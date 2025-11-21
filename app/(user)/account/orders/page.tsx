import { getUserOrders } from "./actions";
import { OrderStatus } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, CheckCircle, XCircle, Truck } from "lucide-react";
import { CollapsibleSection } from "./collapsible-section";

export default async function OrdersPage() {
  const orders = await getUserOrders();

  if (!orders) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          My Orders
        </h1>
        <p className="text-muted-foreground">Unable to load orders</p>
      </div>
    );
  }

  // Categorize orders
  const pendingOrders = orders.filter(
    (order) => order.status === OrderStatus.PENDING
  );
  const inTransitOrders = orders.filter(
    (order) => order.status === OrderStatus.IN_TRANSIT
  );
  const pastOrders = orders.filter(
    (order) =>
      order.status === OrderStatus.COMPLETE ||
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.REFUNDED
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        My Orders
      </h1>

      {/* In Transit Orders - Always visible */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" />
          In Transit
        </h2>
        {inTransitOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders in transit</p>
        ) : (
          <div className="space-y-3">
            {inTransitOrders.map((order) => (
              <OrderCard key={order.id} order={order} type="in-transit" />
            ))}
          </div>
        )}
      </section>

      {/* Pending Orders - Collapsible */}
      <CollapsibleSection
        title="Pending Orders"
        icon={<Clock className="h-5 w-5" />}
        count={pendingOrders.length}
        emptyMessage="No pending orders"
      >
        {pendingOrders.map((order) => (
          <OrderCard key={order.id} order={order} type="pending" />
        ))}
      </CollapsibleSection>

      {/* Past Orders - Collapsible */}
      <CollapsibleSection
        title="Past Orders"
        icon={<Package className="h-5 w-5" />}
        count={pastOrders.length}
        emptyMessage="No past orders"
      >
        {pastOrders.map((order) => (
          <OrderCard key={order.id} order={order} type="past" />
        ))}
      </CollapsibleSection>
    </div>
  );
}

function OrderCard({
  order,
  type,
}: {
  order: NonNullable<Awaited<ReturnType<typeof getUserOrders>>>[number];
  type: "pending" | "in-transit" | "past";
}) {
  const totalItems = order.orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Order #{order.id}</CardTitle>
            <CardDescription>
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Status Message */}
        {type === "pending" && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              🕒 To Be Picked Up
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Your order is being prepared and waiting to be picked up by a
              delivery vehicle.
            </p>
          </div>
        )}

        {type === "in-transit" && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              🚚 Your Delivery is on the Way
            </p>
            {order.eta && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Estimated arrival: {order.eta} minutes
              </p>
            )}
          </div>
        )}

        {/* Order Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <span className="font-medium">{totalItems}</span>
          </div>
          {order.totalAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">
                ${parseFloat(order.totalAmount.toString()).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Address</span>
            <span className="font-medium text-right max-w-[60%] truncate">
              {order.toAddress}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Order Items
          </p>
          <div className="space-y-1">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-muted-foreground">
                  {item.product.name} ×{item.quantity}
                </span>
                <span className="font-medium">
                  ${parseFloat(item.pricePerUnit.toString()).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusConfig = {
    [OrderStatus.PENDING]: {
      label: "Pending",
      variant: "outline" as const,
      icon: <Clock className="h-3 w-3" />,
    },
    [OrderStatus.IN_TRANSIT]: {
      label: "In Transit",
      variant: "default" as const,
      icon: <Truck className="h-3 w-3" />,
    },
    [OrderStatus.COMPLETE]: {
      label: "Completed",
      variant: "secondary" as const,
      icon: <CheckCircle className="h-3 w-3" />,
    },
    [OrderStatus.CANCELLED]: {
      label: "Cancelled",
      variant: "destructive" as const,
      icon: <XCircle className="h-3 w-3" />,
    },
    [OrderStatus.REFUNDED]: {
      label: "Refunded",
      variant: "outline" as const,
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}
