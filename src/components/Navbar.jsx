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

  const [allCustomers, setAllCustomers] = useState([])

  const { customerId } = useParams()
  const location = useLocation()

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers`)
    .then((foundCustomers) => {
      setAllCustomers(foundCustomers.data)
    })
    .catch((err) => {
      console.log(err)
    })
  }, [])


  const currentCustomer = allCustomers.find(customer => customer.id === customerId)
  const pathSegments = location.pathname.split('/').filter(Boolean)

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
              {customerId ? (
                <>
                  {pathSegments.includes('edit') ? (
                    <>
                      <BreadcrumbEllipsis />
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <Link to={`/customers/${customerId}`}>{currentCustomer.name}</Link>
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
                          {currentCustomer.name}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </>
              ) : (
                <>
                  {pathSegments.includes('create') ? (
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
                  )}
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
