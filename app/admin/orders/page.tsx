"use server";

import { requireAdmin } from "../actions";
import { getAllOrders } from "./actions";
import AdminOrdersClient from "./admin-orders-client";

export default async function AdminOrders() {
  await requireAdmin();
  const orders = await getAllOrders();

  // Convert Date objects to serializable format
  const serializedOrders = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt,
  }));

  return (
    <>
      <AdminOrdersClient orders={serializedOrders} />
    </>
  );
}

