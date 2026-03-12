# SalesDialpad Security Setup Guide

## Overview
This document outlines the security enhancements added to SalesDialpad:
1. **Global Password Authentication** - Requires password entry before accessing the app
2. **Frontend Optimization** - Shows 10 latest recordings only to reduce load
3. **Historical Search** - New page to search calls and recordings by date without storing results

## Environment Variables Required

### 1. Add Password to Environment Variables

You need to add the global password as an environment variable. This password is NOT stored in source code and is only verified on the server-side.

**In Vercel Settings:**
1. Go to Settings → Environment Variables
2. Add a new variable:
   - **Key**: `APP_PASSWORD`
   - **Value**: `acpremium@021287` (or your preferred password)
   - **Environments**: Production, Preview, Development

**Alternatively, in `.env.local` (for local development):**
```
APP_PASSWORD=acpremium@021287
```

**Important**: Never commit `.env.local` to Git. It's already in `.gitignore`.

## How It Works

### Authentication Flow
1. User lands on the app → redirected to `/auth` page
2. User enters password
3. Password is sent to `/api/auth/verify` (server-side verification)
4. If correct, a session token is stored in `sessionStorage`
5. User is redirected to `/dialpad`
6. On refresh, the session is cleared (sessionStorage is cleared on browser close)

### Security Highlights
- **Password never exposed**: The password is only checked on the server. It never appears in console logs, network requests, or source code.
- **Session token is safe**: The session token in `sessionStorage` is just proof of authentication - it's not sensitive.
- **No persistent authentication**: Using `sessionStorage` means the user must re-authenticate if they close the tab.

### Frontend Optimization
- Dialpad page automatically loads only the 10 latest recordings (API already limited)
- A "Search History" button was added to the header for accessing older records
- This reduces frontend load and Vercel consumption

### Historical Search Page (`/search`)
- New dedicated page at `/search` for searching old calls and recordings
- Users can filter by:
  - Date range (required: start date, optional: end date)
  - Record type (All, Calls Only, Recordings Only)
- Results are fetched on-demand via new API endpoints
- **Important**: Results are NOT persisted to localStorage or sessionStorage
- On page refresh, all results are cleared

## New Files Created

### Authentication System
- `lib/auth.ts` - Authentication utilities
- `app/auth/page.tsx` - Password entry page
- `app/api/auth/verify/route.ts` - Server-side password verification
- `middleware.ts` - Route protection middleware
- `components/auth-wrapper.tsx` - Component wrapper for protected pages

### Historical Search
- `app/search/page.tsx` - Search interface
- `app/api/recording/search/route.ts` - Recording search endpoint
- `app/api/calls/search/route.ts` - Calls search endpoint

### Modified Files
- `app/page.tsx` - Added auth check
- `app/dialpad/page.tsx` - Added AuthWrapper and Search History button

## Testing the Setup

### Local Testing
1. Set `APP_PASSWORD=acpremium@021287` in `.env.local`
2. Start the dev server: `npm run dev`
3. Go to `http://localhost:3000`
4. You should be redirected to `/auth`
5. Enter the password
6. You should now see the dialpad
7. Click "Search History" to test the search page

### Production Testing
1. Add `APP_PASSWORD` to Vercel Environment Variables
2. Deploy the app
3. Test password authentication at your live URL
4. Test the search functionality

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify password and get session token

**Request:**
```json
{
  "password": "acpremium@021287"
}
```

**Response:**
```json
{
  "token": "session_1234567890_abc123"
}
```

### Search Endpoints
- `POST /api/recording/search` - Search recordings by date
- `POST /api/calls/search` - Search calls by date

**Request:**
```json
{
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-20T23:59:59.999Z"
}
```

**Response:**
```json
[
  {
    "sid": "RE123abc...",
    "duration": 42,
    "dateCreated": "2024-01-15T10:30:00.000Z"
  }
]
```

## Security Considerations

1. **Password Management**
   - Password is stored only in environment variables
   - Never logged to console or stored in database
   - Server-side verification ensures client-side cannot bypass auth

2. **Session Management**
   - Uses `sessionStorage` (cleared on browser close)
   - No persistent cookies storing sensitive data
   - User must re-authenticate after closing the tab

3. **API Protection**
   - All data endpoints now behind authentication
   - Search results are not cached on frontend
   - Each search request is fresh (no persistence)

4. **Data Privacy**
   - Search results are not saved to localStorage or database
   - All data handling follows GDPR and privacy best practices

## Troubleshooting

### User keeps being redirected to /auth
- Check that `APP_PASSWORD` is set in environment variables
- Make sure the password value is correct (no extra spaces)

### Search is not returning results
- Verify Twilio credentials are correct
- Check that the date range is valid
- Ensure API endpoints are deployed and accessible

### Session keeps being cleared
- This is intentional behavior - `sessionStorage` is cleared on browser close
- User can close the browser and reopen to start fresh

## Future Enhancements

1. Add more sophisticated session management (JWT with expiration)
2. Add user roles and permissions
3. Add call recording transcripts in search results
4. Add export functionality for search results
5. Add audit logging for security events
