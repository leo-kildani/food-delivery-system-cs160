"use client";

import { Button } from "@/components/ui/button";
import { logoutAction, LogoutState } from "./actions";
import { useActionState } from "react";

export default function LogoutButton() {
  const [logoutState, logoutFormAction, logoutIsPending] = useActionState(
    logoutAction,
    {} as LogoutState
  );

  return (
    <form action={logoutFormAction}>
      <Button 
        disabled={logoutIsPending}
        variant="outline"
        className="cursor-pointer bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200"
      >
        {logoutIsPending ? "Logging Out..." : "Log Out"}
      </Button>
    </form>
  );
}
