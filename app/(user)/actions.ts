"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function getLoggedInUser(): Promise<User | null> {
  try {
    // Create supabase server client
    const supabase = await createClient();
    //   Get logged in user
    const authUser = await supabase.auth.getUser();

    // If no authenticated user, return null early
    if (!authUser.data.user?.id) {
      return null;
    }

    //   Retrieve user information from auth user id
    const user = await prisma.user.findUnique({
      where: {
        authId: authUser.data.user.id,
      },
    });
    return user;
  } catch (e) {
    console.error(e);
  }
  return null;
}

// SERVER ACTION
export type LogoutState = {
  ok?: boolean;
};

export async function logoutAction(
  _prevState: LogoutState,
  formData: FormData
): Promise<LogoutState> {
  // create supabase server client
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    return { ok: false };
  }
  redirect("/login");
}
