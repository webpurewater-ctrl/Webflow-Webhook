# Webflow -> ClickShip Webhook Bridge

Node.js service that receives **Webflow Ecommerce order webhooks** and forwards mapped settlement payloads to **ClickShip**.

## Features

- Express endpoint for new order webhooks
- Optional HMAC signature validation
- Payload mapper from Webflow order shape to ClickShip settlement shape
- Forwarding to ClickShip using API key auth
- Health check endpoint

## Requirements

- Node.js 18+
- A Webflow Ecommerce webhook configured for order events
- ClickShip API credentials and settlement endpoint path

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with real values:

- `CLICKSHIP_BASE_URL`
- `CLICKSHIP_API_KEY`
- `CLICKSHIP_SETTLEMENT_PATH`
- Optional: `WEBFLOW_WEBHOOK_SECRET` if you validate signatures

## Run

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Server defaults to port `3000` and exposes:

- `GET /health`
- `POST /webhooks/webflow/orders`

## Deploy to Vercel (Free Hobby Plan)

This project is configured for Vercel serverless deployment:

- `api/index.js` exposes the Express app as a serverless handler
- `vercel.json` rewrites incoming paths to that handler, so your webhook path stays the same

### 1) Push this project to GitHub

Create a repository, then push your code.

### 2) Import in Vercel

1. Sign in to Vercel.
2. Click **Add New... -> Project**.
3. Import your GitHub repository.
4. Keep default framework setting (**Other** is fine).

### 3) Add Environment Variables in Vercel

Add the same keys from your `.env`:

- `CLICKSHIP_BASE_URL`
- `CLICKSHIP_API_KEY`
- `CLICKSHIP_SETTLEMENT_PATH`
- `WEBFLOW_WEBHOOK_SECRET` (optional)
- `CLICKSHIP_TIMEOUT_MS` (optional)

### 4) Deploy

Click **Deploy**. On success, Vercel gives you a URL like:

- `https://your-project.vercel.app`

### 5) Configure Webflow webhook endpoint

Use this URL in Webflow:

- `https://your-project.vercel.app/webhooks/webflow/orders`

Health endpoint:

- `https://your-project.vercel.app/health`

### Notes for free tier

- Vercel Hobby is enough for low-to-moderate webhook traffic.
- Serverless functions can cold start after idle periods.
- Keep webhook handlers fast and idempotent.

## Webflow Webhook URL

For local testing, expose your local port with a tunnel service (for example, ngrok):

```bash
ngrok http 3000
```

Then use:

`https://<your-tunnel-domain>/webhooks/webflow/orders`

## Notes

- The mapper in `src/orderMapper.js` handles several common Webflow payload variants.
- If your ClickShip settlement schema differs, adjust the output in `mapWebflowOrderToClickShipSettlement`.
- If Webflow signs payloads differently in your setup, update `src/webflowSignature.js` accordingly.
