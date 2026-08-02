# BlueJoinet — 3-Product Integration Plan (1:1 calls, no group calls)

## Website Content Update (new 3-product marketing) ✅
- [x] W1: Landing page FEATURES array — reflect React Components, Headless SDK, waiting room, device selection, branding, dashboard
- [x] W2: Landing page PRODUCTS section — Hosted UI / React Components / Headless SDK cards
- [x] W3: Hero code snippet — new `POST /calls` response shape (callId, hostedUrl, participants[])
- [x] W4: Pricing section — add new features across all 4 plans
- [x] W4b: Single global navigation — removed duplicate inline `<header>` navs from Docs, FAQ, and Dashboard; global Header is now auth-aware (Dashboard/Logout when logged in, Log In/Get Started when not) and hidden on the full-screen /call page; added Playground to NavLinks; sidebar offsets adjusted
- [x] W6: Footer — fix Playground path, add FAQ link, remove dead links
- [x] W7: New `/faq` page — styled like docs, grouped FAQs, CTA
- [x] W8: NavLinks onClick prop made optional (fixed Header type error)
- [x] W9: `next build` passes — all 11 routes compile (/, /faq, /docs, /call, /dashboard, /dashboard/playground, /login, /signup)

## Phase A — Backend core ✅
- [x] A1: Prisma schema — branding on Project (companyName, logoUrl, primaryColor, theme, waitingRoom) + migration
- [x] A2: CallSessionService — add `getByToken(token)`
- [x] A3: CallService — new `POST /calls` response shape (`callId`, `hostedUrl`, `participants[]`)
- [x] A4: CallController — add `POST /calls/:id/join` and `POST /calls/:id/leave`
- [x] A5: CallGateway — standardized socket events (connected, call.started, call.ended, participant.*, media events)
- [x] A6: CallRoomService — participant metadata tracking
- [x] A7: PlaygroundService — update to new createCall response shape

## Phase B — Core SDK (@bluejoinet/sdk) ✅
- [x] B1: rename package to `@bluejoinet/sdk`, add socket.io-client
- [x] B2: `types.ts` rewrite
- [x] B3: `client.ts` — REST helpers for new response shape
- [x] B4: `engine.ts` — headless engine (join/leave/camera/microphone/screenShare/participants/connectionState)
- [x] B5: `index.ts` — exports

## Phase C — React SDK (@bluejoinet/react) ✅
- [x] C1: package scaffold + MeetingProvider/context
- [x] C2: hooks (useMeeting, useParticipants, useParticipant, useDevices, useConnection)
- [x] C3: layout components (MeetingRoom, ParticipantGrid, ParticipantTile, ActiveSpeakerView)
- [x] C4: control components (CameraButton, MicrophoneButton, ScreenShareButton, LeaveButton)
- [x] C5: panels + indicators (DeviceSelector, WaitingRoom, ConnectionStatus, SpeakingIndicator)

## Phase D — Hosted UI (apps/web /call) ✅
- [x] D1: branding from project config
- [x] D2: device selection
- [x] D3: waiting room
- [x] D4: responsive layout + standardized socket events

## Phase E — Dashboard + Docs ✅
- [x] E1: dashboard Calls section (active / history / details)
- [x] E2: dashboard Usage (total calls, active, minutes used)
- [x] E3: docs restructure (3 products + REST API + WebSocket + Auth + Examples + FAQ)

