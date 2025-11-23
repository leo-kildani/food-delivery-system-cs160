"use client";

import { convertToSubcurrency } from "@/lib/utils";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { processCheckoutWithPayment } from "./actions";
import { useRouter } from "next/navigation";

type StripeComponentProps = {
  totalAmount: number;
  selectedItemsData: any[];
  quantities: Record<number, number>;
  selectedAddressId: number | null;
  disabled?: boolean;
};

export default function StripeComponent({
  totalAmount,
  selectedItemsData,
  quantities,
  selectedAddressId,
  disabled = false,
}: StripeComponentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    if (totalAmount <= 0) return;

    fetch("/api/checkout/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: convertToSubcurrency(totalAmount) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setErrorMessage("Failed to initialize payment");
        }
      })
      .catch((error) => {
        console.error("Error creating payment intent:", error);
        setErrorMessage("Failed to initialize payment");
      });
  }, [totalAmount]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAddressId) {
      setErrorMessage("Please select a delivery address");
      return;
    }

    if (selectedItemsData.length === 0) {
      setErrorMessage("Please select items to checkout");
      return;
    }

    setLoading(true);
    setErrorMessage(undefined);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    // Submit the payment element
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message);
      setLoading(false);
      return;
    }

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/payment-success`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    // Payment succeeded, now process the order
    if (paymentIntent && paymentIntent.status === "succeeded") {
      setProcessingOrder(true);

      const result = await processCheckoutWithPayment(
        paymentIntent.id,
        selectedItemsData,
        quantities,
        selectedAddressId,
        totalAmount
      );

      if (result.success) {
        // Redirect to success page
        router.push(
          `/checkout/payment-success?payment_intent=${paymentIntent.id}&order_id=${result.orderId}`
        );
      } else {
        setErrorMessage(result.error || "Failed to process order");
        setProcessingOrder(false);
        setLoading(false);
      }
    } else {
      setErrorMessage("Payment was not successful");
      setLoading(false);
    }
  };

  if (!clientSecret || totalAmount <= 0) {
    return (
      <div className="border-t border-gray-200 mt-6 pt-6">
        <div className="flex items-center justify-center p-8 text-gray-500">
          {totalAmount <= 0
            ? "Add items to proceed with payment"
            : "Loading payment form..."}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 mt-6 pt-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Payment Details
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <PaymentElement />
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading || processingOrder || disabled}
          className="cursor-pointer w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingOrder
            ? "Processing order..."
            : loading
            ? "Processing payment..."
            : `Pay $${totalAmount.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
