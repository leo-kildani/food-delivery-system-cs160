"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deleteAddressAction, type DeliveryAddressState } from "./actions";

interface DeleteAddressButtonProps {
  addressId: number;
  canDelete: boolean;
}

export function DeleteAddressButton({
  addressId,
  canDelete,
}: DeleteAddressButtonProps) {
  const [state, formAction, isPending] = useActionState(
    (prevState: DeliveryAddressState, formData: FormData) =>
      deleteAddressAction(prevState, formData, addressId),
    {} as DeliveryAddressState
  );

  return (
    <form action={formAction}>
      <Button
        type="submit"
        disabled={!canDelete}
        variant="ghost"
        size="sm"
        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-gray-400 disabled:bg-transparent"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </form>
  );
}
