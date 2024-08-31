
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
import { useToast } from '@/hooks/use-toast'
import LoadingSpinner from '../components/LoadingSpinner'

function EditCustomerPage() {

    const [customer, setCustomer] = useState(null)
    const [loading, setLoading] = useState(true)

    const { customerId } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    useEffect(() => {

        axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`)
        .then((oneCustomer) => {
            setCustomer(oneCustomer.data)
            setLoading(false)
        })
        .catch((err) => {
            console.log(err)
            toast.error("Failed to fetch customer data.")
            setLoading(false)
        })

    }, [customerId])

    function handleEditCustomer(updatedCustomer) {
        axios.put(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`, updatedCustomer)
            .then(() => {
                toast.success('Customer updated succesfully!')
                navigate(`/customers/${customerId}`)
            })
            .catch((err) => {
                console.log(err)
                toast.error('Failed to update customer.')
            })
    }

    function handleDeleteCustomer() {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            axios.delete(`${import.meta.env.VITE_BACKEND_URL}/customers/${customerId}`)
                .then(() => {
                    toast.success('Customer deleted!')
                    navigate('/customers')
                })
                .catch((err) => {
                    console.log(err)
                    toast.error('Failed to delete customer.')
                })
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto my-8">
            {customer && (
                <Card className="shadow-lg rounded-lg">
                    <CardHeader className="p-4 bg-gray-100">
                        <CardTitle className="text-xl font-semibold">Edit Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <CustomerForm onSubmit={handleEditCustomer} customerData={customer} buttonText="Update Customer" />
                        <Button onClick={handleDeleteCustomer} className="mt-4 bg-red-500 hover:bg-red-600 text-white">Delete Customer</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default EditCustomerPage
