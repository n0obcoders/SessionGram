# How to upload SessionGram to GitHub (and get the APK built for you)

Once this folder is on GitHub, GitHub builds the Android APK automatically every time you change something. No PC or Android Studio is needed.

> **Never upload these files:** `sessions.xlsx` (or `.csv`/`.xls`), `config.json`, `prefs.json` or `sessiongram.keystore`. Anyone who has your session strings controls your Telegram accounts. The included `.gitignore` already blocks them when you use git (Option B). With the website upload (Option A) it's up to you not to select them.

---

## Step 1: Create the repository

1. Sign in at https://github.com (create a free account if you need one).
2. Tap **+** (top right) › **New repository**.
3. Name it, for example `SessionGram`.
4. Choose **Private**. That's recommended, because it is your personal app.
5. Leave "Add a README" **unticked**, then tap **Create repository**.

## Step 2: Upload the files

Unzip `SessionGram-source.zip` first. You'll get a `SessionGram` folder.

### Option A: From the GitHub website (works on a phone too)

1. In your new empty repository, tap **uploading an existing file**, or use **Add file › Upload files**.
2. Select **everything inside** the `SessionGram` folder: `server.py`, `README.md`, `requirements.txt`, `sessions_template.xlsx`, the run scripts, and the `static` and `android` folders.
   - On a PC, drag the files and folders into the page.
   - On a phone, pick the files folder by folder. Folders keep their structure when you drag them on a PC. On a phone, use **Create new file** and type the path, for example `android/app/build.gradle`, then paste the content.
3. Tap **Commit changes**.
4. The `.github` and `.gitignore` items are hidden "dot" files, so many file pickers skip them. Create them by hand:
   - **Add file › Create new file**. Name it `.github/workflows/android.yml` (typing the `/` creates the folders). Paste the content of that file from the zip, then **Commit changes**.
   - **Add file › Create new file**. Name it `.gitignore`, paste its content, then **Commit changes**.

### Option B: With git (PC, or Termux on Android)

```bash
cd SessionGram                      # the unzipped folder
git init
git add .
git commit -m "SessionGram"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/SessionGram.git
git push -u origin main
```

When git asks for a password, use a **Personal access token**, not your GitHub password. Create one at GitHub › Settings › Developer settings › Personal access tokens › Tokens (classic), with the `repo` scope ticked.

On Termux, install git first with `pkg install git`.

## Step 3: Let GitHub build the APK

1. Open the **Actions** tab of your repository. If GitHub asks, tap **I understand my workflows, go ahead and enable them**.
2. The **Build Android APK** workflow runs on every push. To start it by hand, choose it and tap **Run workflow**.
3. When it shows a green tick, which takes about 10 minutes, open the run. Under **Artifacts**, download **SessionGram-apk**. It's a zip containing `SessionGram-arm64-v8a.apk`, `SessionGram-armeabi-v7a.apk` and `SessionGram-x86_64.apk`.

## Step 4 (recommended): Use your own signing key, so updates install over the app

Android only installs an update over the existing app if both are signed with the same key. The APKs I sent you are signed with `sessiongram.keystore`. To make GitHub sign with that key too:

1. Convert the key to text:
   - **Termux / Linux / Mac:** `base64 -w0 sessiongram.keystore > key.txt` (on Mac: `base64 -i sessiongram.keystore -o key.txt`)
   - **Windows (PowerShell):** `[Convert]::ToBase64String([IO.File]::ReadAllBytes("sessiongram.keystore")) > key.txt`
2. In the repository, open **Settings › Secrets and variables › Actions › New repository secret** and add two secrets:
   - Name `KEYSTORE_BASE64`, with the whole content of `key.txt` as the value.
   - Name `KEYSTORE_PASSWORD`, with the keystore password from `KEYSTORE_PASSWORD.txt` (sent to you with the key).
3. Run the workflow again (Step 3).

Without these secrets the build still works, but it's signed with a temporary key. In that case, uninstall the old app before installing the new one, then upload your sessions file again.

## Making changes later

- The web interface (chat screens, settings and so on) is in `static/` (`app.js`, `style.css`, `index.html`).
- The Telegram logic is in `server.py`.
- The Android wrapper (background service, notifications, file picker) is in `android/app/src/main/java/com/sessiongram/app/`.

Edit a file on GitHub using the pencil icon and commit it. A new APK build starts automatically.
