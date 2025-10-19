"use server";

import prisma from "@/lib/prisma";
import { $Enums, Product } from "@prisma/client";
import z from "zod";

export async function getProducts(): Promise<Product[]> {
  return await prisma.product.findMany();
}

const AddProductSchema = z.object({
  name: z.string().min(1, "Product Name is Required"),
  description: z.string().min(1, "Product Description is Required"),
  category: z.enum($Enums.ProductCategory, {
    error: "This shouldn't be possible?",
  }),
  pricePerUnit: z
    .string()
    .regex(/^(0|[1-9]\d*)\.\d{2}$/, {
      message: "Must be a number with exactly 2 decimal places",
    })
    .transform(Number),
  weightPerUnit: z
    .string()
    .regex(/^(0|[1-9]\d*)\.\d{2}$/, {
      message: "Must be a number with exactly 3 decimal places",
    })
    .transform(Number),
  quantityOnHand: z.coerce.number().int({ error: "Must be an integer" }),
});

export type AddProductState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function addProductAction(
  _prevState: AddProductState,
  formData: FormData
): Promise<AddProductState> {
  const input = {
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    pricePerUnit: formData.get("pricePerUnit"),
    weightPerUnit: formData.get("weightPerUnit"),
    quantityOnHand: formData.get("quantityOnHand"),
  };
  console.log(input);

  const parsed = AddProductSchema.safeParse(input);
  // fields are valid check
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const parsedData = parsed.data;

  // add product to database with supabase
  try {
    await prisma.product.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        category: parsedData.category,
        pricePerUnit: parsedData.pricePerUnit,
        weightPerUnit: parsedData.weightPerUnit,
        quantityOnHand: parsedData.quantityOnHand,
      },
    });
  } catch (e) {
    console.log(e);
    return { formError: "Error creating item" };
  }
  return { ok: true };
}
