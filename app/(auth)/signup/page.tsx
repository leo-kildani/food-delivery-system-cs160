"use client";

import { Input } from "@/components/ui/input";
import { useActionState, useEffect, useRef, useState } from "react";
import { signUpAction, SignUpState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { setOptions } from "@googlemaps/js-api-loader";
import { RADIUS_METERS, STORE_LOCATION } from "@/lib/constants";

export default function SignUpForm() {
  const [signUpState, signUpFormAction, signUpIsPending] = useActionState(
    signUpAction,
    {} as SignUpState
  );

  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteInitialized = useRef(false);
  const [autocompleteError, setAutocompleteError] = useState("");

  // Init google maps api once
  useEffect(() => {
    if (!autocompleteInitialized.current) {
      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        v: "weekly",
      });
      autocompleteInitialized.current = true;
    }
  }, []);

  // Initialize Google Maps once
  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        // @ts-ignore
        const [{ Circle }, { PlaceAutocompleteElement }, { spherical }] =
          await Promise.all([
            google.maps.importLibrary("maps"),
            google.maps.importLibrary("places"),
            google.maps.importLibrary("geometry"),
          ]);

        if (autocompleteContainerRef.current) {
          // Clear any existing autocomplete widgets
          autocompleteContainerRef.current.innerHTML = "";

          const circle = new Circle({
            center: STORE_LOCATION,
            radius: RADIUS_METERS,
          });

          // @ts-ignore
          const placeAutocomplete =
            new google.maps.places.PlaceAutocompleteElement({
              componentRestrictions: { country: "us" },
              locationRestriction: circle.getBounds(),
              // @ts-ignore
              includedPrimaryTypes: ["street_address"],
            });

          placeAutocomplete.style.width = "100%";
          autocompleteContainerRef.current.appendChild(placeAutocomplete);

          // Handle address select
          placeAutocomplete.addEventListener(
            "gmp-select",
            // @ts-ignore
            async ({ placePrediction }) => {
              const place = placePrediction.toPlace();
              await place.fetchFields({
                fields: ["formattedAddress", "location"],
              });

              if (!place.location) {
                setAutocompleteError(
                  "Please select a valid address from the dropdown"
                );
                setSelectedAddress("");
                return;
              }

              // check if address within radius
              const distance = spherical.computeDistanceBetween(
                place.location,
                STORE_LOCATION
              );

              if (distance > RADIUS_METERS) {
                setAutocompleteError("Delivery address unreachable");
                setSelectedAddress("");
                // @ts-ignore
                placeAutocomplete.value = "";
                return;
              }

              // Address is valid and within radius
              setAutocompleteError("");
              setSelectedAddress(place.formattedAddress);
            }
          );

          // Anytime input is deleted or changed from selected, disable saving
          placeAutocomplete.addEventListener("input", () => {
            setSelectedAddress("");
            setAutocompleteError("");
          });
        }
      } catch (e) {
        console.log(e);
        setAutocompleteError("Error loading Address Form");
      }
    };
    initAutocomplete();

    // Cleanup function to remove the autocomplete widget when component unmounts
    return () => {
      if (autocompleteContainerRef.current) {
        autocompleteContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 py-12 font-[Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-xl">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Sign Up
          </h1>
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
                  <Label
                    htmlFor="firstName"
                    className="text-xs font-medium text-blue-700"
                  >
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
                  <Label
                    htmlFor="lastName"
                    className="text-xs font-medium text-blue-700"
                  >
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
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-blue-700"
                >
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
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium text-blue-700"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
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
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-medium text-blue-700"
                  >
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
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
                <h3 className="text-sm font-semibold text-blue-700 mb-2">
                  Delivery Address
                </h3>
              </div>

              {/* Google Maps Autocomplete */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="address"
                  className="text-xs font-medium text-blue-700"
                >
                  Address
                </Label>
                <div ref={autocompleteContainerRef} />
                {autocompleteError && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {autocompleteError}
                  </p>
                )}
                {signUpState.fieldErrors?.address && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
                    {signUpState.fieldErrors.address.join(", ")}
                  </p>
                )}
              </div>
              <Input type="hidden" name="address" value={selectedAddress} />

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
