# Hosting Healthpack Squad

This app needs one Node server. Do not use a static-only host, because calls need WebSockets for live signaling.

The easiest free-ish host is Render. Render gives you HTTPS, which matters because phone microphones usually will not work on plain `http://192.168...` LAN links.

## What Is Already Ready

- `npm start` runs the website server.
- `/healthz` is ready for hosting health checks.
- `render.yaml` is ready for Render.
- `SITE_PASSWORD` can be set in the host settings.
- `accounts.json`, `device-rules.json`, logs, `.env`, and `node_modules` are ignored by Git.
- Catbox uploads still work through the server.

## Step 1: Make A GitHub Repo

1. Go to <https://github.com/new>.
2. Repository name: `aba-squads-discord` or any name you want.
3. Set it to `Private` if you do not want random people seeing the code.
4. Do not add a README, `.gitignore`, or license on GitHub because this folder already has files.
5. Create the repo.

## Step 2: Upload This Folder To GitHub

Open PowerShell in this folder:

```powershell
cd "C:\Users\propl\Documents\Codex\2026-05-29\lets-make-a-calling-website-to"
git init
git add .
git commit -m "Prepare calling website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub info.

If Git asks you to sign in, follow the browser sign-in prompt.

## Step 3: Deploy On Render

1. Go to <https://dashboard.render.com>.
2. Click `New`.
3. Click `Blueprint` if Render notices `render.yaml`, or click `Web Service`.
4. Connect your GitHub account if it asks.
5. Pick the repo you just made.
6. Use these settings if Render asks:
   - Runtime: `Docker`
   - Dockerfile: `./Dockerfile`
   - Health check path: `/healthz`
   - Plan: `Free`
7. Add an environment variable:
   - Key: `SITE_PASSWORD`
   - Value: your private site password
   - Optional key: `GIPHY_API_KEY`
   - Optional value: a GIPHY developer API key, only needed for live GIF search
8. Click deploy.
9. Wait until Render says the service is live.
10. If you add or change `GIPHY_API_KEY` later, redeploy or restart the Render service so Node sees the new value.
11. Phone/PC call notifications use Web Push when supported. For stable subscriptions across Render restarts, set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`; otherwise temporary push keys are generated every server start.

## Step 4: Use The Hosted Site

Open the Render URL. It should look like:

```text
https://your-service-name.onrender.com
```

Use that URL on both PC and phone. Phone mic should work better there because it is HTTPS.

## Important

- Free Render services can sleep. First load may take a bit.
- Text to speech uses the free, self-hosted Piper engine. Docker installs one
  63 MB U.S. English low-memory voice during deployment, so no speech API key
  or per-character payment is required.
- Piper starts only when TTS is used, processes one sentence at a time, allows
  at most one waiting sentence, and unloads after 90 seconds idle. This keeps
  the 512 MB service from holding the voice model in RAM all day. The first
  sentence after idle can take longer while the model loads.
- Accounts are stored in JSON files. On free hosting, data may reset after redeploys or server resets unless you add persistent storage.
- Live GIF search needs `GIPHY_API_KEY`; without it, the GIF panel shows that GIPHY is not active yet.
- Mobile call notifications require HTTPS, notification permission, service worker support, and browser Web Push support. After a redeploy, open the site once so the phone can register.
- The next serious upgrade should be a database for permanent accounts and admin rules.

## Permanent Storage Plan

Render's free web-service filesystem is temporary, so `accounts.json` and
`device-rules.json` can disappear after a restart, redeploy, or idle spin-down.
A persistent Render disk requires a paid web service. Render's free Postgres
database also expires after 30 days.

The best fit for this project is a separate free Postgres database, with Neon
as the first choice. The app can keep running on Render while accounts,
profiles, device rules, chat records, and push subscriptions are stored in
Postgres through a `DATABASE_URL` environment variable.

Planned migration:

1. Create a Neon Postgres project.
2. Add its pooled connection string to Render as `DATABASE_URL`.
3. Add database tables for accounts, device rules, chat, and push subscriptions.
4. Import the current JSON accounts once.
5. Replace the JSON save/load functions with database queries.

Catbox profile and chat media can remain as URLs in the database, so the
database does not need to store large image or video files.

## Set Up Neon Storage

The app now supports Neon automatically. Accounts, password hashes, profile
names, profile media URLs, admin status, known devices, device timeouts, and
signup blocks are stored permanently when `DATABASE_URL` is present. Chat
messages are also stored in Neon while keeping their existing 24-hour text and
12-hour media expiration rules.

Chat storage is additionally hard-capped at the newest 25 messages. The server
deletes the oldest message whenever that cap is exceeded, and clients load only
the newest 15 messages when connecting. The admin panel can disable all chat
types or permanently clear the stored chat history from memory, local fallback
storage, Neon, and connected browsers.

1. Open <https://console.neon.tech/signup> and create a free Neon account.
2. Create a project named `aba-squads-discord`.
3. Keep the default production branch and the default `neondb` database.
4. On the project dashboard, click **Connect**.
5. Leave **Connection pooling** enabled. The hostname in the generated URL
   should contain `-pooler`.
6. Copy the entire connection string. It starts with `postgresql://` and ends
   with options such as `sslmode=require`. Treat this URL like a password.
7. Open the Render dashboard and select the Healthpack Squad web service.
8. Open **Environment**, then add:
   - Key: `DATABASE_URL`
   - Value: the complete pooled Neon connection string
9. Save the environment change and redeploy the service.
10. Open the Render logs. A successful setup prints:

```text
Permanent Neon/Postgres storage connected.
```

No SQL needs to be pasted into Neon. On first startup, the app creates an
`app_state` table and imports the current `accounts.json` and
`device-rules.json` values. Later changes, including bounded chat history, are
written to Neon automatically.

## Optional TURN Relay

WebRTC works directly on many networks, but some cellular, school, work, and
carrier-grade NAT networks require a TURN relay. Add these Render environment
variables after obtaining TURN credentials from a provider:

```text
TURN_URL=turn:your-turn-host:3478
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-credential
```

The site automatically adds the relay to its WebRTC configuration. Calls still
use direct peer-to-peer paths when possible and use TURN only when needed.

To verify it:

1. Create a test account or change a profile.
2. In Neon, open **Tables** and select `app_state`.
3. Confirm that rows named `accounts` and `device-rules` exist.
4. Restart or redeploy the Render service.
5. Log in again and confirm that the account and profile remain.

Do not put `DATABASE_URL` in GitHub, source code, screenshots, or chat. Store it
only as a Render environment variable and in a local `.env` file if local
database testing is needed.

## Automatic Resource Protection

The server silently limits temporary chat history, upload buffers, WebSocket
buffers, sessions, notification subscriptions, cooldowns, and stale call
records. Expired messages are removed gradually, with stronger cleanup if the
server approaches its 500 MB memory limit. This runs entirely behind the
scenes and does not collect analytics or add anything to the site interface.

## Local Testing

Run:

```powershell
npm start
```

Then open:

```text
http://localhost:3000
```

For phone testing on the same Wi-Fi, use the phone URL printed by the server, but mic may fail unless the URL is HTTPS.
