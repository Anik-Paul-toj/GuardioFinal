# Cloudinary Setup Instructions

## ✅ **Current Status**
The app is configured with your Cloudinary credentials and will work with fallback to local images if Cloudinary upload fails.

## 🔧 **To Enable Full Cloudinary Upload:**

### Step 1: Create an Unsigned Upload Preset
1. Go to [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Navigate to **Settings** → **Upload**
3. Scroll down to **Upload presets** section
4. Click **"Add upload preset"**
5. Configure the preset:
   - **Preset name**: `guardio_unsigned`
   - **Signing Mode**: Select `Unsigned`
   - **Folder**: `guardio/profiles` (optional but recommended)
   - **Allowed formats**: `jpg, jpeg, png`
   - **Max file size**: Set appropriate limit (e.g., 10MB)
6. Click **Save**

### Step 2: Update the App (if needed)
The app is already configured to use the `guardio_unsigned` preset. If you named it differently, update the preset name in `config/cloudinary.js`:

```javascript
formData.append('upload_preset', 'your_preset_name_here');
```

## 📱 **How It Currently Works**

### With Cloudinary Upload Working:
1. User takes/selects photo
2. Photo uploads to Cloudinary
3. Cloudinary URL saved to Firebase
4. Profile displays photo from Cloudinary CDN

### With Cloudinary Upload Failing (Current Fallback):
1. User takes/selects photo
2. Local photo URI saved to Firebase
3. Profile displays local photo (works on same device)

## 🔍 **Testing**

### To Test Cloudinary Upload:
1. Ensure unsigned preset is created (Step 1 above)
2. Run the app: `npx expo start`
3. Create a profile with photo
4. Check console logs for "Image uploaded to Cloudinary successfully"
5. Check Firebase database - photo field should contain Cloudinary URL

### Current Fallback Testing:
- The app works right now with local image URIs
- Photos will display on the same device
- Firebase stores the local URI as fallback

## 🛠️ **Alternative: Enable Default Preset**

If you can't create custom presets, you can try enabling Cloudinary's default unsigned uploads:

1. Go to Cloudinary Dashboard → Settings → Upload
2. Find **"Unsigned uploading"** section
3. Check **"Enable unsigned uploading"**
4. The app will use `ml_default` preset (which is currently configured)

## 📝 **Current Configuration**

Your app is configured with:
- **Cloud Name**: `dapalnm6r`
- **API Key**: `463174385936929`
- **Upload URL**: `https://api.cloudinary.com/v1_1/dapalnm6r/image/upload`
- **Fallback**: Local image URIs if upload fails

The app will work perfectly for the demo with local images, and will automatically upgrade to Cloudinary URLs once the preset is configured! 🚀
