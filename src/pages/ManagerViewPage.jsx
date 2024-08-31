
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
      <div className="p-4 space-y-4">
        <aside className="flex flex-wrap gap-4">
          {productionLines.map((productionLine) => (
            <Card key={productionLine.id} onClick={() => {setProductionLineId(productionLine.id)}} disabled={isProcessing || isSaving} className="relative max-w-xs overflow-hidden rounded-xl shadow-lg cursor-pointer transition-transform transform hover:scale-105">
              <CardHeader className="bg-gray-800 text-white p-4">{productionLine.name}</CardHeader>
              <CardContent className="p-2">
                <img src={productionLine.product_logoURL} alt={`Image of ${productionLine.name}`} className="w-full h-32 object-cover"/>
              </CardContent>
            </Card>
          ))}
        </aside>
        <div className="space-y-4">
          {isSaving && (
            <Card className="bg-yellow-100 borger-yellow-300">
              <CardHeader className="bg-yellow-300">Loading..</CardHeader>
              <CardContent className="flex items-center justify-center p-4">
                  <Loader2 className="animate-spin mr-2"/>
                  <p>Please wait</p>
              </CardContent>
            </Card>
          )}
          {isProcessing && (
            <Card className="bg-blue-100 border-blue-300">
              <CardHeader className="bg-blue-300">{currentProductionLine?.name} in progress</CardHeader>
              <CardContent className="p-4">
                  <p>{inProductionItems.length} / {productionItemCount}</p>
              </CardContent>
            </Card>
          )}
          {!isProcessing && productionItemCount > 0 && inProductionItems.length === 0 && (
            <Card className="bg-green-100 border-green-300">
              <CardHeader className="bg-green-300">{currentProductionLine?.name} production completed!</CardHeader>
              <CardContent className="p-4">
                <p>Well done!</p>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader className="bg-blue-500 text-white flex justify-between items-center">
              <CardTitle>Sales</CardTitle>
              <Button onClick={handleEdit} className="bg-yellow-500 hover:bg-yellow-600">EDIT</Button>
            </CardHeader>
            <CardContent>
              {showSales.length > 0 ? (
                <ul className="space-y-2">
                  {showSales.map((item) => (
                    <li key={item.saleId} className="p-2 border-b border-gray-200">
                      <p className="font-medium">{item.productName} - {item.quantity}</p>
                      <p>{item.customerName} - {item.dateToDeliver}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No sales data available</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-green-500 text-white flex justify-between items-center">
              <CardTitle>Selection</CardTitle>
              <Button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 ">SAVE</Button>
            </CardHeader>
            <CardContent>
              <ul ref={parentRef} className="space-y-2">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item, index) => (
                    <li key={item.saleId} className="p-2 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.productName} - {item.quantity}</p>
                        <p>{item.customerName} - {item.dateToDeliver}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => moveItem(index, -1)} disabled={index === 0} className="bg-gray-200 hover:bg-gray-300">
                          <FontAwesomeIcon icon={faArrowUp} />
                        </Button>
                        <Button onClick={() => moveItem(index, 1)} disabled={index === selectedItems.length -1} className="bg-gray-200 hover:bg-gray-300">
                          <FontAwesomeIcon icon={faArrowDown} />
                        </Button>
                      </div>
                    </li>
                  ))
                ) : (
                  <p>No items selected</p>
                )}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-gray-800 text-white flex justify-between items-center">
              <CardTitle>In Production</CardTitle>
              <Button onClick={handleStart} className="bg-blue-500 hover:bg-blue-600">START</Button>
            </CardHeader>
            <CardContent>
              {inProductionItems.length > 0 ? (
                <ul className="space-y-2">
                  {inProductionItems.map(item => (
                    <li key={item.saleId} className="p-2 border-b border-gray-200">
                      <p className="font-medium">{item.productName} - {item.quantity}</p>
                      <p>{item.customerName} - {item.dateToDeliver}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No items in production</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}

export default ManagerViewPage
