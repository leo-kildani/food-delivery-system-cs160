import { Card, CardContent } from "@/components/ui/card";
import { DeliveryAddress } from "@prisma/client";
import { DeleteAddressButton } from "./delete-address-button";

interface AddressCardProps {
  address: DeliveryAddress;
  canDelete: boolean;
}

export function AddressCard({ address, canDelete }: AddressCardProps) {
  return (
    <Card className="w-full h-fit “border-black/10">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <p className="font-medium text-sm">{address.street}</p>
          <p className="text-sm text-gray-600">
            {address.city}, {address.stateCode} {address.postalCode}
          </p>
          {address.aptNumber && (
            <p className="text-sm text-gray-600">{address.aptNumber}</p>
          )}

          <DeleteAddressButton addressId={address.id} canDelete={canDelete} />
        </div>
      </CardContent>
    </Card>
  );
}
