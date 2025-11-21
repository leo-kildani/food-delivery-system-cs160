"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Loader2 } from "lucide-react";
import {
  removeCartItem,
  updateCartItemQuantity,
  SerializedCartItem,
} from "./actions";
import { useRouter } from "next/navigation";

interface ShoppingCartClientProps {
  initialCartItems: SerializedCartItem[];
}

export default function ShoppingCartClient({
  initialCartItems,
}: ShoppingCartClientProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [isPending, startTransition] = useTransition();
  const [pendingActions, setPendingActions] = useState<Set<number>>(new Set());
  const [modifiedQuantities, setModifiedQuantities] = useState<
    Map<number, number>
  >(new Map());

  const handleQuantityChange = useCallback(
    (cartItemId: number, newQuantity: number) => {
      if (newQuantity < 1) return;

      // Clamp to product's quantityOnHand
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id !== cartItemId) return item;
          const max = item.product ? Number(item.product.quantityOnHand) : Infinity;
          const clamped = Math.min(max, newQuantity);
          return { ...item, quantity: clamped };
        })
      );

      // Track that this item has been modified
      setModifiedQuantities((prev) => {
        const next = new Map(prev);
        next.set(cartItemId, newQuantity);
        return next;
      });
    },
    []
  );

  const handleSaveQuantity = useCallback(
    (cartItemId: number, newQuantity: number) => {
      setPendingActions((prev) => new Set(prev).add(cartItemId));

      startTransition(async () => {
        await updateCartItemQuantity(cartItemId, newQuantity);

        // Remove from modified quantities after saving
        setModifiedQuantities((prev) => {
          const next = new Map(prev);
          next.delete(cartItemId);
          return next;
        });

        setPendingActions((prev) => {
          const next = new Set(prev);
          next.delete(cartItemId);
          return next;
        });

        router.refresh();
      });
    },
    [router]
  );

  const handleRemove = useCallback(
    (cartItemId: number) => {
      // Optimistic removal
      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));

      setPendingActions((prev) => new Set(prev).add(cartItemId));

      startTransition(async () => {
        await removeCartItem(cartItemId);
        setPendingActions((prev) => {
          const next = new Set(prev);
          next.delete(cartItemId);
          return next;
        });
        router.refresh();
      });
    },
    [router]
  );

  // Calculate total cost, total weight 
  let totalCartCost = 0;
  let totalCartWeight = 0;
  let itemCount = 0;
  cartItems.forEach((cartItem) => {
    itemCount++;
    const price = cartItem.product.pricePerUnit;
    totalCartCost += price * cartItem.quantity;
    totalCartWeight += cartItem.product.weightPerUnit * cartItem.quantity;
  });

  // 2 decimal places for totalWeight
  let totalCartWeight2Digits = totalCartWeight.toFixed(2);

  // Calculate delivery fee and overweight condition
  let deliveryFee = 0;
  if (totalCartWeight > 20) {
    deliveryFee = 10;
    totalCartCost += 10;
  }
  const overweight = totalCartWeight > 200;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>

        <div className="flex gap-6">
          {/* Cart Items - Left side */}
          <div className="flex-1 space-y-4">
            {cartItems.map((cartItem) => {
              const p = cartItem.product;
              const price = p.pricePerUnit;
              const subtotal = price * cartItem.quantity;
              const subWeight = cartItem.product.weightPerUnit * cartItem.quantity;
              const subWeight2Digits = subWeight.toFixed(2);
              const isActionPending = pendingActions.has(cartItem.id);
              const hasUnsavedChanges = modifiedQuantities.has(cartItem.id);

              return (
                <div
                  key={cartItem.id}
                  className={`rounded-lg border bg-white p-4 shadow-sm relative transition-opacity ${
                    isActionPending ? "opacity-60" : ""
                  }`}
                >
                  {/* Remove Button - Top Right */}
                  <button
                    onClick={() => handleRemove(cartItem.id)}
                    disabled={isActionPending}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
                    aria-label="Remove item"
                  >
                    {isActionPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Remove
                  </button>
                  <div className="flex items-start gap-4 pr-12">
                  {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <span className="text-sm">No image</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg font-semibold">{p.name}</h3>
                      {p.description && (
                        <p className="mb-2 text-sm text-gray-600">
                          {p.description}
                        </p>
                      )}

                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Category:</span>{" "}
                          {p.category}
                        </p>
                        <p>
                          <span className="font-medium">Weight:</span>{" "}
                          {subWeight2Digits}
                        </p>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 py-2">
                          <span className="font-medium">Quantity:</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() =>
                                  handleQuantityChange(
                                    cartItem.id,
                                    cartItem.quantity - 1
                                  )
                                }
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={cartItem.quantity <= 1 || isActionPending}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>

                              <span className="w-12 text-center font-semibold">
                                {cartItem.quantity}
                              </span>

                              <Button
                                onClick={() =>
                                  handleQuantityChange(
                                    cartItem.id,
                                    cartItem.quantity + 1
                                  )
                                }
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={
                                  isActionPending ||
                                  cartItem.quantity >=
                                    (cartItem.product
                                      ? Number(cartItem.product.quantityOnHand)
                                      : Infinity)
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Save Button - Only shows when quantity is modified */}
                            {hasUnsavedChanges && (
                              <Button
                                onClick={() =>
                                  handleSaveQuantity(
                                    cartItem.id,
                                    cartItem.quantity
                                  )
                                }
                                disabled={isActionPending}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isActionPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            )}
                            <div className="text-xs text-gray-500">
                              {`Only ${cartItem.product.quantityOnHand} in stock`}
                            </div>
                          </div>
                        </div>

                        <p className="text-base font-semibold">
                          ${subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary - Right side sticky */}
          <div className="w-80 shrink-0">
            <div className="sticky top-8 rounded-lg border bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold">Cart Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Items:</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Weight:</span>
                  <span>{totalCartWeight2Digits}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee: 
                    <br></br>
                    <p className="text-[13px] text-gray-400 italic">A cart weight over 20lbs will have a $10 delievery fee.</p>
                    </span>
                  <span>${deliveryFee}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">Subtotal:</span>
                  <span className="font-bold text-green-600">
                    ${totalCartCost.toFixed(2)}
                  </span>
                </div>
              </div>
              {modifiedQuantities.size > 0 && (
                <div className="mt-4 rounded-md bg-yellow-50 border border-yellow-200 p-3">
                  <p className="text-sm text-yellow-800">
                    You have unsaved changes. Click Save to update quantities.
                  </p>
                </div>
              )}
              {overweight && (
                <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">
                    Cart exceeds the maximum allowed weight of 200 lbs and you
                    cannot proceed to checkout. Please remove some items.
                  </p>
                </div>
              )}
              <div className="mt-6">
                <Button
                  asChild
                  className="w-full"
                  disabled={isPending || modifiedQuantities.size > 0 || overweight}
                >
                <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
