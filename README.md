# Rythmoband (FreshDubs)

A browser-based dubbing editor with dynamic subtitle lanes, video scrubbing,
voice takes, audio export, and rehearsal-video export.

## Clone

```sh
git clone https://github.com/Lethaldroid/Rythmoband.git
cd Rythmoband
```

Use Node.js and npm. The frontend declares Node 20.x and npm 7.6 or later in the 7.x line. The backend declares Node 18.x. For the full editor,
install and start MongoDB separately. A Chromium browser on localhost works
for microphone recording and WebM export.

## Start the API

From the clone root, run these commands in a PowerShell terminal.

```powershell
cd FreshDubs-Server-main
Copy-Item .env.example .env
npm ci
```

On macOS or Linux, use `cp .env.example .env` in place of `Copy-Item`.

In the API's `.env`, configure a random `SECRET`, a Stripe **test-mode** secret
key in `STRIPE_SECRET_KEY`, and the MongoDB connection URI if it differs from
the default. Email/password signup creates a Stripe test customer. Leave the
Google placeholders for local email/password login. The Google OAuth callback
currently points to the deployed API and needs local configuration if you
want to test Google login. Mail flows use `SMTP_USER` and `SMTP_PASSWORD`;
translation uses `GEMINI_API_KEY`.

Start the API with `npm start` and wait for the database connection message.

## Start the frontend

In a second terminal from the clone root, run:

```powershell
cd FreshDubsDeployed-master
Copy-Item .env.example .env
npm ci --legacy-peer-deps
npx craco start
```

Use `cp .env.example .env` on macOS or Linux. Open
[http://localhost:3000](http://localhost:3000), sign up or log in, create/open
a project, and use **Upload** to add a video and up to three SRT files.
Keep the frontend on port 3000 for the API's local CORS configuration.
The public [subtitle player](http://localhost:3000/subplayer) can also be
opened directly after starting the frontend.

Run `npx craco build` from the frontend directory for a production build.
Local environment files, database contents, dependencies and builds are
excluded from version control.
