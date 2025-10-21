import { getLoggedInUser } from "./actions";
import { DetailsForm } from "./details-form";

export default async function DetailsPage() {
  const user = await getLoggedInUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Account Details
        </h1>
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        Account Details
      </h1>
      <DetailsForm user={user} />
    </div>
  );
}
