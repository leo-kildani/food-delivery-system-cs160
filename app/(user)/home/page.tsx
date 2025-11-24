import { Product } from "@prisma/client";
import { CartItem, getActiveProducts, getCartId } from "./actions";
import ProductSearchGrid from "./product-search-grid";
import { getLoggedInUser } from "@/app/(user)/actions";
import { getCartItems } from "../checkout/actions";
import ChatWidget from "./ChatBot";

// Force dynamic rendering since we use cookies and database
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Check if user is logged in
  const user = await getLoggedInUser();

  // Only fetch cart data if user is logged in
  // If user is not logged in, cart and cartId will be null
  const cartItems: CartItem[] | null = user ? await getCartItems() : null;
  const cartId: number | null = user ? await getCartId() : null;

  const products: Product[] = await getActiveProducts();
  // serialize products to pass to client components
  const serializedProducts = products.map((p) => ({
    ...p,
    pricePerUnit: p.pricePerUnit.toNumber(),
    weightPerUnit: p.weightPerUnit.toNumber(),
  }));
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {/* Search + grid rendering moved to a client component */}
      {/* cart and cartId will be null if user is not logged in */}
      <ProductSearchGrid
        products={serializedProducts}
        cart={cartItems}
        cartId={cartId}
      />
      <ChatWidget />
    </div>
  );
}
