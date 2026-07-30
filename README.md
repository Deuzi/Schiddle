# Schiddle

Privacy-first AI schedule optimizer for students — academics, athletics,
clubs, jobs, and everything in between. Turns messy free-text notes into
an optimized, exportable calendar — without ever sending real names,
schools, or locations to an AI model.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Groq API (`llama-3.3-70b-versatile`, free tier) via `groq-sdk`
- `next-auth` (Google provider) for real Google Calendar write access
- `ics` for native, local `.ics` calendar export (fallback / non-Google users)

## Getting started

```bash
npm install
cp .env.example .env.local
```

Then fill in `.env.local`:
1. `GROQ_API_KEY` — free key from https://console.groq.com/keys
2. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from a Google Cloud project
   with the **Google Calendar API** enabled and an OAuth 2.0 Web Client
   (redirect URI `http://localhost:3000/api/auth/callback/google`)
3. `NEXTAUTH_SECRET` — any random string (`openssl rand -base64 32`)
4. `NEXTAUTH_URL=http://localhost:3000`

```bash
npm run dev
```

Open http://localhost:3000.

## How it works

1. You type your schedule into the input box.
2. `utils/securityEngine.ts` scans the text in your browser and replaces
   anything identifying (school names, cities, sports, subjects, names)
   with tokens like `[LOCATION_EDUCATIONAL_1]`.
3. Only the tokenized text is sent to `/api/optimize`, a Next.js route
   that calls Groq with a system prompt instructing the model to preserve
   the tokens exactly and return structured JSON.
4. The response (still tokenized) comes back to the browser, where it's
   unmasked back into real values — client-side only.
5. Two export options are offered on the results screen:
   - **"Connect Google Calendar" → "Add to Google Calendar"** — signs the
     user in with Google OAuth (scope limited to *creating* events only,
     never reading or deleting existing ones) and writes each event
     directly into their real, live Google Calendar via the Calendar API.
   - **"Download .ics"** — generates a real `.ics` file locally in the
     browser (not a mock/sample) and downloads it, no sign-in required.

See `SECURITY.md` for the full data-flow / zero-trust write-up.

## Does this work on iOS / Mac?

Short answer: yes, but which button to use depends on the user's setup.

| Situation | What to use | Why |
|---|---|---|
| Android or web, any Google account | **Add to Google Calendar** | Events land directly in their Google Calendar, which syncs everywhere. |
| iPhone/iPad/Mac **with** a Google account added in the native Calendar app (Settings → Calendar → Accounts → Add Account → Google) | **Add to Google Calendar** | Google events sync into Apple Calendar automatically once linked — no extra step needed. |
| iPhone/iPad/Mac with **no Google account linked**, using only native Apple/iCloud Calendar | **Download .ics** | Google OAuth can only write to a Google account — it cannot write into an iCloud-only calendar. Tapping the downloaded `.ics` file opens Apple Calendar's native "Add Event(s)" import screen directly, no Google account or extra software needed. |
| Outlook / other calendar apps | **Download .ics** | `.ics` is the universal calendar interchange format; virtually every calendar app can import it. |

In short: **Google OAuth is the one-click path, but it only reaches
accounts that are actually Google accounts (directly, or linked into
Apple Calendar).** The `.ics` download is kept as the fallback specifically
so Apple-only users without a Google account aren't left without a working
export.

## Next steps

Core functionality (masking → Groq → unmasking → .ics export) is done.
UI/design pass comes next — current UI is intentionally minimal.
