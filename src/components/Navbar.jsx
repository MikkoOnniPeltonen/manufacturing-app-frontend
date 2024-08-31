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

  const [currentCustomer, setCurrentCustomer] = useState(null)

  const { customerId } = useParams()
  const location = useLocation()

  useEffect(() => {

    if (customerId) {

      axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`)
        .then((foundCustomer) => {
          setCurrentCustomer(foundCustomer.data)
        })
        .catch((err) => {
          console.log(err)
        })
    }
    
  }, [customerId])

  console.log('customer id is: ', customerId)
  console.log(currentCustomer)

  const pathSegments = location.pathname.split('/').filter(Boolean)

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
              {customerId ? (
                pathSegments.includes('edit') ? (
                  <>
                    <BreadcrumbEllipsis />
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <Link to={`/customers/${customerId}`}>
                        {currentCustomer ? currentCustomer.name : 'Customer'}
                      </Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Edit</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <>
                    <BreadcrumbItem>
                      <Link to='/customers'>All Customers</Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {currentCustomer ? currentCustomer.name : 'Customer'}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )
              ) : (
                pathSegments.includes('create') ? (
                  <>
                    <BreadcrumbItem>
                      <Link to='/customers'>All Customers</Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Create</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>All Customers</BreadcrumbPage>
                  </BreadcrumbItem>
                ) 
              )}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

export default Navbar
