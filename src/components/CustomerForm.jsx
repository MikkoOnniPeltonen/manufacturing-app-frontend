
import axios from 'axios'
import { useState, useEffect } from "react"
import Select from 'react-select'
import { useForm } from 'react-hook-form'



function CustomerForm({ onSubmit, customerData={}, buttonText }) {

    const { 
        register, 
        handleSubmit,
    } = useForm({ defaultValues: customerData,
        resolver: ({ values }) => ({
            name: values.name,
            customer_logoURL: values.logo,
            contact: values.contact,
            address: values.address,
            selected_products: values.selectedProducts,
            delivered: values.delivered || [],
        })
     })

    const [productList, setProductList] = useState([])

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/products`)
        .then((allProducts) => {
            setProductList(allProducts.data)
        })
        .catch((err) => {
            console.log(err)
        })

    }, [])


    const options = productList.map((oneProduct) => ({
        value: oneProduct.id,
        label: oneProduct.name
    }))

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor='name'>
            Name
            <input type="text" 
                {...register('name', { required: true })}
                placeholder='Enter Customer Name'
                id='name'
            />
        </label>
        <label htmlFor='logo'>
            Brand Logo
            <input type="text" 
                {...register('logo', { required: true })}
                placeholder='Enter Customer logo URL'
                id='logo'
            />
        </label>
        <label htmlFor='contact'>
            Contact
            <input type="text"
                {...register('contact', { required: true })}
                placeholder='Enter Customer Contact info'
                id='contact'
            />
        </label>
        <label htmlFor='address'>
            Address
            <input type="text" 
                {...register('address', { required: true })}
                placeholder='Enter Customer address'
                id='address'
            />
        </label>
        <label htmlFor='selectedProducts'>
            Products
            <Select 
                isMulti
                name="selectedProducts"
                options={options}
                {...register('selectedProducts', { required: true })}
                placeholder='Select products'
                id='selectedProducts'
            />
        </label>
        <button>{buttonText}</button>
    </form>
  )
}

export default CustomerForm
