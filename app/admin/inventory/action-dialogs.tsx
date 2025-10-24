"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { deleteProduct, restoreProduct } from "./actions";
import { Button } from "@/components/ui/button";

type DeleteDialogProps = {
  productId: number;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (open: boolean) => void;
};

export function DeleteDialog({
  productId,
  showDeleteDialog,
  setShowDeleteDialog,
}: DeleteDialogProps) {
  const [deleteProductPending, setDeleteProductPending] = useState(false);
  const [deleteFail, setDeleteFail] = useState(false);

  const deleteProductHandler = async (productId: number) => {
    setDeleteProductPending(true);
    const result = await deleteProduct(productId);
    if (result.success) {
      // close the dialog if successful
      setShowDeleteDialog(false);
    } else {
      setDeleteFail(true);
    }
    setDeleteProductPending(false);
  };
  return (
    <>
      {/* Delete Dialog Box */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Restoring this item will <b>remove</b> it from the list of active
              items! <b>Are you sure</b> you want to do this?
            </DialogDescription>

            {/* Delete failure text */}
            <DialogDescription className="text-red-600 text-sm mt-1 text-right">
              {deleteFail ? "Delete failed. Likely foreign key issues." : ""}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => deleteProductHandler(productId)}
              className="bg-red-600"
              disabled={deleteProductPending || deleteFail}
            >
              {deleteProductPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type RestoreDialogProps = {
  productId: number;
  showRestoreDialog: boolean;
  setShowRestoreDialog: (open: boolean) => void;
};

export function RestoreDialog({
  productId,
  showRestoreDialog,
  setShowRestoreDialog,
}: RestoreDialogProps) {
  const [restoreProductPending, setRestoreProductPending] = useState(false);
  const [restoreFail, setRestoreFail] = useState(false);

  const restoreProductHandler = async (productId: number) => {
    setRestoreProductPending(true);
    const result = await restoreProduct(productId);
    if (result.success) {
      // close the dialog if successful
      setShowRestoreDialog(false);
    } else {
      setRestoreFail(true);
    }
    setRestoreProductPending(false);
  };
  return (
    <>
      {/* Restore Dialog Box */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Restore</DialogTitle>
            <DialogDescription>
              Restoring this item will <b>put it back</b> in the list of active
              items! <b>Are you sure</b> you want to do this?
            </DialogDescription>

            {/* Restore failure text */}
            <DialogDescription className="text-red-600 text-sm mt-1 text-right">
              {restoreFail ? "Restore failed." : ""}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => restoreProductHandler(productId)}
              className="bg-green-600"
              disabled={restoreProductPending || restoreFail}
            >
              {restoreProductPending ? "Deleting..." : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
