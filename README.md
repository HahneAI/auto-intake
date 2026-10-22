# auto-intake

One-page car-trouble intake form for a mechanic. The link goes straight to a 4-step form: vehicle (VIN lookup, year/make/model, mileage) → problem (symptoms, when, drivable, description) → contact → review.

## Run
```
npm install
npm run dev
```

## TJ's admin page
`/admin`: sign in with `ADMIN_PASSWORD` (stays signed in 90 days). Lists requests newest first; each one has Call / Text / Directions buttons and a notes box.

## Configure
- Business details and form options: `src/lib/shop.ts` (values marked PLACEHOLDER).
- Storage: Upstash Redis via Vercel → Storage (injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`). Without it, local dev saves to `.data/intakes.json`.
- Optional: `INTAKE_WEBHOOK_URL` also forwards each request (for text/email alerts later).
- VIN lookup uses the free NHTSA vPIC API from the browser (no key).

## Deploy
1. Import the repo in Vercel.
2. Storage → add Upstash Redis, connect to the project.
3. Add env var `ADMIN_PASSWORD`.
4. Deploy.
