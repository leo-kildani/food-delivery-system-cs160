"use client";
import { Pie, PieChart } from "recharts";
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
  // https://ui.shadcn.com/charts/pie#charts
  const chartColors = ["#e16704", "#d6395b", "#993f84", "#464882", "#013f5c"]; // https://www.learnui.design/tools/data-color-picker.html
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
      color: chartColors[0], // tbh I'm not entirely sure what this does; I'm pretty sure the fill in chartData is all that matters
    }, // https://ui.shadcn.com/docs/components/chart#chart-config
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
