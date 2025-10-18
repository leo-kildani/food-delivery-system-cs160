"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Loader2 } from "lucide-react";
import { removeCartItem, updateCartItemQuantity, CartItemWithProduct } from "./actions";
import { Product } from "@prisma/client";
import { useRouter } from "next/navigation";

// Create a serialized product type
type SerializedProduct = Omit<Product, 'pricePerUnit' | 'weightPerUnit'> & {
  pricePerUnit: number;
  weightPerUnit: number;
};

type Props = {
  initialCartItems: CartItemWithProduct[];
  products: SerializedProduct[];
};

export default function ShoppingCartClient({ initialCartItems, products }: Props) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [isPending, startTransition] = useTransition();
  const [pendingActions, setPendingActions] = useState<Set<number>>(new Set());

  // Debounce timer for quantity updates
  const [updateTimers, setUpdateTimers] = useState<Map<number, NodeJS.Timeout>>(new Map());

  const handleQuantityChange = useCallback((cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Optimistic update
    setCartItems(prev =>
      prev.map(item =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );

    // Clear existing timer for this item
    const existingTimer = updateTimers.get(cartItemId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = setTimeout(() => {
      setPendingActions(prev => new Set(prev).add(cartItemId));
      
      startTransition(async () => {
        await updateCartItemQuantity(cartItemId, newQuantity);
        setPendingActions(prev => {
          const next = new Set(prev);
          next.delete(cartItemId);
          return next;
        });
        router.refresh();
      });
      
      setUpdateTimers(prev => {
        const next = new Map(prev);
        next.delete(cartItemId);
        return next;
      });
    }, 500); // 500ms debounce

    setUpdateTimers(prev => new Map(prev).set(cartItemId, timer));
  }, [updateTimers, router]);

  const handleRemove = useCallback((cartItemId: number) => {
    // Optimistic removal
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    
    setPendingActions(prev => new Set(prev).add(cartItemId));
    
    startTransition(async () => {
      await removeCartItem(cartItemId);
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
      router.refresh();
    });
  }, [router]);

  // Calculate totals from optimistic state
  let totalCartCost = 0;
  let itemCount = 0;
  cartItems.forEach((cartItem) => {
    const p = products.find((product) => product.id === cartItem.productId);
    if (p) {
      itemCount++;
      const price = p.pricePerUnit; // Already a number now
      totalCartCost += price * cartItem.quantity;
    }
  });

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>

        <div className="flex gap-6">
          {/* Cart Items - Left side */}
          <div className="flex-1 space-y-4">
            {cartItems.map((cartItem) => {
              const p = products.find(
                (product) => product.id === cartItem.productId
              );
              if (!p) return null;
              
              const price = p.pricePerUnit; // Already a number
              const subtotal = price * cartItem.quantity;
              const isActionPending = pendingActions.has(cartItem.id);

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
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white p-2 rounded-md transition-colors flex items-center justify-center gap-2"
                    aria-label="Remove item"
                  >
                    {isActionPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Remove
                  </button>

                  <div className="flex items-start gap-4 pr-12">
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
                        
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 py-2">
                          <span className="font-medium">Quantity:</span>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleQuantityChange(cartItem.id, cartItem.quantity - 1)}
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
                              onClick={() => handleQuantityChange(cartItem.id, cartItem.quantity + 1)}
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isActionPending}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
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
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">Subtotal:</span>
                  <span className="font-bold text-green-600">
                    ${totalCartCost.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <Button asChild className="w-full" disabled={isPending}>
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