# Hosting Aba Squads Discord

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
   - Runtime: `Node`
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/healthz`
   - Plan: `Free`
7. Add an environment variable:
   - Key: `SITE_PASSWORD`
   - Value: your private site password
   - Optional key: `GIPHY_API_KEY`
   - Optional value: a GIPHY developer API key, only needed for live GIF search
8. Click deploy.
9. Wait until Render says the service is live.

## Step 4: Use The Hosted Site

Open the Render URL. It should look like:

```text
https://your-service-name.onrender.com
```

Use that URL on both PC and phone. Phone mic should work better there because it is HTTPS.

## Important

- Free Render services can sleep. First load may take a bit.
- Accounts are stored in JSON files. On free hosting, data may reset after redeploys or server resets unless you add persistent storage.
- Chat stickers work without setup. Live GIF search needs `GIPHY_API_KEY`; without it, the GIF panel falls back to built-in stickers.
- The next serious upgrade should be a database for permanent accounts and admin rules.

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
