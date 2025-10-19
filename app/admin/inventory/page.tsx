"use server";

import { getProducts } from "./actions";
import AddProductButton from "./add-product-button";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export default async function AdminInventory() {
  const products = await getProducts();

  return (
    <div className="">
      <div className="container mx-auto py-10">
        <div className="flex justify-end">
          <AddProductButton />
        </div>
        <div className="py-3">
          <DataTable
            columns={columns}
            data={products.map((product) => {
              return {
                name: product.name,
                description: product.description,
                category: product.category,
                pricePerUnit: product.pricePerUnit.toNumber(),
                weightPerUnit: product.weightPerUnit.toNumber(),
                quantityOnHand: product.quantityOnHand,
              };
            })}
          />
        </div>
      </div>
    </div>
  );
}
