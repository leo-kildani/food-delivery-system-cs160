"use client";

import { useState } from "react";
import AddProductButton from "./components/add-product-button";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { Switch } from "@/components/ui/switch";
import { $Enums } from "@prisma/client";

type ProductProp = {
  id: number;
  name: string;
  description: string;
  category: $Enums.ProductCategory;
  pricePerUnit: number;
  weightPerUnit: number;
  quantityOnHand: number;
  status: $Enums.ProductStatus;
};

export default function AdminInventoryClient({
  activeProducts,
  inactiveProducts,
}: {
  activeProducts: ProductProp[];
  inactiveProducts: ProductProp[];
}) {
  const [showInactive, setShowInactive] = useState(false);

  // Filter products based on switch
  const filteredProducts = showInactive ? inactiveProducts : activeProducts;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-end gap-x-5">
        <div className="flex items-center space-x-2">
          <Switch
            checked={showInactive}
            onCheckedChange={setShowInactive}
            id="show-inactive"
          />
          <label htmlFor="show-inactive">Show Archived</label>
          <AddProductButton />
        </div>
      </div>
      <div className="py-3">
        <DataTable columns={columns} data={filteredProducts} />
      </div>
    </div>
  );
}
