# Render Deployment Steps - Simple Guide

## Step 1: Upload to GitHub First

Before using Render, upload your signaling server to GitHub:

```bash
cd signaling-server-deploy
git init
git add .
git commit -m "Signaling server"
```

Then create a new repository on GitHub and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/signaling-server.git
git push -u origin main
```

---

## Step 2: Deploy on Render

### On Render Dashboard:

1. Go to https://render.com
2. Click **"New +"** button (top right)
3. Select: **"Web Service"** ✅ (THIS ONE!)

### Other Options (NOT these):
- ❌ "Static Site" - For HTML/CSS/JS websites
- ❌ "Background Worker" - For scheduled tasks
- ❌ "Cron Job" - For automated scripts
- ❌ "PostgreSQL" - Database (not needed)

---

## Step 3: Configure

After selecting "Web Service":

1. **Connect Repository**: 
   - Connect your GitHub account (first time)
   - Select your `signaling-server` repository

2. **Settings**:
   - **Name**: `signaling-server` (or any name)
   - **Region**: Choose closest to you
   - **Branch**: `main` (or `master`)
   - **Root Directory**: Leave empty (or set to `signaling-server-deploy` if deploying from subfolder)
   - **Runtime**: `Node` (auto-detected)
   - **Build Command**: `npm install` (auto-filled)
   - **Start Command**: `npm start` (auto-filled)
   - **Plan**: `Free` (for testing)

3. Click **"Create Web Service"**

---

## Step 4: Get Your URL

After deployment (takes 2-3 minutes):

- Render gives you a URL like: `https://signaling-server.onrender.com`
- But you need WebSocket, so use: `wss://signaling-server.onrender.com` (note the `wss://`)

---

## Important: WebSocket Support

Render's free tier has some limitations:
- Free tier: WebSockets work but service sleeps after 15 min inactivity
- Paid tier ($7/month): Always on, no sleep

For testing: Free tier is OK (service wakes up when someone connects)

---

## Summary:

1. **Upload** `signaling-server-deploy/` to GitHub
2. On Render: **"New +"** → **"Web Service"** ✅
3. Connect GitHub repo
4. Set **Start Command**: `npm start`
5. Deploy
6. Get URL: `wss://your-app.onrender.com`

---

## Update Your App Code:

In `app/(tabs)/sos.tsx`, update:
```typescript
if (!__DEV__) {
  return 'wss://your-app.onrender.com';
}
```

Replace `your-app.onrender.com` with your actual Render URL!

