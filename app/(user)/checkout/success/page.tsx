import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-8">
          Thank you for your order. Your payment has been processed successfully.
          You will receive a confirmation email shortly.
        </p>

        <div className="space-y-3">
          <Link href="/account/orders" className="block">
            <Button className="w-full" size="lg">
              View My Orders
            </Button>
          </Link>
          
          <Link href="/home" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
