
import axios from 'axios'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import CustomerForm from '../components/CustomerForm'

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from '@/components/ui/button'

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
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CustomerForm onSubmit={handleEditCustomer} customerData={customer} buttonText="Update Customer" />
                        <Button onClick={handleDeleteCustomer}>Delete Customer</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default EditCustomerPage
