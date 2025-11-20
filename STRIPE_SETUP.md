# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for your food delivery system.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Stripe Dashboard

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Click on **Developers** in the left sidebar
3. Click on **API keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode) - Click "Reveal test key"

## Step 2: Add Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret (you'll get this in Step 3)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL for redirects (use your production URL in production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important:** 
- Do NOT add quotes around the values
- The `STRIPE_SECRET_KEY` should NEVER be exposed to the client
- Only `NEXT_PUBLIC_*` variables are accessible in the browser

## Step 3: Set Up Webhooks (For Production)

Webhooks allow Stripe to notify your app when payments succeed or fail.

### For Local Development (Using Stripe CLI)

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`

### For Production

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** and add it to your production environment variables

## Step 4: Run Database Migration

The Stripe integration requires new fields in your database:

```bash
npx prisma migrate dev
npx prisma generate
```

## Step 5: Restart Your Development Server

After adding environment variables, restart your server:

```bash
npm run dev
```

## Testing the Integration

### Test Card Numbers

Use these test cards in Stripe's test mode:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any postal code.

### Testing Flow

1. Add items to your cart
2. Go to checkout
3. Select items and delivery address
4. Click "Proceed to Payment"
5. You'll be redirected to Stripe's checkout page
6. Enter test card details
7. Complete payment
8. You'll be redirected back to the success page

## Payment Flow

1. **User clicks "Proceed to Payment"**
   - App creates an order in the database with `paymentStatus: "pending"`
   - App creates a Stripe Checkout Session
   - User is redirected to Stripe's hosted checkout page

2. **User completes payment on Stripe**
   - Stripe processes the payment
   - Stripe sends a webhook to `/api/stripe/webhook`

3. **Webhook handler processes the payment**
   - Updates order `paymentStatus` to `"paid"`
   - Removes items from user's cart
   - Order is now complete

4. **User is redirected back**
   - Success: `/checkout/success`
   - Cancel: `/checkout/cancel`

## Troubleshooting

### "Missing credentials" Error
- Ensure `STRIPE_SECRET_KEY` is set in `.env.local`
- Restart your dev server after adding env variables

### Webhook Not Working Locally
- Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Check that `STRIPE_WEBHOOK_SECRET` matches the one from Stripe CLI

### TypeScript Errors
- Run `npx prisma generate` to regenerate Prisma client
- Restart your IDE/TypeScript server

### Payment Succeeds but Order Not Updated
- Check webhook logs in Stripe Dashboard
- Verify webhook secret is correct
- Check server logs for errors

## Going to Production

Before going live:

1. **Switch to live mode keys:**
   - Get your live API keys from Stripe Dashboard (they start with `pk_live_` and `sk_live_`)
   - Update environment variables in your production environment

2. **Set up production webhooks:**
   - Add webhook endpoint in Stripe Dashboard for your production URL
   - Update `STRIPE_WEBHOOK_SECRET` with the production webhook secret

3. **Update base URL:**
   - Set `NEXT_PUBLIC_BASE_URL` to your production domain

4. **Test thoroughly:**
   - Use real cards in small amounts
   - Verify webhooks are being received
   - Check order creation and cart clearing

## Security Notes

- Never commit `.env.local` to version control
- Keep your secret key secure
- Validate webhook signatures (already implemented)
- Use HTTPS in production
- Regularly rotate your API keys

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
