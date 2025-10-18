"use client";

import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { signUpAction, SignUpState } from "./actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpForm() {
  const [signUpState, signUpFormAction, signUpIsPending] = useActionState(
    signUpAction,
    {} as SignUpState
  );

  return (
    <div>
      {signUpState.formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {signUpState.formError}
        </div>
      )}
      <form action={signUpFormAction}>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
            First Name
          </label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="John"
            type="text"
          ></Input>
          {signUpState.fieldErrors?.firstName && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.firstName.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
            Last Name
          </label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Doe"
            type="text"
          ></Input>
          {signUpState.fieldErrors?.lastName && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.lastName.join(", ")}
            </div>
          )}
        </div>
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
          {signUpState.fieldErrors?.email && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.email.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <Input id="password" name="password" type="password"></Input>
          {signUpState.fieldErrors?.password && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.password.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
          ></Input>
          {signUpState.fieldErrors?.confirmPassword && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.confirmPassword.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="streetAddress"
            className="block text-sm font-medium mb-1"
          >
            Street Address
          </label>
          <Input id="streetAddress" name="streetAddress" type="text"></Input>
          {signUpState.fieldErrors?.streetAddress && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.streetAddress.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="aptNumber" className="block text-sm font-medium mb-1">
            Apartment Number
          </label>
          <Input id="aptNumber" name="aptNumber" type="text"></Input>
          {signUpState.fieldErrors?.aptNumber && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.aptNumber.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            City
          </label>
          <Input id="city" name="city" type="text"></Input>
          {signUpState.fieldErrors?.city && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.city.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="stateCode" className="block text-sm font-medium mb-1">
            State Code
          </label>
          <Input id="stateCode" name="stateCode" type="text"></Input>
          {signUpState.fieldErrors?.stateCode && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.stateCode.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium mb-1"
          >
            Postal Code
          </label>
          <Input id="postalCode" name="postalCode" type="number"></Input>
          {signUpState.fieldErrors?.postalCode && (
            <div className="text-red-600 text-sm mt-1">
              {signUpState.fieldErrors.postalCode.join(", ")}
            </div>
          )}
        </div>
        <Button type="submit" disabled={signUpIsPending}>
          {signUpIsPending ? "Signing Up..." : "Sign Up"}
        </Button>
      </form>
      <Link href="/login">Log In</Link>
    </div>
  );
}
