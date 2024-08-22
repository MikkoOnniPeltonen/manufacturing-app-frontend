

import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import CustomerForm from '../components/CustomerForm'

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
            <h1>Create Customer</h1>
            <CustomerForm onSubmit={handleCreateCustomer} buttonText="Create Customer" />
        </div>
    )

}

export default CreateCustomerPage
