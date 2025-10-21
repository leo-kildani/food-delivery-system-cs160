"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import z from "zod";

const UserDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
});

export async function getLoggedInUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const authuser = await supabase.auth.getUser();

    if (!authuser.data.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { authId: authuser.data.user.id },
    });

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export type UserDetailsState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateUserDetailsAction(
  _prevState: UserDetailsState,
  formData: FormData
): Promise<UserDetailsState> {
  try {
    const user = await getLoggedInUser();

    if (!user) {
      return {
        ok: false,
        formError: "User not authenticated",
      };
    }

    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
    };

    const validation = UserDetailsSchema.safeParse(data);

    if (!validation.success) {
      return {
        ok: false,
        fieldErrors: z.flattenError(validation.error).fieldErrors,
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
      },
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    return {
      ok: false,
      formError: "Failed to update user details. Please try again.",
    };
  }
  revalidatePath("/account/details");

  return {
    ok: true,
  };
}
