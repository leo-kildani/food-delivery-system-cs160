"use client";

import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { signUpAction, SignUpState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SignUpForm() {
  const [signUpState, signUpFormAction, signUpIsPending] = useActionState(
    signUpAction,
    {} as SignUpState
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 py-12 font-[Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-xl">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Sign Up</h1>
        </div>

        {/* Sign Up Card */}
        <Card className="border border-blue-200 shadow-xl bg-white">
          <CardContent className="px-4 py-4">
            {signUpState.formError && (
              <Alert className="mb-3 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">
                  {signUpState.formError}
                </AlertDescription>
              </Alert>
            )}

            <form action={signUpFormAction} className="space-y-3">
              {/* Name Fields - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-medium text-blue-700">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="First Name"
                    type="text"
                    required
                    className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                  />
                  {signUpState.fieldErrors?.firstName && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                      {signUpState.fieldErrors.firstName.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-medium text-blue-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Last Name"
                    type="text"
                    required
                    className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                  />
                  {signUpState.fieldErrors?.lastName && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                      {signUpState.fieldErrors.lastName.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-blue-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  required
                  className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                />
                {signUpState.fieldErrors?.email && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {signUpState.fieldErrors.email.join(", ")}
                  </p>
                )}
              </div>

              {/* Password Fields - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-blue-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                  />
                  {signUpState.fieldErrors?.password && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                      {signUpState.fieldErrors.password.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-blue-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                  />
                  {signUpState.fieldErrors?.confirmPassword && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                      {signUpState.fieldErrors.confirmPassword.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Section Header */}
              <div className="pt-1.5">
                <h3 className="text-sm font-semibold text-blue-700 mb-2">Delivery Address</h3>
              </div>

              {/* Street Address */}
              <div className="space-y-1.5">
                <Label htmlFor="streetAddress" className="text-xs font-medium text-blue-700">
                  Street Address
                </Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  placeholder="123 Main St"
                  type="text"
                  required
                  className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                />
                {signUpState.fieldErrors?.streetAddress && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {signUpState.fieldErrors.streetAddress.join(", ")}
                  </p>
                )}
              </div>

              {/* Apartment Number */}
              <div className="space-y-1.5">
                <Label htmlFor="aptNumber" className="text-xs font-medium text-blue-700">
                  Apartment Number <span className="text-gray-500 text-xs">(Optional)</span>
                </Label>
                <Input
                  id="aptNumber"
                  name="aptNumber"
                  placeholder=""
                  type="text"
                  className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                />
                {signUpState.fieldErrors?.aptNumber && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {signUpState.fieldErrors.aptNumber.join(", ")}
                  </p>
                )}
              </div>

              {/* City, State, Postal - Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="city" className="text-xs font-medium text-blue-700">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="San Jose"
                    type="text"
                    required
                    className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                  />
                  {signUpState.fieldErrors?.city && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                      {signUpState.fieldErrors.city.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stateCode" className="text-xs font-medium text-blue-700">
                    State
                  </Label>
                  <Input
                    id="stateCode"
                    name="stateCode"
                    placeholder="CA"
                    type="text"
                    required
                    className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                  />
                  {signUpState.fieldErrors?.stateCode && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                      {signUpState.fieldErrors.stateCode.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="postalCode" className="text-xs font-medium text-blue-700">
                    Zip Code
                  </Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="94102"
                    type="text"
                    required
                    className="h-9 border-blue-200 focus:border-blue-600 focus:ring-blue-500 bg-white text-sm"
                  />
                  {signUpState.fieldErrors?.postalCode && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                      {signUpState.fieldErrors.postalCode.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={signUpIsPending}
                className="w-full h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 mt-4 text-sm"
              >
                {signUpIsPending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Signing Up...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-blue-200 pt-6 pb-6">
            <div className="text-center text-base text-blue-600">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="font-semibold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center gap-1"
              >
                Log In
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </Link>
            </div>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}