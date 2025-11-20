"use client";

import { Button } from "@/components/ui/button";
import { $Enums } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export type TableProduct = {
  id: number;
  name: string;
  description: string;
  category: $Enums.ProductCategory;
  pricePerUnit: number;
  weightPerUnit: number;
  quantityOnHand: number;
  status: $Enums.ProductStatus;
  imageUrl: string | null;
};

export const columns: ColumnDef<TableProduct>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "pricePerUnit",
    header: ({ column }) => {
      return (
        <div className="justify-end">
          <Button variant="ghost" onClick={() => column.toggleSorting()}>
            <div className="text-right">Price</div>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const pricePerUnit = parseFloat(row.getValue("pricePerUnit"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(pricePerUnit);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "weightPerUnit",
    header: "Weight",
  },
  {
    accessorKey: "quantityOnHand",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];
