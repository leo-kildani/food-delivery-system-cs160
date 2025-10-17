"use server";

import { getProducts } from "./actions";

export default async function HomePage() {
  const products = await getProducts();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {products.map((product) => (
        <div key={product.id} className="border rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-2">{product.description}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Price:</span> $
              {product.pricePerUnit.toNumber()}
            </p>
            <p className="text-sm">
              <span className="font-medium">Weight:</span>{" "}
              {product.weightPerUnit.toNumber()}
            </p>
            <p className="text-sm">
              <span className="font-medium">Quantity:</span>{" "}
              {product.quantityOnHand}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
