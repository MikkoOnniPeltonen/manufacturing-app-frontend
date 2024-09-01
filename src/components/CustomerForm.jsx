
import axios from 'axios'
import { useState, useEffect } from "react"
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'


function CustomerForm({ onSubmit, customerData={}, buttonText }) {

    const { 
        register, 
        handleSubmit,
        control,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: customerData.name || '',
            customer_logoURL: customerData.customer_logoURL || '',
            contact: customerData.contact || '',
            address: customerData.address || '',
            selected_products: customerData.selected_products || [],
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 bg-white rounded-lg shadow-lg max-w-md mx-auto">
            <div className="mb-4">
                <label htmlFor='name' className="block text-sm font-medium text-gray-700">Name</label>
                <input 
                    type="text" 
                    {...register('name', { required: "Customer name is required" })}
                    placeholder='Enter Customer Name'
                    id='name'
                    className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div className="mb-4">
                <label htmlFor='customer_logoURL' className="block text-sm font-medium text-gray-700">Brand Logo</label>
                <input 
                    type="text" 
                    {...register('customer_logoURL', { required: "Customer logo is required" })}
                    placeholder='Enter Customer logo URL'
                    id='customer_logoURL'
                    className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo.message}</p>}
            </div>
            <div className="mb-4">
                <label htmlFor='contact' className="block text-sm font-medium text-gray-700">Contact</label>
                <input 
                    type="text" 
                    {...register('contact', { required: "Customer contact is required" })}
                    placeholder='Enter Customer contact info'
                    id='contact'
                    className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact.message}</p>}
            </div>
            <div className="mb-4">
                <label htmlFor='address' className="block text-sm font-medium text-gray-700">Address</label>
                <input 
                    type="text" 
                    {...register('address', { required: "Customer address is required" })}
                    placeholder='Enter Customer Address'
                    id='address'
                    className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>
            <div className="mb-4">
                <label htmlFor='selected_products' className="block text-sm font-medium text-gray-700">Products</label>
                <Controller 
                    name="selected_products"
                    control={control}
                    render={({ field }) => (
                        <Select 
                            isMulti
                            options={options}
                            value={options.filter(option => field.value?.includes(option.value))}
                            onChange={selectedOptions => {
                                setValue('selected_products', selectedOptions.map(option => option.value))
                            }}
                            placeholder='Select products'
                            id='selected_products'
                            className="mt-1"
                        />
                    )}
                />
            </div>
            <button type='submit' className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{buttonText}</button>
        </form>
    )
}

export default CustomerForm
