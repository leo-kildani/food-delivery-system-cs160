import { getCartItems } from "./actions";
import { getProducts } from "../home/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ShoppingCartClient from "./cart-client";

export default async function ShoppingCartPage() {
  const cartItems = await getCartItems();
  const products = await getProducts();
  
  // EMPTY CART
  if (!cartItems || cartItems.length === 0) {
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

  // Serialize Decimal fields to numbers for client component
  const serializedProducts = products.map(p => ({
    ...p,
    pricePerUnit: p.pricePerUnit.toNumber(),
    weightPerUnit: p.weightPerUnit.toNumber(),
  }));

  return <ShoppingCartClient initialCartItems={cartItems} products={serializedProducts} />;
}