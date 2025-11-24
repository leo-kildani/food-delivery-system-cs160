"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { convertToSubcurrency } from "@/lib/utils";
import StripeComponent from "./stripeComponent";

if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === undefined) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not defined.");
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

type StripePaymentProps = {
  totalAmount: number;
  selectedItemsData: any[];
  quantities: Record<number, number>;
  selectedAddressId: number | null;
  disabled?: boolean;
};

export default function StripePayment({
  totalAmount,
  selectedItemsData,
  quantities,
  selectedAddressId,
  disabled = false,
}: StripePaymentProps) {
  return (
    <div>
      <Elements
        stripe={stripePromise}
        options={{
          mode: "payment",
          amount: convertToSubcurrency(totalAmount),
          currency: "usd",
        }}
      >
        <StripeComponent
          totalAmount={totalAmount}
          selectedItemsData={selectedItemsData}
          quantities={quantities}
          selectedAddressId={selectedAddressId}
          disabled={disabled}
        />
      </Elements>
    </div>
  );
}
