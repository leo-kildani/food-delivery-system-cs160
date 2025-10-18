import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { getCartItems, removeCartItem, updateCartItemQuantity } from "./actions";
import { getProducts } from "../home/actions";

export default async function ShoppingCartPage() {
  const cartItems = await getCartItems();
  const products = await getProducts();
  
  //EMPTY CART
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

  //TOTAL CART COST
  let totalCartCost = 0;
  let itemCount = 0;
  cartItems.forEach((cartItem) => {
    const p = products.find((product) => product.id === cartItem.productId);
    if (p) {
      itemCount++;
      const price = p.pricePerUnit.toNumber();
      totalCartCost += price * cartItem.quantity;
    }
  });

  //CART WITH ITEMS
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
              const price = p.pricePerUnit.toNumber();
              const subtotal = price * cartItem.quantity;

              return (
                <div
                  key={cartItem.id}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
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
                            <form action={updateCartItemQuantity.bind(null, cartItem.id, cartItem.quantity - 1)}>
                              <Button 
                                type="submit" 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                disabled={cartItem.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </form>
                            
                            <span className="w-12 text-center font-semibold">
                              {cartItem.quantity}
                            </span>
                            
                            <form action={updateCartItemQuantity.bind(null, cartItem.id, cartItem.quantity + 1)}>
                              <Button 
                                type="submit" 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        </div>
                        
                        <p className="text-base font-semibold">
                          ${subtotal.toFixed(2)}
                        </p>
                      </div>
                      
                      <form action={removeCartItem.bind(null, cartItem.id)} className="mt-3">
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
                <Button asChild className="w-full">
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