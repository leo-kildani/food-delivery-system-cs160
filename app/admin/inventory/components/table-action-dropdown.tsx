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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontalIcon, MoreVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActionState, useEffect, useState } from "react";
import {
  archiveProduct,
  editProductAction,
  EditProductState,
} from "../actions";
import { Label } from "@/components/ui/label";
import { ProductCategory, ProductStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { TableProduct } from "./columns";
import { ArchiveDialog, RestoreDialog } from "./action-dialogs";

type TableActionProp = {
  productRow: TableProduct;
};

export default function TableActionDropdown(prop: TableActionProp) {
  const productRow = prop.productRow;
  const itemActive = productRow.status === ProductStatus.ACTIVE;

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const boundEditProductAction = editProductAction.bind(null, productRow.id);
  const [editProductState, editProductFormAction, editProductIsPending] =
    useActionState(boundEditProductAction, {} as EditProductState);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (editProductState?.ok) {
      setShowEditDialog(false);
      // arbitrary update so we can listen again
      editProductState.ok = false;
    }
  }, [editProductState?.ok]);

  // See if we're actually getting the right information
  // console.log(rowProduct);
  return (
    <>
      {/* Dropdown Menu */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" aria-label="Open menu" size="icon-sm">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            Edit
          </DropdownMenuItem>
          {itemActive ? (
            <DropdownMenuItem
              className="text-red-600"
              onSelect={() => setShowArchiveDialog(true)}
            >
              Archive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-green-600"
              onSelect={() => setShowRestoreDialog(true)}
            >
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog Box */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={editProductFormAction}>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>Edit item.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {/* Name */}
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={productRow.name}
                  type="text"
                />
                {editProductState.fieldErrors?.name && (
                  <div className="text-red-600 text-sm mt-1">
                    {editProductState.fieldErrors.name.join(", ")}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={productRow.description}
                  type="text"
                />
                {editProductState.fieldErrors?.description && (
                  <div className="text-red-600 text-sm mt-1">
                    {editProductState.fieldErrors.description.join(", ")}
                  </div>
                )}
              </div>

              {/* Categories */}
              <div className="grid gap-3">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={productRow.category}
                >
                  {/* Default value (existing category)*/}
                  <option
                    key={productRow.category.codePointAt(0)}
                    value={productRow.category}
                  >
                    {productRow.category
                      .toLowerCase()
                      .replace(/\b\w/g, (s) => s.toUpperCase())}
                  </option>
                  {/* create options in the form based on the categories in the product enum EXCEPT the category the item already is */}
                  {Object.values(ProductCategory)
                    .filter((cat) => {
                      return cat !== productRow.category;
                    })
                    .map((productCat) => (
                      // random key based on unicode value of string because next.js/react wants one
                      <option
                        key={productCat.codePointAt(0)}
                        value={productCat}
                      >
                        {productCat
                          .toLowerCase()
                          .replace(/\b\w/g, (s) => s.toUpperCase())}
                      </option>
                    ))}
                </select>
                {editProductState.fieldErrors?.category && (
                  <div className="text-red-600 text-sm mt-1">
                    {editProductState.fieldErrors.category.join(", ")}
                  </div>
                )}
              </div>

              {/* Price Per Unit */}
              <div className="grid gap-3">
                <Label htmlFor="pricePerUnit">Price / Unit</Label>
                <Input
                  id="pricePerUnit"
                  name="pricePerUnit"
                  defaultValue={productRow.pricePerUnit.toFixed(2)}
                  type="number"
                  min="0"
                  step="0.01"
                />
                {editProductState.fieldErrors?.pricePerUnit && (
                  <div className="text-red-600 text-sm mt-1">
                    {editProductState.fieldErrors.pricePerUnit.join(", ")}
                  </div>
                )}
              </div>

              {/* Weight per Unit */}
              <div className="grid gap-3">
                <Label htmlFor="weightPerUnit">Weight / Unit</Label>
                <Input
                  id="weightPerUnit"
                  name="weightPerUnit"
                  defaultValue={productRow.weightPerUnit.toFixed(3)}
                  type="number"
                  min="0"
                  step="0.001"
                />
                {editProductState.fieldErrors?.weightPerUnit && (
                  <div className="text-red-600 text-sm mt-1">
                    {editProductState.fieldErrors.weightPerUnit.join(", ")}
                  </div>
                )}
              </div>

              {/* Quantity on Hand */}
              <div className="grid gap-3">
                <Label htmlFor="quantityOnHand">Quantity</Label>
                <Input
                  id="quantityOnHand"
                  name="quantityOnHand"
                  defaultValue={productRow.quantityOnHand}
                  type="number"
                  min="0"
                />
                {editProductState.fieldErrors?.quantityOnHand && (
                  <div className="text-red-600 text-sm mt-1">
                    {editProductState.fieldErrors.quantityOnHand.join(", ")}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={editProductIsPending}>
                {editProductIsPending ? "Editing Item" : "Edit Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog Box */}
      {itemActive ? (
        <ArchiveDialog
          productId={productRow.id}
          showArchiveDialog={showArchiveDialog}
          setShowArchiveDialog={setShowArchiveDialog}
        />
      ) : (
        <RestoreDialog
          productId={productRow.id}
          showRestoreDialog={showRestoreDialog}
          setShowRestoreDialog={setShowRestoreDialog}
        />
      )}
    </>
  );
}
