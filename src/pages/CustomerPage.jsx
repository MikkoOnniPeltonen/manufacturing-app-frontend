

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

        const foundCustomer = allCustomers.find(oneCustomer => oneCustomer.id === customerId)
        setCurrentCustomer(foundCustomer)

      } catch (error) {
        console.log(error)
      }
    }
    
    fetchData()

    if(!currentCustomer) return

    const processCustomerData = () => {
      const displaySelection = []
      const data = []

      if (currentCustomer.selected_products.length > 0) {
        const productInfo = currentCustomer.selected_products.map((oneProduct) => {
          return (
            products.find(correspondingProduct => correspondingProduct.id === oneProduct.value)
          )
        })
  
        productionLines.forEach((line) => {
  
          const productsByProductionLine = productInfo.filter(oneProduct => oneProduct.productionLineId === line.id)
          displaySelection.push({
            id: line.id,
            productionLine: line.name,
            productsByProductionLine
          })
        })
  
      } else {
        productionLines.forEach((line) => {
          const productsByProductionLine = {id: line.id, text: 'No products selected'}
          displaySelection.push({
            id: line.id,
            productionLine: line.name,
            productsByProductionLine
          })
        })
      }
  
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
    <div>
      {currentCustomer && (
        <>
          <article>
            <Card>
              <CardHeader>
                <CardTitle>{currentCustomer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={currentCustomer.customer_logoURL} alt={`pic not loading`}/>
                <div>
                  <p>Contact: {currentCustomer.contact}</p>
                  <p>Address: {currentCustomer.address}</p>
                </div>
              </CardContent>
            </Card>
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Selected Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                      {selection.map(oneItem => {
                        return (
                          <AccordionItem key={oneItem.id} value={`item-${oneItem.id}`}>
                            <AccordionTrigger>{oneItem.productionLine}</AccordionTrigger>
                            <AccordionContent>
                              {oneItem.productsByProductionLine.map(oneObject => {
                                if (oneObject.text) {
                                  return (
                                    <p key={oneObject.id}>{oneObject.text}</p>
                                  )
                                } else {
                                  return (
                                    <div key={oneObject.id}>
                                      <p>{oneObject.name}</p>
                                      <hr />
                                      <p>{oneObject.description}</p>
                                    </div>
                                  )
                                }
                              })}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                  </Accordion>
                </CardContent>
              </Card>
            </section>
          </article>
          <article>
            <Tabs defaultValue="table">
              <TabsList>
                <TabsTrigger value="table">Orders</TabsTrigger>
                <TabsTrigger value="chart">Chart</TabsTrigger>
              </TabsList>
              <TabsContent value="table">
                <div className="flex items-center py-4">
                 <Input
                  placeholder="Filter by name"
                  value={table.getColumn("productName") && table.getColumn("productName").getFilterValue() || ""}
                  onChange={(event) =>
                    table.getColumn("productName").setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                 />
                </div>
                <OrderTable table={table} />
              </TabsContent>
              <TabsContent value="chart">
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
