# auto-intake

One-page car-trouble intake form for a mechanic. The link goes straight to a 4-step form: vehicle (VIN lookup, year/make/model, mileage) → problem (symptoms, when, drivable, description) → contact → review.

## Run
```
npm install
npm run dev
```

## Configure
- Business details and form options: `src/lib/shop.ts` (values marked PLACEHOLDER).
- Submissions: `POST /api/intake`. Set `INTAKE_WEBHOOK_URL` (Make, Zapier, Slack webhook…) to forward each one; without it they are only logged to the server/Vercel function logs.
- VIN lookup uses the free NHTSA vPIC API from the browser (no key).

## Deploy
Import the repo in Vercel (framework auto-detected), add `INTAKE_WEBHOOK_URL`, deploy.
