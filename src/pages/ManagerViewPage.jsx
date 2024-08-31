
import axios from 'axios'
import { useState, useEffect, useRef } from 'react'

import { useAutoAnimate } from '@formkit/auto-animate/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'


function ManagerViewPage() {

  const [productionLines, setProductionLines] = useState([])
  const [allSales, setAllSales] = useState([])

  const [productionLineId, setProductionLineId] = useState(null)
  const [showSales, setShowSales] = useState([])
  const [currentProductionLine, setCurrentProductionLine] = useState(null)

  const [productionItemCount, setProductionItemCount] = useState(0)

  const [selectedItems, setSelectedItems] = useState([])
  const [inProductionItems, setInProductionItems] = useState([])

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

    if (productionLineId) {
      const foundProductionLine = productionLines.find(line => line.id === productionLineId)
      setCurrentProductionLine(foundProductionLine)
      const productionLineSale = allSales.find(sale => sale.id === productionLineId)
      
      if (productionLineSale) {
        console.log('Sales based on production line: ', productionLineSale)
        const filteredSales = productionLineSale.listedItems.map(oneSale => oneSale)
        setShowSales(filteredSales) 
      }
      setSelectedItems([])
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`)
      .then((response) => {
        setInProductionItems(response.data.inProductionItems)
        setProductionItemCount(response.data.inProductionItems.length)
      })
      .catch((err) => {
        console.log(err)
      })
    }
    
  }, [productionLineId])


  // HANDLE EDIT
  const handleEdit = () => {

    if (selectedItems.length > 0) {
      return
    }

    if(currentProductionLine.hasSales) {
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
      return false
    }

    const saleIds1 = new Set(salesItemsByProduction.map(sale => sale.saleId))
    const saleIds2 = new Set(totalPatchedProducts.map(sale => sale.saleId))
  
    if (saleIds1.size !== saleIds2.size) {
      return false
    }

    for (const id of saleIds1) {
      if (!saleIds2.has(id)) {
        return false
      }
    }
    return true
  }


  // HANDLE SAVE OF EDITED LIST
  async function handleSave() {

    if (selectedItems.length === 0) {
      return
    }
    setIsSaving(true)

    const totalPatchedProducts = []
    const salesItemsByProduction = []

    try {

      const patchingData = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`, {
        inProductionItems: selectedItems
      })
      totalPatchedProducts.push(...patchingData.data)

      const newProductionList = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`)

      
      if (newProductionList.data.inProductionItems.length > 0) {
          salesItemsByProduction.push(...newProductionList.data.inProductionItems)
        }
      
      console.log('patched products: ', totalPatchedProducts)
      console.log('updated production lists: ', salesItemsByProduction)

      const haveIdenticalSales = checkSalesArrays(salesItemsByProduction, totalPatchedProducts)
      if (!haveIdenticalSales) {
        throw new Error('Sales are not identical!')
      }

      setInProductionItems(newProductionList.data.inProductionItems)
      setSelectedItems([])
      setIsSaving(false)
      
    } catch (error) {
      console.log('Error saving data: ', error)
      setIsSaving(false)
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
          if (!currentProductionLine) {
            console.error("Production line not found")
            setIsProcessing(false)
            return
          }
          const timeToProcess = (item.quantity / currentProductionLine.capacity) * 10000
  
          await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`, {
            inProductionItems: remainingItems
          })

          const customerResponse =  await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${item.customerId}`)

          item.status = true

          await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/customers/${item.customerId}`, {
            delivered: [...customerResponse.data.delivered, item]
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
        <aside>
          {productionLines.map((productionLine) => {
            return (
              <Card key={productionLine.id} onClick={() => {setProductionLineId(productionLine.id)}} disabled={isProcessing || isSaving} className="relative max-w-xs overflow-hidden rounded-2xl shadow-lg group">
                <CardHeader>{productionLine.name}</CardHeader>
                <CardContent>
                  <img src={productionLine.product_logoURL} alt={`Image of ${productionLine.name}`} className="transition-transform group-hover:scale-110 duration-200"/>
                </CardContent>
              </Card>
            )
          })}
        </aside>
        <div>
          <div>
            {isSaving && (
              <Card>
                <CardHeader>Loading..</CardHeader>
                <CardContent>
                  <Loader2 />
                  <p>Please wait</p>
                </CardContent>
              </Card>
            )}
            {isProcessing && (
              <Card>
                <CardHeader>{currentProductionLine.name} in progress</CardHeader>
                <CardContent>
                  <p>{inProductionItems.length} / {productionItemCount}</p>
                </CardContent>
              </Card>
            )}
            {!isProcessing && productionItemCount > 0 && inProductionItems.length === 0 && (
              <Card>
                <CardHeader>{currentProductionLine.name} production completed!</CardHeader>
                <CardContent>
                  <p>Well done!</p>
                </CardContent>
              </Card>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Sales</CardTitle>
              <Button onClick={handleEdit}>EDIT</Button>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Selection</CardTitle>
              <Button onClick={handleSave}>SAVE</Button>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>In Production</CardTitle>
              <Button onClick={handleStart}>START</Button>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
  )
}

export default ManagerViewPage
