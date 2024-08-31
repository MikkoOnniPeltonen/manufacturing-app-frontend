
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

  async function fetchCustomerData() {

    try {

      const customersResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`)
      setCustomerList(customersResponse.data)

      const customerSalesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`)
      const allSales = customerSalesResponse.data.flatMap(sale => sale.listedItems || [])
      setCustomerSales(allSales)

    } catch (error) {
      console.log('Error fetching data: ', error)
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
          <TableCell><img src={customer.customer_logoURL} alt={`Logo of ${customer.name}`} style={{"height": 105}}/></TableCell>
          <TableCell>{customer.name}</TableCell>
          <TableCell>{correspondingSales}</TableCell>
          <TableCell><Link to={`/customers/${customer.id}`}><button>Check Info</button></Link></TableCell>
          <TableCell><Link to={`/customers/${customer.id}/edit`}><button>Edit Customer</button></Link></TableCell>
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

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Our Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Button><Link to={`/customers/create`}>Create A Customer</Link></Button>
          </div>
          <div>
            <Button onClick={sortByName}>Sort by Name</Button>
            <Button onClick={sortBySales}>Sort by Sales</Button>
          </div>
          <div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AllCustomersPage
