# Application Security Architecture & Data Compliance — Schiddle

Schiddle enforces a strict **Zero-Trust Client-Side Privacy Policy** to protect
user PII (Personally Identifiable Information) before it ever reaches
external infrastructure.

### Defensive Mechanisms Implemented

1. **Local Data Sanitization (Client-Side Tokenization)**
   No raw school names, personal names, or geographic locations are
   transmitted over the network. The application intercepts raw input in
   the browser, substituting identifiable strings with standardized
   structural tokens (e.g. `[LOCATION_EDUCATIONAL_1]`,
   `[ACTIVITY_ATHLETIC_1]`) via `utils/securityEngine.ts`.

2. **Serverless-Boundary AI Access**
   The Next.js API route (`app/api/optimize/route.ts`) forwards only the
   masked/tokenized text to Groq's LLM API. The server itself never
   receives, logs, or stores raw PII — it is architecturally incapable of
   doing so, since the browser never sends it.

3. **Client-Side Unmasking**
   The AI's structured JSON response (which still contains the same
   tokens) is returned to the browser and unmasked back into real values
   entirely client-side (`unmaskObject`), so real names/locations are
   reconstructed only on the user's own device.

4. **Dual Calendar Export: Local `.ics` and Scoped Google OAuth**
   Two export paths are offered, and neither one exposes data to Groq or
   any third party beyond the user's own calendar:
   - **Local `.ics` export** (`utils/calendarExporter.ts`) compiles a real
     `.ics` file entirely in-browser and streams it to the user's
     downloads folder. No account, no server storage, zero retention
     footprint. This path is the fallback for anyone not using Google
     Calendar (e.g. iOS/Mac users on native iCloud Calendar only).
   - **Google Calendar OAuth** (`next-auth` + `lib/googleCalendar.ts`)
     lets the user sign in with Google and write events directly into
     their own primary calendar via the Calendar API
     (`app/api/calendar/push/route.ts`). The requested OAuth scope is
     intentionally the narrowest available —
     `https://www.googleapis.com/auth/calendar.events` — which permits
     *creating* events only. Schiddle never requests, and cannot exercise,
     permission to read, list, or delete the user's existing calendar
     data. The OAuth access token is stored only in the user's signed,
     server-side session (via `next-auth`'s JWT strategy) and is used
     solely to make the event-creation call on the user's behalf.

   Note: the schedule data pushed at this stage is the user's own,
   already-unmasked, real event data going into the user's own calendar —
   masking only applies to the earlier step where text is sent to the
   Groq LLM, not to this final, user-authorized write to their own
   account.

### Data Flow Summary

```
Browser (raw text)
   │  mask (client-side)
   ▼
Browser (tokenized text) ──POST──▶ /api/optimize (Next.js server)
                                        │  forwards tokenized text only
                                        ▼
                                   Groq LLM API
                                        │  tokenized JSON response
                                        ▼
Browser (tokenized JSON) ◀──────────────
   │  unmask (client-side)
   ▼
Browser (real schedule)
   ├──▶ .ics file, built + downloaded locally, no network round-trip
   └──▶ (if user connects Google) POST /api/calendar/push ──▶ Google Calendar API
                                                                (user's own primary
                                                                 calendar, via their
                                                                 own OAuth token)
```

At no point does raw PII cross a network boundary to reach the AI model.
The only place real, unmasked data ever leaves the browser is the optional,
user-initiated write into the user's *own* Google Calendar — which is the
explicit purpose of that feature, not a privacy leak.

### Cross-platform note (iOS / Mac)

Google OAuth can only write into a Google account. On iPhone, iPad, or Mac
that means: it works automatically if the user has linked a Google account
inside the native Calendar app, but it **cannot** write directly into an
iCloud-only calendar (Apple does not expose an equivalent OAuth API — that
would require CalDAV + an app-specific password, a separate integration
this app does not implement). The `.ics` download exists specifically to
cover that case: tapping the file opens Apple Calendar's native import
screen with no Google account required. See `README.md` for the full
platform matrix.
