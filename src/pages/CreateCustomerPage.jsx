

import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import CustomerForm from '../components/CustomerForm'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import toast from 'react-hot-toast'
import CustomAlertDialog from '../components/CustomAlertDialog'

function CreateCustomerPage() {

    const navigate = useNavigate()
    const [errorDialogOpen, setErrorDialogOpen] = useState(false)

    const handleCreateCustomer = (newCustomer) => {
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/customers`, newCustomer)
            .then(() => {
                toast.success('New Customer added succesfully!')
                setTimeout(() => {
                    navigate('/customers')
                }, 2000)
            })
            .catch((err) => {
                console.log(err)
                setErrorDialogOpen(true)
            })
    }

    const handleErrorDialogClose = () => {
        setErrorDialogOpen(false)
    }

    const handleRetry = () => {
        setErrorDialogOpen(false)
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
            <CustomAlertDialog 
                isOpen={errorDialogOpen}
                onOpenChange={setErrorDialogOpen}
                title="Error"
                description="Failed to add new customer. Please try again."
                onCancel={handleErrorDialogClose}
                onConfirm={handleRetry}
                confirmText="Retry"
                cancelText='Go back to form'
            />
        </div>
    )

}

export default CreateCustomerPage
