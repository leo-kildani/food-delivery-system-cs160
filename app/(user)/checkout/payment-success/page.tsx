"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const pi = searchParams.get("payment_intent");
    const oid = searchParams.get("order_id");
    setPaymentIntent(pi);
    setOrderId(oid);
  }, [searchParams]);

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-2">
          Thank you for your order. Your payment has been processed
          successfully.
        </p>

        {orderId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-xl font-semibold text-blue-900">#{orderId}</p>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-8">
          You will receive an email confirmation shortly. You can track your
          order in your account.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/account/orders"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
          >
            View My Orders
          </Link>
          <Link
            href="/home"
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
