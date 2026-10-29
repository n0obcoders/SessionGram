"""A simulated Telegram for testing SessionGram without real accounts.

`FakeClient` stands in for `telethon.TelegramClient`: it hands out real Telethon objects
(User, Channel, Message, Dialog, ...) so server.py runs its normal code paths, but nothing
touches the network. One fake account per session string `fake:<n>`; phone logins accept
code 12345, and numbers ending in 0 ask for the two-step password `hunter2`.
"""
import asyncio
import os
import random
from datetime import datetime, timedelta, timezone

from telethon import errors, events, functions, types, utils
from telethon.crypto import AuthKey
from telethon.helpers import TotalList
from telethon.sessions import StringSession
from telethon.tl.custom import Dialog

NOW = datetime.now(timezone.utc)
WORDS = ("hey there are you coming tonight sure sounds good let's ship it the build is green "
         "lunch at one meeting moved to friday nice photo congrats on the launch see you soon").split()
RNG = random.Random(7)


def sentence(rng):
    return " ".join(rng.choice(WORDS) for _ in range(rng.randint(2, 12))).capitalize()


class World:
    """Everything the fake Telegram knows, shared by all FakeClients (like the real servers)."""

    def __init__(self, dialogs_per_account=60, messages_per_chat=60):
        self.dpa = dialogs_per_account
        self.mpc = messages_per_chat
        self.next_user = 1000
        self.accounts = {}          # account number -> state dict
        self.phone_accounts = {}    # phone -> account number
        self.sent_codes = {}        # phone -> code hash

    def account(self, n):
        st = self.accounts.get(n)
        if st is None:
            st = self._make_account(n)
            self.accounts[n] = st
        return st

    def _make_account(self, n):
        rng = random.Random(n)
        me = types.User(id=500000 + n, is_self=True, first_name=rng.choice(["Asha", "Ravi", "Maya", "Leo", "Zara", "Omar", "Ivy", "Kai"]),
                        last_name=f"#{n}", username=f"sg_user{n}", phone=f"9198000{n:05d}", access_hash=n, premium=n % 5 == 0)
        ents, dialogs, msgs = {me.id: me}, [], {}
        for i in range(self.dpa):
            kind = i % 7
            if kind in (0, 1, 2, 3):
                e = types.User(id=1_000_000 + n * 10000 + i, first_name=rng.choice(["Ana", "Ben", "Chen", "Dev", "Eli", "Fay", "Gus", "Hira"]),
                               last_name=rng.choice(["Rao", "Lee", "Khan", "Diaz", ""]), access_hash=i + 1, contact=kind == 0,
                               username=f"u{n}_{i}" if i % 3 == 0 else None, bot=kind == 3 and i % 2 == 1,
                               status=types.UserStatusRecently())
            else:
                e = types.Channel(id=2_000_000 + n * 10000 + i, title=f"{rng.choice(['Dev', 'Family', 'Crypto', 'News', 'Music', 'Study'])} {'channel' if kind == 6 else 'group'} {i}",
                                  photo=types.ChatPhotoEmpty(), date=NOW, access_hash=i + 7, broadcast=kind == 6, megagroup=kind != 6,
                                  username=f"c{n}_{i}" if i % 2 else None, participants_count=rng.randint(3, 90000),
                                  creator=i % 11 == 0)
            pid = utils.get_peer_id(e)
            ents[pid] = e
            unread = rng.choice([0, 0, 0, 1, 2, 5, 12]) if i > 2 else 0
            dialogs.append({"pid": pid, "unread": unread, "pinned": i < 2, "archived": i % 23 == 22, "muted": i % 9 == 4,
                            "unread_mark": False, "folder_ids": []})
            msgs[pid] = None    # generated on first use
        return {"n": n, "me": me, "ents": ents, "dialogs": dialogs, "msgs": msgs, "next_id": 10_000, "authorized": True}

    def messages(self, st, pid, client):
        if st["msgs"].get(pid) is None:
            rng = random.Random(pid)
            shift = rng.randint(0, 3000)          # chats differ in how recent they are
            me, peer = st["me"], st["ents"][pid]
            out = []
            for k in range(self.mpc):
                mine = rng.random() < 0.35
                m = make_message(st, pid, k + 1, sentence(rng), out=mine and not getattr(peer, "broadcast", False),
                                 date=NOW - timedelta(minutes=(self.mpc - k) * 37 + shift))
                out.append(m)
            st["msgs"][pid] = out
        for m in st["msgs"][pid]:
            if m._client is None:
                m._finish_init(client, st["ents"], None)
        return st["msgs"][pid]


def make_message(st, pid, mid, text, out=False, date=None, media=None, reply_to=None):
    me, peer = st["me"], st["ents"][pid]
    if isinstance(peer, types.User):
        peer_id = types.PeerUser(peer.id)
        from_id = types.PeerUser(me.id if out else peer.id)
    else:
        peer_id = types.PeerChannel(peer.id)
        from_id = None if peer.broadcast else types.PeerUser(me.id if out else peer.id + 7)
    return types.Message(id=mid, peer_id=peer_id, date=date or datetime.now(timezone.utc), message=text, out=out,
                         from_id=from_id, media=media, views=1234 if getattr(peer, "broadcast", False) else None,
                         reply_to=types.MessageReplyHeader(reply_to_msg_id=reply_to) if reply_to else None)


WORLD = World(int(os.environ.get("SG_FAKE_DIALOGS", "60")), int(os.environ.get("SG_FAKE_MESSAGES", "60")))


class FakeClient:
    def __init__(self, session, api_id, api_hash, **kw):
        self.session = session if isinstance(session, StringSession) else StringSession()
        self.api_id, self.api_hash = api_id, api_hash
        self._connected = False
        self._handlers = []
        # A session string "fake:<n>" (or one saved after a fake phone login) maps to account n
        self.n = getattr(session, "_fake", None)
        self._pending_phone = None
        self._need_pw = False
        from telethon._updates import EntityCache
        self._mb_entity_cache = EntityCache()

    # -- connection / auth
    async def connect(self):
        await asyncio.sleep(0.01)
        self._connected = True

    def is_connected(self):
        return self._connected

    async def disconnect(self):
        self._connected = False

    async def is_user_authorized(self):
        return self.n is not None and self.n > 0

    @property
    def st(self):
        return WORLD.account(self.n)

    @property
    def _self_id(self):
        return self.st["me"].id if self.n else None

    async def get_me(self):
        return self.st["me"]

    async def send_code_request(self, phone, force_sms=False):
        if not phone.lstrip("+").isdigit() or len(phone) < 8:
            raise errors.PhoneNumberInvalidError(None)
        self._pending_phone = phone
        return types.auth.SentCode(type=types.auth.SentCodeTypeApp(length=5), phone_code_hash="hash" + phone,
                                   next_type=types.auth.CodeTypeSms(), timeout=30)

    async def sign_in(self, phone=None, code=None, *, password=None, phone_code_hash=None):
        if password is not None:
            if password != "hunter2":
                raise errors.PasswordHashInvalidError(None)
            self._finish_login()
            return self.st["me"]
        if str(code) != "12345":
            raise errors.PhoneCodeInvalidError(None)
        if phone.endswith("0"):
            self._need_pw = True
            raise errors.SessionPasswordNeededError(None)
        self._finish_login()
        return self.st["me"]

    def _finish_login(self):
        phone = self._pending_phone
        n = WORLD.phone_accounts.get(phone)
        if n is None:
            n = 900 + len(WORLD.phone_accounts)
            WORLD.phone_accounts[phone] = n
        self.n = n
        self.st["me"].phone = phone.lstrip("+")
        self.session.set_dc(2, "149.154.167.40", 443)
        self.session.auth_key = AuthKey(n.to_bytes(2, "big") * 128)

    # -- events
    def on(self, builder):
        def deco(fn):
            self._handlers.append((builder, fn))
            return fn
        return deco

    async def fire_new_message(self, pid, text, out=False):
        st = self.st
        WORLD.messages(st, pid, self)
        st["next_id"] += 1
        m = make_message(st, pid, st["next_id"], text, out=out)
        m._finish_init(self, st["ents"], None)
        st["msgs"][pid].append(m)
        for b, fn in self._handlers:
            if isinstance(b, events.NewMessage):
                class Ev:
                    message = m
                await fn(Ev())
        return m

    # -- entities
    def _entity(self, x):
        st = self.st
        if isinstance(x, (types.InputPeerSelf, types.InputUserSelf)) or x in ("me", "self"):
            return st["me"]
        if isinstance(x, str):
            for e in st["ents"].values():
                if getattr(e, "username", None) and e.username.lower() == x.lower():
                    return e
            raise ValueError(f'No user has "{x}" as username')
        if not isinstance(x, int):
            x = utils.get_peer_id(x)
        e = st["ents"].get(x)
        if e is None:
            raise ValueError("Could not find the input entity")
        return e

    async def get_entity(self, x):
        return self._entity(x)

    async def get_input_entity(self, x):
        e = self._entity(x)
        return types.InputPeerSelf() if getattr(e, "is_self", False) else utils.get_input_peer(e)

    def _pid(self, ent):
        if isinstance(ent, types.InputPeerSelf):
            return self.st["me"].id
        return utils.get_peer_id(ent)

    # -- dialogs
    async def iter_dialogs(self, limit=None):
        st = self.st
        for d in st["dialogs"]:
            msgs = WORLD.messages(st, d["pid"], self)
            last = msgs[-1]
            peer = utils.get_peer(st["ents"][d["pid"]])
            mute = datetime(2038, 1, 1, tzinfo=timezone.utc) if d["muted"] else None
            dlg = types.Dialog(peer=peer, top_message=last.id, read_inbox_max_id=0, read_outbox_max_id=last.id - 1,
                               unread_count=d["unread"], unread_mentions_count=1 if d["unread"] > 4 else 0, unread_reactions_count=0,
                               unread_poll_votes_count=0, notify_settings=types.PeerNotifySettings(mute_until=mute),
                               pinned=d["pinned"], unread_mark=d["unread_mark"], folder_id=1 if d["archived"] else None)
            yield Dialog(self, dlg, st["ents"], last)

    def _dialog(self, pid):
        return next(d for d in self.st["dialogs"] if d["pid"] == pid)

    # -- messages
    async def get_messages(self, ent, limit=None, offset_id=0, ids=None, search=None, filter=None):
        pid = self._pid(ent)
        msgs = WORLD.messages(self.st, pid, self)
        if ids is not None:
            one = isinstance(ids, int)
            want = [ids] if one else list(ids)
            found = [next((m for m in msgs if m.id == i), None) for i in want]
            return found[0] if one else found
        pool = msgs
        if isinstance(filter, types.InputMessagesFilterPinned):
            pool = [m for m in msgs if m.pinned]
        if search:
            pool = [m for m in pool if search.lower() in (m.message or "").lower()]
        if offset_id:
            pool = [m for m in pool if m.id < offset_id]
        res = TotalList(list(reversed(pool))[:limit or 100])
        res.total = len(pool)
        return res

    async def send_message(self, ent, text, reply_to=None, link_preview=True, silent=None, schedule=None):
        pid = self._pid(ent)
        st = self.st
        WORLD.messages(st, pid, self)
        st["next_id"] += 1
        m = make_message(st, pid, st["next_id"], text, out=True, reply_to=reply_to)
        m._finish_init(self, st["ents"], None)
        if schedule:
            st.setdefault("scheduled", []).append(m)
            return m
        st["msgs"][pid].append(m)
        return m

    async def send_file(self, ent, file, caption=None, reply_to=None, voice_note=False, silent=None, attributes=None, mime_type=None, **kw):
        pid = self._pid(ent)
        st = self.st
        WORLD.messages(st, pid, self)
        st["next_id"] += 1
        data = open(file, "rb").read()
        attrs = list(attributes or [])
        if voice_note and not attrs:
            attrs = [types.DocumentAttributeAudio(duration=1, voice=True)]
        attrs.append(types.DocumentAttributeFilename(os.path.basename(file)))
        doc = types.Document(id=st["next_id"], access_hash=1, file_reference=b"", date=datetime.now(timezone.utc),
                             mime_type=mime_type or ("audio/ogg" if voice_note else "application/octet-stream"), size=len(data),
                             dc_id=2, attributes=attrs)
        m = make_message(st, pid, st["next_id"], caption or "", out=True, media=types.MessageMediaDocument(document=doc), reply_to=reply_to)
        m._finish_init(self, st["ents"], None)
        m._fake_bytes = data
        st["msgs"][pid].append(m)
        st["last_upload"] = {"name": os.path.basename(file), "bytes": data, "voice": voice_note, "attributes": attrs, "mime": mime_type}
        return m

    async def edit_message(self, ent, mid, text):
        m = await self.get_messages(ent, ids=mid)
        m.message = text
        m.edit_date = datetime.now(timezone.utc)
        return m

    async def delete_messages(self, ent, ids, revoke=True):
        pid = self._pid(ent)
        self.st["msgs"][pid] = [m for m in WORLD.messages(self.st, pid, self) if m.id not in ids]

    async def forward_messages(self, dst, ids, src):
        for i in ids:
            m = await self.get_messages(src, ids=i)
            await self.send_message(dst, m.message)

    async def send_read_acknowledge(self, ent, clear_mentions=False):
        pid = self._pid(ent)
        try:
            d = self._dialog(pid)
            d["unread"] = 0
            d["unread_mark"] = False
        except StopIteration:
            pass

    async def pin_message(self, ent, mid, notify=False):
        m = await self.get_messages(ent, ids=mid)
        m.pinned = True

    async def unpin_message(self, ent, mid=None):
        pid = self._pid(ent)
        for m in WORLD.messages(self.st, pid, self):
            if mid is None or m.id == mid:
                m.pinned = False

    async def edit_folder(self, ent, folder):
        self._dialog(self._pid(ent))["archived"] = folder == 1

    async def delete_dialog(self, ent):
        pid = self._pid(ent)
        self.st["dialogs"] = [d for d in self.st["dialogs"] if d["pid"] != pid]

    async def download_profile_photo(self, ent, file=None, download_big=False):
        return None

    async def download_media(self, m, file=None, thumb=None):
        data = getattr(m, "_fake_bytes", b"\x89PNG\r\n\x1a\n")
        path = str(file) + ".bin"
        with open(path, "wb") as f:
            f.write(data)
        return path

    async def upload_file(self, path):
        return types.InputFile(id=1, parts=1, name="p.jpg", md5_checksum="")

    # -- raw requests
    async def __call__(self, req):
        st = self.st if self.n else None
        name = type(req).__name__
        if name == "GetDialogFiltersRequest":
            return types.messages.DialogFilters(filters=[
                types.DialogFilter(id=2, title=types.TextWithEntities("Personal", []), pinned_peers=[], include_peers=[], exclude_peers=[], contacts=True, non_contacts=True),
                types.DialogFilter(id=3, title=types.TextWithEntities("Groups", []), pinned_peers=[], include_peers=[], exclude_peers=[], groups=True),
                types.DialogFilter(id=4, title=types.TextWithEntities("Channels", []), pinned_peers=[], include_peers=[], exclude_peers=[], broadcasts=True),
            ])
        if name == "ToggleDialogPinRequest":
            self._dialog(self._pid(req.peer.peer))["pinned"] = bool(req.pinned)
            return True
        if name == "MarkDialogUnreadRequest":
            self._dialog(self._pid(req.peer.peer))["unread_mark"] = True
            return True
        if name == "SendReactionRequest":
            m = await self.get_messages(req.peer, ids=req.msg_id)
            res = []
            if req.reaction:
                res = [types.ReactionCount(reaction=req.reaction[0], count=1, chosen_order=0),
                       types.ReactionCount(reaction=types.ReactionEmoji("👍"), count=3)] if req.reaction[0].emoticon != "👍" else \
                      [types.ReactionCount(reaction=req.reaction[0], count=4, chosen_order=0)]
            m.reactions = types.MessageReactions(results=res)
            return types.Updates(updates=[types.UpdateMessageReactions(peer=utils.get_peer(st["ents"][self._pid(req.peer)]) if not isinstance(req.peer, types.InputPeerSelf) else types.PeerUser(st["me"].id),
                                                                       msg_id=req.msg_id, reactions=m.reactions)], users=[], chats=[], date=NOW, seq=0)
        if name == "SetTypingRequest":
            st["typing"] = st.get("typing", 0) + 1
            return True
        if name in ("DeleteHistoryRequest",):
            pid = self._pid(getattr(req, "peer", None) or req.channel)
            st["msgs"][pid] = []
            WORLD.mpc_backup = WORLD.mpc
            st["msgs"][pid] = [make_message(st, pid, 1, "History was cleared", out=False)]
            return types.messages.AffectedHistory(pts=1, pts_count=1, offset=0)
        if name == "GetScheduledHistoryRequest":
            return types.messages.Messages(messages=st.get("scheduled", []), topics=[], chats=[], users=[])
        if name == "GetFullUserRequest":
            uid = st["me"].id if isinstance(req.id, types.InputUserSelf) else self._pid(req.id)
            return types.users.UserFull(full_user=types.UserFull(id=uid, settings=types.PeerSettings(), notify_settings=types.PeerNotifySettings(),
                                                                    common_chats_count=2, about="Hello from the fake Telegram"), chats=[], users=[])
        if name == "GetFullChannelRequest":
            e = self._entity(req.channel)

            class FC:
                about = "A simulated chat"
                participants_count = e.participants_count
                online_count = 3
            class R:
                full_chat = FC()
            return R()
        if name == "UpdateNotifySettingsRequest":
            return True
        if name == "GetPasswordRequest":
            class P:
                hint = "classic"
            return P()
        if name == "ResendCodeRequest":
            return types.auth.SentCode(type=types.auth.SentCodeTypeSms(length=5), phone_code_hash="hash2", timeout=60)
        if name == "GetAuthorizationsRequest":
            mk = lambda h, cur, dev: types.Authorization(hash=h, device_model=dev, platform="Android", system_version="16", api_id=1, app_name="SessionGram",
                                                         app_version="2.0", date_created=NOW, date_active=NOW, ip="10.0.0.1", country="India", region="", current=cur)
            return types.account.Authorizations(authorization_ttl_days=180, authorizations=[mk(0, True, "SessionGram"), mk(77, False, "Desktop")])
        if name == "ResetAuthorizationRequest":
            st["terminated"] = req.hash
            return True
        if name == "GetContactsRequest":
            return types.contacts.Contacts(contacts=[], saved_count=0, users=[e for e in st["ents"].values() if isinstance(e, types.User) and e.contact])
        if name == "SearchRequest":
            return types.contacts.Found(my_results=[], results=[], chats=[], users=[])
        raise NotImplementedError(name)


def install(server):
    """Point server.py at the fake Telegram."""
    real_ss = server.StringSession

    class FakeStringSession(StringSession):
        def __init__(self, string=None):
            if string and string.startswith("fake:"):
                super().__init__(None)
                self._fake = int(string[5:])
            else:
                super().__init__(string)
                self._fake = int.from_bytes(self.auth_key.key[:2], "big") if self.auth_key else None

    server.StringSession = FakeStringSession
    server.make_client = lambda session, api_id, api_hash: FakeClient(session, api_id, api_hash)
    return real_ss


def write_sessions_csv(path, count):
    with open(path, "w") as f:
        f.write("phone,api id,api hash,session\n")
        for n in range(1, count + 1):
            f.write(f"+9198000{n:05d},12345,{'a' * 32},fake:{n}\n")
