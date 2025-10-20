"use server";

import prisma from "@/lib/prisma";

export interface ProductWithNumbers {
  id: number;
  name: string;
  description: string;
  category: string;
  pricePerUnit: number;
  weightPerUnit: number;
  quantityOnHand: number;
  imageUrl: string | null;
}

export async function getProducts(): Promise<ProductWithNumbers[]> {
  const products = await prisma.product.findMany();
  
  return products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    pricePerUnit: product.pricePerUnit.toNumber(),
    weightPerUnit: product.weightPerUnit.toNumber(),
    quantityOnHand: product.quantityOnHand,
    imageUrl: product.imageUrl
  }));
}
