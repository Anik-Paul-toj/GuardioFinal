# Quick Deploy Steps - Step by Step

## Step 1: Upload to GitHub First

Before using Railway, you need your code on GitHub:

### Option 1: Use the folder I created (EASIEST)
```bash
cd signaling-server-deploy
git init
git add .
git commit -m "Signaling server"
```

Then:
1. Create a NEW repository on GitHub (name it "signaling-server" or anything)
2. Copy the GitHub repo URL
3. Run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/signaling-server.git
git push -u origin main
```

---

## Step 2: Deploy to Railway

### In Railway Dashboard:
1. Click **"New Project"**
2. From the dropdown, select: **"Deploy from GitHub repo"** ✅ (THIS ONE!)
3. Connect your GitHub account (if first time)
4. Select your repository (the one with signaling-server)
5. Railway will:
   - Auto-detect it's Node.js
   - Install dependencies (`ws` package)
   - Start the server
6. Get your URL: `wss://your-app-name.railway.app`

---

## Which Dropdown Option?

When Railway asks "What do you want to deploy?":

✅ **Select: "Deploy from GitHub repo"**

❌ NOT "Empty Project" - This is for manual setup
❌ NOT "Deploy from Docker Hub" - This is for Docker images
❌ NOT "Deploy from Template" - This is for pre-built templates

---

## Summary:

1. **First**: Upload `signaling-server-deploy/` folder to GitHub
2. **Then**: On Railway, choose **"Deploy from GitHub repo"**
3. **Done**: Get your URL and use it in your app!

