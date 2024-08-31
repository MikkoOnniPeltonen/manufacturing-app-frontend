

import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import CustomerForm from '../components/CustomerForm'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

function CreateCustomerPage() {

    const navigate = useNavigate()

    const handleCreateCustomer = (newCustomer) => {
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/customers`, newCustomer)
        .then(() => {
            alert('New Customer added!')
            navigate('/customers')
        })
        .catch((err) => {
            console.log(err)
        })
    }


    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Create Customer</CardTitle>
                </CardHeader>
                <CardContent>
                    <CustomerForm onSubmit={handleCreateCustomer} buttonText="Create Customer" />
                </CardContent>
            </Card>  
        </div>
    )

}

export default CreateCustomerPage
