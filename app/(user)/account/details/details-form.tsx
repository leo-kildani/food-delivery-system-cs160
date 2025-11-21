"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateUserDetailsAction, type UserDetailsState } from "./actions";
import { User } from "@prisma/client";

interface DetailsFormProps {
  user: User;
}

export function DetailsForm({ user }: DetailsFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (prevState: UserDetailsState, formData: FormData) => {
      const newState = await updateUserDetailsAction(prevState, formData);
      if (newState.ok) {
        setIsEditing(false);
      }
      return newState;
    },
    {} as UserDetailsState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Details</CardTitle>
        <CardDescription>Manage your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.formError && (
            <Alert variant="destructive">
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          )}

          {state.ok && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription className="text-green-700">
                Account details updated successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={user.firstName || ""}
              disabled={!isEditing || isPending}
              required
            />
            {state.fieldErrors?.firstName && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.firstName[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={user.lastName || ""}
              disabled={!isEditing || isPending}
              required
            />
            {state.fieldErrors?.lastName && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.lastName[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email changes require additional verification (coming soon)
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            {!isEditing && (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
