"use client"

import { Input } from "@/components/ui/input"
import { useActionState } from "react"
import { loginAction , LoginState} from "./actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginForm() {
  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAction,
    {} as LoginState
  );
  return (
    <div>
 <form action={loginFormAction}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            name="email"
            placeholder="name@example.com"
            type="email"
          ></Input>
          {loginState.fieldErrors?.email && (
            <div className="text-red-600 text-sm mt-1">
              {loginState.fieldErrors.email.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <Input id="password" name="password" type="password"></Input>
          {loginState.fieldErrors?.password && (
            <div className="text-red-600 text-sm mt-1">
              {loginState.fieldErrors.password.join(", ")}
            </div>
          )}
      </div>
      
      <Button type="submit" disabled={loginPending}>
          {loginPending ? "Logging In..." : "Log In"}
        </Button>
      </form>
      <Link href="/signup"> Sign Up
      </Link>
    </div>
   

  )
}