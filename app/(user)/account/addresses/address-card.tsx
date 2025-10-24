import { Card, CardContent } from "@/components/ui/card";
import { DeliveryAddress } from "@prisma/client";
import { DeleteAddressButton } from "./delete-address-button";
import { parseAddress } from "./actions";

interface AddressCardProps {
  address: DeliveryAddress;
  canDelete: boolean;
}

export async function AddressCard({ address, canDelete }: AddressCardProps) {
  const parsedAddress = await parseAddress(address.address);
  if (!parsedAddress) {
    return <div>ERROR</div>;
  }
  return (
    <Card className="w-full h-fit border-black/10">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <p className="font-medium text-sm">{parsedAddress?.address}</p>
          <p className="text-sm text-gray-600">
            {parsedAddress.city}, {parsedAddress.stateZip}
          </p>
          <DeleteAddressButton addressId={address.id} canDelete={canDelete} />
        </div>
      </CardContent>
    </Card>
  );
}
