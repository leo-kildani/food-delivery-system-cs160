"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmployeeAction } from "./actions";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddEmployeeButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createEmployeeAction,
    {}
  );
  const router = useRouter();

  // Close dialog, show toast, and refresh page on success
  useEffect(() => {
    if (state?.ok) {
      toast.success("Employee created successfully!");
      setOpen(false);
      router.refresh();
    }
  }, [state?.ok, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-blue-500 text-white">
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Create a new employee account. They will be able to access the
            inventory management system.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                className="col-span-3"
                required
              />
              {state?.fieldErrors?.firstName && (
                <p className="col-span-4 text-sm text-red-600">
                  {state.fieldErrors.firstName[0]}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                className="col-span-3"
                required
              />
              {state?.fieldErrors?.lastName && (
                <p className="col-span-4 text-sm text-red-600">
                  {state.fieldErrors.lastName[0]}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="col-span-3"
                required
              />
              {state?.fieldErrors?.email && (
                <p className="col-span-4 text-sm text-red-600">
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="col-span-3"
                required
              />
              {state?.fieldErrors?.password && (
                <p className="col-span-4 text-sm text-red-600">
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>
            {state?.formError && (
              <p className="col-span-4 text-sm text-red-600">
                {state.formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
