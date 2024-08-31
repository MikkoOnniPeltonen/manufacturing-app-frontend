

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
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import OrderTable from '../components/OrderTable'
import OrderChart from '../components/OrderChart'


function CustomerPage() {

  const [currentCustomer, setCurrentCustomer] = useState(null)

  const [products, setProducts] = useState([])
  const [productionLines, setProductionLines] = useState([])
  const [allCustomers, setAllCustomers] = useState([])

  const [selection, setSelection] = useState([])
  const [showData, setShowData] = useState([])
  const [showChartData, setShowChartData] = useState([])

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const { customerId } = useParams()

  useEffect(() => {
    async function fetchData() {

      try {

        const productionLinesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
        setProductionLines(productionLinesResponse.data)

        const allCustomersResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`)
        setAllCustomers(allCustomersResponse.data)

        const productsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/products`)
        setProducts(productsResponse.data)

      } catch (error) {
        console.log(error)
      }
    }
    
    fetchData()

  }, [])

  useEffect(() => {

    const foundCustomer = allCustomers.find(oneCustomer => oneCustomer.id === customerId)
      setCurrentCustomer(foundCustomer)

    console.log('current customer: ', currentCustomer)

    if(currentCustomer) {

      const processCustomerData = () => {
      
        const displaySelection = []
        const data = []
  
        // ACCORDION CONTENT
        if (currentCustomer.selected_products.length > 0) {

          const productMap = new Map(products.map(p => [p.id, p]))

          const productInfo = currentCustomer.selected_products.map((oneProduct) => 
            productMap.get(oneProduct.value)
          )
    
          const groupedByProductionLine = productInfo.reduce((acc, product) => {
            if (!acc[product.productionLineId]) {
              acc[product.productionLineId] = []
            }
            acc[product.productionLineId].push(product)
            return acc
          }, {})

          productionLines.forEach((line) => {
            displaySelection.push({
              id: line.id,
              productionLine: line.name,
              productsByProductionLine: groupedByProductionLine[line.id] || [{id: line.id, text: 'No products selected.'}]
            })
          })
    
        } else {
          productionLines.forEach((line) => {
            displaySelection.push({
              id: line.id,
              productionLine: line.name,
              productsByProductionLine: [{id: line.id, text: 'No products selected for this production line.'}]
            })
          })
        }
    

        // TABLE CONTENT
        if (currentCustomer.delivered.length > 0) {
          currentCustomer.delivered.forEach((oneOrder) => {
            data.push(oneOrder)
          })
        }

        const customersWithOrders = allCustomers.filter((oneCustomer) => {
          return (
            oneCustomer.delivered.length > 0 && oneCustomer.id !== customerId
          )
        })
      
        const productionLineMap = productionLines.reduce((acc, line) => {
          acc[line.id] = line.name
          return acc
        }, {})
      
        const ordersByProductionLine = customersWithOrders.flatMap(customer => customer.delivered)
      
        const currentCustomerOrders = currentCustomer.delivered.reduce((acc, product) => {
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
      
        const chartData = Object.entries(productGroup).map(([productionLine, { totalQuantity, customerSet}]) => (
          {
            productionLine,
            average: totalQuantity / customerSet.size,
            orders: currentCustomerOrders[productionLine] || 0
      
        }))
        
        return { displaySelection, data, chartData }
  
      }
  
      const { displaySelection, data, chartData } = processCustomerData()
  
      setSelection(displaySelection)
      setShowData(data)
      setShowChartData(chartData)

    }



  }, [customerId])

  const columns = useMemo(
    () => [
      { accessorKey: 'saleId', header: 'Id' },
      { accessorKey: 'productName', header: 'Product' },
      { accessorKey: 'status', header: 'Status' },
      { 
        accessorKey: 'dateToDeliver', 
        header: ({ column }) => {
          return (
            <Button 
              variant="ghost" 
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
            Date
            <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          )
        }
      },
      { accessorKey: 'quantity', header: 'Amount' }
    ], 
    []
  )

  const table = useReactTable({
    showData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters
    } 
  })

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {currentCustomer && (
        <>
          <article className="mb-6">
            <Card className="shadow-lg rounded-lg overflow-hidden border border-gray-200 bg-white">
              <CardHeader className="p-4 border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-800">{currentCustomer.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <img src={currentCustomer.customer_logoURL} alt={`pic not loading`} className="w-16 h-16 rounded-full border" />
                  <div>
                    <p className="text-sm text-gray-600">Contact: {currentCustomer.contact}</p>
                    <p className="text-sm text-gray-600">Address: {currentCustomer.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <section className="mt-6">
              <Card className="shadow-lg rounded-lg overflow-hidden border border-gray-200 bg-white">
                <CardHeader className="p-4 border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-gray-800">Selected Products</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Accordion type="single" collapsible className="w-full">
                    {selection.map(oneItem => (
                      <AccordionItem key={oneItem.id} value={`item-${oneItem.id}`} className="border-b border-gray-200">
                        <AccordionTrigger className="text-sm font-medium text-gray-700 hover:text-blue-600">{oneItem.productionLine}</AccordionTrigger>
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
          
          <article className="p-6 bg-white rounded-lg shadow-md">
            <Tabs defaultValue="table" className="space-y-6">
              <TabsList className="flex border-b border-gray-200">
                <TabsTrigger value="table" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-t-md hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ease-in-out">Orders</TabsTrigger>
                <TabsTrigger value="chart" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-t-md hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ease-in-out">Charts</TabsTrigger>
              </TabsList>
              <TabsContent value="table" className="bg-gray-50 p-6 rounded-b-lg shadow-md">
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
                <OrderTable table={table} />
              </TabsContent>
              <TabsContent value="chart" className="bg-gray-50 p-6 rounded-b-lg shadow-md">
                <OrderChart chartData={showChartData} />
              </TabsContent> 
            </Tabs>
          </article>
        </>
      )}
    </div>
  )
}

export default CustomerPage
