import { format } from "date-fns";
import { Package, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getPastOrders } from "./actions";
import { getLoggedInUser } from "../../actions";

export default async function UserAccountPastOrders() {
  const user = await getLoggedInUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Past Orders
        </h1>
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const orders = await getPastOrders();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        Past Orders
      </h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              You haven't completed any orders yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Order #{order.id}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(order.createdAt), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {item.quantity}x
                        </span>
                        <span>{item.product?.name ?? "Unknown Product"}</span>
                      </div>
                      <span className="font-medium">
                        ${(Number(item.pricePerUnit) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold">
                    ${order.orderItems
                      .reduce(
                        (sum, item) =>
                          sum + Number(item.pricePerUnit) * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-center gap-1 mt-4 text-sm text-primary hover:underline"
                >
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}