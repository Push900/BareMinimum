# BareMinimum

BareMinimum is a React wellness dashboard for small, sustainable habits across UN Goals 3, 8, and 12. The app uses an Express server and MongoDB for dashboard snapshots, with a browser-local preview fallback when MongoDB is unavailable.

## Run locally

1. Install dependencies with `pnpm install`.
2. Set `MONGODB_URI` and `MONGODB_DB_NAME` in `.env` (the default database is `bareminimum`).
3. Start MongoDB, then run `pnpm dev`.
4. Open `http://localhost:3000`. Set `PORT=3001` if port 3000 is already in use.

The Express server exposes the dashboard snapshot routes and the dated healthcare record routes:

- `GET /api/healthcare-records?dataset=body` lists the signed-in user's records (omit `dataset` to list all).
- `POST /api/healthcare-records` creates a dated entry with `{ "dataset": "body", "values": { "heightCm": 170 } }`.
- `PUT /api/healthcare-records/:id` updates an entry owned by the signed-in user.

Healthcare entries are stored in the `healthcareRecords` collection using the verified server user's OAuth `openId` as the owner key. Unauthenticated or unavailable-server use remains in browser localStorage and is labelled local-only. Sample examples are separate from personal history. `GET /api/health` reports whether the app server is running.

The healthcare dashboard covers SDG 3 personal wellness, SDG 8 healthcare worker well-being, and SDG 12 healthcare waste, resources, food waste, and procurement. Wearable-ready values are manual entry; no smartwatch provider is connected. See [the metric and implementation guide](output/pdf/BareMinimum_Healthcare_Metrics_and_Implementation_Guide.pdf) for definitions, formulas, source references, validation ranges, architecture, limits, and implementation notes.

## Production

- `pnpm build` builds the React client and Express server.
- `pnpm start` serves the production build.
- `pnpm check` runs TypeScript validation.
