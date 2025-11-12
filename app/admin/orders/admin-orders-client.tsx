"use client";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { $Enums } from "@prisma/client";

type OrderProp = {
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

export default function AdminOrdersClient({
  orders,
}: {
  orders: OrderProp[];
}) {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="text-sm text-gray-600">
          Total: {orders.length} orders
        </div>
      </div>
      <div className="py-3">
        <DataTable columns={columns} data={orders} />
      </div>
    </div>
  );
}

