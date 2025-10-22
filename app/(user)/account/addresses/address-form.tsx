"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { addAddressAction, DeliveryAddressState } from "./actions";
import { Prisma, User } from "@prisma/client";
import {setOptions, importLibrary} from "@googlemaps/js-api-loader"
import { RADIUS_METERS, STORE_LOCATION } from "@/lib/constants";

interface AddressFormProps {
  user: User;
}

export function AddressForm({ user }: AddressFormProps) {
  // required local states
  const [isOpen, setIsOpen] = useState(false);
  const [parsedAddress, setParsedAddress] =
    useState<Prisma.DeliveryAddressCreateInput | null>(null);
  const [mapsError, setMapsError] = useState("");
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // save delivery address server action
  const [state, formAction, isPending] = useActionState(
    async (prevState: DeliveryAddressState, formData: FormData) => {
      const newState = await addAddressAction(prevState, formData);
      if (newState.ok) {
        setIsOpen(false);
        setParsedAddress(null);
        setMapsError("");
      }
      return newState;
    },
    {} as DeliveryAddressState
  );

  // reference Maps html elements
  const mapRef = useRef<HTMLDivElement>(null);
  const mapsInstanceRef = useRef<google.maps.Map | null>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const placesAutocompleteRef = useRef<any>(null);

  // retrieve Google Maps HTML elements on re-renders
  useEffect(() => {
    if (!isOpen) return;

    const initMaps = async () => {
      try {
        setOptions({
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          v: "weekly"
        })
        const {Map} = await importLibrary("maps")
        const {AdvancedMarkerElement} = await importLibrary("marker")

        // Initialize map
        if (mapRef.current && !mapsInstanceRef.current) {
          const map = new Map(mapRef.current, {
            center: STORE_LOCATION,
            zoom: 12,
            mapId: "ADDRESS_MAP"
          });
          mapsInstanceRef.current = map

          // Add store marker
          new AdvancedMarkerElement({
            map,
            position: STORE_LOCATION,
            title: "Store Location"
          })

          // Add circle radius of possible deliveries
          new google.maps.Circle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map,
            center: STORE_LOCATION,
            radius: RADIUS_METERS
          })
        }

        // Initialize autocomplete
        if (autocompleteContainerRef.current && !placesAutocompleteRef.current) {
          const circle = new google.maps.Circle({
            center: STORE_LOCATION,
            radius: RADIUS_METERS
          })

          // https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
          await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
          // @ts-ignore
          const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
            componentRestrictions: {country: "us"},
            locationRestriction: circle.getBounds()
          });

          // LEFT OFF HERE
  
        }
      }
    }
  });

  const handleClose = () => {
    setIsOpen(false);
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
    <Card className="border-black/10">
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

        {state?.formError && (
          <div className="text-red-500 text-sm mb-4">{state.formError}</div>
        )}

        <form action={formAction} className="space-y-4">
          <Input type="hidden" name="userId" value={user.id} />
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="streetAddress"
              name="streetAddress"
              placeholder="123 Main St"
              required
            />
            {state?.fieldErrors?.street && (
              <p className="text-red-500 text-sm">
                {state.fieldErrors.streetAddress[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                placeholder="San Francisco"
                required
              />
              {state?.fieldErrors?.city && (
                <p className="text-red-500 text-sm">
                  {state.fieldErrors.city[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateCode">State</Label>
              <Input
                id="stateCode"
                name="stateCode"
                placeholder="CA"
                maxLength={2}
                required
              />
              {state?.fieldErrors?.stateCode && (
                <p className="text-red-500 text-sm">
                  {state.fieldErrors.stateCode[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Zip Code</Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="94102"
                maxLength={5}
                required
              />
              {state?.fieldErrors?.postalCode && (
                <p className="text-red-500 text-sm">
                  {state.fieldErrors.postalCode[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="aptNumber">Apt/Suite (Optional)</Label>
              <Input id="aptNumber" name="aptNumber" placeholder="Apt 123" />
              {state?.fieldErrors?.aptNumber && (
                <p className="text-red-500 text-sm">
                  {state.fieldErrors.aptNumber[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending} className="flex-1">
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
