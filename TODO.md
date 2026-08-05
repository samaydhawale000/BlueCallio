# Google OAuth Login Implementation ✔

## Backend
- [x] Update Prisma schema (add googleId, name, avatarUrl; make passwordHash optional)
- [x] Install google-auth-library
- [x] Create Google DTO (google.dto.ts)
- [x] Update AuthService: replace signup/login with loginWithGoogle
- [x] Update AuthController: replace signup/login with /auth/google
- [x] Update AuthModule (no change needed)
- [x] Update .env.example with GOOGLE_CLIENT_ID
- [x] Run prisma migration (add_google_auth)

## Frontend
- [x] Create useGoogleAuth hook (Google Identity Services)
- [x] Create GoogleSignInButton component
- [x] Update login page with Google button
- [x] Update signup page with Google button
- [x] Update .env.example with NEXT_PUBLIC_GOOGLE_CLIENT_ID

## Removed
- [x] Removed email/password backend endpoints (/auth/signup, /auth/login)
- [x] Removed signup.dto.ts and login.dto.ts
- [x] Removed email/password forms on login & signup pages

---

# Call Auto-TimeOut (fix stuck RINGING calls) ✔

## Backend
- [x] Add `ringTimeoutMs` config (default 15s, env `CALL_RING_TIMEOUT_MS`) to CallService
- [x] Add `missExpiredCalls()` — find RINGING calls older than timeout and mark MISSED
- [x] Add `missCall()` — mark single call MISSED (fires `call-missed` socket event + `call.missed` webhook)
- [x] Run auto-cleanup on boot (`onModuleInit`) to clear existing stuck calls
- [x] Run auto-cleanup every 10s via `setInterval`
- [x] Guard `acceptCall` against accepting missed/ended/rejected calls
- [x] Emit `call-missed` to both CALLER and RECEIVER

## Frontend
- [x] Add `missed` state to CallState type
- [x] Handle `call-missed` socket event
- [x] Add "No answer" missed screen
- [x] Register `call-missed` in socket cleanup

---

# Auth Persistence Bug (refresh bounces to login) ✔

## Fix
- [x] Add `hasHydrated` flag to auth store via `onRehydrateStorage`
- [x] Create `useRequireAuth` hook that waits for rehydration before redirecting
- [x] Use guard in dashboard page (no more premature redirect on refresh)
- [x] Use guard in playground page
