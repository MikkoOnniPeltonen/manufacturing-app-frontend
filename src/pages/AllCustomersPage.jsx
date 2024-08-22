
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

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
        <tr key={customer.id}>
          <td><img src={customer.customer_logoURL} alt={`Logo of ${customer.name}`}/></td>
          <td>{customer.name}</td>
          <td>{correspondingSales}</td>
          <td><Link to={`/customers/${customer.id}`}><button>Check Info</button></Link></td>
          <td><Link to={`/customers/${customer.id}/edit`}><button>Edit Customer</button></Link></td>
        </tr>
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
      <h1>Our Customers</h1>
      <div>
        <button><Link to={`/customers/create`}>Create A Customer</Link></button>
      </div>
      <div>
        <button onClick={sortByName}>Sort by Name</button>
        <button onClick={sortBySales}>Sort by Sales</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Brand Logo</th>
            <th>Name</th>
            <th>Sales</th>
            <th>Customer Info</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customerList.map(customer => showCustomerRow(customer).row)}
        </tbody>
      </table>
    </div>
  )
}

export default AllCustomersPage
