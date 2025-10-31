# WebRTC Signaling Server - Standalone Deployment

This is a standalone signaling server ready to deploy to Railway, Render, Heroku, etc.

## Files Needed:

1. **server.js** - The main server file
2. **package.json** - Dependencies and start script
3. **README.md** - This file (optional)

That's it! Only these 3 files.

## Quick Deploy Instructions:

### Railway.app (Recommended - Free Tier)
1. Create account at https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repo (or create new repo with just this folder)
4. Railway auto-detects Node.js and runs `npm start`
5. Done! Get your URL like: `wss://your-app.railway.app`

### Render.com (Free Tier)
1. Create account at https://render.com
2. Click "New" → "Web Service"
3. Connect GitHub repo
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Deploy!

### Heroku
1. Install Heroku CLI
2. In this folder:
   ```bash
   heroku create your-signaling-server
   git push heroku main
   ```

## Important Notes:

- Railway/Render will automatically set the `PORT` environment variable
- The server listens on `0.0.0.0` to accept all connections
- Your app URL will be like: `wss://your-app.railway.app` (no port needed)
- Use `wss://` (secure) instead of `ws://` for production

