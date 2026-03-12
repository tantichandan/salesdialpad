# SalesDialpad Security - Quick Start

## What Changed?
1. ✅ App now requires a password to access
2. ✅ Only 10 latest recordings shown (rest accessible via search)
3. ✅ New search page to find old calls & recordings by date

## ONE Step Before Deploying

### Add Environment Variable to Vercel
1. Go to Vercel Dashboard → Project Settings
2. Click "Environment Variables"
3. Add:
   ```
   KEY: APP_PASSWORD
   VALUE: acpremium@021287
   Environments: Production, Preview, Development
   ```
4. Save and redeploy

OR for local testing, add to `.env.local`:
```
APP_PASSWORD=acpremium@021287
```

## Testing Locally
```bash
npm run dev
# Go to http://localhost:3000
# Enter password: acpremium@021287
# You're in!
```

## User Flow
```
User Opens App
    ↓
Enter Password (acpremium@021287)
    ↓
Dialpad with 10 Latest Recordings
    ↓
Need older recordings?
    └─ Click "Search History" button
       → Select date range
       → See all calls & recordings from that date
       → Results NOT saved (refresh = clear results)
    ↓
Logout
    └─ Click "Logout" button (top-right)
    └─ Enter password again to re-access
```

## New Pages
| Page | URL | Purpose |
|------|-----|---------|
| Login | `/auth` | Enter password |
| Dialpad | `/dialpad` | Make calls, see 10 latest recordings |
| Search | `/search` | Find old calls & recordings by date |

## Key Features
✅ Password protected (environment variable, never in code)
✅ Only 10 recordings shown (cleaner UI, less load)
✅ Search without persistence (results cleared on refresh)
✅ Logout functionality
✅ Mobile responsive
✅ No data leaks (password not in console/network)

## Files Modified/Created
- NEW: `lib/auth.ts` - Authentication logic
- NEW: `app/auth/page.tsx` - Login page
- NEW: `app/search/page.tsx` - Search page
- NEW: `app/api/auth/verify/route.ts` - Password verification
- NEW: `app/api/recording/search/route.ts` - Search recordings
- NEW: `app/api/calls/search/route.ts` - Search calls
- NEW: `components/auth-wrapper.tsx` - Auth wrapper
- NEW: `middleware.ts` - Route protection
- MODIFIED: `app/page.tsx` - Check auth on load
- MODIFIED: `app/dialpad/page.tsx` - Add auth + search button

## Troubleshooting

**Q: User keeps getting redirected to /auth**
A: Make sure `APP_PASSWORD` is set in Vercel Environment Variables

**Q: Search returns no results**
A: Check the date range is valid and Twilio credentials are correct

**Q: Why does password prompt appear after closing the browser?**
A: By design - session uses `sessionStorage` which clears on browser close. This is secure.

**Q: Can I change the password?**
A: Yes! Update the `APP_PASSWORD` environment variable in Vercel. No code changes needed.

## Documentation
- `SECURITY_SETUP.md` - Detailed security documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete technical overview

---

**Ready to deploy?**
1. Add `APP_PASSWORD` to Vercel Environment Variables
2. Push code to GitHub (auto-deploys)
3. Test at your live URL
4. Recharge Twilio account
5. Done!
