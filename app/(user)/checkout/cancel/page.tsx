import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <XCircle className="w-20 h-20 text-orange-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-8">
          Your payment was cancelled. No charges were made to your account.
          Your items are still in your cart if you'd like to try again.
        </p>

        <div className="space-y-3">
          <Link href="/checkout" className="block">
            <Button className="w-full" size="lg">
              Return to Checkout
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
