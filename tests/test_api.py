"""End-to-end tests of the SessionGram engine (server.py) against the simulated Telegram.

Run:  pip install pytest pytest-aiohttp && pytest tests -q
"""
import asyncio
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tests"))
import server  # noqa: E402
import fake_telegram  # noqa: E402

fake_telegram.install(server)


@pytest.fixture
async def cli(aiohttp_client, tmp_path, request):
    n = getattr(request, "param", 3)
    server.configure(str(tmp_path), None)
    server.ARGS = None
    server.CONFIG = {"password": "pw"}
    server.APP_TOKEN = None
    server.MGR.accounts = {}
    server.PENDING.clear()
    if n:
        fake_telegram.write_sessions_csv(tmp_path / "sessions.csv", n)
    client = await aiohttp_client(server.make_app())
    r = await client.post("/api/login", json={"password": "pw"})
    assert r.status == 200
    # wait until every account connected and loaded its chats
    for _ in range(400):
        acc = await (await client.get("/api/accounts")).json()
        if len(acc["accounts"]) == n and all(a["dialogs_loaded"] for a in acc["accounts"]):
            break
        await asyncio.sleep(0.05)
    return client


async def j(resp, status=200):
    body = await resp.json()
    assert resp.status == status, body
    return body


async def test_about_is_public(aiohttp_client, tmp_path):
    server.configure(str(tmp_path), None)
    server.CONFIG = {"password": "pw"}
    c = await aiohttp_client(server.make_app())
    r = await j(await c.get("/api/about"))
    assert r["app"] == "SessionGram"
    assert r["developer"] == {"name": "Nitin Shukla", "github": "https://github.com/n0obcoders",
                              "portfolio": "https://n0obcoders.github.io/portfoli0/"}
    assert (await c.get("/api/accounts")).status == 401          # everything else needs login


async def test_password_gate(aiohttp_client, tmp_path):
    server.configure(str(tmp_path), None)
    server.CONFIG = {"password": "pw"}
    server.APP_TOKEN = None
    c = await aiohttp_client(server.make_app())
    assert (await c.post("/api/login", json={"password": "nope"})).status == 403
    assert (await c.post("/api/login", json={"password": "pw"})).status == 200
    assert (await c.get("/api/accounts")).status == 200


async def test_accounts_and_dialogs(cli):
    acc = await j(await cli.get("/api/accounts"))
    assert [a["status"] for a in acc["accounts"]] == ["online"] * 3
    d = await j(await cli.get("/api/a/1/dialogs"))
    assert len(d["dialogs"]) == 60
    assert {f["title"] for f in d["folders"]} == {"Personal", "Groups", "Channels"}
    assert any(x["pinned"] for x in d["dialogs"]) and any(x["archived"] for x in d["dialogs"])


# ---------------------------------------------------------------- phone number + OTP login
async def test_phone_login_with_code(cli):
    cfg = await j(await cli.get("/api/phone/config"))
    assert cfg["has_saved_api"] is True                          # falls back to the loaded accounts' API ID
    bad = await j(await cli.post("/api/phone/start", json={"phone": "12", "api_id": "1", "api_hash": "a" * 32}), 400)
    assert "country code" in bad["detail"]
    bad = await j(await cli.post("/api/phone/start", json={"phone": "+15550001111", "api_id": "x", "api_hash": "a" * 32}), 400)
    assert "API ID" in bad["detail"]
    r = await j(await cli.post("/api/phone/start", json={"phone": "+1 555 000 1111", "api_id": "777", "api_hash": "b" * 32}))
    assert r["phone"] == "+15550001111" and r["via"] == "app" and r["length"] == 5 and r["next"] == "sms"
    wrong = await j(await cli.post("/api/phone/code", json={"lid": r["lid"], "code": "00000"}), 400)
    assert "Wrong code" in wrong["detail"]
    rs = await j(await cli.post("/api/phone/resend", json={"lid": r["lid"]}))
    assert rs["via"] == "sms"
    ok = await j(await cli.post("/api/phone/code", json={"lid": r["lid"], "code": "1 2 3 4 5"}))
    assert ok["ok"] and ok["account"]["status"] == "online"
    assert len(ok["accounts"]) == 4
    # saved for next time: API credentials remembered, account appended to the sessions file
    cfg = await j(await cli.get("/api/phone/config"))
    assert cfg["api_id"] == 777
    rows = (Path(server.DATA) / "sessions.csv").read_text().strip().splitlines()
    assert len(rows) == 5 and rows[-1].startswith("+15550001111,777,")
    assert "b" * 32 not in json.dumps(ok)                        # the API hash never reaches the browser
    # the same number cannot be added twice
    dup = await j(await cli.post("/api/phone/start", json={"phone": "+15550001111", "use_saved": True}), 409)
    assert "already logged in" in dup["detail"]


async def test_phone_login_with_two_step_password(cli):
    r = await j(await cli.post("/api/phone/start", json={"phone": "+447700900120", "use_saved": True}))
    need = await j(await cli.post("/api/phone/code", json={"lid": r["lid"], "code": "12345"}))
    assert need == {"need_password": True, "hint": "classic"}
    bad = await j(await cli.post("/api/phone/password", json={"lid": r["lid"], "password": "wrong"}), 400)
    assert "Wrong password" in bad["detail"]
    ok = await j(await cli.post("/api/phone/password", json={"lid": r["lid"], "password": "hunter2"}))
    assert ok["ok"]


async def test_phone_login_cancel_and_expiry(cli):
    r = await j(await cli.post("/api/phone/start", json={"phone": "+919000000001", "use_saved": True}))
    await j(await cli.post("/api/phone/cancel", json={"lid": r["lid"]}))
    gone = await j(await cli.post("/api/phone/code", json={"lid": r["lid"], "code": "12345"}), 410)
    assert "expired" in gone["detail"]


# ---------------------------------------------------------------- new chat features
async def first_user_chat(cli, aid="1"):
    d = await j(await cli.get(f"/api/a/{aid}/dialogs"))
    return next(x for x in d["dialogs"] if x["kind"] == "user" and not x["archived"] and not x["pinned"])


async def test_pin_archive_mark_unread(cli):
    chat = await first_user_chat(cli)
    r = await j(await cli.post("/api/a/1/pin_chat", json={"peer": chat["id"], "pin": True}))
    assert r["dialog"]["pinned"] is True
    r = await j(await cli.post("/api/a/1/mark_unread", json={"peer": chat["id"]}))
    assert r["dialog"]["unread"] >= 1
    r = await j(await cli.post("/api/a/1/archive", json={"peer": chat["id"], "archive": True}))
    assert r["dialog"]["archived"] is True and r["dialog"]["pinned"] is False
    r = await j(await cli.post("/api/a/1/archive", json={"peer": chat["id"], "archive": False}))
    assert r["dialog"]["archived"] is False


async def test_reactions_pins_and_messages(cli):
    chat = await first_user_chat(cli)
    msgs = (await j(await cli.get(f"/api/a/1/messages/{chat['id']}?limit=5")))["messages"]
    assert len(msgs) == 5 and msgs[0]["id"] < msgs[-1]["id"]
    mid = msgs[-1]["id"]
    r = await j(await cli.post("/api/a/1/react", json={"peer": chat["id"], "id": mid, "emoji": "🔥"}))
    assert {"e": "🔥", "n": 1, "me": True} in r["reactions"]
    r = await j(await cli.post("/api/a/1/react", json={"peer": chat["id"], "id": mid, "emoji": ""}))
    assert r["reactions"] == []
    assert (await j(await cli.get(f"/api/a/1/pinned/{chat['id']}")))["message"] is None
    await j(await cli.post("/api/a/1/pin_message", json={"peer": chat["id"], "id": mid}))
    p = await j(await cli.get(f"/api/a/1/pinned/{chat['id']}"))
    assert p["message"]["id"] == mid and p["count"] == 1
    msgs = (await j(await cli.get(f"/api/a/1/messages/{chat['id']}?limit=1")))["messages"]
    assert msgs[0]["pinned"] is True
    await j(await cli.post("/api/a/1/pin_message", json={"peer": chat["id"], "id": mid, "unpin": True}))
    assert (await j(await cli.get(f"/api/a/1/pinned/{chat['id']}")))["message"] is None


async def test_send_silent_scheduled_typing_and_saved(cli):
    chat = await first_user_chat(cli)
    r = await j(await cli.post("/api/a/1/send", json={"peer": chat["id"], "text": "hello", "silent": True}))
    assert r["message"]["text"] == "hello" and r["message"]["out"]
    past = await j(await cli.post("/api/a/1/send", json={"peer": chat["id"], "text": "x", "schedule": int(time.time()) - 5}), 400)
    assert "future" in past["detail"]
    r = await j(await cli.post("/api/a/1/send", json={"peer": chat["id"], "text": "later", "schedule": int(time.time()) + 3600}))
    assert r["message"] is None and r["scheduled"] > time.time()
    sch = await j(await cli.get(f"/api/a/1/scheduled/{chat['id']}"))
    assert sch["messages"][0]["text"] == "later"
    await j(await cli.post("/api/a/1/typing", json={"peer": chat["id"]}))
    await j(await cli.post("/api/a/1/typing", json={"peer": chat["id"], "voice": True}))
    msgs = (await j(await cli.get(f"/api/a/1/messages/{chat['id']}?limit=1")))["messages"]
    await j(await cli.post("/api/a/1/forward", json={"from_peer": chat["id"], "to_peer": "me", "ids": [msgs[0]["id"]]}))


async def test_clear_history_and_peer_info(cli):
    chat = await first_user_chat(cli)
    info = await j(await cli.get(f"/api/a/1/peer/{chat['id']}"))
    assert info["can_pin"] is True and info["about"]
    r = await j(await cli.post("/api/a/1/clear_history", json={"peer": chat["id"]}))
    assert r["dialog"]["unread"] == 0
    msgs = (await j(await cli.get(f"/api/a/1/messages/{chat['id']}")))["messages"]
    assert len(msgs) == 1


async def test_devices_terminate(cli):
    d = await j(await cli.get("/api/a/1/devices"))
    other = next(x for x in d["devices"] if not x["current"])
    await j(await cli.post("/api/a/1/devices/terminate", json={"hash": other["hash"]}))
    assert fake_telegram.WORLD.account(1)["terminated"] == int(other["hash"])


async def test_unified_inbox(cli):
    r = await j(await cli.get("/api/inbox"))
    assert r["total"] > 0
    accounts = {x["account"] for x in r["dialogs"]}
    assert accounts == {"1", "2", "3"}                          # unread chats from every account
    dates = [x["date"] for x in r["dialogs"]]
    assert dates == sorted(dates, reverse=True)
    assert all(x["unread"] > 0 and not x["archived"] for x in r["dialogs"])


def _make_webm(tmp_path, seconds=2):
    if not shutil.which("ffmpeg"):
        pytest.skip("ffmpeg is needed to make a test recording")
    src = tmp_path / "rec.webm"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}",
                    "-c:a", "libopus", "-b:a", "32k", str(src)], check=True)
    return src.read_bytes()


async def test_voice_message_is_remuxed_to_ogg(cli, tmp_path):
    chat = await first_user_chat(cli)
    import aiohttp
    fd = aiohttp.FormData()
    fd.add_field("peer", str(chat["id"]))
    fd.add_field("voice", "1")
    fd.add_field("file", _make_webm(tmp_path, 3), filename="voice.webm", content_type="audio/webm")
    r = await j(await cli.post("/api/a/1/send_file", data=fd))
    assert r["message"]["media"]["kind"] == "voice"
    up = fake_telegram.WORLD.account(1)["last_upload"]
    assert up["bytes"][:4] == b"OggS" and up["mime"] == "audio/ogg" and up["voice"]
    assert up["attributes"][0].duration == 3 and up["attributes"][0].voice
    out = tmp_path / "check.ogg"
    out.write_bytes(up["bytes"])
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name:format=duration", "-of", "json", str(out)],
                           capture_output=True, text=True, check=True)
    info = json.loads(probe.stdout)
    assert info["streams"][0]["codec_name"] == "opus"
    assert abs(float(info["format"]["duration"]) - 3.0) < 0.1
    dec = subprocess.run(["ffmpeg", "-v", "error", "-i", str(out), "-f", "null", "-"], capture_output=True, text=True)
    assert dec.returncode == 0 and not dec.stderr.strip()       # decodes cleanly: valid pages and CRCs


async def test_realtime_message_reaches_websocket(cli):
    ws = await cli.ws_connect("/ws")
    a = server.MGR.accounts["2"]
    chat = await first_user_chat(cli, "2")
    await a.client.fire_new_message(chat["id"], "ping from the other side")
    for _ in range(20):
        msg = await ws.receive_json(timeout=5)
        if msg["type"] == "message":
            break
    assert msg["account"] == "2" and msg["message"]["text"] == "ping from the other side"
    assert msg["dialog"]["unread"] >= 1
    await ws.close()


@pytest.mark.parametrize("cli", [150], indirect=True)
async def test_150_accounts_load_and_stay_responsive(cli):
    """100+ accounts: all connect, and API calls stay fast while they work."""
    acc = await j(await cli.get("/api/accounts"))
    assert len(acc["accounts"]) == 150 and all(a["status"] == "online" for a in acc["accounts"])
    t = time.perf_counter()
    for aid in ("1", "75", "150"):
        await j(await cli.get(f"/api/a/{aid}/dialogs"))
    await j(await cli.get("/api/inbox?limit=500"))
    assert time.perf_counter() - t < 2.0
    # a burst of 600 incoming messages spread over every account
    t = time.perf_counter()
    for k in range(600):
        a = server.MGR.accounts[str(k % 150 + 1)]
        pid = next(iter(a.dialogs))
        await a.client.fire_new_message(pid, f"burst {k}")
    elapsed = time.perf_counter() - t
    assert elapsed < 6.0, elapsed
