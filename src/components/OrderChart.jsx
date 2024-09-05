
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

function OrderChart({ chartData, productionLines }) {

  
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


  const completeChartData = productionLines.map(line => {
    const existingData = chartData.find(d => d.productionLine === line.name) || {}
    return {
      productionLine: line.name,
      average: existingData.average || 0,
      orders: existingData.orders || 0
    }
  })
  return (
    <ResponsiveContainer width='100%' height={400} className="min-h-[400px] w-full p-4 bg-white rounded-lg shadow-md">
        <BarChart data={completeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
                dataKey="productionLine"
                tickFormatter={(value) => value.slice(0, 15)}
                interval={0}
                tick={{ fontSize: 12, width: 100, wordWrap: 'break-word' }}
                className="text-sm text-gray-700"
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="average" name={chartConfig.average.label} fill={chartConfig.average.color}  />
            <Bar dataKey="orders" name={chartConfig.orders.label} fill={chartConfig.orders.color} />
        </BarChart>
    </ResponsiveContainer>
  )
}

export default OrderChart
