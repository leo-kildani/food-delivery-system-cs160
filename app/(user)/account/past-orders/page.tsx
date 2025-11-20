import { getPastOrders } from "./actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default async function PastOrdersPage() {
  const orders = await getPastOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETE":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="outline">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Past Orders
        </h1>
        <p className="text-muted-foreground mt-2">
          View your order history
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No past orders</h3>
          <p className="text-muted-foreground">
            You haven&apos;t completed any orders yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Placed on {format(new Date(order.createdAt), "PPP")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    ${order.totalAmount?.toString() || "0.00"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.paymentStatus === "paid" ? "Paid" : "Pending Payment"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Delivery Address:</p>
                <p className="text-sm text-muted-foreground">{order.toAddress}</p>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Items:</p>
                <div className="space-y-2">
                  {order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.product.name}</span>
                        <span className="text-muted-foreground">
                          x{item.quantity}
                        </span>
                      </div>
                      <span className="font-medium">
                        ${(Number(item.pricePerUnit) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
