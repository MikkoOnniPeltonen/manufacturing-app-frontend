
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer } from '@/components/ui/chart'

function OrderChart({ ...chartData }) {

    const chartConfig = {
        average: {
          label: "Total",
          color: "#2563eb"
        },
        orders: {
          label: "Customer",
          color: "#60a5fa"
        }
      }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="productionLine"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
            />
            <Bar dataKey="average" fill={chartConfig.average.color} radius={4} />
            <Bar dataKey="orders" fill={chartConfig.orders.color} radius={4} />
        </BarChart>
    </ChartContainer>
  )
}

export default OrderChart
