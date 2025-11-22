import { getUserOrders, calculateAndUpdateOrderTotal } from "./actions";
import { OrderStatus, Prisma } from "@prisma/client";
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

  // Calculate and update total amounts for orders that don't have them
  for (const order of orders) {
    if (order.totalAmount === null) {
      const calculatedTotal = await calculateAndUpdateOrderTotal(order.id);
      if (calculatedTotal !== null) {
        order.totalAmount = new Prisma.Decimal(calculatedTotal);
      }
    }
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
  // Calculate total weight
  const totalWeight = order.orderItems.reduce((sum, item) => {
    const itemWeight =
      parseFloat(item.weightPerUnit.toString()) * item.quantity;
    return sum + itemWeight;
  }, 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Order #{order.id}</CardTitle>
            <OrderStatusBadge status={order.status} />
            {type === "in-transit" && order.eta && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                ETA: {order.eta} min
              </span>
            )}
          </div>
        </div>
        <CardDescription className="text-xs space-y-0.5">
          <div>{order.toAddress}</div>
          <div>
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}{" "}
            at{" "}
            {new Date(order.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Order Items */}
        <div className="space-y-1.5">
          {order.orderItems.map((item) => {
            const itemWeight =
              parseFloat(item.weightPerUnit.toString()) * item.quantity;
            const itemPrice = parseFloat(item.pricePerUnit.toString());
            const itemTotal = itemPrice * item.quantity;
            return (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">
                    {item.product.name} ×{item.quantity}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {itemWeight.toFixed(2)} lbs
                  </span>
                </div>
                <span className="font-medium">${itemTotal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-sm font-semibold">
            <span>Total ({totalWeight.toFixed(2)} lbs)</span>
            <span>
              {order.totalAmount
                ? `$${parseFloat(order.totalAmount.toString()).toFixed(2)}`
                : "Calculating..."}
            </span>
          </div>
          {totalWeight >= 20 && (
            <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
              <span>Includes heavy order surcharge</span>
              <span>+$10.00</span>
            </div>
          )}
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
