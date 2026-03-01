# VoiceLink - Twilio Setup Guide

## Deployed App
Your preview URL: https://vm-qzkyk8n7znkdh9pizl9hq2.vusercontent.net/dialpad

## Twilio Console Configuration

You need to update your TwiML App in the Twilio Console with the following URLs:

### 1. Voice Webhook URL (for incoming and outgoing calls)
```
https://vm-qzkyk8n7znkdh9pizl9hq2.vusercontent.net/api/voice
```

### 2. Fallback URL (optional, for error handling)
```
https://vm-qzkyk8n7znkdh9pizl9hq2.vusercontent.net/api/voice/gather
```

## Steps to Update in Twilio Console:

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: **Develop** → **Explore Products** → **Voice** → **TwiML Apps**
3. Click on your TwiML App (configured with `TWILIO_TWIML_APP_SID`)
4. In the **Voice Configuration** section, update:
   - **Request URL**: `https://vm-qzkyk8n7znkdh9pizl9hq2.vusercontent.net/api/voice`
   - **Method**: POST
5. Save changes

Alternatively, if using Phone Numbers:
1. Go to: **Develop** → **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your phone number
3. In **Call handling**, set:
   - **Configure with**: TwiML App
   - **TwiML App**: Select your app
4. Save

## Features Included:

✅ **Dialpad** - Click buttons or use keyboard (0-9, *, #)
✅ **Keyboard Support** - Type numbers directly
✅ **Call Duration** - Real-time call timer
✅ **Mute/Unmute** - Control microphone during calls
✅ **Speaker Control** - Toggle speaker on/off
✅ **Recording** - Start/stop call recording (UI only, backend implementation optional)
✅ **Call History** - View recent incoming/outgoing calls
✅ **Messaging** - Send/receive text messages with contacts
✅ **Recent Contacts** - Quick access to frequently called numbers
✅ **Professional UI** - Dark theme, modern enterprise design

## Environment Variables

All required environment variables are already set:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY`
- `TWILIO_API_SECRET`
- `TWILIO_TWIML_APP_SID`
- `TWILIO_PHONE_NUMBER`

## API Routes

- `GET /api/token` - Generate Twilio access token
- `POST /api/token` - Generate token with custom identity
- `POST /api/voice` - Handle incoming/outgoing call webhooks
- `POST /api/voice/gather` - Process DTMF (dial) input from calls

## Notes

- The app supports both keyboard and button input for the dialpad
- Call history and messages are stored in-memory (reset on refresh)
- Recording functionality UI is ready - backend implementation can be added later
- All phone numbers in the interface are for demonstration
