"use client";
import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PopularProductData } from "../actions";
export const description = "Most popular products";

type PieChartProductsProps = {
  popularProductData: PopularProductData[];
};

export function PieChartProducts(data: PieChartProductsProps) {
  const chartColors = ["#e16704", "#d6395b", "#993f84", "#464882", "#013f5c"];
  const chartData = [];
  for (const [index, element] of data.popularProductData.entries()) {
    if (index >= 5) break; // This should not execute due to actions.ts only selecting 5 elements max
    chartData.push({
      name: element.name,
      amount: element.quantity,
      fill: chartColors[index],
    });
  }
  const chartConfig = {
    amount: {
      label: "Amount sold",
    },
    product1: {
      label: chartData[0].name,
      color: chartColors[0],
    },
    product2: {
      label: chartData[1].name,
      color: chartColors[1],
    },
    product3: {
      label: chartData[2].name,
      color: chartColors[2],
    },
    product4: {
      label: chartData[3].name,
      color: chartColors[3],
    },
    product5: {
      label: chartData[4].name,
      color: chartColors[4],
    },
  } satisfies ChartConfig;
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie data={chartData} dataKey="amount" nameKey="name" />
      </PieChart>
    </ChartContainer>
  );
}
