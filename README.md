# Melody Backend (Auth)

Simple Express + MongoDB backend providing register and login for Melody web.

## Setup

1. Copy `.env.example` to `.env` and update values if needed (keep `CLIENT_URL=https://melody-fe.vercel.app` for CORS).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   The API defaults to `http://localhost:4000`.

## Endpoints

- `POST /api/auth/register` — body `{ email, password, name? }`; returns `{ user, token }`.
- `POST /api/auth/login` — body `{ email, password }`; returns `{ user, token }`.

## Notes

- MongoDB defaults to the provided cluster: `mongodb+srv://tinlangx:123456@mindx-web91.whzoamu.mongodb.net/`.
- CORS is limited to the deployed frontend domain via `CLIENT_URL`.
