# Billing & Razorpay Setup

BlueJoinet's billing system runs in **mock mode** when Razorpay is not
configured. In mock mode, changes apply locally and webhooks are no-ops — the
whole flow is still testable end-to-end. To enable real payments, configure
Razorpay.

## Environment variables

### Server (`apps/server/.env`)

| Variable                    | Required | Description                                                                 |
| --------------------------- | -------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`              | yes      | Postgres connection string.                                                 |
| `RAZORPAY_KEY_ID`           | for live | Razorpay Key ID (e.g. `rzp_test_...`). If unset, runs in mock mode.         |
| `RAZORPAY_KEY_SECRET`       | for live | Razorpay Key Secret. Used to make server-side API calls.                    |
| `RAZORPAY_WEBHOOK_SECRET`   | for live | Razorpay webhook signing secret. Used to verify webhook signatures.         |
| `APP_URL`                   | for live | Public app base URL for redirects (default `http://localhost:3000`).        |
| `TOPUP_PAISE_PER_MINUTE`    | optional | Price per purchased minute in paise (default `70` = ₹0.70/min).             |

### Web (`apps/web/.env.local`)

| Variable                    | Required | Description                                        |
| --------------------------- | -------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | no       | Backend base URL (default `http://localhost:3005`).|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | for Google login | Google OAuth web client ID.                |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`  | for live | Razorpay Key ID (used by the Checkout modal).  |

## Seeding plans

The subscription plans are stored in the database. Seed them with:

```bash
cd apps/server
npx ts-node --transpile-only -r dotenv/config prisma/seed-plans.ts
```

This creates/updates the **Free**, **Starter**, **Growth**, and **Pro** plans.

## Razorpay configuration

1. Create a Razorpay account and get your keys from the Razorpay Dashboard.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`
   to `apps/server/.env`, plus `NEXT_PUBLIC_RAZORPAY_KEY_ID` to
   `apps/web/.env.local`.
3. Configure the webhook endpoint
   (e.g. `https://your-api.example.com/billing/webhook`) in the Razorpay
   Dashboard for the relevant payment events.
4. In the app, users add a card via the **Razorpay Checkout** modal
   (`POST /billing/payment-method/setup` creates a ₹0 order, then the modal
   captures a saved-card token). The saved token is used to auto-charge the
   monthly usage invoice.

## Usage-based billing (v2)

BlueJoinet now uses **usage-based billing** rather than flat subscriptions:

- **Rates** (editable in the admin portal, stored in `BillingRate`):
  - Audio: ₹0.20 / participant-minute
  - Video: ₹0.80 / participant-minute
  - Screen-share: +₹0.10 / participant-minute (add-on to video)
- **Free tier**: 500 audio minutes + 200 video minutes per month. Screen-share
  is always paid.
- **Billing**: A monthly job (`BillingJobsService`, runs on the 1st) generates
  a `UsageInvoice` for the previous cycle and auto-charges the saved card via
  Razorpay. On failure, the invoice enters **dunning** with a 7-day grace
  period; new calls are gated, but active calls are never interrupted.

## Notes

- **Saving a card**: `POST /billing/payment-method/setup` returns a ₹0 order
  id; the frontend opens the Razorpay Checkout modal with `token.request = true`
  to capture a saved-card token, then calls `/billing/payment-method/attach`
  to persist it.
- **Top-ups**: `POST /billing/topup` creates a one-time payment for additional
  minutes (price per minute configurable via `TOPUP_PAISE_PER_MINUTE`, default
  ₹0.70/min). On success the minutes are credited to `Usage.minutesPurchased`
  and carry over between billing cycles.
- **Dunning & auto-downgrade**: On a failed invoice charge the subscription is
  marked `PAST_DUE` with a 7-day grace period. A daily scheduled job resets
  expired usage cycles and auto-downgrades `PAST_DUE` subscriptions back to the
  Free plan once the grace period passes.

## Migrations

Apply pending migrations:

```bash
cd apps/server
npx prisma migrate deploy
```

## Notes

- When `RAZORPAY_KEY_ID` is unset, `POST /billing/checkout` returns
  `{ isMock: true }` and upgrades the subscription locally.
- The admin "Billing & Revenue" page reads from `/billing/admin/revenue` and
  `/billing/plans`, both gated behind the `AdminGuard`.
