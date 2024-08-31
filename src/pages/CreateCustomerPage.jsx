

import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import CustomerForm from '../components/CustomerForm'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { useToast } from '@/hooks/use-toast'

function CreateCustomerPage() {

    const navigate = useNavigate()
    const toast = useToast()

    const handleCreateCustomer = (newCustomer) => {
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/customers`, newCustomer)
            .then(() => {
                toast.success('New Customer added succesfully!')
                navigate('/customers')
            })
            .catch((err) => {
                console.log(err)
                toast.error('Failed to add new customer.')
            })
    }


    return (
        <div className="max-w-2xl mx-auto my-8">
            <Card className="shadow-lg rounded-lg">
                <CardHeader className="p-4 bg-gray-100">
                    <CardTitle className="text-xl font-semibold">Create Customer</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <CustomerForm onSubmit={handleCreateCustomer} buttonText="Create Customer" />
                </CardContent>
            </Card>  
        </div>
    )

}

export default CreateCustomerPage
