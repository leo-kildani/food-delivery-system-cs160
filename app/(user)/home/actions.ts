"use server";

import prisma from "@/lib/prisma";
import { Product } from "@prisma/client";

export async function getProducts(): Promise<Product[]> {
  return await prisma.product.findMany();
}
