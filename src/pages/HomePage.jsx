
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
      const productionLinesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
      setProductionLines(productionLinesResponse.data)

      const salesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`)
      setSalesData(salesResponse.data)

      const customersResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`)
      setCustomers(customersResponse.data)

      const productsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/products`)
      setProducts(productsResponse.data)

      if (newSalesCount !== 0) {
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
      }
      

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
    const timer = setInterval(() => {
      if (progress < 100) {
        switch (progress) {
          case 0:
            setProgress(25);
            break;
          case 25:
            setTimeout(() => {
              setProgress(75)
            }, 1000);
            break;
          case 75:
            setProgress(100);
            break;
          default:
            break;
        }
      } else {
        setLoading(false)
        setProgress(0)
        clearInterval(timer)
      }
    }, 1000)

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
    <div>
      {loading ? (
        <Progress value={progress} />
      ) : (
        <>
          <article>
            <Link to="/customers">
              <Card>
                <CardHeader>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>see all customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    {customers.length > 0 ? (<p>{customers.length} customers registered</p>) : (<p>No customers found</p>)}
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/managerview">
              <Card>
                <CardHeader>
                  <CardTitle>Production</CardTitle>
                  <CardDescription>see production lines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    {productionLines.map((line) => {
                      if (line.hasSales) {
                        return (
                          <div key={line.id}>
                            <p>{line.name} waiting for actions</p>
                          </div>
                        )
                      }
                    })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </article>  
          <article>
            <Card>
              <CardHeader>
                <CardTitle>Sales Division</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  {newSalesCount.length > 0 ? (<h6>{newSalesCount} new sales!</h6>) : (<h6>No new sales</h6>)}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={generateRandomSales}>Check Sales</Button>
              </CardFooter>
            </Card>
          </article>
        </>
      )}
    </div>
  )
}

export default HomePage
