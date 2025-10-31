# Signaling Server Deployment - Simple Guide

## ❌ NOT Just One File!

You need **3 files minimum**:
1. `server.js` - The server code
2. `package.json` - Dependencies (tells Railway/Render what to install)
3. `.gitignore` - Optional but recommended

## ✅ Option 1: Separate Repository (Recommended)

### Step 1: Create New Folder
Create a folder called `signaling-server` (outside your main project)

### Step 2: Create These 3 Files:

**1. server.js** (copy from `signaling-server-deploy/server.js`)
**2. package.json** (copy from `signaling-server-deploy/package.json`)
**3. README.md** (optional)

### Step 3: Upload to GitHub
```bash
cd signaling-server
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/signaling-server.git
git push -u origin main
```

### Step 4: Deploy to Railway
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `signaling-server` repo
4. Railway auto-detects it's Node.js and deploys!
5. Get your URL: `wss://your-app-name.railway.app`

---

## ✅ Option 2: Deploy from Main Project (Subfolder)

If you want to keep it in your main project:

### Step 1: Create `signaling-server-deploy` folder
(Already created for you)

### Step 2: Configure Railway/Render
When connecting GitHub:
- **Root Directory**: Set to `signaling-server-deploy`
- Or deploy the whole repo and Railway will auto-detect the Node.js files

---

## 📋 Quick Checklist

- [ ] Create `server.js`
- [ ] Create `package.json` with `ws` dependency
- [ ] Upload to GitHub
- [ ] Connect to Railway/Render
- [ ] Deploy
- [ ] Get your URL (e.g., `wss://my-server.railway.app`)
- [ ] Update your app code with this URL

## 🔗 What URL to Use in Your App?

After deployment, you'll get a URL like:
```
wss://signaling-server-production.railway.app
```

Update in `app/(tabs)/sos.tsx`:
```typescript
if (!__DEV__) {
  return 'wss://signaling-server-production.railway.app';
}
```

**Note**: Use `wss://` (secure) for production, not `ws://`

