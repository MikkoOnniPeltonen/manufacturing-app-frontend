
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useState, useEffect } from 'react'

function HomePage() {

  const [productionLines, setProductionLines] = useState([])
  const [salesData, setSalesData] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)


  async function fetchData() {
    try {
      const productionLinesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
      setProductionLines(productionLinesResponse.data)

      const salesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`)
      setSalesData(salesResponse.data)

      const customersResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`)
      setCustomers(customersResponse.data)

    } catch (error) {
      console.log('Error fetching data: ', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])


  // Helper functions for creating Sales
  function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  function getRandomDate() {
    const today = new Date()
    const randomDays = getRandomInt(1, 30)
    const randomDate = new Date(today)
    randomDate.setDate(today.getDate() + randomDays)
    return `${randomDate.getDate()}/${randomDate.getMonth() + 1}/${randomDate.getFullYear()}`
  }

  async function generateRandomSales() {

    setLoading(true)
    try {

      const randomCustomers = customers.sort(() => 0.5 - Math.random()).slice(0, getRandomInt(1, customers.length))

      const randomSales = []
      for (const customer of randomCustomers) {
        const randomProducts = customer.selected_products.sort(() => 0.5 - Math.random()).slice(0, getRandomInt(1, customer.selected_products.length))
        for (const product of randomProducts) {
          randomSales.push({
            productId: product.id,
            productName: product.name,
            customerId: customer.id,
            customerName: customer.name,
            productionLineId: product.productionLineId,
            quantity: getRandomInt(100, 5000),
            dateToDeliver: getRandomDate()
          })
        }
      }

      const salesByProductionLine = randomSales.reduce((acc, oneSale) => {
        acc[oneSale.productionLineId] = acc[oneSale.productionLineId] || []
        acc[oneSale.productionLineId].push(oneSale)
      }, {})

      for (const productionLineId in salesByProductionLine) {
        const salesItems = salesByProductionLine[productionLineId]

          await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/sales/${productionLineId}`, {
            listedItems: salesItems
          })
      }

      const updatedSalesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`)
      setSalesData(updatedSalesResponse.data)

    } catch (error) {
      console.log('Error generating sales: ', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {loading ? (
        <div className='loading-screen'>
          <p>Fetching sales, please wait...</p>
        </div>
      ) : (
        <>
          <div>
            <Link to="/customers">
              <div>
                <h2>Customers</h2>
                <p>{customers.length > 0 ? `${customers.length} customers registered` : 'Loading customers...'}</p>
              </div>
            </Link>
          </div>
          <div>
            <Link to="/managerview">
              <div>
                <h2>Production</h2>
                <div>
                  {salesData.map((oneSale) => {
                    const correspondingProductionLine = productionLines.find((line) => line.id === oneSale.id)

                    return (
                      <div key={oneSale.id}>
                        {oneSale.listedItems.length > 0 && correspondingProductionLine && (
                          <p>{correspondingProductionLine.name} waiting for actions</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </Link>
          </div>
          <div>
            <h3>Sales Division</h3>
            <button onClick={generateRandomSales}>Check Sales</button>
          </div>
        </>
      )}
    </div>
  )
}

export default HomePage
