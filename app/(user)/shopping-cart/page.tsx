"use server";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCartItems } from "./actions";

// Assumes getCartItems() returns cart items with `include: { product: true }`
// and orders by `createdAt` as you set earlier.
export default async function ShoppingCartPage() {
  const cartItems = await getCartItems(); // for current user inside the action

  // Empty state
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <p className="mb-2 text-lg">Your cart is empty</p>
            <p className="mb-6 text-muted-foreground">
              Browse products and add items to your cart.
            </p>
            <Button asChild>
              <Link href="/home">Shop products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>

        <div className="space-y-4">
          {cartItems.map((cartItem) => {
            const p = cartItem.product; // related Product
            const price =
              typeof p?.pricePerUnit === "number"
                ? p.pricePerUnit
                : // handle Prisma.Decimal or undefined
                  (p?.pricePerUnit as any)?.toNumber?.() ??
                  Number(p?.pricePerUnit ?? 0);

            const weight =
              typeof p?.weightPerUnit === "number"
                ? p.weightPerUnit
                : (p?.weightPerUnit as any)?.toNumber?.() ??
                  Number(p?.weightPerUnit ?? 0);

            return (
              <div key={cartItem.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  {/* Replace with actual image if you have one on Product */}
                  <div className="h-16 w-16 rounded-md bg-gray-100" />

                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-semibold">
                      {p?.name ?? "Unnamed product"}
                    </h3>
                    {p?.description && (
                      <p className="mb-2 text-gray-600">{p.description}</p>
                    )}

                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Price:</span> ${price.toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium">Weight:</span> {weight}
                      </p>
                      <p>
                        <span className="font-medium">Quantity:</span> {cartItem.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <Button asChild>
            <Link href="/checkout">Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}