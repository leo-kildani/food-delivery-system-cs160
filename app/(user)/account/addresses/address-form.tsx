"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { addAddressAction, DeliveryAddressState } from "./actions";
import { User } from "@prisma/client";

interface AddressFormProps {
  user: User;
}

export function AddressForm({ user }: AddressFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    addAddressAction,
    {} as DeliveryAddressState
  );

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (state?.ok) {
      handleClose();
    }
  }, [state?.ok]);

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
              id="street"
              name="street"
              placeholder="123 Main St"
              required
            />
            {state?.fieldErrors?.street && (
              <p className="text-red-500 text-sm">
                {state.fieldErrors.street[0]}
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
