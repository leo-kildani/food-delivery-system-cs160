"use server";

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChartProducts } from "./product-pie-chart";
import { RecentOrder, PopularProductData } from "./actions";
import { OrdersTable } from "./orders-table";
import { $Enums } from "@prisma/client";

type SectionCardsProps = {
  activeUsers: number;
  activeOrders: number;
  orderList: RecentOrder[];
  popularProductData: PopularProductData[];
};

export async function SectionCards(data: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 grid grid-cols-1 gap-10 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Active Users</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.activeUsers}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Placed {data.activeOrders} new orders
          </div>
          <div className="text-muted-foreground">Users in the last 30 days</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Recent Orders</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.orderList.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <OrdersTable orderList={data.orderList} />
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {
              data.orderList.filter(
                (element) => element.order.status === $Enums.OrderStatus.PENDING
              ).length
            }{" "}
            pending orders
          </div>
          <div className="text-muted-foreground">Orders in the last 7 days</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Most Popular Product:</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.popularProductData[0]?.name || "N/A"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <PieChartProducts popularProductData={data.popularProductData} />
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Purchased in{" "}
            {Math.round(100 * data.popularProductData[0]?.frequency)}% of orders
          </div>
          <div className="text-muted-foreground">
            Orders in the past 30 days
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
