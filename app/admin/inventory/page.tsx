"use server";

import { Product } from "@prisma/client";
import { getActiveProducts, getInactiveProducts } from "./actions";
import AdminInventoryClient from "./admin-inventory-client";
import { requireAdmin } from "../actions";

const fixProductNumbers = (product: Product) => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    pricePerUnit: product.pricePerUnit.toNumber(),
    weightPerUnit: product.weightPerUnit.toNumber(),
    quantityOnHand: product.quantityOnHand,
    status: product.status,
    imageUrl: product.imageUrl,
  };
};

export default async function AdminInventory() {
  await requireAdmin();
  const activeProducts = await getActiveProducts();
  const inactiveProducts = await getInactiveProducts();

  return (
    <>
      <AdminInventoryClient
        activeProducts={activeProducts.map(fixProductNumbers)}
        inactiveProducts={inactiveProducts.map(fixProductNumbers)}
      />
    </>
  );
}
