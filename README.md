# Cadence

Recurring crypto buys, paid with a card, delivered to a Tangem wallet.

Cadence never holds keys and never sees a card number. Production charges go through **Stripe Crypto Onramp** (no monthly fee — pay as you go). Stripe is PCI-certified; the PAN and CVC stay in their iframe and are sent to your Tangem address on-chain.

## Security

- No card number, CVC, or full expiry fields in the app
- No PAN in `localStorage`, logs, or the database
- Preview mode uses a one-tap test rail (`···· 4242`) we mint locally — you never type a number
- Live mode mounts Stripe’s on-ramp; Cadence only stores a rail label
- Destination is a receive address you paste from the Tangem app

## Stripe setup (free to start)

1. Create a Stripe account at [stripe.com](https://stripe.com) — no monthly fee
2. Enable [Crypto Onramp](https://dashboard.stripe.com/crypto/onramp)
3. Copy keys from [API keys](https://dashboard.stripe.com/apikeys)

```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

On Vercel, add those as environment variables. Publishable keys are public by design; never commit the secret.

Live on-ramp currently supports **BTC, ETH, SOL, AVAX** to a locked Tangem address. Other assets remain preview-only.

## Run

```
npm install
npm run dev
```

App listens on port 8080.

## Stack

TanStack Start, React 19, Tailwind v4, Zustand (local cadence data), Stripe Crypto Onramp.
