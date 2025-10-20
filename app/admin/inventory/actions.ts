"use server";

import prisma from "@/lib/prisma";
import { $Enums, Prisma, Product } from "@prisma/client";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function getProducts(): Promise<Product[]> {
  return await prisma.product.findMany();
}

export async function deleteProduct(
  productId: number
): Promise<{ success: boolean }> {
  // Delete throws an exception on failure (if record doesn't exist)
  // We expect to only be deleting objects that exist, but still important to catch
  try {
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // Failed to find a record to delete
      if (e.code === "P2025") {
        console.error(
          "admin/inventory/deleteProduct: failed to delete a product. " +
            e.message
        );
      }
      // Failed to find a record to delete
      if (e.code === "P2003") {
        console.error(
          "admin/inventory/deleteProduct: foreign key constraints. " + e.message
        );
      }
      return { success: false };
    }
    throw e; // If not the expected error something may be wrong, throw
  }
  // Updates the table after deleting item
  revalidatePath("/admin/inventory");
  return { success: true };
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
    .regex(/^(0|[1-9]\d*)\.\d{3}$/, {
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

// Add Item Dialog
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
  //console.log(input);

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
  // Updates the table after adding item
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export type EditProductState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

// Edit Item Dialog
export async function editProductAction(
  productId: number,
  _prevState: EditProductState,
  formData: FormData
): Promise<EditProductState> {
  const input = {
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    pricePerUnit: formData.get("pricePerUnit"),
    weightPerUnit: formData.get("weightPerUnit"),
    quantityOnHand: formData.get("quantityOnHand"),
  };
  //console.log(input);

  // Reuses the Add Product input handling
  const parsed = AddProductSchema.safeParse(input);
  // fields are valid check
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const parsedData = parsed.data;

  // edit product in database with supabase
  try {
    await prisma.product.update({
      where: {
        id: productId,
      },
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
    return { formError: "Error editing item" };
  }
  // Updates the table after editing item
  revalidatePath("/admin/inventory");
  return { ok: true };
}
