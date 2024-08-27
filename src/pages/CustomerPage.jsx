
import axios from 'axios'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'


function CustomerPage() {

  const [customer, setCustomer] = useState(null)
  const { customerId } = useParams()

  useEffect(() => {

    axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`)
    .then((oneCustomer) => {
      setCustomer(oneCustomer.data)
    })
    .catch((err) => {
      console.log(err)
    })

  }, [customerId])

  return (
    <div>
      {customer && (
        <div>
          <div>
            <img src={customer.customer_logoURL} alt={`pic not loading`}/>
            <h1>{customer.name}</h1>
            <div>
              <h5>{customer.contact}</h5>
              <p>{customer.address}</p>
            </div>
          </div>
          <div>
            <ul>
              {customer.selected_products && (customer.selected_products.map((oneSelectedProduct) => {
                return(
                  <li key={oneSelectedProduct.value}>{oneSelectedProduct.label}</li>
                )
              }))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerPage
