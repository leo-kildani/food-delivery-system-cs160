"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { DeliveryAddress, Prisma, User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import z from "zod";

export type ParsedAddress = {
  address: string;
  city: string;
  stateZip: string;
  country: string;
};

export async function parseAddress(
  address: string
): Promise<ParsedAddress | undefined> {
  // ^(.*)      - Group 1: Captures the full address part at the start.
  // , ([^,]+)  - Group 2: Captures the City (any character except a comma).
  // , CA       - Matches the literal ", CA ".
  // (\d{5})    - Group 3: Captures the 5-digit postal code.
  // , USA$     - Matches the literal ", USA" at the end of the string.
  const regex = /^(.*), ([^,]+), CA (\d{5}), USA$/;

  const match = address.match(regex);

  if (match) {
    // match[0] is the full matched string
    // match[1] is the Address
    // match[2] is the City
    // match[3] is the Postal Code

    return {
      address: match[1].trim(),
      city: match[2].trim(),
      stateZip: `CA ${match[3]}`,
      country: "USA",
    };
  } else {
    console.error("Address pattern not matched:", address);
    return undefined; // Explicitly return undefined
  }
}

const DeliveryAddressSchema = z.object({
  address: z
    .string()
    .min(1, "Delivery Address Required")
    .regex(
      /CA \d{5}, USA$/,
      "Invalid Address. Please select from the dropdown."
    ),
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
    address: formData.get("address"),
  };

  const parsed = DeliveryAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  let address: Prisma.DeliveryAddressCreateInput;
  address = {
    address: parsed.data.address,
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
  revalidatePath("/dashboard/addresses");
  return { ok: true };
}
