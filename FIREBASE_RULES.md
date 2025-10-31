# Firebase Security Rules Setup

## 🔥 **Current Issue**
Firebase Firestore is blocking writes due to security rules. You need to update the rules in your Firebase console.

## ✅ **Quick Fix for Development**

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `guardio-500a0`
3. Navigate to **Firestore Database** → **Rules**

### Step 2: Update Rules for Development
Replace the current rules with this development-friendly version:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // For testing - allow read/write to authenticated users (remove in production)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 3: Publish Rules
Click **"Publish"** to save the rules.

## 🔒 **For Production (Later)**
Use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 **Alternative: Test Mode (Temporary)**
For quick testing, you can temporarily enable test mode:
1. Go to Firestore Database → Rules
2. Select **"Start in test mode"** 
3. This allows all reads/writes for 30 days (NOT for production!)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2024, 12, 1);
    }
  }
}
```

After updating the rules, your app should be able to save profiles to Firebase! 🚀
