
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"


function HomePage() {

  const [productionLines, setProductionLines] = useState([])
  const [salesData, setSalesData] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const [newSalesCount, setNewSalesCount] = useState(0)

  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)


  async function fetchData() {
    try {
      const [productionLinesResponse, salesResponse, customersResponse, productsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/products`)
      ])

      setProductionLines(productionLinesResponse.data)
      setSalesData(salesResponse.data)
      setCustomers(customersResponse.data)
      setProducts(productsResponse.data)

      const anySales = productionLinesResponse.data.reduce((acc, line) => {
        if (line.hasSales) {
          const sale = salesResponse.data.find(sale => sale.id === line.id)
          if (sale && sale.listedItems.length > 0) {
            return acc + sale.listedItems.length
          }
        }
        return acc
      }, 0)

      setNewSalesCount(anySales)

    } catch (error) {
      console.log('Error fetching data: ', error)
    }
  }

  // INITIAL PAGE LOAD
  useEffect(() => {

    fetchData()
  }, [])

  // PROGRESS BAR PAGE LOAD
  useEffect(() => {

    if (!loading) return

    const timer = setInterval(() => {
      if (progress < 100) {
        switch (progress) {
          case 0:
            setProgress(25)
            break
          case 25:
            setTimeout(() => {
              setProgress(75)
            }, 1000)
            break
          case 75:
            setProgress(100)
            break
          default:
            break
        }
      } else {
        setLoading(false)
        setProgress(0)
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, progress])


  // Helper function for creating Sales: Quantity
  function getRandomInt(min, max) {
    min = Math.ceil(min / 100) * 100
    max = Math.floor(max / 100) * 100
    return Math.floor(Math.random() * ((max - min) / 100 + 1)) * 100 + min
  }

  // Helper function for creating Sales: Date to be delivered
  function getRandomDate() {
    const today = new Date()
    const randomDays = Math.floor(Math.random() * 30) + 1
    const randomDate = new Date(today)
    randomDate.setDate(today.getDate() + randomDays)
    return `${randomDate.getDate()}/${randomDate.getMonth() + 1}/${randomDate.getFullYear()}`
  }

  // CHECKS IDENTICAL LISTS
  function checkSalesArrays(allSalesItems, totalPatchedSales) {

    if (allSalesItems.length !== totalPatchedSales.length) {
      return false
    }
  
    const saleIds1 = new Set(allSalesItems.map(sale => sale.saleId))
    const saleIds2 = new Set(totalPatchedSales.map(sale => sale.saleId))
    
    if (saleIds1.size !== saleIds2.size) {
      return false
    }

    for (const id of saleIds1) {
      if (!saleIds2.has(id)) {
        return false
      }
    }
    return true
  }

  // GENERATES SALES
  async function generateRandomSales() {

    setLoading(true)

    const randomSales = []

    const totalPatchedSales = []
    const allSalesItems = []

    try {

      const randomCustomers = customers.filter(customer => customer.selected_products.length > 0)
      console.log(randomCustomers)

      randomCustomers.sort(() => 0.5 - Math.random()).slice(0, Math.min(4, randomCustomers.length))
      console.log(randomCustomers)

      for (const customer of randomCustomers) {
        const randomProducts = customer.selected_products.sort(() => 0.5 - Math.random()).slice(0, Math.min(2, customer.selected_products.length))
        console.log(randomProducts)

        for (const product of randomProducts) {
          const foundProduct = products.find(p => p.id === product.value)
          if (foundProduct) {
            randomSales.push({
              saleId: uuidv4(),
              productId: foundProduct.id,
              productName: foundProduct.name,
              customerId: customer.id,
              customerName: customer.name,
              productionLineId: foundProduct.productionLineId,
              status: false,
              quantity: getRandomInt(100, 5000),
              dateToDeliver: getRandomDate()
            })
          } else {
            console.warn(`Skipping product with value ${product.value}. (Not found in products)`)
          }
        }
      }

      console.log('random sales: ', randomSales)

     const salesByProductionLine = randomSales.reduce((acc, oneSale) => {
        const productionLineId = oneSale.productionLineId
        acc[productionLineId] = acc[productionLineId] || []
        acc[productionLineId].push(oneSale)
        return acc
      }, {})

      console.log('sales by production line: ', salesByProductionLine)

      
      for (const productionLineId in salesByProductionLine) {
        const salesItems = salesByProductionLine[productionLineId]

        const patchedSale = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/sales/${productionLineId}`, {
            listedItems: salesItems
          })

        await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productionLines/${productionLineId}`, {
          hasSales: true
        })

        totalPatchedSales.push(...patchedSale.data)
      }

      const updatedSalesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`) 
      setSalesData(updatedSalesResponse.data)

      console.log('updated sales data: ', salesData)

      const updatedProductionLinesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
      setProductionLines(updatedProductionLinesResponse.data)

      console.log('updated production lines: ', productionLines)

      
      for (const sale of updatedSalesResponse.data) {
        if (sale.listedItems.length > 0) {
          allSalesItems.push(...sale.listedItems)
        } 
      }

      const haveIdenticalSales = checkSalesArrays(allSalesItems, totalPatchedSales)
      if (!haveIdenticalSales) {
        throw new Error('Not all sales were updated!')
      }

      setNewSalesCount(allSalesItems.length)

    } catch (error) {
      console.log('Error generating sales: ', error)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {loading ? (
        <Card className="p-4 flex items-center justify-center bg-gray-100">
          <Progress value={progress} className="w-64 bg-blue-200"/>
        </Card>
      ) : (
        <>
          <article className="space-y-4">
            <Link to="/customers" className="block">
              <Card className="transition-transform transform hover:scale-105">
                <CardHeader className="bg-blue-500 text-white">
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>See all customers</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <p>{customers.length > 0 ? `${customers.length} customers registered` : 'No customers found'}</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/managerview" className="block">
              <Card className="transition-transform transform hover:scale-105">
                <CardHeader className="bg-green-500 text-white">
                  <CardTitle>Production</CardTitle>
                  <CardDescription>See production lines</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {productionLines.map(line => line.hasSales && (
                      <p key={line.id} className="text-lg font-medium">{line.name} waiting for actions</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </article>  
          <article>
            <Card>
              <CardHeader className="bg-yellow-500 text-white">
                <CardTitle>Sales Division</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <h6 className="text-lg font-semibold">{newSalesCount > 0 ? `${newSalesCount} new sales!` : 'No new sales'}</h6>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button onClick={generateRandomSales} className="bg-blue-500 text-white hover:bg-blue-600">Check Sales</Button>
              </CardFooter>
            </Card>
          </article>
        </>
      )}
    </div>
  )
}

export default HomePage
