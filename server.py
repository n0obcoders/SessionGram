"""SessionGram: a self-hosted, multi-account Telegram client built on Telethon.

Developed by Nitin Shukla (https://github.com/n0obcoders).

Run:  python server.py [--sessions sessions.xlsx] [--host 0.0.0.0] [--port 8080] [--data DIR]
Then open http://<this-computer-ip>:8080 in your phone's browser.

Security notes:
  * api hashes and session strings are never logged or sent to the browser.
  * The web UI is protected by a password stored in config.json (generated on first run).
"""
import argparse
import asyncio
import csv
import json
import logging
import mimetypes
import os
import re
import secrets
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from aiohttp import web
from telethon import TelegramClient, errors, events, functions, types, utils
from telethon.sessions import StringSession

BASE = Path(__file__).resolve().parent
STATIC = BASE / "static"
CACHE = BASE / "cache"
CONFIG_FILE = BASE / "config.json"
DATA = BASE

APP_NAME = "SessionGram"
APP_VERSION = "2.0"
DEVELOPER = {
    "name": "Nitin Shukla",
    "github": "https://github.com/n0obcoders",
    "portfolio": "https://n0obcoders.github.io/portfoli0/",
}


class HTTPException(Exception):
    def __init__(self, status_code, detail=""):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("sessiongram")


class _RingLog(logging.Handler):
    """Keeps the last warnings/errors so they can be shown in Settings › Error log."""
    def __init__(self, size=150):
        super().__init__(logging.WARNING)
        self.records = []
        self.size = size

    def emit(self, record):
        try:
            self.records.append({"t": int(record.created), "level": record.levelname,
                                 "msg": record.getMessage()[:600]})
            del self.records[:-self.size]
        except Exception:
            pass


RING = _RingLog()
logging.getLogger().addHandler(RING)
logging.getLogger("telethon").setLevel(logging.WARNING)


# ----------------------------------------------------------------------------- config
def load_config():
    cfg = {}
    if CONFIG_FILE.exists():
        try:
            cfg = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except Exception:
            cfg = {}
    changed = False
    pw = os.environ.get("SESSIONGRAM_PASSWORD") or os.environ.get("TELEMULTI_PASSWORD")
    if pw:
        cfg["password"] = pw
    if not cfg.get("password"):
        cfg["password"] = secrets.token_urlsafe(9)
        changed = True
    if changed:
        CONFIG_FILE.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    return cfg


ARGS = None
CONFIG = {}
TOKENS = set()


# ----------------------------------------------------------------------------- sessions file
def _cell(v):
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).strip()


def read_sessions_file(path: Path):
    """Return a list of (phone, api_id, api_hash, session_string) from xlsx / xls / csv.

    Columns, in order: phone number, api id, api hash, telethon session string.
    A header row (or any row whose api id is not a number) is skipped.
    """
    ext = path.suffix.lower()
    rows = []
    if ext in (".xlsx", ".xlsm"):
        import openpyxl
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb.worksheets[0]
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
        wb.close()
    elif ext == ".xls":
        try:
            import xlrd
        except ImportError:
            raise RuntimeError("Reading .xls needs the 'xlrd' package (pip install xlrd), or save the sheet as .xlsx")
        sh = xlrd.open_workbook(str(path)).sheet_by_index(0)
        rows = [sh.row_values(i) for i in range(sh.nrows)]
    elif ext in (".csv", ".txt"):
        with open(path, newline="", encoding="utf-8-sig") as f:
            rows = list(csv.reader(f))
    else:
        raise RuntimeError(f"Unsupported sessions file type: {ext}")

    out = []
    for r in rows:
        r = [_cell(c) for c in (r or [])] + ["", "", "", ""]
        phone, api_id, api_hash, sess = r[:4]
        if not api_id.isdigit() or not api_hash or not sess:
            continue
        out.append((phone, int(api_id), api_hash, sess))
    return out


# ----------------------------------------------------------------------------- helpers
def ts(d):
    if not d:
        return None
    return int(d.timestamp())


def text_of(x):
    """TextWithEntities or str -> str."""
    if x is None:
        return ""
    return getattr(x, "text", x) if not isinstance(x, str) else x


def entity_kind(e):
    if isinstance(e, types.User):
        return "bot" if e.bot else "user"
    if isinstance(e, (types.Chat, types.ChatForbidden)):
        return "group"
    if isinstance(e, (types.Channel, types.ChannelForbidden)):
        return "channel" if getattr(e, "broadcast", False) else "group"
    return "user"


def display_name(e, me_id=None):
    if e is None:
        return "Unknown"
    if me_id and getattr(e, "id", None) == me_id and isinstance(e, types.User):
        return "Saved Messages"
    n = utils.get_display_name(e)
    if not n and isinstance(e, types.User) and e.deleted:
        return "Deleted Account"
    return n or "Unknown"


def has_photo(e):
    p = getattr(e, "photo", None)
    return bool(p) and not isinstance(p, (types.UserProfilePhotoEmpty, types.ChatPhotoEmpty))


def media_kind(m):
    if not m.media:
        return None
    if m.photo:
        return "photo"
    if m.sticker:
        return "sticker"
    if m.gif:
        return "gif"
    if m.video_note:
        return "video_note"
    if m.video:
        return "video"
    if m.voice:
        return "voice"
    if m.audio:
        return "audio"
    if m.document:
        return "document"
    if m.poll:
        return "poll"
    if m.geo:
        return "location"
    if m.contact:
        return "contact"
    if isinstance(m.media, types.MessageMediaWebPage):
        return "webpage"
    if isinstance(m.media, types.MessageMediaDice):
        return "dice"
    return "media"


MEDIA_LABEL = {
    "photo": "🖼 Photo", "sticker": "Sticker", "gif": "GIF", "video_note": "📹 Video message",
    "video": "🎬 Video", "voice": "🎤 Voice message", "audio": "🎵 Audio", "document": "📎 File",
    "poll": "📊 Poll", "location": "📍 Location", "contact": "👤 Contact", "dice": "🎲 Dice", "media": "Media",
}


def action_text(m):
    a = m.action
    name = type(a).__name__.replace("MessageAction", "")
    return {
        "ChatAddUser": "added a member", "ChatDeleteUser": "removed a member / left",
        "ChatJoinedByLink": "joined via invite link", "ChatJoinedByRequest": "joined the group",
        "ChatCreate": "created the group", "ChannelCreate": "Channel created",
        "ChatEditTitle": f"changed the title to “{getattr(a, 'title', '')}”",
        "ChatEditPhoto": "changed the photo", "ChatDeletePhoto": "removed the photo",
        "PinMessage": "pinned a message", "PhoneCall": "📞 Call", "ScreenshotTaken": "took a screenshot",
        "ContactSignUp": "joined Telegram", "HistoryClear": "History cleared",
        "ChatMigrateTo": "upgraded to supergroup", "ChannelMigrateFrom": "upgraded from group",
        "GroupCall": "🎙 Voice chat", "SetMessagesTTL": "changed auto-delete timer",
    }.get(name, re.sub(r"(?<!^)(?=[A-Z])", " ", name).lower() or "service message")


def msg_preview(m):
    if m is None:
        return ""
    if isinstance(m, types.MessageService) or getattr(m, "action", None):
        return action_text(m)
    k = media_kind(m)
    t = (m.message or "").replace("\n", " ")
    if k and k != "webpage":
        lab = MEDIA_LABEL.get(k, "Media")
        if k == "sticker":
            alt = next((getattr(a, "alt", "") for a in (m.document.attributes or []) if isinstance(a, types.DocumentAttributeSticker)), "")
            lab = f"{alt} Sticker".strip()
        if k == "document" and m.file and m.file.name:
            lab = f"📎 {m.file.name}"
        if k == "poll":
            lab = f"📊 {text_of(m.poll.poll.question)}"
        return f"{lab}, {t}" if t else lab
    return t[:200]


def reactions_of(r):
    """MessageReactions -> [{"e": emoji, "n": count, "me": chosen by this account}] (custom emoji shown as ⭐)."""
    out = []
    for rc in (getattr(r, "results", None) or []):
        rx = rc.reaction
        if isinstance(rx, types.ReactionEmoji):
            e = rx.emoticon
        elif isinstance(rx, types.ReactionCustomEmoji):
            e = "⭐"
        elif type(rx).__name__ == "ReactionPaid":
            e = "⭐"
        else:
            continue
        out.append({"e": e, "n": rc.count, "me": getattr(rc, "chosen_order", None) is not None})
    return out


def is_muted(dialog_obj):
    ns = getattr(dialog_obj, "notify_settings", None)
    mu = getattr(ns, "mute_until", None) if ns else None
    if not mu:
        return False
    if isinstance(mu, datetime):
        return mu > datetime.now(timezone.utc)
    return mu > time.time()


def safe_err(e):
    if isinstance(e, errors.FloodWaitError):
        return f"Telegram flood wait: try again in {e.seconds}s"
    if isinstance(e, errors.RPCError):
        return f"{type(e).__name__}: {e.message}" if getattr(e, "message", None) else type(e).__name__
    return str(e) or type(e).__name__


# ----------------------------------------------------------------------------- websocket hub
class Hub:
    def __init__(self):
        self.sockets = set()

    async def send(self, payload):
        if not self.sockets:
            return
        data = json.dumps(payload, default=str)
        dead = []
        for ws in list(self.sockets):
            try:
                await ws.send_str(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.sockets.discard(ws)


HUB = Hub()


# ----------------------------------------------------------------------------- account
def make_client(session, api_id, api_hash):
    return TelegramClient(
        session, api_id, api_hash,
        device_model="SessionGram", system_version="Android", app_version=APP_VERSION,
        flood_sleep_threshold=30,
        # Keep per-account memory small so 100+ accounts stay light.
        entity_cache_limit=2000,
    )


class Account:
    def __init__(self, aid, phone, api_id, api_hash, session):
        self.aid = aid
        self.phone = phone
        self._api_id = api_id
        self._api_hash = api_hash
        self._session = session
        self.client = None
        self.me = None
        self.status = "connecting"
        self.error = None
        self.dialogs = {}      # peer_id -> public dict
        self.entities = {}     # peer_id -> entity
        self.meta = {}         # peer_id -> dict(muted, archived, marked_unread)
        self.folders = []      # raw dialog filters
        self.dialogs_loaded = False
        self.lock = asyncio.Lock()
        self.silent = False
        self._fsets = {}       # id(folder) -> (include ids, exclude ids)

    def __repr__(self):
        return f"<Account {self.aid} {self.phone}>"

    # -- public info
    def info(self):
        me = self.me
        return {
            "id": self.aid,
            "phone": ("+" + me.phone) if me and me.phone else self.phone,
            "name": display_name(me) if me else (self.phone or f"Account {self.aid}"),
            "username": getattr(me, "username", None) if me else None,
            "user_id": me.id if me else None,
            "has_photo": has_photo(me) if me else False,
            "status": self.status,
            "error": self.error,
            "unread": self.total_unread(),
            "dialogs_loaded": self.dialogs_loaded,
        }

    def total_unread(self):
        return sum(d["unread"] for pid, d in self.dialogs.items() if not d["archived"] and not d["muted"])

    # -- connection
    async def start(self, client=None):
        """Connect with the stored session string, or adopt `client` (already logged in by phone + code)."""
        try:
            if client is not None:
                self.client = client
            else:
                try:
                    sess = StringSession(self._session)
                except Exception:
                    self.status = "error"
                    self.error = "Invalid session string: column D must be a Telethon StringSession"
                    if not self.silent:
                        await HUB.send({"type": "account", "account": self.info()})
                    return
                self.client = make_client(sess, self._api_id, self._api_hash)
            if not self.client.is_connected():
                await self.client.connect()
            if not await self.client.is_user_authorized():
                self.status = "unauthorized"
                self.error = "Session is not authorized (expired, revoked or invalid session string)"
                await self.client.disconnect()
                if not self.silent:
                    await HUB.send({"type": "account", "account": self.info()})
                return
            self.me = await self.client.get_me()
            self.status = "online"
            self.error = None
            self._register_handlers()
            log.info("Account %s connected as %s", self.aid, display_name(self.me))
        except Exception as e:
            self.status = "error"
            self.error = safe_err(e)
            log.warning("Account %s failed to connect: %s", self.aid, self.error)
        if not self.silent:
            await HUB.send({"type": "account", "account": self.info()})

    async def stop(self):
        if self.client:
            try:
                await self.client.disconnect()
            except Exception:
                pass

    # -- dialogs
    def _dialog_from(self, d):
        e = d.entity
        pid = d.id
        self.entities[pid] = e
        muted = is_muted(d.dialog)
        self.meta[pid] = {"muted": muted, "archived": d.archived,
                          "marked_unread": bool(getattr(d.dialog, "unread_mark", False))}
        m = d.message
        return {
            "id": pid,
            "name": display_name(e, self.me.id if self.me else None),
            "kind": entity_kind(e),
            "username": getattr(e, "username", None),
            "verified": bool(getattr(e, "verified", False)),
            "is_self": bool(getattr(e, "is_self", False)),
            "has_photo": has_photo(e) or bool(getattr(e, "is_self", False)),
            "unread": d.unread_count or (1 if self.meta[pid]["marked_unread"] else 0),
            "mentions": d.unread_mentions_count or 0,
            "pinned": bool(d.pinned),
            "archived": bool(d.archived),
            "muted": muted,
            "last": msg_preview(m),
            "last_out": bool(m and m.out),
            "last_sender": self._short_sender(m, e),
            "date": ts(m.date) if m else 0,
            "read_outbox": getattr(d.dialog, "read_outbox_max_id", 0),
            "last_id": m.id if m else 0,
            "folders": [],
        }

    def _short_sender(self, m, chat):
        if not m or isinstance(chat, types.User) or getattr(chat, "broadcast", False):
            return None
        if m.out:
            return "You"
        s = m.sender
        if isinstance(s, types.User):
            return s.first_name or utils.get_display_name(s)
        return None

    async def load_dialogs(self):
        async with self.lock:
            dialogs = {}
            async for d in self.client.iter_dialogs(limit=None):
                dialogs[d.id] = self._dialog_from(d)
            self.dialogs = dialogs
            try:
                res = await self.client(functions.messages.GetDialogFiltersRequest())
                self.folders = [f for f in getattr(res, "filters", res)
                                if isinstance(f, (types.DialogFilter, types.DialogFilterChatlist))]
                self._fsets = {}
            except Exception as e:
                log.info("Account %s: could not load folders: %s", self.aid, safe_err(e))
                self.folders = []
            for pid in self.dialogs:
                self._assign_folders(pid)
            self.dialogs_loaded = True
        await HUB.send({"type": "account", "account": self.info()})

    def folders_public(self):
        return [{"id": f.id, "title": text_of(f.title), "emoticon": getattr(f, "emoticon", None)} for f in self.folders]

    def _assign_folders(self, pid):
        d = self.dialogs.get(pid)
        if not d:
            return
        e = self.entities.get(pid)
        meta = self.meta.get(pid, {})
        d["folders"] = [f.id for f in self.folders if self._match(f, pid, e, d, meta)]

    @staticmethod
    def _peer_ids(peers):
        out = set()
        for p in peers or []:
            try:
                out.add(utils.get_peer_id(p))
            except Exception:
                pass
        return out

    def _folder_sets(self, f):
        """(include, exclude) peer-id sets for a folder, computed once per folder load, not once per chat."""
        key = id(f)
        hit = self._fsets.get(key)
        if hit is None:
            hit = (self._peer_ids(list(f.pinned_peers) + list(f.include_peers)),
                   self._peer_ids(getattr(f, "exclude_peers", None)))
            self._fsets[key] = hit
        return hit

    def _match(self, f, pid, e, d, meta):
        inc, exc = self._folder_sets(f)
        if pid in inc:
            return True
        if isinstance(f, types.DialogFilterChatlist):
            return False
        if pid in exc:
            return False
        if f.exclude_archived and d["archived"]:
            return False
        if f.exclude_read and d["unread"] == 0 and not meta.get("marked_unread"):
            return False
        if f.exclude_muted and d["muted"]:
            return False
        if isinstance(e, types.User):
            if e.bot:
                return bool(f.bots)
            return bool(f.contacts) if (e.contact or e.is_self) else bool(f.non_contacts)
        if isinstance(e, (types.Channel, types.ChannelForbidden)) and getattr(e, "broadcast", False):
            return bool(f.broadcasts)
        return bool(f.groups)

    # -- peers
    async def peer(self, peer: str):
        if peer in ("me", "self") or (self.me and peer == str(self.me.id)):
            return types.InputPeerSelf()
        try:
            pid = int(peer)
        except ValueError:
            return await self.client.get_input_entity(peer.lstrip("@"))
        e = self.entities.get(pid)
        if e is not None:
            return utils.get_input_peer(e)
        try:
            return await self.client.get_input_entity(pid)
        except (ValueError, TypeError):
            pass
        await self.load_dialogs()
        e = self.entities.get(pid)
        if e is None:
            raise HTTPException(404, "Chat not found for this account")
        return utils.get_input_peer(e)

    # -- messages
    def msg_dict(self, m, replies=None):
        me_id = self.me.id if self.me else None
        d = {
            "id": m.id,
            "out": bool(m.out),
            "date": ts(m.date),
            "chat_id": m.chat_id,
            "text": getattr(m, "message", "") or "",
            "sender_id": m.sender_id,
            "sender_name": None,
            "service": isinstance(m, types.MessageService),
            "media": None,
            "reply_to": getattr(m, "reply_to_msg_id", None),
            "reply": None,
            "views": getattr(m, "views", None),
            "edited": bool(getattr(m, "edit_date", None)) and not getattr(m, "edit_hide", False),
            "fwd": None,
            "author": getattr(m, "post_author", None),
            "grouped_id": getattr(m, "grouped_id", None),
            "entities": [],
            "pinned": bool(getattr(m, "pinned", False)),
            "reactions": reactions_of(getattr(m, "reactions", None)),
        }
        s = m.sender
        if s is not None:
            d["sender_name"] = display_name(s) if getattr(s, "id", None) != me_id else display_name(s)
        if d["service"]:
            d["text"] = (d["sender_name"] + " " if d["sender_name"] and not isinstance(m.action, (types.MessageActionChannelCreate,)) else "") + action_text(m)
            return d
        for ent in m.entities or []:
            url = getattr(ent, "url", None)
            kind = type(ent).__name__.replace("MessageEntity", "").lower()
            if kind in ("bold", "italic", "code", "pre", "texturl", "url", "mention", "strike", "underline", "spoiler", "hashtag", "blockquote", "mentionname"):
                d["entities"].append({"t": kind, "o": ent.offset, "l": ent.length, "url": url})
        k = media_kind(m)
        if k:
            info = {"kind": k}
            if m.file:
                info.update({"name": m.file.name, "size": m.file.size, "mime": m.file.mime_type})
                if k in ("voice", "audio", "video", "video_note"):
                    info["duration"] = m.file.duration
                if k in ("video", "photo", "gif", "video_note") and m.file.width:
                    info["w"], info["h"] = m.file.width, m.file.height
            if k == "sticker":
                info["alt"] = next((getattr(a, "alt", "") for a in (m.document.attributes or []) if isinstance(a, types.DocumentAttributeSticker)), "")
                info["animated"] = (m.file.mime_type or "") in ("application/x-tgsticker", "video/webm")
            if k == "poll":
                p = m.poll.poll
                res = m.poll.results
                counts = {}
                for r in (getattr(res, "results", None) or []):
                    counts[r.option] = r.voters
                info["question"] = text_of(p.question)
                info["answers"] = [{"text": text_of(a.text), "votes": counts.get(a.option, 0)} for a in p.answers]
                info["total"] = getattr(res, "total_voters", 0) or 0
            if k == "webpage":
                wp = m.media.webpage
                info.update({"url": getattr(wp, "url", None), "title": getattr(wp, "title", None),
                             "site": getattr(wp, "site_name", None), "description": getattr(wp, "description", None),
                             "has_photo": bool(getattr(wp, "photo", None))})
            if k == "location":
                info.update({"lat": m.geo.lat, "long": m.geo.long})
            if k == "contact":
                c = m.media
                info.update({"first": c.first_name, "last": c.last_name, "phone": c.phone_number, "user_id": c.user_id})
            if k == "dice":
                info.update({"emoticon": m.media.emoticon, "value": m.media.value})
            d["media"] = info
        f = m.forward
        if f is not None:
            try:
                name = f.from_name or (utils.get_display_name(f.sender) if f.sender else None) or \
                       (utils.get_display_name(f.chat) if f.chat else None)
            except Exception:
                name = None
            d["fwd"] = name or "Unknown"
        if replies and d["reply_to"] in replies:
            r = replies[d["reply_to"]]
            d["reply"] = {"id": r.id, "sender": display_name(r.sender) if r.sender else None, "text": msg_preview(r)}
        return d

    async def messages(self, peer, offset_id=0, limit=40):
        ent = await self.peer(peer)
        msgs = await self.client.get_messages(ent, limit=limit, offset_id=offset_id)
        msgs = [m for m in msgs if m is not None]
        have = {m.id: m for m in msgs}
        need = [m.reply_to_msg_id for m in msgs if getattr(m, "reply_to_msg_id", None) and m.reply_to_msg_id not in have]
        if need:
            try:
                extra = await self.client.get_messages(ent, ids=need)
                for x in extra or []:
                    if x is not None:
                        have[x.id] = x
            except Exception:
                pass
        return [self.msg_dict(m, have) for m in reversed(msgs)]

    # -- realtime
    def _register_handlers(self):
        c = self.client

        @c.on(events.NewMessage())
        async def on_new(ev):
            try:
                await self._on_message(ev.message, new=True)
            except Exception as e:
                log.debug("new message handler: %s", e)

        @c.on(events.MessageEdited())
        async def on_edit(ev):
            try:
                await self._on_message(ev.message, new=False)
            except Exception as e:
                log.debug("edit handler: %s", e)

        @c.on(events.MessageDeleted())
        async def on_del(ev):
            await HUB.send({"type": "deleted", "account": self.aid, "chat_id": ev.chat_id, "ids": ev.deleted_ids})

        @c.on(events.MessageRead(inbox=False))
        async def on_read_out(ev):
            d = self.dialogs.get(ev.chat_id)
            if d:
                d["read_outbox"] = max(d.get("read_outbox", 0), ev.max_id)
            await HUB.send({"type": "read", "account": self.aid, "chat_id": ev.chat_id, "outbox": True, "max_id": ev.max_id})

        @c.on(events.MessageRead(inbox=True))
        async def on_read_in(ev):
            d = self.dialogs.get(ev.chat_id)
            if d and ev.max_id >= d.get("last_id", 0):
                d["unread"] = 0
                d["mentions"] = 0
            await HUB.send({"type": "read", "account": self.aid, "chat_id": ev.chat_id, "outbox": False,
                            "max_id": ev.max_id, "dialog": d, "account_unread": self.total_unread()})

        @c.on(events.Raw(types.UpdateMessageReactions))
        async def on_reactions(upd):
            try:
                await HUB.send({"type": "reactions", "account": self.aid, "chat_id": utils.get_peer_id(upd.peer),
                                "id": upd.msg_id, "reactions": reactions_of(upd.reactions)})
            except Exception as e:
                log.debug("reactions handler: %s", e)

        @c.on(events.UserUpdate())
        async def on_user(ev):
            if ev.typing:
                await HUB.send({"type": "typing", "account": self.aid, "chat_id": ev.chat_id, "user_id": ev.user_id})

    def new_dialog(self, pid, chat, last=""):
        """Add a chat to the dialog list right away (new chat, or one we just joined)."""
        self.entities[pid] = chat
        self.meta[pid] = {"muted": False, "archived": False, "marked_unread": False}
        d = {
            "id": pid, "name": display_name(chat, self.me.id), "kind": entity_kind(chat),
            "username": getattr(chat, "username", None), "verified": bool(getattr(chat, "verified", False)),
            "is_self": bool(getattr(chat, "is_self", False)), "has_photo": has_photo(chat),
            "unread": 0, "mentions": 0, "pinned": False, "archived": False, "muted": False,
            "read_outbox": 0, "folders": [], "last": last, "last_out": False, "last_sender": None,
            "date": int(time.time()), "last_id": 0,
        }
        self.dialogs[pid] = d
        self._assign_folders(pid)
        return d

    async def _on_message(self, m, new=True):
        try:
            chat = await m.get_chat()
        except Exception:
            chat = None
        if m.sender is None and m.sender_id:
            try:
                await m.get_sender()
            except Exception:
                pass
        replies = None
        if getattr(m, "reply_to_msg_id", None):
            try:
                r = await self.client.get_messages(m.chat_id, ids=m.reply_to_msg_id)
                if r:
                    replies = {r.id: r}
            except Exception:
                pass
        md = self.msg_dict(m, replies)
        pid = m.chat_id
        d = self.dialogs.get(pid)
        if new:
            if d is None and chat is not None:
                d = self.new_dialog(pid, chat)
            if d is not None:
                d["last"] = msg_preview(m)
                d["last_out"] = bool(m.out)
                d["last_sender"] = self._short_sender(m, chat)
                d["date"] = ts(m.date)
                d["last_id"] = m.id
                if not m.out:
                    d["unread"] = d.get("unread", 0) + 1
                    if m.mentioned:
                        d["mentions"] = d.get("mentions", 0) + 1
                self._assign_folders(pid)
        await HUB.send({"type": "message" if new else "edited", "account": self.aid, "chat_id": pid,
                        "message": md, "dialog": d, "account_unread": self.total_unread()})
        if new and NOTIFIER is not None and not m.out and not (d and d.get("muted")):
            try:
                title = (d or {}).get("name") or "New message"
                if len(MGR.accounts) > 1:
                    title = f"{title} · {display_name(self.me)}"
                text = msg_preview(m)
                if md.get("sender_name") and d and d.get("kind") == "group":
                    text = f"{md['sender_name']}: {text}"
                NOTIFIER.notifyMessage(title, text[:300], self.aid, str(pid))
            except Exception as e:
                log.debug("notifier failed: %s", e)


# ----------------------------------------------------------------------------- manager
CONNECT_CONCURRENCY = 8   # accounts connecting at the same time
WARM_CONCURRENCY = 4      # accounts downloading their chat list at the same time


class Manager:
    def __init__(self):
        self.accounts = {}
        self.source = None
        self.load_error = None

    async def load(self, path: Path):
        await self.stop_all()
        self.accounts = {}
        self.source = path
        self.load_error = None
        if not path.exists():
            self.load_error = f"Sessions file not found: {path.name}. Upload one from Settings › Accounts."
            log.warning(self.load_error)
            return
        try:
            rows = read_sessions_file(path)
        except Exception as e:
            self.load_error = f"Could not read {path.name}: {e}"
            log.warning(self.load_error)
            return
        if not rows:
            self.load_error = f"No valid rows in {path.name} (columns: phone, api id, api hash, session string)"
            log.warning(self.load_error)
        seen = set()
        for i, (phone, api_id, api_hash, sess) in enumerate(rows):
            if sess in seen:
                continue
            seen.add(sess)
            aid = str(i + 1)
            self.accounts[aid] = Account(aid, phone, api_id, api_hash, sess)
        log.info("Loaded %d account(s) from %s", len(self.accounts), path.name)
        # Connect in small batches: 100+ simultaneous handshakes stall the event loop
        # (and the UI with it) and can trip Telegram's flood limits.
        sem = asyncio.Semaphore(CONNECT_CONCURRENCY)

        async def connect(a):
            async with sem:
                await a.start()

        await asyncio.gather(*(connect(a) for a in self.accounts.values()))
        asyncio.create_task(self._warm())

    async def add(self, phone, api_id, api_hash, sess):
        """Log in one more account from a session string and append it to the sessions file."""
        for a in self.accounts.values():
            if a._session == sess:
                raise HTTPException(409, f"This session is already added ({a.info()['name']})")
        aid = str(max([int(k) for k in self.accounts if k.isdigit()] or [0]) + 1)
        a = Account(aid, phone, api_id, api_hash, sess)
        a.silent = True
        await a.start()
        a.silent = False
        if a.status != "online":
            await a.stop()
            raise HTTPException(400, a.error or "Could not log in with this session")
        for other in self.accounts.values():
            if other.me and other.me.id == a.me.id and other.status == "online":
                await a.stop()
                raise HTTPException(409, f"{display_name(a.me)} is already open in the app")
        if not a.phone and a.me.phone:
            a.phone = "+" + a.me.phone
        self.accounts[aid] = a
        try:
            self._append_row([a.phone, api_id, api_hash, sess])
        except Exception as e:
            log.warning("Account added but could not be saved to the sessions file: %s", e)
        self.load_error = None
        await HUB.send({"type": "account", "account": a.info()})
        asyncio.create_task(self._warm_one(a))
        return a

    async def add_client(self, phone, api_id, api_hash, client):
        """Adopt a client that was just logged in with phone number + code, and save it to the sessions file."""
        me = await client.get_me()
        for other in self.accounts.values():
            if other.me and other.me.id == me.id and other.status == "online":
                await client.disconnect()
                raise HTTPException(409, f"{display_name(me)} is already logged in to SessionGram")
        sess = StringSession.save(client.session)
        aid = str(max([int(k) for k in self.accounts if k.isdigit()] or [0]) + 1)
        a = Account(aid, phone or ("+" + me.phone if me.phone else ""), api_id, api_hash, sess)
        a.silent = True
        await a.start(client=client)
        a.silent = False
        if a.status != "online":
            raise HTTPException(400, a.error or "Could not open this account")
        self.accounts[aid] = a
        try:
            self._append_row([a.phone, api_id, api_hash, sess])
        except Exception as e:
            log.warning("Account added but could not be saved to the sessions file: %s", e)
        self.load_error = None
        await HUB.send({"type": "account", "account": a.info()})
        asyncio.create_task(self._warm_one(a))
        return a

    async def remove(self, aid):
        a = self.accounts.pop(aid, None)
        if not a:
            raise HTTPException(404, "Unknown account")
        await a.stop()
        try:
            self._rewrite(lambda row: (row[3] if len(row) > 3 else "") != a._session)
        except Exception as e:
            log.warning("Could not update the sessions file: %s", e)
        await HUB.send({"type": "account_removed", "id": aid})

    def _sessions_path(self):
        if self.source and self.source.exists():
            return self.source
        return DATA / "sessions.xlsx"

    def _raw_rows(self, path):
        if not path.exists():
            return [["phone number", "api id", "api hash", "telethon session string"]]
        ext = path.suffix.lower()
        if ext in (".xlsx", ".xlsm"):
            import openpyxl
            wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
            rows = [[_cell(c) for c in r] for r in wb.worksheets[0].iter_rows(values_only=True)]
            wb.close()
            return rows
        if ext == ".xls":
            import xlrd
            sh = xlrd.open_workbook(str(path)).sheet_by_index(0)
            return [[_cell(c) for c in sh.row_values(i)] for i in range(sh.nrows)]
        with open(path, newline="", encoding="utf-8-sig") as f:
            return [list(r) for r in csv.reader(f)]

    def _write_rows(self, path, rows):
        if path.suffix.lower() == ".csv":
            with open(path, "w", newline="", encoding="utf-8") as f:
                csv.writer(f).writerows(rows)
        else:
            import openpyxl
            if path.suffix.lower() == ".xls":
                old, path = path, path.with_suffix(".xlsx")
                old.unlink(missing_ok=True)
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "sessions"
            for r in rows:
                ws.append([str(c) if c is not None else "" for c in r])
            for col, w in zip("ABCD", (18, 12, 36, 70)):
                ws.column_dimensions[col].width = w
            tmp = path.with_name(path.name + ".tmp")
            wb.save(tmp)
            os.replace(tmp, path)
        try:
            os.chmod(path, 0o600)
        except Exception:
            pass
        self.source = path
        return path

    def _append_row(self, row):
        path = self._sessions_path()
        rows = self._raw_rows(path)
        rows.append([str(c) for c in row])
        self._write_rows(path, rows)

    def _rewrite(self, keep):
        path = self._sessions_path()
        if not path.exists():
            return
        self._write_rows(path, [r for r in self._raw_rows(path) if keep(r)])

    async def _warm_one(self, a):
        try:
            await a.load_dialogs()
        except Exception as e:
            log.warning("Account %s: dialogs failed: %s", a.aid, safe_err(e))

    async def _warm(self):
        sem = asyncio.Semaphore(WARM_CONCURRENCY)

        async def one(a):
            async with sem:
                try:
                    await a.load_dialogs()
                except Exception as e:
                    log.warning("Account %s: dialogs failed: %s", a.aid, safe_err(e))

        await asyncio.gather(*(one(a) for a in self.accounts.values() if a.status == "online"))

    async def stop_all(self):
        await asyncio.gather(*(a.stop() for a in self.accounts.values()), return_exceptions=True)

    def get(self, aid) -> Account:
        a = self.accounts.get(aid)
        if not a:
            raise HTTPException(404, "Unknown account")
        if a.status != "online":
            raise HTTPException(409, a.error or "Account is not connected")
        return a


MGR = Manager()



# ----------------------------------------------------------------------------- app
routes = web.RouteTableDef()
OPEN_PATHS = {"/api/login", "/api/auth", "/api/applogin", "/api/about"}
APP_TOKEN = None      # set when embedded in the Android app
NOTIFIER = None       # Android notification bridge (object with notifyMessage(title, text, aid, chat_id))


def _json(data, status=200):
    return web.json_response(data, status=status, dumps=lambda o: json.dumps(o, default=str))


@web.middleware
async def mw(request, handler):
    p = request.path
    if p.startswith("/api/") and p not in OPEN_PATHS and request.cookies.get("sg_token") not in TOKENS:
        return _json({"detail": "auth"}, 401)
    try:
        resp = await handler(request)
    except HTTPException as e:
        return _json({"detail": e.detail}, e.status_code)
    except web.HTTPException:
        raise
    except errors.FloodWaitError as e:
        return _json({"detail": safe_err(e)}, 429)
    except errors.RPCError as e:
        return _json({"detail": safe_err(e)}, 400)
    except (ValueError, TypeError, KeyError) as e:
        return _json({"detail": str(e) or type(e).__name__}, 400)
    except Exception as e:
        log.exception("request failed: %s", p)
        return _json({"detail": safe_err(e)}, 500)
    if isinstance(resp, (dict, list)):
        resp = _json(resp)
    return resp


def qi(request, name, default=0):
    try:
        return int(request.query.get(name, default))
    except ValueError:
        return default


async def body(request):
    try:
        return await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON body")


async def save_upload(field, dest: Path):
    with open(dest, "wb") as f:
        shutil.copyfileobj(field.file, f)
    return dest


def _set_cookie(resp):
    tok = secrets.token_urlsafe(32)
    TOKENS.add(tok)
    resp.set_cookie("sg_token", tok, httponly=True, samesite="Lax", max_age=60 * 60 * 24 * 30)
    return resp


@routes.post("/api/login")
async def login(request):
    b = await body(request)
    if APP_TOKEN or not secrets.compare_digest(str(b.get("password", "")), CONFIG["password"]):
        await asyncio.sleep(1.0)
        raise HTTPException(403, "Wrong password")
    return _set_cookie(_json({"ok": True}))


@routes.get("/api/applogin")
async def applogin(request):
    if not APP_TOKEN or not secrets.compare_digest(request.query.get("t", ""), APP_TOKEN):
        raise HTTPException(403, "Forbidden")
    return _set_cookie(web.HTTPFound("/"))


@routes.get("/api/auth")
async def auth_check(request):
    return {"ok": request.cookies.get("sg_token") in TOKENS, "app": bool(APP_TOKEN)}


@routes.post("/api/logout")
async def logout(request):
    TOKENS.discard(request.cookies.get("sg_token"))
    r = _json({"ok": True})
    r.del_cookie("sg_token")
    return r


# -- accounts
def accounts_payload():
    return {"accounts": [a.info() for a in MGR.accounts.values()], "error": MGR.load_error,
            "source": MGR.source.name if MGR.source else None, "app": bool(APP_TOKEN)}


@routes.get("/api/accounts")
async def accounts(request):
    return accounts_payload()


@routes.post("/api/accounts/reload")
async def reload_accounts(request):
    await MGR.load(MGR.source or default_sessions_path())
    await HUB.send({"type": "reloaded"})
    return accounts_payload()


@routes.post("/api/accounts/upload")
async def upload_sessions(request):
    form = await request.post()
    f = form.get("file")
    if f is None or not hasattr(f, "file"):
        raise HTTPException(400, "No file")
    ext = Path(f.filename or "").suffix.lower()
    if ext not in (".xlsx", ".xlsm", ".xls", ".csv"):
        raise HTTPException(400, "Upload a .xlsx, .xls or .csv file")
    for old in DATA.glob("sessions.*"):
        if old.suffix.lower() in (".xlsx", ".xlsm", ".xls", ".csv"):
            old.unlink(missing_ok=True)
    dest = await save_upload(f, DATA / f"sessions{ext}")
    try:
        os.chmod(dest, 0o600)
    except Exception:
        pass
    await MGR.load(dest)
    await HUB.send({"type": "reloaded"})
    return accounts_payload()


@routes.post("/api/accounts/add")
async def add_account(request):
    b = await body(request)
    api_id = str(b.get("api_id") or "").strip()
    api_hash = str(b.get("api_hash") or "").strip()
    sess = "".join(str(b.get("session") or "").split())
    phone = str(b.get("phone") or "").strip()
    if not api_id.isdigit():
        raise HTTPException(400, "API ID must be a number")
    if not re.fullmatch(r"[0-9a-fA-F]{32}", api_hash):
        raise HTTPException(400, "API hash must be 32 letters/numbers (0-9, a-f)")
    if len(sess) < 20:
        raise HTTPException(400, "Paste the full Telethon session string")
    a = await MGR.add(phone, int(api_id), api_hash, sess)
    return {"account": a.info(), **accounts_payload()}


# -- phone number + login code (OTP)
PENDING = {}            # login id -> dict(client, phone, api_id, api_hash, hash, created)
PENDING_TTL = 15 * 60


def _prefs_file():
    return DATA / "prefs.json"


def load_prefs():
    try:
        return json.loads(_prefs_file().read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_prefs(p):
    f = _prefs_file()
    f.write_text(json.dumps(p, indent=2), encoding="utf-8")
    try:
        os.chmod(f, 0o600)
    except Exception:
        pass


def _saved_api():
    """API credentials to reuse: the last ones used for a phone login, else those of the first loaded account."""
    p = load_prefs()
    if str(p.get("api_id", "")).isdigit() and p.get("api_hash"):
        return int(p["api_id"]), p["api_hash"]
    for a in MGR.accounts.values():
        return a._api_id, a._api_hash
    return None


def _clean_phone(phone):
    p = re.sub(r"[^\d+]", "", str(phone or ""))
    if p.startswith("00"):
        p = "+" + p[2:]
    if not re.fullmatch(r"\+?\d{6,16}", p):
        raise HTTPException(400, "Enter the phone number with its country code, for example +91 98765 43210")
    return p if p.startswith("+") else "+" + p


async def _drop_pending(lid):
    st = PENDING.pop(lid, None)
    if st:
        try:
            await st["client"].disconnect()
        except Exception:
            pass


async def _expire_pending():
    now = time.time()
    for lid in [k for k, v in PENDING.items() if now - v["created"] > PENDING_TTL]:
        await _drop_pending(lid)


def _pending(lid):
    st = PENDING.get(str(lid or ""))
    if not st:
        raise HTTPException(410, "This login attempt expired. Start again.")
    return st


def _code_type(sent):
    t = type(getattr(sent, "type", None)).__name__
    return {"SentCodeTypeApp": "app", "SentCodeTypeSms": "sms", "SentCodeTypeCall": "call",
            "SentCodeTypeFlashCall": "call", "SentCodeTypeMissedCall": "call",
            "SentCodeTypeFragmentSms": "fragment", "SentCodeTypeEmailCode": "email"}.get(t, "sms")


def _sent_payload(lid, st, sent):
    return {"lid": lid, "phone": st["phone"], "via": _code_type(sent),
            "length": getattr(sent.type, "length", 5) or 5,
            "next": type(sent.next_type).__name__.replace("CodeType", "").lower() if getattr(sent, "next_type", None) else None,
            "timeout": getattr(sent, "timeout", None)}


@routes.get("/api/phone/config")
async def phone_config(request):
    saved = _saved_api()
    return {"has_saved_api": bool(saved), "api_id": saved[0] if saved else None}


@routes.post("/api/phone/start")
async def phone_start(request):
    await _expire_pending()
    b = await body(request)
    phone = _clean_phone(b.get("phone"))
    if b.get("use_saved"):
        saved = _saved_api()
        if not saved:
            raise HTTPException(400, "No saved API ID yet. Enter your API ID and API hash from my.telegram.org.")
        api_id, api_hash = saved
    else:
        api_id = str(b.get("api_id") or "").strip()
        api_hash = str(b.get("api_hash") or "").strip()
        if not api_id.isdigit():
            raise HTTPException(400, "API ID must be a number (get it from my.telegram.org › API development tools)")
        if not re.fullmatch(r"[0-9a-fA-F]{32}", api_hash):
            raise HTTPException(400, "API hash must be 32 letters/numbers (0-9, a-f)")
        api_id = int(api_id)
    for a in MGR.accounts.values():
        if a.me and a.me.phone and "+" + a.me.phone == phone and a.status == "online":
            raise HTTPException(409, f"{display_name(a.me)} ({phone}) is already logged in")
    client = make_client(StringSession(), api_id, api_hash)
    await client.connect()
    try:
        sent = await client.send_code_request(phone)
    except errors.PhoneNumberInvalidError:
        await client.disconnect()
        raise HTTPException(400, "That phone number is not valid. Include the country code.")
    except errors.PhoneNumberBannedError:
        await client.disconnect()
        raise HTTPException(400, "This phone number is banned from Telegram.")
    except (errors.ApiIdInvalidError, errors.ApiIdPublishedFloodError):
        await client.disconnect()
        raise HTTPException(400, "Telegram rejected this API ID / API hash. Check them on my.telegram.org.")
    except Exception:
        await client.disconnect()
        raise
    lid = secrets.token_urlsafe(12)
    PENDING[lid] = {"client": client, "phone": phone, "api_id": api_id, "api_hash": api_hash,
                    "hash": sent.phone_code_hash, "created": time.time()}
    if not b.get("use_saved"):
        p = load_prefs()
        p.update({"api_id": api_id, "api_hash": api_hash})
        save_prefs(p)
    log.info("Login code sent to %s***", phone[:4])
    return _sent_payload(lid, PENDING[lid], sent)


@routes.post("/api/phone/resend")
async def phone_resend(request):
    b = await body(request)
    st = _pending(b.get("lid"))
    sent = await st["client"](functions.auth.ResendCodeRequest(st["phone"], st["hash"]))
    st["hash"] = sent.phone_code_hash
    return _sent_payload(b.get("lid"), st, sent)


async def _finish_login(lid, st):
    PENDING.pop(lid, None)
    a = await MGR.add_client(st["phone"], st["api_id"], st["api_hash"], st["client"])
    return {"ok": True, "account": a.info(), **accounts_payload()}


@routes.post("/api/phone/code")
async def phone_code(request):
    b = await body(request)
    lid = str(b.get("lid") or "")
    st = _pending(lid)
    code = re.sub(r"\D", "", str(b.get("code") or ""))
    if not code:
        raise HTTPException(400, "Enter the code Telegram sent you")
    try:
        await st["client"].sign_in(st["phone"], code, phone_code_hash=st["hash"])
    except errors.SessionPasswordNeededError:
        hint = None
        try:
            pw = await st["client"](functions.account.GetPasswordRequest())
            hint = pw.hint
        except Exception:
            pass
        st["need_password"] = True
        return {"need_password": True, "hint": hint}
    except (errors.PhoneCodeInvalidError, errors.PhoneCodeEmptyError):
        raise HTTPException(400, "Wrong code. Check it and try again.")
    except errors.PhoneCodeExpiredError:
        await _drop_pending(lid)
        raise HTTPException(410, "This code expired. Start again to get a new one.")
    except errors.PhoneNumberUnoccupiedError:
        await _drop_pending(lid)
        raise HTTPException(400, "This number has no Telegram account yet. Sign up in the official Telegram app first.")
    return await _finish_login(lid, st)


@routes.post("/api/phone/password")
async def phone_password(request):
    b = await body(request)
    lid = str(b.get("lid") or "")
    st = _pending(lid)
    if not st.get("need_password"):
        raise HTTPException(400, "Enter the login code first")
    try:
        await st["client"].sign_in(password=str(b.get("password") or ""))
    except errors.PasswordHashInvalidError:
        raise HTTPException(400, "Wrong password. Try again.")
    return await _finish_login(lid, st)


@routes.post("/api/phone/cancel")
async def phone_cancel(request):
    b = await body(request)
    await _drop_pending(str(b.get("lid") or ""))
    return {"ok": True}


@routes.get("/api/about")
async def about(request):
    return {"app": APP_NAME, "version": APP_VERSION, "developer": DEVELOPER}


@routes.get("/api/inbox")
async def inbox(request):
    """Unread chats across every account, newest first: the unified inbox."""
    limit = min(max(qi(request, "limit", 200), 1), 500)
    items = []
    for a in MGR.accounts.values():
        if a.status != "online":
            continue
        for d in a.dialogs.values():
            if d["unread"] > 0 and not d["archived"]:
                items.append({**d, "account": a.aid, "account_name": display_name(a.me)})
    items.sort(key=lambda d: d.get("date") or 0, reverse=True)
    return {"dialogs": items[:limit], "total": len(items)}


@routes.post("/api/accounts/remove")
async def remove_account(request):
    b = await body(request)
    await MGR.remove(str(b.get("id")))
    return accounts_payload()


@routes.get("/api/accounts/export")
async def export_sessions(request):
    path = MGR._sessions_path()
    if not path.exists():
        raise HTTPException(404, "No sessions file yet")
    return web.FileResponse(path, headers={"Content-Disposition": f'attachment; filename="{path.name}"',
                                           "Cache-Control": "no-store"})


@routes.get("/api/logs")
async def logs(request):
    return {"logs": RING.records[::-1]}


@routes.post("/api/a/{aid}/reconnect")
async def reconnect(request):
    aid = request.match_info["aid"]
    a = MGR.accounts.get(aid)
    if not a:
        raise HTTPException(404, "Unknown account")
    await a.stop()
    await a.start()
    if a.status == "online":
        asyncio.create_task(a.load_dialogs())
    return a.info()


# -- dialogs / messages
@routes.get("/api/a/{aid}/dialogs")
async def dialogs(request):
    a = MGR.get(request.match_info["aid"])
    if qi(request, "refresh") or not a.dialogs_loaded:
        await a.load_dialogs()
    items = sorted(a.dialogs.values(), key=lambda d: d.get("date") or 0, reverse=True)
    return {"dialogs": items, "folders": a.folders_public(), "unread": a.total_unread()}


@routes.get("/api/a/{aid}/messages/{peer}")
async def messages(request):
    a = MGR.get(request.match_info["aid"])
    limit = min(max(qi(request, "limit", 40), 1), 100)
    return {"messages": await a.messages(request.match_info["peer"], qi(request, "offset_id"), limit)}


@routes.post("/api/a/{aid}/read/{peer}")
async def mark_read(request):
    aid = request.match_info["aid"]
    a = MGR.get(aid)
    ent = await a.peer(request.match_info["peer"])
    await a.client.send_read_acknowledge(ent, clear_mentions=True)
    pid = a.me.id if isinstance(ent, types.InputPeerSelf) else utils.get_peer_id(ent)
    d = a.dialogs.get(pid)
    if d:
        d["unread"] = 0
        d["mentions"] = 0
    await HUB.send({"type": "read", "account": aid, "chat_id": pid, "outbox": False, "dialog": d,
                    "account_unread": a.total_unread()})
    return {"ok": True, "unread": a.total_unread()}


@routes.post("/api/a/{aid}/send")
async def send(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    text = (b.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Empty message")
    ent = await a.peer(str(b["peer"]))
    schedule = _schedule_of(b)
    m = await a.client.send_message(ent, text, reply_to=b.get("reply_to") or None, link_preview=True,
                                    silent=bool(b.get("silent")), schedule=schedule)
    if schedule:
        return {"message": None, "scheduled": ts(schedule)}
    return {"message": a.msg_dict(m) if m else None}


def _schedule_of(b):
    """Optional 'schedule' (unix seconds) -> aware datetime, at least a minute ahead as Telegram requires."""
    t = b.get("schedule")
    if not t:
        return None
    t = int(t)
    if t < time.time() + 30:
        raise HTTPException(400, "Pick a time in the future")
    return datetime.fromtimestamp(t, timezone.utc)


@routes.post("/api/a/{aid}/send_file")
async def send_file(request):
    a = MGR.get(request.match_info["aid"])
    form = await request.post()
    f = form.get("file")
    if f is None or not hasattr(f, "file"):
        raise HTTPException(400, "No file")
    ent = await a.peer(str(form.get("peer")))
    tmp = CACHE / f"up_{secrets.token_hex(6)}_{Path(f.filename or 'file').name}"
    await save_upload(f, tmp)
    try:
        reply_to = int(form.get("reply_to") or 0)
        voice = form.get("voice") == "1"
        extra = {}
        if voice:
            raw = tmp.read_bytes()
            if raw[:4] == b"\x1a\x45\xdf\xa3":          # WebM from the browser recorder
                ogg, secs = webm_opus_to_ogg(raw)
                tmp.unlink(missing_ok=True)
                tmp = tmp.with_suffix(".ogg")
                tmp.write_bytes(ogg)
                extra = {"attributes": [types.DocumentAttributeAudio(duration=secs, voice=True)], "mime_type": "audio/ogg"}
        m = await a.client.send_file(ent, str(tmp), caption=form.get("caption") or None, reply_to=reply_to or None,
                                     voice_note=voice, silent=form.get("silent") == "1", **extra)
    finally:
        tmp.unlink(missing_ok=True)
    return {"message": a.msg_dict(m) if m else None}


# -- voice messages: browsers record Opus inside WebM, Telegram voice notes must be Opus inside Ogg.
_EBML_MASTERS = {0x18538067, 0x1F43B675, 0x1654AE6B, 0xAE, 0xA0}   # Segment, Cluster, Tracks, TrackEntry, BlockGroup


def _vint(buf, i, keep_marker):
    b = buf[i]
    n = 1
    while n <= 8 and not (b & (0x80 >> (n - 1))):
        n += 1
    if n > 8:
        raise ValueError("bad EBML length")
    v = b if keep_marker else b & (0xFF >> n)
    for k in range(1, n):
        v = (v << 8) | buf[i + k]
    unknown = not keep_marker and v == (1 << (7 * n)) - 1
    return v, n, unknown


def _opus_samples(pkt):
    """Duration of one Opus packet in 48 kHz samples, from its TOC byte."""
    if not pkt:
        return 0
    toc = pkt[0]
    cfg = toc >> 3
    if cfg < 12:
        ms = (10, 20, 40, 60)[cfg % 4]
    elif cfg < 16:
        ms = (10, 20)[cfg % 2]
    else:
        ms = (2.5, 5, 10, 20)[cfg % 4]
    c = toc & 3
    frames = 1 if c == 0 else 2 if c in (1, 2) else (pkt[1] & 0x3F if len(pkt) > 1 else 1)
    return int(ms * 48 * frames)


def _make_ogg_table():
    table = []
    for i in range(256):
        r = i << 24
        for _ in range(8):
            r = ((r << 1) ^ 0x04C11DB7) if r & 0x80000000 else (r << 1)
            r &= 0xFFFFFFFF
        table.append(r)
    return table


_OGG_TABLE = _make_ogg_table()


def _ogg_crc(data):
    crc = 0
    t = _OGG_TABLE
    for byte in data:
        crc = ((crc << 8) & 0xFFFFFFFF) ^ t[((crc >> 24) ^ byte) & 0xFF]
    return crc


def _ogg_page(packet, granule, serial, seq, flags):
    segs = []
    n = len(packet)
    while n >= 255:
        segs.append(255)
        n -= 255
    segs.append(n)
    hdr = b"OggS" + bytes([0, flags]) + granule.to_bytes(8, "little", signed=True) + serial.to_bytes(4, "little") + \
        seq.to_bytes(4, "little") + b"\0\0\0\0" + bytes([len(segs)]) + bytes(segs)
    page = bytearray(hdr + packet)
    page[22:26] = _ogg_crc(page).to_bytes(4, "little")
    return bytes(page)


def webm_opus_to_ogg(data):
    """Remux the Opus audio of a WebM file into an Ogg file. Returns (ogg_bytes, duration_seconds)."""
    i, head, packets, track = 0, None, [], None
    while i < len(data) - 2:
        eid, n1, _ = _vint(data, i, True)
        size, n2, unknown = _vint(data, i + n1, False)
        i += n1 + n2
        if eid in _EBML_MASTERS:
            continue                        # descend into the element
        if unknown:
            break
        body_ = data[i:i + size]
        if eid == 0x63A2:                   # CodecPrivate: the OpusHead
            head = bytes(body_)
        elif eid in (0xA3, 0xA1):           # SimpleBlock / Block
            tn, tl, _ = _vint(body_, 0, False)
            if track is None:
                track = tn
            if tn == track:
                packets.append(bytes(body_[tl + 3:]))
        i += size
    if not packets:
        raise ValueError("No Opus audio found in the recording")
    if not head or not head.startswith(b"OpusHead"):
        head = b"OpusHead" + bytes([1, 1]) + (312).to_bytes(2, "little") + (48000).to_bytes(4, "little") + b"\0\0\0"
    serial = secrets.randbits(31)
    tags = b"OpusTags" + (11).to_bytes(4, "little") + b"SessionGram" + (0).to_bytes(4, "little")
    out = [_ogg_page(head, 0, serial, 0, 0x02), _ogg_page(tags, 0, serial, 1, 0)]
    granule = 0
    for k, p in enumerate(packets):
        granule += _opus_samples(p)
        out.append(_ogg_page(p, granule, serial, k + 2, 0x04 if k == len(packets) - 1 else 0))
    return b"".join(out), max(1, round(granule / 48000))


def _dialog_pid(a, ent):
    return a.me.id if isinstance(ent, types.InputPeerSelf) else utils.get_peer_id(ent)


async def _dialog_changed(a, pid):
    d = a.dialogs.get(pid)
    if d:
        a._assign_folders(pid)
        await HUB.send({"type": "dialog", "account": a.aid, "dialog": d, "account_unread": a.total_unread()})
    return d


@routes.post("/api/a/{aid}/pin_chat")
async def pin_chat(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    on = bool(b.get("pin", True))
    await a.client(functions.messages.ToggleDialogPinRequest(peer=types.InputDialogPeer(ent), pinned=on))
    pid = _dialog_pid(a, ent)
    if pid in a.dialogs:
        a.dialogs[pid]["pinned"] = on
    return {"ok": True, "dialog": await _dialog_changed(a, pid)}


@routes.post("/api/a/{aid}/archive")
async def archive(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    on = bool(b.get("archive", True))
    await a.client.edit_folder(ent, 1 if on else 0)
    pid = _dialog_pid(a, ent)
    if pid in a.dialogs:
        a.dialogs[pid]["archived"] = on
        a.dialogs[pid]["pinned"] = False
        a.meta.setdefault(pid, {})["archived"] = on
    return {"ok": True, "dialog": await _dialog_changed(a, pid)}


@routes.post("/api/a/{aid}/mark_unread")
async def mark_unread(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    await a.client(functions.messages.MarkDialogUnreadRequest(peer=types.InputDialogPeer(ent), unread=True))
    pid = _dialog_pid(a, ent)
    d = a.dialogs.get(pid)
    if d:
        a.meta.setdefault(pid, {})["marked_unread"] = True
        d["unread"] = max(d["unread"], 1)
    return {"ok": True, "dialog": await _dialog_changed(a, pid)}


@routes.post("/api/a/{aid}/pin_message")
async def pin_message(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    if b.get("unpin"):
        await a.client.unpin_message(ent, int(b["id"]) if b.get("id") else None)
    else:
        await a.client.pin_message(ent, int(b["id"]), notify=bool(b.get("notify")))
    return {"ok": True}


@routes.get("/api/a/{aid}/pinned/{peer}")
async def pinned(request):
    """The most recent pinned message of a chat, for the bar on top of the chat."""
    a = MGR.get(request.match_info["aid"])
    ent = await a.peer(request.match_info["peer"])
    msgs = await a.client.get_messages(ent, limit=1, filter=types.InputMessagesFilterPinned())
    m = msgs[0] if msgs else None
    return {"message": {"id": m.id, "text": msg_preview(m) or "Pinned message"} if m else None,
            "count": getattr(msgs, "total", 0) or (1 if m else 0)}


@routes.post("/api/a/{aid}/react")
async def react(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    emoji = str(b.get("emoji") or "")
    res = await a.client(functions.messages.SendReactionRequest(
        peer=ent, msg_id=int(b["id"]), reaction=[types.ReactionEmoji(emoticon=emoji)] if emoji else []))
    for u in getattr(res, "updates", None) or []:
        if isinstance(u, types.UpdateMessageReactions):
            return {"ok": True, "reactions": reactions_of(u.reactions)}
    m = await a.client.get_messages(ent, ids=int(b["id"]))
    return {"ok": True, "reactions": reactions_of(getattr(m, "reactions", None)) if m else []}


@routes.post("/api/a/{aid}/typing")
async def typing(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    action = types.SendMessageRecordAudioAction() if b.get("voice") else types.SendMessageTypingAction()
    await a.client(functions.messages.SetTypingRequest(peer=ent, action=action))
    return {"ok": True}


@routes.post("/api/a/{aid}/clear_history")
async def clear_history(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    if isinstance(ent, types.InputPeerChannel):
        await a.client(functions.channels.DeleteHistoryRequest(channel=ent, max_id=0))
    else:
        await a.client(functions.messages.DeleteHistoryRequest(peer=ent, max_id=0, just_clear=True,
                                                               revoke=bool(b.get("revoke"))))
    pid = _dialog_pid(a, ent)
    d = a.dialogs.get(pid)
    if d:
        d.update({"last": "", "unread": 0, "mentions": 0, "last_sender": None})
    return {"ok": True, "dialog": await _dialog_changed(a, pid)}


@routes.get("/api/a/{aid}/scheduled/{peer}")
async def scheduled(request):
    a = MGR.get(request.match_info["aid"])
    ent = await a.peer(request.match_info["peer"])
    res = await a.client(functions.messages.GetScheduledHistoryRequest(peer=ent, hash=0))
    out = []
    for m in getattr(res, "messages", []) or []:
        if isinstance(m, types.Message):
            out.append({"id": m.id, "date": ts(m.date), "text": m.message or msg_preview(m)})
    out.sort(key=lambda x: x["date"] or 0)
    return {"messages": out}


@routes.post("/api/a/{aid}/delete")
async def delete(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    await a.client.delete_messages(ent, [int(i) for i in b["ids"]], revoke=bool(b.get("revoke", True)))
    return {"ok": True}


@routes.post("/api/a/{aid}/edit")
async def edit(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    m = await a.client.edit_message(ent, int(b["id"]), b["text"])
    return {"message": a.msg_dict(m) if m else None}


@routes.post("/api/a/{aid}/forward")
async def forward(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    src = await a.peer(str(b["from_peer"]))
    dst = await a.peer(str(b["to_peer"]))
    await a.client.forward_messages(dst, [int(i) for i in b["ids"]], src)
    return {"ok": True}


# -- media
def _file_response(path: Path, mime=None, name=None, download=False):
    mime = mime or mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    headers = {"Cache-Control": "private, max-age=86400", "Content-Type": mime}
    if download and name:
        safe = re.sub(r'[^\w.\- ]', "_", name)
        headers["Content-Disposition"] = f'attachment; filename="{safe}"'
    return web.FileResponse(path, headers=headers)


@routes.get("/api/a/{aid}/media/{peer}/{msg_id}")
async def media(request):
    aid, peer = request.match_info["aid"], request.match_info["peer"]
    msg_id = int(request.match_info["msg_id"])
    thumb, download = qi(request, "thumb"), qi(request, "download")
    a = MGR.get(aid)
    ent = await a.peer(peer)
    key = f"{aid}_{peer}_{msg_id}_{'t' if thumb else 'f'}".replace("-", "m")
    folder = CACHE / "media"
    hit = next(folder.glob(key + ".*"), None)
    m = None
    if hit is None or download:
        m = await a.client.get_messages(ent, ids=msg_id)
        if not m or not m.media:
            raise HTTPException(404, "No media")
    if hit is None:
        if thumb:
            if isinstance(m.media, types.MessageMediaWebPage):
                wp_photo = getattr(m.media.webpage, "photo", None)
                path = await a.client.download_media(wp_photo, file=str(folder / key)) if wp_photo else None
            else:
                path = await a.client.download_media(m, file=str(folder / key), thumb=-1)
        else:
            path = await a.client.download_media(m, file=str(folder / key))
        if not path:
            raise HTTPException(404, "No media")
        hit = Path(path)
    name = mime = None
    if m is not None and m.file and not thumb:
        name, mime = m.file.name, m.file.mime_type
    if mime is None and hit.suffix == ".oga":
        mime = "audio/ogg"
    return _file_response(hit, mime, name or hit.name, bool(download))


@routes.get("/api/a/{aid}/avatar/{peer}")
async def avatar(request):
    aid, peer = request.match_info["aid"], request.match_info["peer"]
    a = MGR.get(aid)
    key = f"{aid}_{peer}".replace("-", "m")
    folder = CACHE / "avatars"
    jpg = folder / (key + ".jpg")
    none = folder / (key + ".none")
    if jpg.exists():
        return _file_response(jpg, "image/jpeg")
    if none.exists() and time.time() - none.stat().st_mtime < 3600:
        return web.Response(status=204)
    try:
        ent = a.me if peer in ("me", "self") else await a.peer(peer)
        path = await a.client.download_profile_photo(ent, file=str(jpg), download_big=False)
    except HTTPException:
        raise
    except Exception:
        path = None
    if not path:
        none.touch()
        return web.Response(status=204)
    return _file_response(Path(path), "image/jpeg")


# -- search / peers
def _peer_public(a, e):
    pid = utils.get_peer_id(e)
    return {"id": pid, "name": display_name(e, a.me.id), "kind": entity_kind(e), "username": getattr(e, "username", None),
            "has_photo": has_photo(e), "verified": bool(getattr(e, "verified", False)),
            "participants": getattr(e, "participants_count", None),
            "in_dialogs": pid in a.dialogs}


@routes.get("/api/a/{aid}/search")
async def search(request):
    a = MGR.get(request.match_info["aid"])
    q = request.query.get("q", "").strip()
    if not q:
        return {"local": [], "global": []}
    ql = q.lower().lstrip("@")
    local = [d for d in a.dialogs.values()
             if ql in (d["name"] or "").lower() or ql in (d.get("username") or "").lower()][:30]
    glob, seen = [], {d["id"] for d in local}
    if len(ql) >= 3 and re.fullmatch(r"[A-Za-z0-9_]{3,64}", ql):
        try:
            e = await a.client.get_entity(ql)
            a.entities[utils.get_peer_id(e)] = e
            p = _peer_public(a, e)
            if p["id"] not in seen:
                glob.append(p)
                seen.add(p["id"])
        except Exception:
            pass
    if len(ql) >= 2:
        try:
            res = await a.client(functions.contacts.SearchRequest(q=ql, limit=30))
            for e in list(res.users) + list(res.chats):
                if isinstance(e, (types.ChatForbidden, types.ChannelForbidden)):
                    continue
                pid = utils.get_peer_id(e)
                a.entities[pid] = e
                if pid not in seen:
                    glob.append(_peer_public(a, e))
                    seen.add(pid)
        except Exception as e:
            log.info("search failed: %s", safe_err(e))
    return {"local": local, "global": glob}


@routes.get("/api/a/{aid}/search_messages/{peer}")
async def search_messages(request):
    a = MGR.get(request.match_info["aid"])
    ent = await a.peer(request.match_info["peer"])
    msgs = await a.client.get_messages(ent, search=request.query.get("q", ""), limit=50)
    return {"messages": [a.msg_dict(m) for m in msgs]}


@routes.get("/api/a/{aid}/peer/{peer}")
async def peer_info(request):
    aid = request.match_info["aid"]
    a = MGR.get(aid)
    ent = await a.peer(request.match_info["peer"])
    e = await a.client.get_entity(ent)
    pid = utils.get_peer_id(e)
    a.entities[pid] = e
    out = _peer_public(a, e)
    out["is_self"] = bool(getattr(e, "is_self", False))
    if out["is_self"]:
        out["name"] = "Saved Messages"
    out["about"] = None
    out["status"] = None
    if isinstance(e, types.User):
        out["phone"] = ("+" + e.phone) if e.phone else None
        out["first_name"], out["last_name"] = e.first_name, e.last_name
        st = e.status
        if isinstance(st, types.UserStatusOnline):
            out["status"] = "online"
        elif isinstance(st, types.UserStatusOffline):
            out["status"] = "last seen " + st.was_online.astimezone().strftime("%b %d at %H:%M")
        elif isinstance(st, types.UserStatusRecently):
            out["status"] = "last seen recently"
        elif isinstance(st, types.UserStatusLastWeek):
            out["status"] = "last seen within a week"
        elif isinstance(st, types.UserStatusLastMonth):
            out["status"] = "last seen within a month"
        else:
            out["status"] = "bot" if e.bot else "last seen a long time ago"
        try:
            full = await a.client(functions.users.GetFullUserRequest(e))
            out["about"] = full.full_user.about
            out["common_chats"] = full.full_user.common_chats_count
        except Exception:
            pass
        out["can_send"] = not e.deleted
        out["joined"] = True
    else:
        try:
            if isinstance(e, types.Channel):
                full = await a.client(functions.channels.GetFullChannelRequest(e))
            else:
                full = await a.client(functions.messages.GetFullChatRequest(e.id))
            fc = full.full_chat
            out["about"] = getattr(fc, "about", None)
            cnt = getattr(fc, "participants_count", None)
            if cnt is None and getattr(fc, "participants", None) is not None:
                cnt = len(getattr(fc.participants, "participants", []) or [])
            out["participants"] = cnt
            out["online"] = getattr(fc, "online_count", None)
        except Exception:
            pass
        left = bool(getattr(e, "left", False))
        out["joined"] = not left
        if isinstance(e, types.Channel) and e.broadcast:
            out["can_send"] = bool(e.creator or (e.admin_rights and e.admin_rights.post_messages))
        else:
            banned = getattr(e, "default_banned_rights", None)
            out["can_send"] = (not left) and not (banned and banned.send_messages and not (getattr(e, "creator", False) or getattr(e, "admin_rights", None)))
        word = "subscribers" if out["kind"] == "channel" else "members"
        if out["participants"]:
            out["status"] = f"{out['participants']:,} {word}" + (f", {out['online']} online" if out.get("online") else "")
        else:
            out["status"] = out["kind"]
    out["link"] = f"https://t.me/{out['username']}" if out.get("username") else None
    out["can_pin"] = _can_pin(e)
    d = a.dialogs.get(pid)
    out["muted"] = d["muted"] if d else False
    return out


def _can_pin(e):
    if isinstance(e, types.User):
        return True
    if getattr(e, "creator", False):
        return True
    rights = getattr(e, "admin_rights", None)
    if isinstance(e, types.Channel) and e.broadcast:
        return bool(rights and (rights.edit_messages or rights.pin_messages))
    if rights and rights.pin_messages:
        return True
    banned = getattr(e, "default_banned_rights", None)
    return not (banned and banned.pin_messages) and not getattr(e, "left", False)


JOIN_ERRORS = [
    (errors.InviteRequestSentError, "Join request sent. An admin of this chat has to approve it."),
    (errors.ChannelsTooMuchError, "This account is already in too many channels/groups (Telegram limit). Leave some first."),
    (errors.ChannelPrivateError, "This chat is private, or this account was removed from it. Use an invite link."),
    (errors.InviteHashExpiredError, "This invite link has expired."),
    (errors.InviteHashInvalidError, "This invite link is not valid."),
    (errors.UserBannedInChannelError, "This account is banned from that chat."),
    (errors.UsernameNotOccupiedError, "No channel or group has that username."),
    (errors.UsernameInvalidError, "That username is not valid."),
]
INVITE_RE = re.compile(r"(?:t\.me/|telegram\.me/|telegram\.dog/)(?:joinchat/|\+)([\w-]+)|tg://join\?invite=([\w-]+)")


async def _join(a, target, username=""):
    m = INVITE_RE.search(target)
    if m:
        h = m.group(1) or m.group(2)
        chat = None
        try:
            chk = await a.client(functions.messages.CheckChatInviteRequest(h))
            if isinstance(chk, types.ChatInviteAlready):
                return chk.chat
        except errors.RPCError as e:
            if not isinstance(e, (errors.InviteHashExpiredError, errors.InviteHashInvalidError)):
                log.info("invite check failed: %s", safe_err(e))
            else:
                raise
        try:
            res = await a.client(functions.messages.ImportChatInviteRequest(h))
            chat = res.chats[0] if getattr(res, "chats", None) else None
        except errors.UserAlreadyParticipantError:
            chat = None
        if chat is None:
            raise HTTPException(400, "Already a member. Pull down to refresh the chat list.")
        return chat
    t = re.sub(r"^(https?://)?(t\.me|telegram\.me|telegram\.dog)/", "", target).split("?")[0].strip("/")
    t = t.split("/")[0] if not t.lstrip("-").isdigit() else t
    try:
        ent = await a.peer(t)
    except (HTTPException, ValueError, TypeError):
        if not username:
            raise
        ent = await a.peer(username)
    if isinstance(ent, types.InputPeerChat):
        raise HTTPException(400, "This is a basic group: it can only be joined with an invite link.")
    if not isinstance(ent, (types.InputPeerChannel, types.InputChannel)):
        raise HTTPException(400, "Only channels and groups can be joined.")
    chat = None
    try:
        res = await a.client(functions.channels.JoinChannelRequest(ent))
        want = utils.get_peer_id(ent)
        chats = getattr(res, "chats", None) or []
        chat = next((c for c in chats if utils.get_peer_id(c) == want), chats[0] if chats else None)
    except errors.UserAlreadyParticipantError:
        pass
    if chat is None:
        chat = await a.client.get_entity(ent)
    return chat


@routes.post("/api/a/{aid}/join")
async def join(request):
    aid = request.match_info["aid"]
    a = MGR.get(aid)
    b = await body(request)
    target = str(b.get("peer") or "").strip()
    if not target:
        raise HTTPException(400, "Nothing to join")
    try:
        chat = await _join(a, target, str(b.get("username") or "").strip().lstrip("@"))
    except tuple(e for e, _ in JOIN_ERRORS) as e:
        msg = next(t for k, t in JOIN_ERRORS if isinstance(e, k))
        log.warning("Join failed on account %s: %s", aid, type(e).__name__)
        raise HTTPException(400, msg)
    except (errors.RPCError, HTTPException) as e:
        log.warning("Join failed on account %s: %s", aid, e.detail if isinstance(e, HTTPException) else safe_err(e))
        raise
    pid = utils.get_peer_id(chat)
    a.entities[pid] = chat
    d = a.dialogs.get(pid) or a.new_dialog(pid, chat, last="You joined")
    await HUB.send({"type": "dialog", "account": aid, "dialog": d, "account_unread": a.total_unread()})

    async def refresh_later():
        await asyncio.sleep(3)
        try:
            await a.load_dialogs()
            await HUB.send({"type": "dialogs_changed", "account": aid})
        except Exception as e:
            log.info("dialog refresh failed: %s", safe_err(e))

    asyncio.create_task(refresh_later())
    return {"ok": True, "id": pid, "dialog": d, "kind": entity_kind(chat)}


@routes.post("/api/a/{aid}/leave")
async def leave(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    await a.client.delete_dialog(ent)
    a.dialogs.pop(utils.get_peer_id(ent), None)
    return {"ok": True}


@routes.post("/api/a/{aid}/mute")
async def mute(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    ent = await a.peer(str(b["peer"]))
    on = bool(b.get("mute"))
    until = datetime(2038, 1, 1, tzinfo=timezone.utc) if on else datetime.fromtimestamp(0, timezone.utc)
    await a.client(functions.account.UpdateNotifySettingsRequest(
        peer=types.InputNotifyPeer(ent), settings=types.InputPeerNotifySettings(mute_until=until)))
    d = a.dialogs.get(a.me.id if isinstance(ent, types.InputPeerSelf) else utils.get_peer_id(ent))
    if d:
        d["muted"] = on
    return {"ok": True}


# -- profile / contacts / devices
async def _me(aid):
    a = MGR.get(aid)
    a.me = await a.client.get_me()
    full = await a.client(functions.users.GetFullUserRequest(types.InputUserSelf()))
    u = a.me
    return {"id": u.id, "first_name": u.first_name, "last_name": u.last_name, "username": u.username,
            "phone": ("+" + u.phone) if u.phone else a.phone, "about": full.full_user.about,
            "premium": bool(getattr(u, "premium", False)), "name": display_name(u), "has_photo": has_photo(u)}


@routes.get("/api/a/{aid}/me")
async def me(request):
    return await _me(request.match_info["aid"])


@routes.post("/api/a/{aid}/me")
async def update_me(request):
    aid = request.match_info["aid"]
    a = MGR.get(aid)
    b = await body(request)
    await a.client(functions.account.UpdateProfileRequest(
        first_name=b.get("first_name") or a.me.first_name or "", last_name=b.get("last_name") or "",
        about=b.get("about") or ""))
    new_un = (b.get("username") or "").strip().lstrip("@")
    if new_un != (a.me.username or ""):
        await a.client(functions.account.UpdateUsernameRequest(username=new_un))
    (CACHE / "avatars" / f"{aid}_me.jpg").unlink(missing_ok=True)
    return await _me(aid)


@routes.post("/api/a/{aid}/photo")
async def set_photo(request):
    aid = request.match_info["aid"]
    a = MGR.get(aid)
    form = await request.post()
    f = form.get("file")
    if f is None or not hasattr(f, "file"):
        raise HTTPException(400, "No file")
    tmp = CACHE / f"up_{secrets.token_hex(6)}_{Path(f.filename or 'photo.jpg').name}"
    await save_upload(f, tmp)
    try:
        up = await a.client.upload_file(str(tmp))
        await a.client(functions.photos.UploadProfilePhotoRequest(file=up))
    finally:
        tmp.unlink(missing_ok=True)
    for p in (CACHE / "avatars").glob(f"{aid}_*"):
        if p.stem in (f"{aid}_me", f"{aid}_{a.me.id}"):
            p.unlink(missing_ok=True)
    a.me = await a.client.get_me()
    return {"ok": True}


@routes.get("/api/a/{aid}/contacts")
async def contacts(request):
    a = MGR.get(request.match_info["aid"])
    res = await a.client(functions.contacts.GetContactsRequest(hash=0))
    out = []
    for u in getattr(res, "users", []):
        a.entities[u.id] = u
        p = _peer_public(a, u)
        p["phone"] = ("+" + u.phone) if u.phone else None
        out.append(p)
    out.sort(key=lambda x: x["name"].lower())
    return {"contacts": out}


@routes.post("/api/a/{aid}/contacts")
async def add_contact(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    res = await a.client(functions.contacts.ImportContactsRequest([types.InputPhoneContact(
        client_id=secrets.randbits(31), phone=b["phone"], first_name=b.get("first_name") or b["phone"],
        last_name=b.get("last_name") or "")]))
    if not res.users:
        raise HTTPException(404, "That phone number is not on Telegram (or hides it)")
    u = res.users[0]
    a.entities[u.id] = u
    return {"id": u.id}


@routes.post("/api/a/{aid}/create")
async def create(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    title = (b.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "Title required")
    res = await a.client(functions.channels.CreateChannelRequest(
        title=title, about=b.get("about") or "", megagroup=b.get("kind") == "group", broadcast=b.get("kind") != "group"))
    chat = res.chats[0]
    pid = utils.get_peer_id(chat)
    a.entities[pid] = chat
    asyncio.create_task(a.load_dialogs())
    return {"id": pid}


@routes.get("/api/a/{aid}/devices")
async def devices(request):
    a = MGR.get(request.match_info["aid"])
    res = await a.client(functions.account.GetAuthorizationsRequest())
    out = []
    for x in res.authorizations:
        out.append({"hash": str(x.hash), "current": bool(x.current), "device": x.device_model, "platform": x.platform,
                    "system": x.system_version, "app": f"{x.app_name} {x.app_version}", "ip": x.ip,
                    "country": x.country, "active": ts(x.date_active)})
    return {"devices": out}


@routes.post("/api/a/{aid}/devices/terminate")
async def terminate_device(request):
    a = MGR.get(request.match_info["aid"])
    b = await body(request)
    await a.client(functions.account.ResetAuthorizationRequest(hash=int(b["hash"])))
    return {"ok": True}


# -- websocket / pages
@routes.get("/ws")
async def ws_handler(request):
    if request.cookies.get("sg_token") not in TOKENS:
        raise web.HTTPUnauthorized()
    ws = web.WebSocketResponse(heartbeat=30)
    await ws.prepare(request)
    HUB.sockets.add(ws)
    try:
        async for _ in ws:
            pass
    finally:
        HUB.sockets.discard(ws)
    return ws


@routes.get("/")
async def index(request):
    return web.FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})


def default_sessions_path():
    p = Path(ARGS.sessions).resolve() if ARGS and ARGS.sessions else DATA / "sessions.xlsx"
    if not p.exists():
        for alt in sorted(DATA.glob("sessions.*")):
            if alt.suffix.lower() in (".xlsx", ".xlsm", ".xls", ".csv"):
                return alt
    return p


async def _startup(app):
    CACHE.mkdir(parents=True, exist_ok=True)
    (CACHE / "avatars").mkdir(exist_ok=True)
    (CACHE / "media").mkdir(exist_ok=True)
    for p in CACHE.glob("up_*"):
        p.unlink(missing_ok=True)
    asyncio.create_task(MGR.load(default_sessions_path()))


async def _cleanup(app):
    await MGR.stop_all()


def make_app():
    app = web.Application(middlewares=[mw], client_max_size=2 * 1024 ** 3)
    app.add_routes(routes)
    app.router.add_static("/static", str(STATIC))
    app.on_startup.append(_startup)
    app.on_cleanup.append(_cleanup)
    return app


def configure(data_dir=None, static_dir=None):
    """Point data (sessions, config, cache) and static web files at the given folders."""
    global DATA, CACHE, CONFIG_FILE, STATIC
    if data_dir:
        DATA = Path(data_dir)
        DATA.mkdir(parents=True, exist_ok=True)
        CACHE = DATA / "cache"
        CONFIG_FILE = DATA / "config.json"
    if static_dir:
        STATIC = Path(static_dir)


def run_embedded(data_dir, static_dir, port, token, notifier=None):
    """Entry point used by the Android app: serve on 127.0.0.1 only, log in with a one-time token."""
    global ARGS, CONFIG, APP_TOKEN, NOTIFIER
    configure(data_dir, static_dir)
    ARGS = None
    CONFIG = {"password": secrets.token_urlsafe(24)}
    APP_TOKEN = token
    NOTIFIER = notifier
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    runner = web.AppRunner(make_app())
    loop.run_until_complete(runner.setup())
    loop.run_until_complete(web.TCPSite(runner, "127.0.0.1", int(port)).start())
    log.info("SessionGram embedded server on 127.0.0.1:%s", port)
    loop.run_forever()


def main():
    global ARGS, CONFIG
    ap = argparse.ArgumentParser(description="SessionGram - multi-account Telegram client")
    ap.add_argument("--sessions", default=None, help="path to sessions .xlsx/.xls/.csv (default: sessions.xlsx next to this file)")
    ap.add_argument("--host", default="0.0.0.0", help="bind address (0.0.0.0 = reachable from your phone on the same Wi-Fi)")
    ap.add_argument("--port", type=int, default=8080)
    ap.add_argument("--data", default=None, help="folder for sessions/config/cache (default: next to this file)")
    ARGS = ap.parse_args()
    configure(ARGS.data, None)
    CONFIG = load_config()
    import socket
    ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass
    print("=" * 60)
    print(f" SessionGram {APP_VERSION} is starting on port {ARGS.port}")
    print(f" Developed by {DEVELOPER['name']} · {DEVELOPER['github']}")
    print(f" Open on this device: http://127.0.0.1:{ARGS.port}")
    print(f" Open on your phone:  http://{ip}:{ARGS.port}  (same Wi-Fi)")
    print(f" Web password:        {CONFIG['password']}   (change it in config.json)")
    print("=" * 60)
    web.run_app(make_app(), host=ARGS.host, port=ARGS.port, print=None)


if __name__ == "__main__":
    main()
