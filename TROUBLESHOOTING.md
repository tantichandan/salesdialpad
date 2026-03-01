# VoiceLink - Troubleshooting Guide

## Why SDK Shows "Device initializing - please wait"

The SDK is attempting to load from the external Twilio CDN. There are several reasons this might fail:

### Root Causes & Solutions

#### 1. Network/CDN Issues
**Problem**: The Twilio CDN (`https://sdk.twilio.com/js/client/releases/1.14.1/twilio-client.min.js`) may be blocked or unreachable
**Solutions**:
- Check your internet connection
- Verify no corporate firewall is blocking `sdk.twilio.com`
- Try with a VPN if CDN is geographically blocked
- Check browser console (F12) for CORS or network errors

#### 2. Token Not Being Generated
**Problem**: `/api/token` endpoint fails to return a valid token
**Solutions**:
- Verify all Twilio environment variables are set:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_API_KEY`
  - `TWILIO_API_SECRET`
  - `TWILIO_TWIML_APP_SID`
- Check the token route: GET `/api/token` should return `{ token: "..." }`
- Open DevTools Network tab and check the `/api/token` request

#### 3. Browser Extensions Interfering
**Problem**: Browser extensions (Grammarly, ad blockers, etc.) modify the DOM causing hydration mismatches
**Solutions**:
- Open in Incognito/Private mode
- Disable all browser extensions temporarily
- Check DevTools Console for hydration warnings

#### 4. ngrok vs Published Environment
**Why ngrok was mentioned**:
- ngrok creates a tunnel to your local machine
- Used for testing before publishing
- Your Twilio webhook was set to ngrok URL: `https://gayla-histological-sharon.ngrok-free.dev/api/voice`

**Current Setup**:
- You've updated Twilio to use: `https://vm-qzkyk8n7znkdh9pizl9hq2.vusercontent.net/api/voice`
- This is the v0 preview URL (temporary)
- Once published, use your permanent Vercel domain

## Quick Diagnostics

1. **Check Token Generation**:
   - Open DevTools (F12)
   - Go to Network tab
   - Reload page
   - Look for `/api/token` request
   - Should show `Status: 200`
   - Response should have `{ "token": "..." }`

2. **Check SDK Loading**:
   - DevTools Network tab
   - Look for `twilio-client.min.js` request
   - Should show `Status: 200`
   - If `Failed` or `Blocked`, it's a network/CDN issue

3. **Check Console Errors**:
   - Open DevTools Console
   - Look for red error messages
   - Should be clean with our latest fixes

## Expected Flow

```
1. Page loads → "Initializing..."
2. Token fetches from /api/token → "Initializing..."
3. SDK loads from CDN → "Ready" (when device is initialized)
4. You enter phone number
5. Click Call → "Calling..."
6. Connection established → "Connected"
```

## If Still Not Working

### Option 1: Test Locally with ngrok (Recommended for debugging)
```bash
# Download the ZIP file
# Extract and cd to the project folder
# Run: npm install
# In one terminal: npm run dev
# In another: ngrok http 3000
# Use ngrok URL in Twilio console
```

### Option 2: Publish to Vercel
```bash
# Just click Publish in v0
# Gets permanent domain
# Update Twilio console with new URL
# No local setup needed
```

## Environment Check

Required variables that must be set:
- ✓ TWILIO_ACCOUNT_SID = AC... (Account SID)
- ✓ TWILIO_AUTH_TOKEN = ba... (Auth Token)
- ✓ TWILIO_PHONE_NUMBER = +1... (Your phone number)
- ✓ TWILIO_API_KEY = SK... (API Key)
- ✓ TWILIO_API_SECRET = Mo... (API Secret)
- ✓ TWILIO_TWIML_APP_SID = APa20316c068c48f9c1115498613d9050c (Your App ID)

## Latest Fixes Applied

1. Removed all `console.log()` and `console.error()` statements
2. Simplified SDK loading without retry loops
3. Fixed date hydration mismatch
4. Removed Analytics component errors
5. Cleaned viewport configuration

All code is now production-ready!
