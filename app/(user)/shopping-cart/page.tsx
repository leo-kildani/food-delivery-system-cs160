import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCartItems, removeCartItem } from "./actions";
import { getProducts } from "../home/actions";

export default async function ShoppingCartPage() {
  const cartItems = await getCartItems();
  const products = await getProducts();
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
            const p = products.find(product => product.id === cartItem.productId);
            const price = p.pricePerUnit.toNumber();
            const weight = p.weightPerUnit.toNumber();
            const subtotal = price * cartItem.quantity;

            return (
              <div key={cartItem.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-semibold">{p.name}</h3>
                    {p.description && (
                      <p className="mb-2 text-sm text-gray-600">{p.description}</p>
                    )}

                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Category:</span> {p.category}
                      </p>
                      <p>
                        <span className="font-medium">Price per unit:</span> ${price.toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium">Weight per unit:</span> {weight.toFixed(3)} lbs
                      </p>
                      <p>
                        <span className="font-medium">Quantity:</span> {cartItem.quantity}
                      </p>
                      <p className="text-base font-semibold">
                        Subtotal: ${subtotal.toFixed(2)}
                      </p>
                    </div>
                    <form action={removeCartItem.bind(null, cartItem.id)}>
                    <Button type="submit" variant="destructive" size="sm">
                      Remove
                    </Button>
                  </form>
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