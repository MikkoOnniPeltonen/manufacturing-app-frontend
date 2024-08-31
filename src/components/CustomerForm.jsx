
import axios from 'axios'
import { useState, useEffect } from "react"
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'



function CustomerForm({ onSubmit, customerData={}, buttonText }) {

    const { 
        register, 
        handleSubmit,
        control,
        setValue
    } = useForm({
        defaultValues: {
            name: customerData.name || '',
            logo: customerData.customer_logoURL || '',
            contact: customerData.contact || '',
            address: customerData.address || '',
            selectedProducts: customerData.selected_products || [],
            delivered: customerData.delivered || [],
        }
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
                <Controller 
                    name="selectedProducts"
                    control={control}
                    render={({ field }) => (
                        <Select 
                            isMulti
                            options={options}
                            value={options.filter(option => field.value.includes(option.value))}
                            onChange={selectedOptions => {
                                setValue('selectedProducts', selectedOptions.map(option => option.value))
                            }}
                            placeholder='Select products'
                            id='selectedProducts'
                        />
                    )}
                />
            </label>
            <button type='submit'>{buttonText}</button>
        </form>
    )
}

export default CustomerForm
