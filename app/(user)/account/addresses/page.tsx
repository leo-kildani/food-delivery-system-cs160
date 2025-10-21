import { getLoggedInUser, getUserDeliveryAddresses } from "./actions";
import { AddressCard } from "./address-card";
import { AddressForm } from "./address-form";

export default async function AddressPage() {
  const user = await getLoggedInUser();

  if (!user) {
    return <div>User not Found</div>;
  }

  const addresses = await getUserDeliveryAddresses(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        Addresses
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            canDelete={addresses.length > 1}
          />
        ))}

        <AddressForm user={user} />
      </div>
    </div>
  );
}
