"use server";

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
