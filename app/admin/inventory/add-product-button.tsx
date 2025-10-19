"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProductAction, AddProductState } from "./actions";
import { useActionState } from "react";

export default function AddProductButton() {
  const [addProductState, addProductFormAction, addProductIsPending] =
    useActionState(addProductAction, {} as AddProductState);

  return (
    <Dialog>
      <form action={addProductFormAction}>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-blue-500 text-white">
            Add Item
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
            <DialogDescription>
              Add a new product to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Apple" type="text" />
              {addProductState.fieldErrors?.name && (
                <div className="text-red-600 text-sm mt-1">
                  {addProductState.fieldErrors.name.join(", ")}
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="A nice snack."
                type="text"
              />
              {addProductState.fieldErrors?.description && (
                <div className="text-red-600 text-sm mt-1">
                  {addProductState.fieldErrors.description.join(", ")}
                </div>
              )}
            </div>
            {/* <div className="grid gap-3">
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category">
                <option value="FRUIT">Fruit</option>
                <option value="VEGETABLE">Vegetable</option>
                <option value="DAIRY">Dairy</option>
                <option value="MEAT">Meat</option>
              </select>
              {addProductState.fieldErrors?.category && (
                <div className="text-red-600 text-sm mt-1">
                  {addProductState.fieldErrors.category.join(", ")}
                </div>
              )}
            </div> */}
            <div className="grid gap-3">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                defaultValue="FRUIT"
                type="text"
              />
              {addProductState.fieldErrors?.category && (
                <div className="text-red-600 text-sm mt-1">
                  {addProductState.fieldErrors.category.join(", ")}
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="pricePerUnit">Price / Unit</Label>
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                placeholder="0.50"
                type="number"
                min="0"
                step="0.05"
              />
              {addProductState.fieldErrors?.pricePerUnit && (
                <div className="text-red-600 text-sm mt-1">
                  {addProductState.fieldErrors.pricePerUnit.join(", ")}
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="weightPerUnit">Weight / Unit</Label>
              <Input
                id="weightPerUnit"
                name="weightPerUnit"
                placeholder="0.200"
                type="number"
                min="0"
                step="0.005"
              />
              {addProductState.fieldErrors?.weightPerUnit && (
                <div className="text-red-600 text-sm mt-1">
                  {addProductState.fieldErrors.weightPerUnit.join(", ")}
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="quantityOnHand">Quantity</Label>
              <Input
                id="quantityOnHand"
                name="quantityOnHand"
                placeholder="50"
                type="number"
                min="0"
              />
              {addProductState.fieldErrors?.quantityOnHand && (
                <div className="text-red-600 text-sm mt-1">
                  {addProductState.fieldErrors.quantityOnHand.join(", ")}
                </div>
              )}
            </div>
            {/* <div className="grid gap-3">
              <Label htmlFor="[FORM]">[LABEL]</Label>
              <Input id="[FORM]" name="[FORM]" defaultValue="[DEFAULT]" type="text" />
              {addProductState.fieldErrors?.[FORM] && (
                <div className="text-red-600 text-sm mt-1">
                  {addProductState.fieldErrors.[FORM].join(", ")}
                </div>
              )}
            </div> */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={addProductIsPending}>
              {addProductIsPending ? "Adding Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
