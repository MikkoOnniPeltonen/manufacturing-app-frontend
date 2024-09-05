
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useState, useEffect, useCallback } from 'react'
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

  const [dataMap, setDataMap] = useState(new Map())
  

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [customersResponse, salesResponse, productionLinesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
      ])

      const storedNewSalesCount = localStorage.getItem('newSalesCount')
      const newSalesCount = storedNewSalesCount ? parseInt(storedNewSalesCount, 10) : calculateNewSalesCount(salesResponse.data)

      setDataMap(new Map([
        ['customers', customersResponse.data],
        ['sales', salesResponse.data],
        ['productionLines', productionLinesResponse.data],
        ['newSalesCount', newSalesCount]
      ]))
    } catch (error) {
      console.error('Error fetching initial data: ', error)
    }
  }

  
  const calculateNewSalesCount = useCallback((salesData) => {
    return salesData.reduce((count, sale) => count + sale.listedItems.length, 0)
  }, [])


  const clearExistingSales = async () => {
    const salesData = dataMap.get('sales')
    const clearPromises = salesData.map(sale =>
      axios.patch(`${import.meta.env.VITE_BACKEND_URL}/sales/${sale.id}`, {
        listedItems: []
      })
    )
    await Promise.all(clearPromises)

    const clearedSalesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`)
    if (clearedSalesResponse.data.some(sale => sale.listedItems.length > 0)) {
      throw new Error('Failed to clear all sales!')
    }
  }

  // PROGRESS BAR PAGE LOAD
  const useProgressBar = (initialLoading = false) => {
    const [loading, setLoading] = useState(initialLoading)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
      if (!loading) return
  
      const progressSteps = [0, 25, 75, 100]
      let currentStepIndex = 0
  
      const timer = setInterval(() => {
        if (currentStepIndex < progressSteps.length) {
          setProgress(progressSteps[currentStepIndex])
          currentStepIndex++
        } else {
          clearInterval(timer)
        }
      }, 1000)
  
      return () => clearInterval(timer)
    }, [loading])

    return { loading, setLoading, progress, setProgress }
  }

  const { loading, setLoading, progress, setProgress} = useProgressBar()

  const handleGenerateRandomSales = async () => {

    setLoading(true)
    try {

      await clearExistingSales()
      setProgress(25)

      const customers = dataMap.get('customers')
      const randomCustomers = customers
      .filter(customer => customer.selected_products.length > 0)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)



      const productsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/products`)
      const products = productsResponse.data
      
      const randomSales = generateRandomSales(randomCustomers, products)
      setProgress(50)

      const salesByProductionLine = randomSales.reduce((acc, oneSale) => {
         const { productionLineId } = oneSale
         acc[productionLineId] = acc[productionLineId] || []
         acc[productionLineId].push(oneSale)
         return acc
       }, {})
 
      const updatePromises = Object.entries(salesByProductionLine).map(async ([productionLineId, salesItems]) => {
        await Promise.all([
          axios.patch(`${import.meta.env.VITE_BACKEND_URL}/sales/${productionLineId}`, {
            listedItems: salesItems
          }),
          axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productionLines/${productionLineId}`, {
            hasSales: true
          })
        ])
        return salesItems
      })
 
      const updatedSalesItems = (await Promise.all(updatePromises)).flat()
      setProgress(75)

      const [updatedSalesResponse, updatedProductionLinesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
      ])

      const newSalesCount = calculateNewSalesCount(updatedSalesResponse.data)
 
      setDataMap(new Map([
        ...dataMap,
        ['sales', updatedSalesResponse.data],
        ['productionLines', updatedProductionLinesResponse.data],
        ['newSalesCount', newSalesCount]
      ]))
 
      localStorage.setItem('newSalesCount', newSalesCount)
      const allUpdatedSalesItems = updatedSalesResponse.data.flatMap(sale => sale.listedItems)
 
 
      if (!areArraysIdentical(allUpdatedSalesItems, updatedSalesItems)) {
        throw new Error('Not all sales were updated!')
      }
      setProgress(100)
    } catch (error) {
      console.error('Error generating sales: ', error)
    } finally {
      setLoading(false)
    }
  }


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

  // Helper function for efficient shuffling
  const shuffleArray = (array) => {
    for (let i = array.length -1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array
  }

  // CHECKS IDENTICAL LISTS
  function areArraysIdentical(array1, array2) {

    if (array1.length !== array2.length) {
      return false
    }
  
    const saleIds1 = new Set(array1.map(sale => sale.saleId))
    const saleIds2 = new Set(array2.map(sale => sale.saleId))
    
    if (saleIds1.size !== saleIds2.size) {
      return false
    }
    return Array.from(saleIds1).every(id => saleIds2.has(id))
  }


  // GENERATES SALES
  const generateRandomSales = (customers, products) => {

    const randomSales = []
    const productMap = new Map(products.map(p => [p.id, p]))

    customers.forEach(customer => {
      const randomProducts = shuffleArray(customer.selected_products).slice(0, 2)

      randomProducts.forEach(productId => {
        const product = productMap.get(productId)
        if (product) {
          randomSales.push({
            saleId: uuidv4(),
            productId: product.id,
            productName: product.name,
            customerId: customer.id,
            customerName: customer.name,
            productionLineId: product.productionLineId,
            status: false,
            quantity: getRandomInt(100, 5000),
            dateToDeliver: getRandomDate()
          })
        }
      })
    })

    return randomSales
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
                  <p>{dataMap.get('customers')?.length > 0 ? `${dataMap.get('customers').length} customers registered` : 'No customers found'}</p>
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
                    {dataMap.get('productionLines')?.map(line => line.hasSales && (
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
                <h6 className="text-lg font-semibold">{dataMap.get('newSalesCount') > 0 ? `${dataMap.get('newSalesCount')} new sales!` : 'No new sales'}</h6>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button onClick={handleGenerateRandomSales} className="bg-blue-500 text-white hover:bg-blue-600">Check Sales</Button>
              </CardFooter>
            </Card>
          </article>
        </>
      )}
    </div>
  )
}

export default HomePage
