"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { addAddressAction, DeliveryAddressState } from "./actions";

interface AddressFormProps {
  userId: string;
}

export function AddressForm({ userId }: AddressFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addAddressState, addAddressFormAction, addAddressIsPending] =
    useActionState(
      async (prevState: DeliveryAddressState, formData: FormData) => {
        const result = await addAddressAction(prevState, formData);
        if (result.ok) {
          setIsOpen(false);
        }
        return result;
      },
      {} as DeliveryAddressState
    );

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

        {addAddressState?.formError && (
          <div className="text-red-500 text-sm mb-4">
            {addAddressState.formError}
          </div>
        )}

        <form action={addAddressFormAction}>
          <Input type="hidden" name="userId" value={userId} />
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              id="streetAddress"
              name="streetAddress"
              placeholder="123 Main St"
              required
            />
            {addAddressState?.fieldErrors?.streetAddress && (
              <p className="text-red-500 text-sm">
                {addAddressState.fieldErrors.streetAddress[0]}
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
              {addAddressState?.fieldErrors?.city && (
                <p className="text-red-500 text-sm">
                  {addAddressState.fieldErrors.city[0]}
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
              {addAddressState?.fieldErrors?.stateCode && (
                <p className="text-red-500 text-sm">
                  {addAddressState.fieldErrors.stateCode[0]}
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
              {addAddressState?.fieldErrors?.postalCode && (
                <p className="text-red-500 text-sm">
                  {addAddressState.fieldErrors.postalCode[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="aptNumber">Apt/Suite (Optional)</Label>
              <Input id="aptNumber" name="aptNumber" placeholder="Apt 123" />
              {addAddressState?.fieldErrors?.aptNumber && (
                <p className="text-red-500 text-sm">
                  {addAddressState.fieldErrors.aptNumber[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={addAddressIsPending}
              className="flex-1"
            >
              {addAddressIsPending ? "Saving..." : "Save Address"}
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
