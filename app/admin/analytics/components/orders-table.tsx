"use server";

import { $Enums } from "@prisma/client";
import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentOrder {
  order: {
    id: number;
    status: $Enums.OrderStatus;
    createdAt: Date;
  };
  totalWeight: number;
}

interface OrdersTableProps {
  orderList: RecentOrder[];
}

export async function OrdersTable({
  orderList,
}: OrdersTableProps): Promise<ReactNode> {
  function getStatusColor(status: string): string {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_TRANSIT":
        return "bg-blue-100 text-blue-800";
      case "COMPLETE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="overflow-x-auto">
      {/* Scrollable table */}
      <ScrollArea className="h-60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Total Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderList.map((item) => (
              <TableRow key={item.order.id}>
                <TableCell>{item.order.id}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                      item.order.status
                    )}`}
                  >
                    {item.order.status}
                  </span>
                </TableCell>
                <TableCell>
                  {item.order.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell>{item.totalWeight} lb</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
