
import axios from 'axios'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CustomerForm from '../components/CustomerForm'

function EditCustomerPage() {

    const [customer, setCustomer] = useState(null)

    const { customerId } = useParams()
    const navigate = useNavigate()

    useEffect(() => {

        axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`)
        .then((oneCustomer) => {
            setCustomer(oneCustomer.data)
        })
        .catch((err) => {
            console.log(err)
        })

    }, [customerId])

    function handleEditCustomer(updatedCustomer) {
        axios.put(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`, updatedCustomer)
        .then(() => {
            alert('Customer updated!')
            navigate(`/customers/${customerId}`)
        })
        .catch((err) => {
            console.log(err)
        })
    }

    function handleDeleteCustomer() {
        axios.delete(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`)
        .then(() => {
            alert('Customer deleted!')
            navigate('/customers')
        })
        .catch((err) => {
            console.log(err)
        })
    }
    return (
        <div>
        {customer && (
            <div>
                <h1>Edit Customer</h1>
                <CustomerForm onSubmit={handleEditCustomer} customerData={customer} buttonText="Update Customer" />
                <button onClick={handleDeleteCustomer}>Delete Customer</button>
            </div>
        )}
        </div>
    )
}

export default EditCustomerPage
