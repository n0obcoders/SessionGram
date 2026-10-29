"""Run SessionGram against the simulated Telegram: python tests/run_fake_server.py --accounts 150 --port 8099"""
import argparse
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import server  # noqa: E402
import fake_telegram  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--accounts", type=int, default=5)
ap.add_argument("--port", type=int, default=8099)
ap.add_argument("--data", default=None)
ap.add_argument("--static", default=None, help="serve a different web UI folder (e.g. to compare with an older build)")
ap.add_argument("--app-token", default=None, help="behave like the Android app (token login, no password page)")
a = ap.parse_args()

fake_telegram.install(server)
data = Path(a.data or tempfile.mkdtemp(prefix="sg-test-"))
server.configure(str(data), a.static)
if a.accounts:
    fake_telegram.write_sessions_csv(data / "sessions.csv", a.accounts)
server.ARGS = argparse.Namespace(sessions=None)
server.CONFIG = {"password": "test"}
server.APP_TOKEN = a.app_token
print("data dir:", data, flush=True)


async def burst(request):
    """Test hook: deliver N incoming messages spread over every account, as fast as possible."""
    n = int(request.query.get("n", "100"))
    accs = [x for x in server.MGR.accounts.values() if x.status == "online" and x.dialogs]
    for k in range(n):
        acc = accs[k % len(accs)]
        pids = list(acc.dialogs)
        await acc.client.fire_new_message(pids[(k // len(accs)) % len(pids)], f"Burst message {k}")
    return server.web.json_response({"sent": n})


app = server.make_app()
app.router.add_post("/test/burst", burst)
server.web.run_app(app, host="127.0.0.1", port=a.port, print=None)
