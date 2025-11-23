# Stripe Payment Integration Documentation

## Overview

This document details the Stripe payment integration implemented for the food delivery checkout system. The integration ensures that orders are only created after successful payment processing, providing a secure and reliable checkout experience.

## Architecture Changes

### Before Integration

- Separate checkout form and payment form (nested forms - invalid HTML)
- Orders created before payment verification
- "Buy" button triggered order creation directly
- No payment validation before inventory changes

### After Integration

- Single payment form workflow
- Orders created only after successful Stripe payment
- Payment verification on server-side before order processing
- Atomic transactions ensuring data consistency

## Modified Files

### 1. `app/(user)/checkout/actions.ts`

#### New Function: `processCheckoutWithPayment()`

```typescript
export async function processCheckoutWithPayment(
  paymentIntentId: string,
  selectedItemsData: any[],
  quantities: Record<number, number>,
  selectedAddressId: number,
  totalAmount: number
): Promise<{ success: boolean; error?: string; orderId?: number }>;
```

**Purpose**: Handles complete checkout logic after Stripe payment succeeds.

**Process Flow**:

1. **Payment Verification**: Retrieves payment intent from Stripe API to verify status
2. **Validation**: Checks address, items, quantities, and stock availability
3. **Price Recalculation**: Recalculates totals from database values (never trusts client)
4. **Weight Validation**: Enforces 200 lb weight limit
5. **Amount Verification**: Ensures payment amount matches order total
6. **Transaction Processing**:
   - Creates order record with payment details
   - Creates order items
   - Decrements product stock
   - Clears cart items
7. **Revalidation**: Updates cached data for home and orders pages

**Security Features**:

- Server-side payment verification with Stripe
- Database transaction ensures atomicity
- All prices and weights fetched from database
- Stock availability checked before order creation
- Payment amount validation

**Error Handling**:

- Returns structured error messages for various failure scenarios
- Transaction rollback on any error
- Preserves cart if order creation fails

---

### 2. `app/(user)/checkout/stripeComponent.tsx`

#### Component: `StripeComponent`

**New Props**:

```typescript
type StripeComponentProps = {
  totalAmount: number;
  selectedItemsData: any[]; // Cart items with product details
  quantities: Record<number, number>; // Item quantities
  selectedAddressId: number | null; // Selected delivery address
  disabled?: boolean; // Disable payment button
};
```

**Key Features**:

1. **Payment Intent Creation**:

   - Fetches client secret on component mount
   - Recreates intent if total amount changes
   - Handles loading states and errors

2. **Form Submission Flow**:

   ```
   User clicks "Pay"
   → Validate address & items
   → Submit payment elements
   → Confirm payment with Stripe
   → If successful: Call processCheckoutWithPayment()
   → Redirect to success page with order ID
   ```

3. **State Management**:

   - `loading`: Payment processing state
   - `processingOrder`: Order creation state
   - `errorMessage`: User-facing error messages
   - `clientSecret`: Stripe payment intent secret

4. **User Experience**:

   - Clear loading indicators
   - Error message display with icons
   - Disabled state when no items/address selected
   - Progressive button text ("Processing payment..." → "Processing order...")

5. **Payment Confirmation**:
   - Uses `redirect: "if_required"` for seamless UX
   - No redirect unless necessary
   - Handles payment confirmation client-side

---

### 3. `app/(user)/checkout/stripePayment.tsx`

#### Component: `StripePayment`

**Updated Props**:

```typescript
type StripePaymentProps = {
  totalAmount: number;
  selectedItemsData: any[];
  quantities: Record<number, number>;
  selectedAddressId: number | null;
  disabled?: boolean;
};
```

**Purpose**: Wrapper component that provides Stripe Elements context.

**Key Changes**:

- Passes all checkout data to `StripeComponent`
- Configures Stripe Elements with payment amount
- Handles Stripe initialization errors

---

### 4. `app/(user)/checkout/checkoutItems.tsx`

#### Component: `CheckoutComponent`

**Major Changes**:

1. **Removed**:

   - Form wrapper (`<form>` tag)
   - Hidden form inputs
   - "Buy" button
   - `useActionState` hook
   - `checkoutFormAction` reference

2. **Changed to Display-Only**:

   - Now purely presentational component
   - No form submission logic
   - Manages UI state (selection, quantities, address)

3. **Data Flow**:

   ```typescript
   <StripePayment
     totalAmount={computeGrandTotal()}
     selectedItemsData={selectedItemsData}
     quantities={quantities}
     selectedAddressId={selectedAddressId}
     disabled={
       selectedItems.size === 0 ||
       totalSelectedWeight > 200 ||
       !selectedAddressId
     }
   />
   ```

4. **Disabled Conditions**:
   - No items selected
   - Total weight exceeds 200 lbs
   - No delivery address selected

---

### 5. `app/(user)/checkout/payment-success/page.tsx`

#### New Component: `PaymentSuccessPage`

**Purpose**: Confirmation page after successful payment and order creation.

**Features**:

- Displays success icon and message
- Shows order number (from URL params)
- Provides navigation to orders page or home
- Clean, professional design

**URL Parameters**:

- `payment_intent`: Stripe payment intent ID
- `order_id`: Created order ID

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ CheckoutItems Component (Display Only)                       │
│ - Cart items with selection                                  │
│ - Quantity controls                                          │
│ - Address selection                                          │
│ - Total calculation                                          │
└────────────────────┬────────────────────────────────────────┘
                     │ Passes data as props
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ StripePayment Component                                      │
│ - Initializes Stripe Elements                                │
│ - Provides Stripe context                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ StripeComponent (Payment Form)                               │
│ 1. Creates payment intent → API route                        │
│ 2. Displays PaymentElement                                   │
│ 3. User enters card details                                  │
│ 4. User clicks "Pay $XX.XX"                                  │
│ 5. Confirms payment with Stripe                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
              ┌──────────────┐
              │ Payment      │
              │ Successful?  │
              └──────┬───────┘
                     │ Yes
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ processCheckoutWithPayment() Server Action                   │
│ 1. Verify payment with Stripe API                            │
│ 2. Validate items & stock                                    │
│ 3. Create order in transaction                               │
│ 4. Decrement stock                                           │
│ 5. Clear cart                                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Redirect to Payment Success Page                             │
│ - Show order confirmation                                    │
│ - Display order number                                       │
└─────────────────────────────────────────────────────────────┘
```

## API Routes

### `POST /api/checkout/create-payment-intent`

**Location**: `app/api/checkout/create-payment-intent/route.ts`

**Purpose**: Creates a Stripe payment intent for the checkout.

**Request Body**:

```json
{
  "amount": 1999 // Amount in cents
}
```

**Response**:

```json
{
  "clientSecret": "pi_xxx_secret_yyy"
}
```

**Important**: This endpoint should be kept secure and rate-limited in production.

---

## Database Schema Changes

The existing `Order` model already includes necessary fields:

```prisma
model Order {
  // ... other fields
  stripeSessionId   String?     @unique
  stripePaymentId   String?     // Stores payment intent ID
  paymentStatus     String?     @default("pending")
  totalAmount       Decimal?    @db.Decimal(10, 2)
  // ... other fields
}
```

**Used Fields**:

- `stripePaymentId`: Stores the payment intent ID from Stripe
- `paymentStatus`: Set to "succeeded" after successful payment
- `totalAmount`: Stores the final order total including fees

---

## Security Considerations

### 1. Payment Verification

- **Server-side verification**: Payment status checked with Stripe API before order creation
- **Never trust client**: All amounts recalculated from database

### 2. Data Validation

- **Stock verification**: Real-time stock check before order creation
- **Price validation**: Current prices fetched from database
- **Weight limits**: Enforced on both client and server

### 3. Transaction Safety

- **Atomic operations**: Order creation uses database transactions
- **Rollback on failure**: Any error rolls back entire transaction
- **Idempotency**: Payment intent IDs prevent duplicate orders

### 4. Error Handling

- **Graceful failures**: Clear error messages returned to user
- **No data loss**: Cart preserved if order creation fails
- **Payment reconciliation**: Payment intent ID stored for manual review

---

## Environment Variables

Required environment variables:

```env
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

**Important**:

- Use test keys for development
- Never commit secret keys to version control
- Rotate keys regularly in production

---

## Testing Guide

### Test Card Numbers

| Card Number         | Scenario                |
| ------------------- | ----------------------- |
| 4242 4242 4242 4242 | Successful payment      |
| 4000 0000 0000 0002 | Card declined           |
| 4000 0000 0000 9995 | Insufficient funds      |
| 4000 0025 0000 3155 | Requires authentication |

### Test Scenarios

#### 1. Successful Checkout

1. Add items to cart
2. Navigate to checkout
3. Select items and address
4. Enter test card: 4242 4242 4242 4242
5. Use any future expiry date
6. Use any 3-digit CVC
7. Click "Pay $XX.XX"
8. Verify redirect to success page
9. Check order appears in account/orders
10. Verify cart is cleared
11. Verify product stock decreased

#### 2. Insufficient Stock

1. Add item with low stock
2. In another browser/incognito, buy all remaining stock
3. Return to original checkout
4. Attempt payment
5. Verify error message about stock

#### 3. Invalid Address

1. Proceed to checkout without address
2. Verify payment button is disabled
3. Add address
4. Verify payment button becomes enabled

#### 4. Weight Limit

1. Add items totaling > 200 lbs
2. Verify warning message
3. Verify payment button is disabled
4. Remove items to get under limit
5. Verify payment button becomes enabled

#### 5. Payment Declined

1. Use test card: 4000 0000 0000 0002
2. Verify error message
3. Verify order not created
4. Verify cart still contains items

---

## Error Messages

### User-Facing Errors

| Error                  | Message                                           |
| ---------------------- | ------------------------------------------------- |
| No address             | "Please select a delivery address"                |
| No items               | "Please select items to checkout"                 |
| Payment declined       | Stripe's error message                            |
| Insufficient stock     | "Not enough stock for [Product]. Available: X"    |
| Weight exceeded        | "Order exceeds maximum allowed weight of 200 lbs" |
| Amount mismatch        | "Payment amount does not match order total"       |
| Payment not successful | "Payment was not successful"                      |

### Developer Errors (Console)

- Payment intent creation failures
- Stripe API errors
- Database transaction errors
- Stock validation failures

---

## Maintenance & Monitoring

### Recommended Monitoring

1. **Stripe Dashboard**:

   - Monitor payment success rate
   - Track failed payments
   - Review disputes and refunds

2. **Database Queries**:

   - Orders with missing payment IDs
   - Payments without corresponding orders
   - Failed payment statuses

3. **Logging**:
   - Payment intent creation
   - Order creation success/failure
   - Stock discrepancies

### Common Issues

#### Payment Succeeded but Order Failed

- **Cause**: Database error, validation failure, or stock issue
- **Solution**: Check logs for error details, use `stripePaymentId` to identify payment
- **Recovery**: Manually create order or refund payment

#### Order Created but Payment Failed

- **Should not happen**: Payment verified before order creation
- **If occurs**: Bug in verification logic, investigate immediately

#### Duplicate Orders

- **Prevention**: Payment intent IDs are unique
- **If occurs**: Check for race conditions in transaction handling

---

## Future Enhancements

### Potential Improvements

1. **Webhook Integration**:

   - Listen to Stripe webhooks for payment events
   - Handle async payment methods (bank transfers, etc.)
   - Update order status automatically

2. **Payment Methods**:

   - Add Apple Pay / Google Pay
   - Support for international payment methods
   - Saved payment methods for returning customers

3. **Error Recovery**:

   - Retry logic for failed order creation
   - Automatic refunds for failed orders after payment
   - Customer notification system

4. **Analytics**:

   - Conversion funnel tracking
   - Abandoned cart recovery
   - Payment failure analysis

5. **Performance**:
   - Cache payment intents
   - Optimize database queries
   - Implement request debouncing

---

## Support & Troubleshooting

### Stripe Test Mode

All development uses Stripe test mode. Verify by checking:

- Keys start with `pk_test_` and `sk_test_`
- Stripe dashboard shows "TEST MODE" banner
- Only test cards work

### Common Questions

**Q: Why is the payment form not showing?**
A: Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set and total amount > 0

**Q: Payment succeeded but no order was created?**
A: Check server logs for `processCheckoutWithPayment` errors

**Q: Can users checkout without paying?**
A: No, the old checkout button was removed. Payment is now required.

**Q: What happens if payment succeeds but order creation fails?**
A: User sees error message, payment intent ID is logged for manual reconciliation

**Q: How do I refund a payment?**
A: Use Stripe dashboard or API to refund using the payment intent ID stored in `stripePaymentId`

---

## References

- [Stripe Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe Elements](https://stripe.com/docs/payments/elements)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)

---

## Version History

| Date         | Version | Changes                                   |
| ------------ | ------- | ----------------------------------------- |
| Nov 22, 2025 | 1.0     | Initial Stripe integration implementation |

---

## Contact

For questions or issues related to this integration, contact the development team or refer to the project repository.
