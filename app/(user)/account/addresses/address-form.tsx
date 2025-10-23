"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { addAddressAction, DeliveryAddressState } from "./actions";
import { User } from "@prisma/client";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { RADIUS_METERS, RADIUS_MILES, STORE_LOCATION } from "@/lib/constants";

interface AddressFormProps {
  user: User;
}

export function AddressForm({ user }: AddressFormProps) {
  // required local states
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [mapsError, setMapsError] = useState("");

  // save delivery address server action
  const [state, formAction, isPending] = useActionState(
    async (prevState: DeliveryAddressState, formData: FormData) => {
      const newState = await addAddressAction(prevState, formData);
      if (newState.ok) {
        setIsOpen(false);
        setSelectedAddress("");
        setMapsError("");
      }
      return newState;
    },
    {} as DeliveryAddressState
  );

  // reference Maps html elements
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const mapsInitialized = useRef(false);

  // Initialize Google Maps API options once
  useEffect(() => {
    if (!mapsInitialized.current) {
      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        v: "weekly",
      });
      mapsInitialized.current = true;
    }
  }, []);

  // retrieve Google Maps HTML elements on re-renders
  useEffect(() => {
    if (!isOpen) return;

    const initMaps = async () => {
      try {
        const { Map } = await importLibrary("maps");
        const { AdvancedMarkerElement } = await importLibrary("marker");

        // Initialize map - recreate each time since DOM element is remounted
        if (mapRef.current) {
          const map = new Map(mapRef.current, {
            center: STORE_LOCATION,
            zoom: 10,
            mapId: "ADDR",
          });

          // Add store marker
          new AdvancedMarkerElement({
            map,
            position: STORE_LOCATION,
            title: "Store Location",
          });

          // Add circle radius of possible deliveries
          new google.maps.Circle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map,
            center: STORE_LOCATION,
            radius: RADIUS_METERS,
          });
        }

        // Initialize autocomplete
        if (autocompleteContainerRef.current) {
          const circle = new google.maps.Circle({
            center: STORE_LOCATION,
            radius: RADIUS_METERS,
          });

          // https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
          (await google.maps.importLibrary(
            "places"
          )) as google.maps.PlacesLibrary;
          // @ts-ignore
          const placeAutocomplete =
            new google.maps.places.PlaceAutocompleteElement({
              componentRestrictions: { country: "us" },
              locationRestriction: circle.getBounds(),
            });

          placeAutocomplete.style.width = "100%";
          autocompleteContainerRef.current.appendChild(placeAutocomplete);

          // Handle address select (user can only save address selected from autocomplete)
          placeAutocomplete.addEventListener(
            "gmp-select",
            // @ts-ignore
            async ({ placePrediction }) => {
              const place = placePrediction.toPlace();
              await place.fetchFields({
                fields: ["formattedAddress", "location"],
              });

              // check if real address selected from autocomplete
              if (!place.location) {
                setMapsError("Please select a valid address from the dropdown");
                setSelectedAddress("");
                return;
              }

              // check if address within radius
              const distance =
                google.maps.geometry.spherical.computeDistanceBetween(
                  place.location,
                  STORE_LOCATION
                );

              if (distance > RADIUS_METERS) {
                setMapsError("Delivery address unreachable");
                setSelectedAddress("");
                // @ts-ignore
                placeAutocomplete.value = "";
                return;
              }

              console.log(place.formattedAddress);
              setSelectedAddress(place.formattedAddress);
            }
          );

          // Anytime input is deleted or changed from selected, disable saving
          placeAutocomplete.addEventListener("input", () => {
            setSelectedAddress("");
            setMapsError("");
          });
        }
      } catch (e) {
        console.log(e);
        setMapsError("Error loading Address Form");
      }
    };
    initMaps();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedAddress("");
    setMapsError("");
    // Reset autocomplete ref when closing since DOM will be unmounted
    // Clean up autocomplete element
    if (autocompleteContainerRef.current) {
      autocompleteContainerRef.current.innerHTML = "";
    }
  };

  if (!isOpen) {
    return (
      <Card className="border-2 border-dashed border-black/20 flex items-center justify-center h-full min-h-64">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="text-base"
        >
          + Add Address
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-fit border-black/10">
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">New Address</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map */}
        <div
          ref={mapRef}
          className="w-100 h-75 rounded-lg border border-gray-300"
        />

        {state?.formError && (
          <div className="text-red-500 text-sm">{state.formError}</div>
        )}

        {mapsError && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-3">
            {mapsError}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <Input type="hidden" name="userId" value={user.id} />

          {/* Address Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="address-autocomplete">Street Address</Label>
            <div ref={autocompleteContainerRef} className="w-full" />
            <p className="text-xs text-gray-500">
              We deliver within {RADIUS_MILES} miles of our store
            </p>
          </div>

          {/* Apartment Number (Optional) */}
          {/* <div className="space-y-2">
            <Label htmlFor="aptNumber">Apt/Suite (Optional)</Label>
            <Input id="aptNumber" name="aptNumber" placeholder="Apt 123" />
            {state?.fieldErrors?.aptNumber && (
              <p className="text-red-500 text-sm">
                {state.fieldErrors.aptNumber[0]}
              </p>
            )}
          </div> */}

          <Input type="hidden" name="address" value={selectedAddress} />

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isPending || !selectedAddress}
              className="flex-1"
            >
              {isPending ? "Saving..." : "Save Address"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
