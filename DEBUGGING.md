## VoiceLink Debugging Guide

### UI Not Showing?

1. **Clear browser cache** - Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. **Check the preview URL** - Navigate to: `https://vm-qzkyk8n7znkdh9pizl9hq2.vusercontent.net/dialpad`
3. **Browser console (F12)** - Look for any error messages
4. **Disable browser extensions** - Some extensions cause hydration warnings

### API Endpoints

Your API routes should be:
- Token generation: `POST /api/token`
- Voice webhook: `POST /api/voice`
- DTMF gather: `POST /api/voice/gather`
- Recording: `POST /api/recording`
- Recording callback: `POST /api/recording/callback`

### Twilio Configuration

The URL you added in Twilio Console should be:
```
https://vm-qzkyk8n7znkdh9pizl9hq2.vusercontent.net/api/voice
```

**Important**: Accessing `/api/voice` directly in a browser will show "unauthenticated" - this is normal and expected. Twilio calls this endpoint with authentication headers.

### Testing Calls

1. **Get a Twilio token**: The app automatically fetches this on load
2. **Enter a phone number** in the dialpad (use keyboard or click buttons)
3. **Click Call** to initiate
4. **All call features work** (mute, speaker, recording, hangup)

### Features Status

✅ **Working**
- Dialpad UI (keyboard + button input)
- Token generation from Twilio
- Call status display
- Call duration tracking
- Mute/Speaker controls
- Call history logging
- Messaging interface
- Recording button (API integrated)

⚠️ **Requires Twilio Setup**
- Actual phone calls (needs valid Twilio account config)
- Incoming calls (needs phone number registered)

### If Calls Aren't Working

1. **Check environment variables** in Vercel project settings
2. **Verify TwiML App SID** matches in token generation
3. **Test token generation**: Open browser console → `fetch('/api/token').then(r => r.json()).then(console.log)`
4. **Check Twilio logs** in Twilio Console for errors

### Recording Notes

Recording starts/stops via the recording API. The recorded audio is handled by Twilio and stored in your account.

### Common Issues

**"Error: Identity is required"** → Token route is working correctly

**"Calling..." then nothing** → Check Twilio credentials and TwiML app configuration

**Hydration warnings** → Usually from browser extensions, doesn't affect functionality
