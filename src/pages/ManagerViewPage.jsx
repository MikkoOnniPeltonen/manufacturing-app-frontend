
import axios from 'axios'
import { useState, useEffect, useRef } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'

function ManagerViewPage() {

  const [productionLines, setProductionLines] = useState([])
  const [allSales, setAllSales] = useState([])

  const [productionLineId, setProductionLineId] = useState(null)
  const [showSales, setShowSales] = useState([])

  const [allProductsInProduction, setAllProductsInProduction] = useState([])

  const [selectedItems, setSelectedItems] = useState([])
  const [inProductionItems, setInProductionItems] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  const parentRef = useRef(null)

  useAutoAnimate(parentRef)

  async function fetchData() {

    try {
      const productionLinesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
      setProductionLines(productionLinesResponse.data)

      const allSalesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales`)
      setAllSales(allSalesResponse.data)

    } catch (err) {
      console.log(err)
    }

  }

  useEffect(() => {
    fetchData()

  }, [])


  useEffect(() => {

    const productionLineSale = allSales.find(sale => sale.id === productionLineId)
    console.log(productionLineSale)
    if(productionLineId && productionLineSale){
      const filteredSales = productionLineSale.listedItems.map(oneSale => oneSale)
      setShowSales(filteredSales)      
    }
   
  }, [productionLineId])

  // HANDLE EDIT
  const handleEdit = () => {
    const foundProductionLine = productionLines.find(line => line.id === productionLineId)
    if(foundProductionLine.hasSales) {
      axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productionLines/${productionLineId}`, {
        hasSales: false
      })
      .then(() => {
        return axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
      })
      .then((updatedProductionLines) => {
        setProductionLines(updatedProductionLines.data)
        setSelectedItems(showSales)
      })
      .catch((err) => {
        console.log(err)
      })
    }
    
      
  }

  // MOVE ITEMS IN EDIT
  const moveItem = (index, direction) => {
    const newItems = [...selectedItems]
    const [movedItem] = newItems.splice(index, 1)
    newItems.splice(index + direction, 0, movedItem)
    setSelectedItems(newItems)
  }

  // CHECK IDENTICAL LISTS
  function checkSalesArrays(salesItemsByProduction, totalPatchedProducts) {

    if (salesItemsByProduction.length !== totalPatchedProducts.length) {
      return false;
    }

    const saleIds1 = salesItemsByProduction.map(sale => sale.saleId).sort();
    const saleIds2 = totalPatchedProducts.map(sale => sale.saleId).sort();
  
    for (let i = 0; i < saleIds1.length; i++) {
      if (saleIds1[i] !== saleIds2[i]) {
        return false;
      }
    }

    return true;
  }

  // HANDLE SAVE OF EDITED LIST
  async function handleSave() {

    try {

      const totalPatchedProducts = []

      const patchingData = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`, {
        inProductionItems: selectedItems
      })
      totalPatchedProducts.push(...patchingData.data)

      const newProductionList = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`)
      setAllProductsInProduction(newProductionList.data)

      const salesItemsByProduction = []
      if (allProductsInProduction.inProductionItems.length > 0) {
          salesItemsByProduction.push(...allProductsInProduction.inProductionItems)
        }
      
      console.log(totalPatchedProducts)
      console.log(salesItemsByProduction)
      const haveIdenticalSales = checkSalesArrays(salesItemsByProduction, totalPatchedProducts)
      if (!haveIdenticalSales) {
        throw new Error('Sales are not identical!')
      }

      setInProductionItems(selectedItems)
      setSelectedItems([])
      
    } catch (error) {
      console.log('Error saving data: ', error)
    }
  }

  // BEGIN PRODUCTION
  async function handleStart() {

    if (isProcessing) {
      return
    }

    setIsProcessing(true)

    try {

      if (inProductionItems.length === 0) {
        setIsProcessing(false)
        return
      }
  
      const processItem = async (item, remainingItems) => {
        
        try {
          const productionLine = productionLines.find(line => line.id === productionLineId)
          if (!productionLine) {
            console.error("Production line not found")
            setIsProcessing(false)
            return
          }
          const timeToProcess = (item.quantity / productionLine.capacity) * 10000
  
          await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`, {
            inProductionItems: remainingItems
          })

          const customerResponse =  await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${item.customerId}`)
          const customer = customerResponse.data

          await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/customers/${item.customerId}`, {
            delivered: [...customer.delivered, item]
          })

          setInProductionItems(remainingItems)

          if (remainingItems.length > 0) {
            setTimeout(() => processItem(remainingItems[0], remainingItems.slice(1)), timeToProcess)
          } else {
            setIsProcessing(false)
          }

        } catch (error) {
          console.log('Error in patching data to customers: ', error)
          setIsProcessing(false)
          console.warn('isProcessing state was set to false')
        }
      }

      processItem(inProductionItems[0], inProductionItems.slice(1))

    } catch (error) {
      console.log('Error in production: ', error)
      setIsProcessing(false)
      console.warn('isProcessing state was set to false')
    }
  }


  return (
    <div>
      <div>
        <div>
          {productionLines.map((productionLine) => {
            return (
              <button key={productionLine.id} onClick={() => {setProductionLineId(productionLine.id)}}>
                {productionLine.name}
              </button>
            )
          })}
        </div>
        <div>
          <div>
            <button onClick={handleEdit}>EDIT</button>
            <div>
              <ul>
                {showSales.map((item) => {
                  return (
                    <li key={item.saleId}>
                      <p>{item.productName} - {item.quantity}</p>
                      <p>{item.customerName} - {item.dateToDeliver}</p>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div>
            <button onClick={handleSave}>SAVE</button>
            <div>
              <ul ref={parentRef}>
                {selectedItems.map((item, index) =>{ 
                  return(
                    <li key={item.saleId}>
                      <p>{item.productName} - {item.quantity}</p>
                      <p>{item.customerName} - {item.dateToDeliver}</p>
                      <button onClick={() => moveItem(index, -1)} disabled={index === 0}>
                        <FontAwesomeIcon icon={faArrowUp} />
                      </button>
                      <button onClick={() => moveItem(index, 1)} disabled={index === selectedItems.length -1}>
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div>
            <button onClick={handleStart}>START</button>
            <div>
              <ul>
                {inProductionItems.map((item) => {
                  return (
                    <li key={item.saleId}>
                      <p>{item.productName} - {item.quantity}</p>
                      <p>{item.customerName} - {item.dateToDeliver}</p>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerViewPage
