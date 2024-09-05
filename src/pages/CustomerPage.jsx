

import { ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import axios from 'axios'
import { lazy, Suspense, useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import LoadingSpinner from '../components/LoadingSpinner'

const OrderTable = lazy(() => import('../components/OrderTable'))
const OrderChart = lazy(() => import('../components/OrderChart'))


function CustomerPage() {

  const [dataMap, setDataMap] = useState(new Map()) 

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const [loading, setLoading] = useState(true)

  const { customerId } = useParams()

  const idAsNumber = Number(customerId)


  useEffect(() => {
    fetchData()
  }, [customerId])


  async function fetchData() {
    setLoading(true)

    try {

      const [allCustomersResponse, productionLinesResponse, productsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/products`)
      ])

      const newDataMap = new Map()
      newDataMap.set('allCustomers', allCustomersResponse.data)
      newDataMap.set('currentCustomer', allCustomersResponse.data.find(customer => customer.id === idAsNumber))
      newDataMap.set('productionLines', productionLinesResponse.data)
      newDataMap.set('products', new Map(productsResponse.data.map(p => [p.id, p])))

      setDataMap(newDataMap)
    } catch (error) {
      console.error('Error fetching data: ', error)
    } finally {
      setLoading(false)
    }
  }

  const processCustomerData = useMemo(() => {
    if(!dataMap.has('currentCustomer')) return { displaySelection: [], tableData: [], chartData: [] }

    const customer = dataMap.get('currentCustomer')
    const products = dataMap.get('products')
    const productionLines = dataMap.get('productionLines')
    const allCustomers = dataMap.get('allCustomers')

    // ACCORDION CONTENT
    const displaySelection = productionLines.map(line => {
      const productsForLine = customer.selected_products
        .filter(productId => products.get(productId)?.productionLineId === line.id)
        .map(productId => products.get(productId))

      return {
        id: line.id,
        productionLine: line.name,
        productionLogo: line.product_logoURL,
        productsByProductionLine: productsForLine.length > 0 ? productsForLine : [{ id: line.id, text: 'No products selected for this production line.' }]
      }

    })

    // TABLE CONTENT
    const tableData = customer.delivered || []

    // CHART CONTENT
    const customersWithOrders = allCustomers.filter((oneCustomer) => {
      return (
        oneCustomer.delivered.length > 0 && oneCustomer.id !== idAsNumber
      )
    })

    const productionLineMap = productionLines.reduce((acc, line) => {
      acc[line.id] = line.name
      return acc
    }, {})

    const ordersByProductionLine = customersWithOrders.flatMap(customer => customer.delivered)
      
    const currentCustomerOrders = customer.delivered.reduce((acc, product) => {
      const productionLineName = productionLineMap[product.productionLineId]

      if (!acc[productionLineName]) {
        acc[productionLineName] = 0
      }
      
      acc[productionLineName] += product.quantity
      return acc
    }, {})

    const productGroup = ordersByProductionLine.reduce((acc, oneOrder) => {
      const productionLineName = productionLineMap[oneOrder.productionLineId]
      
      if (!acc[productionLineName]) {
        acc[productionLineName] = { totalQuantity: 0, customerSet: new Set() }
      }
      
      acc[productionLineName].totalQuantity += oneOrder.quantity
      acc[productionLineName].customerSet.add(oneOrder.customerId)
      
      return acc
    }, {})

    const chartData = Object.entries(productGroup).map(([productionLine, { totalQuantity, customerSet}]) => ({
      productionLine,
      average: totalQuantity / customerSet.size,
      orders: currentCustomerOrders[productionLine] || 0
    }))

    return { displaySelection, tableData, chartData }
  }, [dataMap])


  const columns = useMemo(() => [
    { accessorKey: 'saleId', header: 'Id' },
    { accessorKey: 'productName', header: 'Product' },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ getValue }) => getValue() ? 'Delivered' : 'Pending'
    },
    { 
      accessorKey: 'dateToDeliver', 
      header: ({ column }) => (
        <Button 
          variant="ghost" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    { accessorKey: 'quantity', header: 'Amount' }
  ], [])

  const table = useReactTable({
    data: processCustomerData.tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters } 
  })

  if (loading) {
    return <div className="p-6 bg-gray-100 min-h-screen">Loading...</div>
  }

  const currentCustomer = dataMap.get('currentCustomer')

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:w-1/2">
          <article className="mb-6 h-full flex flex-col">
            <Card className="shadow-lg rounded-lg overflow-hidden border border-gray-200 bg-white mb-6 flex-grow">
              <CardHeader className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center w-full">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex-grow">{currentCustomer.name}</CardTitle>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-600">Contact: {currentCustomer.contact}</p>
                    <p className="text-sm text-gray-600">Address: {currentCustomer.address}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center relative overflow-hidden">
                <div className="w-full h-64 relative overflow-hidden">
                  <img 
                    src={currentCustomer.customer_logoURL} 
                    alt={`pic not loading`} 
                    className="absolute -left-[25%] -top-[5%] -bottom-[5%] w-[95%] h-[105%] object-contain" 
                  />
                </div>
              </CardContent>
            </Card>
            <section className="flex-grow">
              <Card className="shadow-lg rounded-lg overflow-hidden border border-gray-200 bg-white h-full">
                <CardHeader className="p-4 border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-gray-800">Selected Products</CardTitle>
                </CardHeader>
                <CardContent className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 60 px)' }}>
                  <Accordion type="single" collapsible className="w-full">
                    {processCustomerData.displaySelection.map(oneItem => (
                      <AccordionItem key={oneItem.id} value={`item-${oneItem.id}`} className="border-b border-gray-200">
                        <AccordionTrigger 
                          className="text-sm font-medium text-white hover:text-blue-200 relative bg-cover bg-center bg-no-repeat p-4 rounded-md transition-all duration-300 ease-in-out overflow-hidden"
                          style={{
                            backgroundImage: `url('${oneItem.productionLogo}')`,
                            opacity: 0.8
                          }}
                        >
                          <span className="text-shadow">{oneItem.productionLine}</span>
                        </AccordionTrigger>
                        <AccordionContent className="mt-2 text-gray-600">
                          {oneItem.productsByProductionLine.map(oneObject => (
                            oneObject.text ? (
                              <p key={oneObject.id} className="py-1">{oneObject.text}</p>
                            ) : (
                              <div key={oneObject.id} className="py-2">
                                <p className="font-medium">{oneObject.name}</p>
                                <hr className="my-2" />
                                <p className="text-sm">{oneObject.description}</p>
                              </div>
                            )
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </section>
          </article>
        </div>
        <div className="flex-1 lg:w-1/2">
          <article className="bg-white rounded-lg shadow-md h-full">
            <Card className="bg-white rounded-lg shadow-md h-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">Customer Data</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)]">
                <Tabs defaultValue="table" className="h-full flex flex-col">
                  <TabsList className="flex border-b border-gray-200">
                    <TabsTrigger value="table" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-t-md hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ease-in-out">Orders</TabsTrigger>
                    <TabsTrigger value="chart" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-t-md hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ease-in-out">Charts</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="bg-gray-50 p-6 rounded-b-lg shadow-inner flex-grow overflow-auto">
                    <div className="flex items-center py-4">
                      <Input
                        placeholder="Filter by name"
                        value={table.getColumn("productName")?.getFilterValue() || ""}
                        onChange={(event) =>
                        table.getColumn("productName").setFilterValue(event.target.value)
                        }
                        className="max-w-sm border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Suspense fallback={<LoadingSpinner />}>
                      <OrderTable table={table} />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="chart" className="bg-gray-50 p-6 rounded-b-lg shadow-inner flex-grow">
                    <Suspense fallback={<LoadingSpinner />}>
                      <OrderChart chartData={processCustomerData.chartData} productionLines={dataMap.get('productionLines')} />
                    </Suspense>
                  </TabsContent> 
                </Tabs>
              </CardContent>
            </Card>
          </article>
        </div>
      </div>
    </div>
  )
}

export default CustomerPage
