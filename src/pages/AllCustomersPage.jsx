
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"

function AllCustomersPage() {

  const [customerList, setCustomerList] = useState([])
  const [customerSales, setCustomerSales] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchCustomerData() {

    try {

      const customersResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`)
      setCustomerList(customersResponse.data)

      const customerSalesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`)
      const allSales = customerSalesResponse.data.flatMap(sale => sale.listedItems || [])
      setCustomerSales(allSales)

    } catch (error) {
      console.log('Error fetching data: ', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    fetchCustomerData()
  }, [])

  function showCustomerRow(customer) {

    const correspondingSales = customerSales.filter(oneSale => oneSale.customerId === customer.id).length 
    
    return {
      customer,
      correspondingSales,
      row: (
        <TableRow key={customer.id}>
          <TableCell><img src={customer.customer_logoURL} alt={`Logo of ${customer.name}`} className="h-20 w-20 object-cover rounded-full shadow-md"/></TableCell>
          <TableCell>{customer.name}</TableCell>
          <TableCell>{correspondingSales}</TableCell>
          <TableCell><Link to={`/customers/${customer.id}`}><Button variant='outline'>Check Info</Button></Link></TableCell>
          <TableCell><Link to={`/customers/${customer.id}/edit`}><Button variant='outline'>Edit Customer</Button></Link></TableCell>
        </TableRow>
      )
    }
  }

  function sortByName() {
    const copiedCustomers = [...customerList]
    copiedCustomers.sort((a,b) => {
      return a.name.localeCompare(b.name)
    })
    setCustomerList(copiedCustomers)
  }

  function sortBySales() {
    const customerRowsWithSales = customerList.map(showCustomerRow)

    customerRowsWithSales.sort((a, b) => b.correspondingSales - a.correspondingSales)
    
    setCustomerList(customerRowsWithSales.map(item => item.customer))
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-100 via-white to-blue-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-lg rounded-lg bg-white">
          <CardHeader className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle className="text-3xl font-semibold">Our Customers</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Button className="bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-md hover:from-green-500 hover:to-blue-600 transition-all duration-300"><Link to={`/customers/create`}>Create A Customer</Link></Button>
              <div>
                <Button onClick={sortByName} className="bg-blue-500 text-white mr-2 hover:bg-blue-600 transition-all duration-300 shadow-md">Sort by Name</Button>
                <Button onClick={sortBySales} className="bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 shadow-md">Sort by Sales</Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Customer Info</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerList.map(customer => showCustomerRow(customer).row)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AllCustomersPage
