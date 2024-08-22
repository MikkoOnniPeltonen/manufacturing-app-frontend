
import axios from 'axios'
import { useState, useEffect } from "react"
import Select from 'react-select'



function CustomerForm({ onSubmit, customerData, buttonText }) {

    const [productList, setProductList] = useState([])
    
    const [customerName, setCustomerName] = useState(customerData?.name || "")
    const [customerLogo, setCustomerLogo] = useState(customerData?.customer_logoURL || "")
    const [contactInfo, setContactInfo] = useState(customerData?.contact || "")
    const [customerAddress, setCustomerAddress] = useState(customerData?.address || "")
    const [selectedProducts, setSelectedProducts] = useState(customerData?.selected_products || [])

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

    const handleSelectChange = (selectedOptions) => {
        setSelectedProducts(selectedOptions)
    }


    function handleSubmit(e) {
        e.preventDefault()

        const customer = {
            name: customerName,
            customer_logoURL: customerLogo,
            contact: contactInfo,
            address: customerAddress,
            selected_products: selectedProducts
        }

        onSubmit(customer)
    }

  return (
    <form onSubmit={handleSubmit}>
        <label>
            Name
            <input type="text" value={customerName} onChange={(e) => {setCustomerName(e.target.value)}}/>
        </label>
        <label>
            Brand Logo
            <input type="text" value={customerLogo} onChange={(e) => {setCustomerLogo(e.target.value)}}/>
        </label>
        <label>
            Contact
            <input type="text" value={contactInfo} onChange={(e) => {setContactInfo(e.target.value)}}/>
        </label>
        <label>
            Address
            <input type="text" value={customerAddress} onChange={(e) => {setCustomerAddress(e.target.value)}}/>
        </label>
        <label>
            Products
            <Select 
            isMulti
            name="products"
            options={options}
            value={selectedProducts}
            onChange={handleSelectChange}
            />
        </label>
        <button>{buttonText}</button>
    </form>
  )
}

export default CustomerForm
