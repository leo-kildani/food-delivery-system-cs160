"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";


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

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: authUser.id }, // you already store authId when signing up
  });

  // If auth user exists but DB user missing, log them out for safety
  if (!dbUser) {
    await supabase.auth.signOut();
    return null;
  }

  return dbUser; // includes role: "USER" | "ADMIN"
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  // Not logged in
  if (!user) {
    redirect("/login");
  }

  // Logged in but not admin
  if (user.role !== "ADMIN") {
    redirect("/home"); // or "/not-authorized"
  }

  // ✅ Admin user
  return user;
}