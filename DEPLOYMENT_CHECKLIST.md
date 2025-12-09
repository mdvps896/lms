# Deployment Checklist - Category Schema Fix

## Changes Made
✅ Fixed `User.js` model to use standard Mongoose pattern
✅ Removed `delete mongoose.models.User;` 
✅ Updated to `mongoose.models.User || mongoose.model('User', userSchema)`
✅ Pushed to GitHub (commit: 4d290c6)

## Vercel Deployment Steps

### 1. Wait for Deployment
- Go to https://vercel.com/dashboard
- Check if the latest deployment is complete
- Look for commit: "Add instrumentation hook for guaranteed model registration in serverless"

### 2. If Deployment Failed or Still Showing Error

#### Option A: Trigger Redeploy
1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Click "Redeploy" button
4. Select "Use existing Build Cache" = **OFF** (force fresh build)

#### Option B: Clear Build Cache via CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Trigger a new deployment
vercel --prod
```

### 3. Verify Environment Variables
Make sure these are set in Vercel:
- `MONGODB_URI` - Your MongoDB connection string
- `NEXT_PUBLIC_API_URL` - Your API URL
- Any other required environment variables

### 4. Check Deployment Logs
1. Go to Vercel Dashboard → Your Project → Latest Deployment
2. Click on "Functions" tab
3. Look for `/api/auth/login` function
4. Check the logs for any errors

### 5. Test the Fix
Once deployment is complete:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try logging in again
3. Check browser console for errors

## Expected Behavior After Fix
- ✅ No "Schema hasn't been registered for model 'Category'" error
- ✅ Login should work successfully
- ✅ Console should show: "✅ Models registered via instrumentation"

## If Still Not Working

### Check Server Logs
The login route has console.log statements that will show:
- "Login attempt for: [email]"
- "Registered models: [list of models]"
- "User found: Yes/No"

### Common Issues
1. **MongoDB Connection** - Verify MONGODB_URI is correct
2. **Model Registration** - Check if Category is in the registered models list
3. **Build Cache** - Force a fresh build without cache
4. **Cold Start** - First request after deployment might be slow

## Quick Test
Try this in browser console on the deployed site:
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

This will show the actual error response from the server.
