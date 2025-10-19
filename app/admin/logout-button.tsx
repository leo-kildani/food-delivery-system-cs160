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
      <Button disabled={logoutIsPending}>
        {logoutIsPending ? "Logging Out..." : "Log Out"}
      </Button>
    </form>
  );
}
