"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { $Enums } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export type TableOrder = {
  id: number;
  createdAt: Date;
  status: $Enums.OrderStatus;
  toAddress: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  delivery: {
    id: number;
    status: string;
  } | null;
};

const getStatusColor = (status: $Enums.OrderStatus) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "IN_TRANSIT":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "COMPLETE":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "REFUNDED":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getDeliveryStatusColor = (status: string) => {
  switch (status) {
    case "IN_TRANSIT":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "STANDBY":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

export const columns: ColumnDef<TableOrder>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div>
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}{" "}
          {date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: "Customer",
    cell: ({ row }) => {
      const user = row.original.user;
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email;
      return <div>{displayName}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Order Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status: $Enums.OrderStatus = row.getValue("status");
      return (
        <Badge className={getStatusColor(status)}>
          {status.replace(/_/g, " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "delivery",
    header: "Delivery Status",
    cell: ({ row }) => {
      const delivery = row.original.delivery;
      if (!delivery) {
        return <Badge variant="outline">Not Assigned</Badge>;
      }
      return (
        <Badge className={getDeliveryStatusColor(delivery.status)}>
          {delivery.status.replace(/_/g, " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "vehicleId",
    header: "Delivery Vehicle",
    cell: ({ row }) => {
      const delivery = row.original.delivery;
      return <div>{delivery ? `Vehicle #${delivery.id}` : "—"}</div>;
    },
  },
  {
    accessorKey: "toAddress",
    header: "Delivery Address",
    cell: ({ row }) => {
      const address: string = row.getValue("toAddress");
      return <div className="max-w-xs truncate" title={address}>{address}</div>;
    },
  },
];

