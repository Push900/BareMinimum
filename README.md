# BareMinimum

BareMinimum is a React wellness dashboard for small, sustainable habits across UN Goals 3, 8, and 12. The app uses an Express server and MongoDB for dashboard snapshots, with a browser-local preview fallback when MongoDB is unavailable.

## Run locally

1. Install dependencies with `pnpm install`.
2. Set `MONGODB_URI` and `MONGODB_DB_NAME` in `.env` (the default database is `bareminimum`). Keep credentials server-side; never prefix them with `VITE_`.
3. Start MongoDB, then run `pnpm dev`.
4. Open `http://localhost:3000`. Set `PORT=3001` if port 3000 is already in use.

The Express server exposes the dashboard snapshot routes and the dated healthcare record routes:

- `GET /api/healthcare-records?dataset=body` lists the signed-in user's records (omit `dataset` to list all).
- `POST /api/healthcare-records` creates a dated entry with `{ "dataset": "body", "values": { "heightCm": 170 } }`.
- `PUT /api/healthcare-records/:id` updates an entry owned by the signed-in user.

Healthcare entries are stored in the `healthcareRecords` collection using the verified server user's account `openId` as the owner key. Unauthenticated or unavailable-server use remains in browser localStorage and is labelled local-only. Sample examples are separate from personal history. `GET /api/health` reports whether the app server is running.

## Accounts, sessions, and data

Account creation and sign-in use the existing Express and MongoDB layers. Passwords are salted and hashed with Node's `scrypt`; the browser receives an `httpOnly`, `SameSite=Lax` session cookie. MongoDB stores only a SHA-256 hash of each random session token in `authSessions`; logout deletes that session. Sessions expire after 24 hours. Account and session checks are server-side, and record ownership always comes from the verified session's `openId`.

The app uses these MongoDB collections: `localAccounts` (account credentials), `authSessions` (revocable sessions with TTL expiry), `dashboardSnapshots` (per-account dashboard state), `healthRecords` (latest wellness baseline), and `healthcareRecords` (dated body, activity, hydration, sleep, wearable-ready, worker, timetable, waste, resources, food, and procurement entries). MongoDB creates the session expiry and account identifier indexes on first connection.

Authentication routes:

- `POST /api/auth/local/signup` creates an account and signs it in.
- `POST /api/auth/local/login` verifies credentials and creates a session.
- `GET /api/trpc/auth.me` resolves the current session.
- `POST /api/trpc/auth.logout` revokes the current session and clears the cookie. `POST /api/auth/local/logout` is also available.

Protected data routes:

- `/api/dashboard` supports `GET` and `PUT`.
- `/api/health-record` supports `GET` and `PUT` for the latest baseline.
- `/api/healthcare-records` supports `GET` and `POST`; `/api/healthcare-records/:id` supports `PUT` and `DELETE`.

Each protected route verifies the cookie before reading or changing data. Record queries and updates include the verified account identifier, so changing a record ID cannot expose another account's data. With no valid session, these routes return HTTP 401. Local-only records are kept in account-scoped browser storage and are never sent to MongoDB without a valid session.

PowerShell commands for port 3001:

```powershell
$env:PORT = "3001"
pnpm dev
```

Then visit `http://127.0.0.1:3001`. MongoDB must be reachable and `MONGODB_URI` must be set to create accounts or sync private records.

The healthcare dashboard covers SDG 3 personal wellness, SDG 8 healthcare worker well-being, and SDG 12 healthcare waste, resources, food waste, and procurement. Wearable-ready values are manual entry; no smartwatch provider is connected. See [the metric and implementation guide](output/pdf/BareMinimum_Healthcare_Metrics_and_Implementation_Guide.pdf) for definitions, formulas, source references, validation ranges, architecture, limits, and implementation notes.

## Production

- `pnpm build` builds the React client and Express server.
- `pnpm start` serves the production build.
- `pnpm check` runs TypeScript validation.
