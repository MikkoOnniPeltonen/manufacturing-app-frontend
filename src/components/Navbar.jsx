import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { useState, useEffect } from "react"
import axios from 'axios'
import { useParams, Link, useLocation } from 'react-router-dom'

function Navbar() {

  const [customerName, setCustomerName] = useState('')

  const { customerId } = useParams()
  const location = useLocation()

  useEffect(() => {

    if (customerId) {
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`)
      .then((foundCustomer) => {
        setCustomerName(foundCustomer.data.name)
        console.log('name of customer: ', foundCustomer.data.name)
      })
      .catch((err) => {
        console.error('Error fetching customer: ', err)
        setCustomerName('Customer')
      })
    } else {
      setCustomerName('')
    }
  }, [customerId])

  console.log('customer id is: ', customerId)
  console.log(customerName)
  
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const pathLength = pathSegments.length
  const isEditPage = pathSegments.includes('edit')

  const renderAllCustomers = () => {
    if (pathLength === 1) {
      return (
        <BreadcrumbPage>All Customers</BreadcrumbPage>
      )
    } else if (isEditPage) {
      return (
        <BreadcrumbEllipsis />
      )
    } else {
      return (
        <Link to='/customers'>All Customers</Link>
      )
      
    }
  }
  
  console.log(pathSegments)

  return (
    <header>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to='/'>Home</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {pathSegments.includes('managerview') && (
            <BreadcrumbItem>
              <BreadcrumbPage>Manager View</BreadcrumbPage>
            </BreadcrumbItem>
          )}

          {pathSegments.includes('customers') && (
            <>
              <BreadcrumbItem>
                {renderAllCustomers()}
              </BreadcrumbItem>
              {pathLength >= 2 && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {pathLength === 2 ? (
                      <BreadcrumbPage>
                        {pathSegments[1] === 'create' ? 'Create' : customerName}
                      </BreadcrumbPage>
                    ) : (
                      <Link to={'customers/${customerId'}>{customerName}</Link>
                    )}
                  </BreadcrumbItem>
                </>
              )}

              {isEditPage && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Edit</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

export default Navbar
