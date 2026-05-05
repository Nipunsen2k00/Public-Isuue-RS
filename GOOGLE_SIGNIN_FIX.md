# Google Sign-In Fix Guide

## Code Changes Made ✅

I've updated your codebase with better error handling:

### 1. **Login.jsx** - Enhanced error handling
- Added `GoogleAuthProvider` parameter configuration with `setCustomParameters({ prompt: 'select_account' })`
- Added console logging for debugging
- Added more error codes:
  - `auth/popup-blocked` - Browser blocking popups
  - `auth/operation-not-supported-in-this-environment` - Environment issue

### 2. **Register.jsx** - Complete Google sign-up implementation
- Added missing `GoogleAuthProvider` and `signInWithPopup` imports
- Created `handleGoogleSignup()` function with proper error handling
- Added loading state for Google sign-up button
- Fixed silent error catching (`catch(e) {}` → proper error handling)

---

## Required Setup in Firebase Console 🔑

Your app shows a Google sign-in button, but **Google authentication must be enabled** in Firebase. Follow these steps:

### Step 1: Enable Google Sign-In in Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **public-issue-reporting-s-812d8**
3. In the left sidebar, click **Authentication**
4. Click the **Sign-in method** tab
5. Click **Google** in the providers list
6. Toggle it **ON**
7. Select a Project support email from the dropdown
8. Click **Save**

### Step 2: Configure OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **public-issue-reporting-s-812d8**
3. In the left sidebar, click **APIs & Services** → **OAuth consent screen**
4. If prompted, select **External** as User Type
5. Fill in the required fields:
   - **App name**: Civic Curator
   - **User support email**: (your email)
   - **Developer contact information**: (your email)
6. Click **Save and Continue**
7. **Skip** optional scopes
8. Click **Back to Dashboard**

### Step 3: Create OAuth 2.0 Credentials
1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Web application**
4. Add Authorized JavaScript Origins:
   ```
   http://localhost:5173
   http://localhost:3000
   https://yourdomain.com (when you deploy)
   ```
5. Add Authorized Redirect URIs:
   ```
   http://localhost:5173
   http://localhost:3000
   https://yourdomain.com (when you deploy)
   ```
6. Click **Create**
7. Copy the **Client ID** (not needed for Firebase - it's auto-configured)

### Step 4: Test Locally
1. Run your app: `npm run dev`
2. Go to http://localhost:5173 (or your Vite port)
3. Try clicking the **Google** sign-in button
4. If it still doesn't work, check the browser console for errors

---

## Troubleshooting

### Error: "auth/popup-blocked"
- ✅ **Solution**: Allow popups in your browser settings for localhost

### Error: "auth/operation-not-supported-in-this-environment"
- ✅ **Solution**: Make sure you're running on `http://` (not `file://`)
- Use `npm run dev` to start the dev server

### Error: "Configuration not found"
- ✅ **Solution**: Google provider may not be enabled in Firebase Console
- Complete Step 1 above

### Blank error or silent failure
- ✅ **Solution**: Check browser DevTools Console (F12)
- The updated code logs errors with `console.error('Google Sign-In Error:', err.code, err.message)`

---

## What Changed in Code

### Before (Login.jsx)
```javascript
const result = await signInWithPopup(auth, new GoogleAuthProvider());
```

### After (Login.jsx)
```javascript
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
const result = await signInWithPopup(auth, provider);
```

This provides better UX by letting users choose their Google account each time.

---

## Need Help?
If Google sign-in still doesn't work after these steps:
1. Open DevTools (F12) and check the Console tab
2. Try Google sign-in and note the exact error code
3. The error messages are now much clearer!
