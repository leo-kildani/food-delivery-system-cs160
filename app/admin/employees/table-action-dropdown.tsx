"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";
import { updateEmployeeAction, deleteEmployeeAction } from "./actions";
import { useActionState } from "react";
import { Employee } from "./columns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TableActionDropdownProps {
  employee: Employee;
}

export default function TableActionDropdown({
  employee,
}: TableActionDropdownProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateEmployeeAction,
    {}
  );
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteEmployeeAction,
    {}
  );
  const router = useRouter();

  // Handle successful update
  useEffect(() => {
    if (updateState?.ok) {
      toast.success("Employee updated successfully!");
      setEditOpen(false);
      router.refresh();
    }
  }, [updateState?.ok, router]);

  // Handle successful delete
  useEffect(() => {
    if (deleteState?.ok) {
      toast.success("Employee deleted successfully!");
      setDeleteOpen(false);
      router.refresh();
    }
  }, [deleteState?.ok, router]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Edit Employee
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600"
          >
            Delete Employee
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information.</DialogDescription>
          </DialogHeader>
          <form action={updateFormAction}>
            <input type="hidden" name="id" value={employee.id} />
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={employee.firstName}
                  className="col-span-3"
                  required
                />
                {updateState?.fieldErrors?.firstName && (
                  <p className="col-span-4 text-sm text-red-600">
                    {updateState.fieldErrors.firstName[0]}
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
                  defaultValue={employee.lastName}
                  className="col-span-3"
                  required
                />
                {updateState?.fieldErrors?.lastName && (
                  <p className="col-span-4 text-sm text-red-600">
                    {updateState.fieldErrors.lastName[0]}
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
                  defaultValue={employee.email}
                  className="col-span-3"
                  required
                />
                {updateState?.fieldErrors?.email && (
                  <p className="col-span-4 text-sm text-red-600">
                    {updateState.fieldErrors.email[0]}
                  </p>
                )}
              </div>
              {updateState?.formError && (
                <p className="col-span-4 text-sm text-red-600">
                  {updateState.formError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isUpdatePending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatePending}>
                {isUpdatePending ? "Updating..." : "Update Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {employee.firstName}{" "}
              {employee.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <form action={deleteFormAction}>
            <input type="hidden" name="id" value={employee.id} />
            {deleteState?.formError && (
              <p className="text-sm text-red-600 mb-4">
                {deleteState.formError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={isDeletePending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isDeletePending}
              >
                {isDeletePending ? "Deleting..." : "Delete Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
