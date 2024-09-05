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
import { Link, useLocation } from 'react-router-dom'

function Navbar() {

  const [customerName, setCustomerName] = useState('')

  const location = useLocation()

  const extractCustomerId = (path) => {
    const match = path.match(/\/customers\/(\d+)/)
    return match ? match[1] : null
  }

  useEffect(() => {

    const customerId = extractCustomerId(location.pathname)
    if (customerId) {
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`)
      .then((response) => {
        setCustomerName(response.data.name)
      })
      .catch((err) => {
        console.error('Error fetching customer: ', err)
        setCustomerName('Customer')
      })
    } else {
      setCustomerName('')
    }
  }, [location])
  
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
                      <Link to={`customers/${pathSegments[1]}`}>{customerName}</Link>
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
