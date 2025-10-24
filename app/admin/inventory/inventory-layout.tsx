"use server";

import { Switch } from "@/components/ui/switch";
import { getActiveProducts } from "./actions";
import AddProductButton from "./add-product-button";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Label } from "@/components/ui/label";

export default async function AdminInventoryLayout() {
  const products = await getActiveProducts();

  return (
    <div className="">
      <div className="container mx-auto py-10">
        <div className="flex justify-end gap-x-5">
          <div className="flex items-center space-x-2">
            <Switch id="show-inactive" />
            <Label htmlFor="show-inactive">Show Inactive Items</Label>
          </div>

          <AddProductButton />
        </div>
        <div className="py-3">
          <DataTable
            columns={columns}
            data={products.map((product) => {
              return {
                id: product.id,
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
