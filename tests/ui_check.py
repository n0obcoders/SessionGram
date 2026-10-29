"""Click through every SessionGram screen in Chromium (the engine Android's WebView uses) against the simulated Telegram.

    python tests/run_fake_server.py --accounts 150 --port 8099 &
    python tests/ui_check.py --url http://127.0.0.1:8099 --shots docs/screenshots

Prints one PASS/FAIL line per check and exits non-zero if anything failed.
"""
import argparse
import json
import os
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--url", default="http://127.0.0.1:8099")
ap.add_argument("--shots", default=None)
ap.add_argument("--chrome", default=os.environ.get("SG_CHROME"))
ap.add_argument("--accounts", type=int, default=150)
args = ap.parse_args()
U = args.url
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail else ""), flush=True)


def shot(page, name):
    if args.shots:
        page.wait_for_timeout(450)          # let sheets and pages finish sliding in
        os.makedirs(args.shots, exist_ok=True)
        page.screenshot(path=os.path.join(args.shots, name + ".png"))


def wait_toast(page, text, timeout=5000):
    page.wait_for_function("t => document.querySelector('#toast').classList.contains('on') && document.querySelector('#toast').textContent.includes(t)", arg=text, timeout=timeout)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.chrome, args=["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"])
    ctx = browser.new_context(viewport={"width": 412, "height": 900}, device_scale_factor=2, is_mobile=True, has_touch=True,
                              permissions=["microphone"], locale="en-IN")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: m.type == "error" and not m.text.startswith("Failed to load resource") and errors.append(m.text))
    bad_http = []
    # 403 (wrong web password) and 400 (wrong login code) are provoked on purpose below
    page.on("response", lambda r: r.status >= 400 and r.status not in (400, 403) and bad_http.append(f"{r.status} {r.url}"))

    # ---------------------------------------------------------------- intro with credits
    page.goto(U + "/")
    page.wait_for_url("**/static/intro.html")
    check("first visit plays the intro", "intro.html" in page.url)
    page.wait_for_function("document.querySelector('#ctext').textContent === 'Developed by Nitin Shukla'", timeout=8000)
    check("intro types 'Developed by Nitin Shukla'", True)
    hrefs = page.eval_on_selector_all(".card", "els => els.map(e => e.href)")
    check("intro links GitHub and portfolio", "https://github.com/n0obcoders" in hrefs and "https://n0obcoders.github.io/portfoli0/" in hrefs, hrefs)
    check("intro shows name, GitHub and portfolio cards", page.locator(".card .v").all_text_contents() == ["Nitin Shukla", "github.com/n0obcoders", "n0obcoders.github.io/portfoli0"])
    letters = page.locator("h1 span")
    check("title spells SessionGram", "".join(letters.all_text_contents()) == "SessionGram")
    letters.nth(0).dispatch_event("pointerdown")
    page.wait_for_timeout(120)
    check("tapping a letter makes it hop", "hop" in (letters.nth(0).get_attribute("class") or ""))
    page.locator("#logo").dispatch_event("pointerdown", {"clientX": 200, "clientY": 150})
    page.wait_for_timeout(100)
    check("tapping the logo spins it", "spin" in (page.locator("#logo").get_attribute("class") or ""))
    shot(page, "01-intro")
    page.wait_for_function("!document.querySelector('#enter').disabled", timeout=6000)
    page.click("#enter")
    page.wait_for_url(U + "/", timeout=5000)
    check("Enter SessionGram opens the app", page.url.rstrip("/") == U)

    # ---------------------------------------------------------------- password (browser mode) then main screen
    page.wait_for_selector("#loginPass", state="visible")
    page.fill("#loginPass", "wrong")
    page.click("#loginBtn")
    page.wait_for_function("document.querySelector('#loginErr').textContent.length > 0")
    check("wrong web password is refused", "Wrong" in page.text_content("#loginErr"))
    page.fill("#loginPass", "test")
    page.click("#loginBtn")
    page.wait_for_selector("#chatList .row[data-peer]", timeout=20000)
    check("chat list renders", page.locator("#chatList .row[data-peer]").count() > 10)
    check("folder tabs render as chips", page.locator("#tabs .tab").count() == 4)
    check("pinned chats are highlighted", page.locator("#chatList .pinned-row").count() >= 1)
    shot(page, "02-chats")

    # ---------------------------------------------------------------- drawer with 150 accounts
    t = time.time()
    page.click("#menuBtn")
    page.wait_for_selector("#drawer.on .acc-row[data-acc]")
    n_acc = page.locator(".acc-row[data-acc]").count()
    check("drawer lists every account", n_acc == args.accounts, n_acc)
    check("account search box appears for many accounts", page.locator(".acc-filter").is_visible())
    page.fill(".acc-filter", "#75")
    check("account search filters", page.locator(".acc-row[data-acc]").count() == 1)
    shot(page, "03-drawer")
    page.locator(".acc-row[data-acc]").first.click()
    page.wait_for_function("document.querySelector('#mainTitle span').textContent.includes('#75')", timeout=5000)
    check("switching account from the drawer", True)
    page.wait_for_selector("#chatList .row[data-peer]")

    # ---------------------------------------------------------------- dialog menu: pin / mark unread / archive
    def long_press(sel):
        page.locator(sel).first.dispatch_event("contextmenu")
    row = page.locator("#chatList .row[data-peer]:not(.pinned-row)").first
    pid = row.get_attribute("data-peer")
    name = row.locator(".name").text_content()
    long_press(f"#chatList .row[data-peer='{pid}']")
    page.wait_for_selector("#sheet:not(.hidden)")
    labels = page.locator("#sheetBody .menu-row span").all_text_contents()
    check("chat menu has pin/unread/archive/clear", {"Pin to top", "Archive", "Clear history"} <= set(labels) and any("unread" in l or "read" in l for l in labels), labels)
    shot(page, "04-chat-menu")
    page.locator("#sheetBody .menu-row", has_text="Pin to top").click()
    wait_toast(page, "Pinned")
    page.wait_for_function("pid => document.querySelector(`#chatList .row[data-peer='${pid}']`)?.classList.contains('pinned-row')", arg=pid)
    check("pin to top moves the chat up and highlights it", True)
    long_press(f"#chatList .row[data-peer='{pid}']")
    page.locator("#sheetBody .menu-row", has_text="Archive").click()
    wait_toast(page, "Archived")
    page.wait_for_function("pid => !document.querySelector(`#chatList .row[data-peer='${pid}']`)", arg=pid)
    check("archive hides the chat from the list", True)
    page.click("#chatList .archived-row")
    page.wait_for_selector(f".page.in .row[data-peer='{pid}']")
    check("archived chat shows in Archived Chats", True)
    page.locator(f".page.in .row[data-peer='{pid}']").dispatch_event("contextmenu")
    page.locator("#sheetBody .menu-row", has_text="Unarchive").click()
    wait_toast(page, "Moved back")
    page.go_back()
    page.wait_for_selector(f"#chatList .row[data-peer='{pid}']")
    check("unarchive brings it back", True)

    # ---------------------------------------------------------------- chat: send, schedule, react, pin, voice
    page.click(f"#chatList .row[data-peer='{pid}']")
    page.wait_for_selector(".page.in .bubble", timeout=10000)
    check("chat opens with messages", page.locator(".page.in .bubble").count() >= 20)
    comp = page.locator(".page.in .composer textarea")
    check("mic shows while the box is empty", page.locator(".page.in .mic").is_visible() and not page.locator(".page.in .send").is_visible())
    comp.fill("Hello from SessionGram ✨")
    comp.dispatch_event("input")
    check("send button replaces the mic when typing", page.locator(".page.in .send").is_visible())
    page.click(".page.in .send")
    page.wait_for_function("document.querySelector('.page.in .msgs').lastElementChild.textContent.includes('Hello from SessionGram')")
    check("message sends and appears", True)
    comp.fill("Reminder for later")
    comp.dispatch_event("input")
    page.locator(".page.in .send").dispatch_event("contextmenu")
    page.wait_for_selector("#sheet:not(.hidden)")
    check("long-press send offers silent + schedule", page.locator("#sheetBody .menu-row span").all_text_contents() == ["Send without sound", "Schedule message"])
    page.locator("#sheetBody .menu-row", has_text="Schedule message").click()
    page.wait_for_selector(".page.in input.when")
    page.locator(".page.in [data-q=morning]").click()
    shot(page, "05-schedule")
    page.click(".page.in .go")
    wait_toast(page, "Scheduled for")
    check("schedule message for tomorrow 9 AM", True)
    comp = page.locator(".page.in .composer textarea")
    comp.fill("quiet one")
    comp.dispatch_event("input")
    page.locator(".page.in .send").dispatch_event("contextmenu")
    page.locator("#sheetBody .menu-row", has_text="Send without sound").click()
    wait_toast(page, "without sound")
    check("send without sound", True)

    last = page.locator(".page.in .bubble").last
    last.dispatch_event("contextmenu")
    page.wait_for_selector("#sheetBody .react-strip")
    check("message menu shows quick reactions", page.locator("#sheetBody .react-strip button").count() == 8)
    mlabels = page.locator("#sheetBody .menu-row span").all_text_contents()
    check("message menu has pin / save / forward", {"Pin", "Save to Saved Messages", "Forward", "Reply"} <= set(mlabels), mlabels)
    shot(page, "06-message-menu")
    page.click("#sheetBody [data-react='🔥']")
    page.wait_for_function("document.querySelector('.page.in .bubble:last-of-type .rx.me')?.textContent.includes('🔥')")
    check("reaction appears on the message", True)
    page.locator(".page.in .bubble:last-of-type .rx.me").click()
    page.wait_for_function("!document.querySelector('.page.in .bubble:last-of-type .reactions')")
    check("tapping your reaction removes it", True)
    page.locator(".page.in .bubble").last.dispatch_event("contextmenu")
    page.locator("#sheetBody .menu-row", has_text="Pin").first.click()
    wait_toast(page, "pinned")
    page.wait_for_selector(".page.in .pinned-bar:not(.hidden)")
    check("pinned bar shows the pinned message", "quiet one" in page.text_content(".page.in .pinned-bar"))
    shot(page, "07-chat")
    page.click(".page.in .pinned-bar .pb-x")
    wait_toast(page, "unpinned")
    page.wait_for_selector(".page.in .pinned-bar.hidden", state="attached")
    check("unpin from the bar", True)
    page.locator(".page.in .bubble").nth(3).dispatch_event("contextmenu")
    page.locator("#sheetBody .menu-row", has_text="Save to Saved Messages").click()
    wait_toast(page, "Saved to Saved Messages")
    check("save to Saved Messages", True)

    page.click(".page.in .mic")
    page.wait_for_selector(".page.in .rec-bar", timeout=5000)
    check("tapping the mic starts recording", page.locator(".page.in .mic.rec").count() == 1)
    shot(page, "08-recording")
    page.wait_for_timeout(1800)
    before = page.locator(".page.in .bubble").count()
    page.click(".page.in .mic")
    page.wait_for_function(f"document.querySelectorAll('.page.in .bubble').length > {before}", timeout=10000)
    check("voice message sends as a voice note", page.locator(".page.in .bubble").last.locator("audio").count() == 1)
    page.go_back()
    page.wait_for_timeout(300)

    # ---------------------------------------------------------------- unified inbox
    page.click("#inboxBtn")
    page.wait_for_selector(".page.in .row[data-acc]", timeout=8000)
    chips = set(page.locator(".page.in .acc-chip").all_text_contents())
    check("unified inbox shows unread chats from many accounts", len(chips) > 10, len(chips))
    shot(page, "09-inbox")
    target = page.locator(".page.in .row[data-acc]").first
    tacc = target.get_attribute("data-acc")
    target.click()
    page.wait_for_selector(".page.in .bubble", timeout=10000)
    check("opening an inbox chat switches to its account", page.evaluate("S.aid") == tacc)
    page.go_back()
    page.wait_for_timeout(300)

    # ---------------------------------------------------------------- burst of incoming messages over all accounts
    page.evaluate("""() => {
      window.__lt = []; window.__gap = 0; let last = performance.now();
      new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ type: 'longtask', buffered: false });
      const tick = (t) => { window.__gap = Math.max(window.__gap, t - last); last = t; if (!window.__stop) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }""")
    t0 = time.time()
    req = urllib.request.Request(U + "/test/burst?n=600", method="POST")
    urllib.request.urlopen(req).read()
    page.wait_for_timeout(1500)
    lt = page.evaluate("window.__lt")
    gap = page.evaluate("window.__stop = true, window.__gap")
    worst = max(lt) if lt else 0
    check("600 incoming messages across 150 accounts: no UI freeze over 200 ms", worst < 200 and gap < 200,
          f"longest task {worst:.0f} ms, {len(lt)} long tasks, longest frame {gap:.0f} ms")
    t = time.time()
    page.click("#menuBtn")
    page.wait_for_selector("#drawer.on")
    page.wait_for_timeout(50)
    check("drawer opens fast after the burst", time.time() - t < 1.0, f"{(time.time() - t) * 1000:.0f} ms")
    page.go_back()

    # ---------------------------------------------------------------- phone number + OTP login
    page.click("#menuBtn")
    page.locator(".acc-row[data-act=add]").click()
    page.wait_for_selector("#sheet:not(.hidden)")
    check("add account offers phone, session string, file", page.locator("#sheetBody .menu-row span").all_text_contents() == ["Log in with phone number", "Paste a session string", "Upload a sessions file"])
    page.locator("#sheetBody .menu-row", has_text="phone number").click()
    page.wait_for_selector(".page.in .auth .num")
    check("country picker defaults from the phone's region (India)", page.input_value(".page.in .code") == "+91")
    shot(page, "10-login-phone")
    page.fill(".page.in .num", "98765 43210")
    page.click(".page.in .go")
    page.wait_for_selector(".page.in .otp input", timeout=8000)
    check("code step shows 5 OTP boxes", page.locator(".page.in .otp input").count() == 5)
    check("resend has a countdown", "Resend code in" in page.text_content(".page.in .resend"))
    page.locator(".page.in .otp input").first.fill("00000")
    page.wait_for_function("document.querySelector('.page.in .err').textContent.includes('Wrong code')", timeout=5000)
    check("wrong code shakes and explains", True)
    shot(page, "11-login-code")
    page.locator(".page.in .otp input").first.fill("12345")
    page.wait_for_selector(".page.in .pw", timeout=8000)
    check("account with 2-step verification asks for the password + hint", "classic" in page.text_content(".page.in .auth"))
    page.fill(".page.in .pw", "hunter2")
    page.click(".page.in .go")
    page.wait_for_function("document.querySelector('.page.in .auth h2')?.textContent.startsWith('Welcome')", timeout=8000)
    shot(page, "12-login-done")
    page.wait_for_function("document.querySelectorAll('.page').length === 0", timeout=8000)
    check("phone login adds the account and opens it", page.evaluate("S.accounts.length") == n_acc + 1 and page.evaluate("acc().phone") == "+919876543210")

    # ---------------------------------------------------------------- about the developer
    page.click("#menuBtn")
    page.locator(".menu-row", has_text="About the developer").click()
    page.wait_for_selector(".page.in .about-hero")
    check("About Me shows the name", page.text_content(".page.in .about-hero h2") == "Nitin Shukla")
    links = page.eval_on_selector_all(".page.in .link-card", "els => els.map(e => e.href)")
    check("About Me links GitHub + portfolio", links == ["https://github.com/n0obcoders", "https://n0obcoders.github.io/portfoli0/"], links)
    page.wait_for_function("document.querySelector('.page.in .rt').textContent.length > 5")
    check("About Me role line types itself", True)
    page.click(".page.in .about-ava")
    page.wait_for_timeout(400)
    shot(page, "13-about")
    page.wait_for_function("document.querySelector('.page.in .ver').textContent === 'v2.0'")
    check("About Me shows the app version", True)
    page.go_back()

    # ---------------------------------------------------------------- settings: passcode lock + dark theme
    page.click("#menuBtn")
    page.locator(".menu-row", has_text="Settings").click()
    page.locator(".page.in .set-row", has_text="Privacy & Security").click()
    page.wait_for_selector(".page.in [data-s=pass]")
    page.click(".page.in [data-s=pass]")
    for _ in range(2):
        for k in "2580":
            page.click(f"#lock [data-k='{k}']")
        page.wait_for_timeout(350)
    wait_toast(page, "Passcode lock is on")
    check("set a 4-digit passcode", True)
    page.reload()
    page.wait_for_selector("#lock:not(.hidden)")
    check("app is locked after reopening", True)
    shot(page, "14-lock")
    for k in "1111":
        page.click(f"#lock [data-k='{k}']")
    page.wait_for_timeout(400)
    check("wrong passcode keeps it locked", page.locator("#lock:not(.hidden)").count() == 1)
    for k in "2580":
        page.click(f"#lock [data-k='{k}']")
    page.wait_for_selector("#lock.hidden", state="attached")
    check("right passcode unlocks", True)
    page.evaluate("store.set('pass', null)")
    page.evaluate("S.settings.theme = 'dark'; saveSettings();")
    page.wait_for_timeout(200)
    check("dark theme applies", page.evaluate("document.documentElement.dataset.theme") == "dark")
    shot(page, "15-dark")
    page.click(f"#chatList .row[data-peer]")
    page.wait_for_selector(".page.in .bubble")
    page.wait_for_timeout(400)
    shot(page, "16-dark-chat")
    page.evaluate("S.settings.theme = 'light'; saveSettings();")

    check("no JavaScript errors", not errors, errors[:5])
    check("no unexpected HTTP errors", not bad_http, bad_http[:5])
    browser.close()

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} UI checks passed")
sys.exit(1 if failed else 0)
