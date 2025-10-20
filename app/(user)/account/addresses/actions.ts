"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { DeliveryAddress, Prisma, User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import z from "zod";

const DeliveryAddressSchema = z.object({
  streetAddress: z.string().trim().min(1, "Street Address required"),
  aptNumber: z.string().optional(),
  city: z.string().trim().min(1, "City is required"),
  stateCode: z.enum(["CA"], { error: "Only delivery in california allowed" }),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Invalid US Postal Code"),
});

export async function getUserDeliveryAddresses(
  userId: string
): Promise<DeliveryAddress[]> {
  const addresses = await prisma.deliveryAddress.findMany({
    where: { userId: userId },
  });
  return addresses;
}

export async function getLoggedInUser(): Promise<User> {
  const supabase = await createClient();
  const authuser = await supabase.auth.getUser();
  const user = await prisma.user.findUnique({
    where: { authId: authuser.data.user?.id },
  });
  if (!user) {
    throw Error("User not found");
  }
  return user;
}

// Server Actions
export type DeliveryAddressState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function addAddressAction(
  _prevState: DeliveryAddressState,
  formData: FormData
): Promise<DeliveryAddressState> {
  const userId = formData.get("userId");
  const input = {
    streetAddress: formData.get("streetAddress"),
    aptNumber: formData.get("aptNumber"),
    city: formData.get("city"),
    stateCode: formData.get("stateCode"),
    postalCode: formData.get("postalCode"),
  };

  const parsed = DeliveryAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  let address: Prisma.DeliveryAddressCreateInput;
  address = {
    street: parsed.data.streetAddress,
    aptNumber: parsed.data.aptNumber,
    city: parsed.data.city,
    stateCode: parsed.data.stateCode,
    postalCode: parsed.data.postalCode,
    user: {
      connect: {
        id: userId?.toString(),
      },
    },
  };

  try {
    await prisma.deliveryAddress.create({
      data: address,
    });
  } catch (e) {
    console.log(e);
    return { formError: "Error creating address" };
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddressAction(
  _prevState: DeliveryAddressState,
  formData: FormData,
  addressId: number
): Promise<DeliveryAddressState> {
  try {
    await prisma.deliveryAddress.delete({
      where: {
        id: addressId,
      },
    });
  } catch (e) {
    return { formError: "Error Deleting Address" };
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}
