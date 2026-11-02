# BareMinimum

BareMinimum is a React wellness dashboard for small, sustainable habits across UN Goals 3, 8, and 12. The app uses an Express server and MongoDB for dashboard snapshots, with a browser-local preview fallback when MongoDB is unavailable.

## Run locally

1. Install dependencies with `pnpm install`.
2. Set `MONGODB_URI` and `MONGODB_DB_NAME` in `.env` (the default database is `bareminimum`).
3. Start MongoDB, then run `pnpm dev`.
4. Open `http://localhost:3000`. Set `PORT=3001` if port 3000 is already in use.

The Express server exposes `GET /api/dashboard` and `PUT /api/dashboard`. Snapshots are saved in the `dashboardSnapshots` collection. `GET /api/health` reports whether the app server is running.

## Production

- `pnpm build` builds the React client and Express server.
- `pnpm start` serves the production build.
- `pnpm check` runs TypeScript validation.
