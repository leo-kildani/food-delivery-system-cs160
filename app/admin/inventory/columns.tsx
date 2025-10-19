"use client";

import { Button } from "@/components/ui/button";
import { $Enums } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export type TableProduct = {
  name: string;
  description: string;
  category: $Enums.ProductCategory;
  pricePerUnit: number;
  weightPerUnit: number;
  quantityOnHand: number;
};

export const columns: ColumnDef<TableProduct>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "weightPerUnit",
    header: "Weight",
  },
  {
    accessorKey: "pricePerUnit",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const pricePerUnit = parseFloat(row.getValue("pricePerUnit"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(pricePerUnit);

      return <div className="text-right">{formatted}</div>;
    },
  },
  {
    accessorKey: "quantityOnHand",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];
