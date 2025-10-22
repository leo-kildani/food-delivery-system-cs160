import { Product } from "@prisma/client";
import { CartItem, getProducts, SerializedProduct, getCartId } from "./actions";
import { redirect } from "next/navigation";
import ProductSearchGrid from "./product-search-grid";
import { getLoggedInUser } from "@/app/(user)/actions";
import { getCartItems } from "../checkout/actions";


export default async function HomePage() {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login");
  }
  const products: Product[] = await getProducts();
  const cart_items: CartItem[] = await getCartItems();
  const cartId: number = await getCartId();
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
      <ProductSearchGrid products={serializedProducts} cart={cart_items} cartId={cartId} />
    </div>
  );
}
