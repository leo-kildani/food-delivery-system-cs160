"use client";

import { Input } from "@/components/ui/input";
import { useActionState, useState } from "react";
import { loginAction, LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ChevronRight, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const initialState: LoginState = {
    ok: false,
    formError: undefined,
    fieldErrors: {},
    values: {},
  };

  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAction,
    {} as LoginState
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-[Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-900">
            On-Demand Food Delivery Service
          </h1>
          <p className="text-blue-700 mt-4 text-xl">
            Sign in to shop for your food products
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-none shadow-2xl bg-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center text-blue-800">
              Sign In
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form action={loginFormAction} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-blue-800"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  defaultValue={loginState.values?.email ?? ""}
                  className="h-11 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white"
                />
                {loginState.fieldErrors?.email && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {loginState.fieldErrors.email.join(", ")}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-blue-800"
                  >
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {loginState.fieldErrors?.password && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {loginState.fieldErrors.password.join(", ")}
                  </p>
                )}
                {loginState.formError && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {loginState.formError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loginPending}
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {loginPending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Logging In...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Log In
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-blue-100 pt-6">
            <div className="text-center text-sm text-blue-700">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
              >
                Sign Up
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
