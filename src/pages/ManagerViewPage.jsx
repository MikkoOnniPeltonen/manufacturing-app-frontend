
import axios from 'axios'
import { useState, useEffect, useRef, useCallback } from 'react'

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

  const [productionDataMap, setProductionDataMap] = useState(new Map())
  const [selectedLineId, setSelectedLineId] = useState(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const parentRef = useRef(null)
  useAutoAnimate(parentRef)

  // INITIAL DATA FETCH FOR PRODUCTION LINES
  useEffect(() => {
    fetchProductionLines()
  }, [])

  // FETCH SALES AND PRODUCTION ITEMS FOR SINGLE SELECTED PRODUCTION LINE
  useEffect(() => {
    if (selectedLineId) {
      fetchDataForProductionLine(selectedLineId)
    }
  }, [selectedLineId])

  async function fetchProductionLines() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
      const newProductionDataMap = new Map(
      response.data.map(line => [line.id, { productionLine: line }])
      )
      setProductionDataMap(newProductionDataMap)
    } catch (error) {
      console.error('Error fetching production lines: ', error)
    }
  }

  // FUNCTION TO FETCH DATA FOR A SPECIFIC PRODUCTION LINE
  async function fetchDataForProductionLine(lineId) {
    try {
      const [salesResponse, productionsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales/${lineId}`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/productions/${lineId}`)
      ])

      setProductionDataMap(prevMap => {
        const newMap = new Map(prevMap)
        const lineData = newMap.get(lineId)
        newMap.set(lineId, {
          ...lineData,
          showSales: salesResponse.data.listedItems || [],
          selectedItems: [],
          inProductionItems: productionsResponse.data.inProductionItems || [],
          productionItemCount: productionsResponse.data.inProductionItems.length || 0
        })
        return newMap
      })
    } catch (error) {
        console.error('Error fetching data: ', error)
    }
  
  }

  // MOVE ITEMS IN EDIT
  const moveItem = useCallback((index, direction) => {
    setProductionDataMap(prevMap => {
      const newMap = new Map(prevMap)
      const lineData = newMap.get(selectedLineId)
      const newItems = [...lineData.selectedItems]
      const [movedItem] = newItems.splice(index, 1)
      newItems.splice(index + direction, 0, movedItem)
      newMap.set(selectedLineId, { ...lineData, selectedItems: newItems })
      return newMap
    })
  }, [selectedLineId])

  // CHECK IDENTICAL LISTS
  const areArraysIdentical = useCallback((array1, array2) => {

    if (array1.length !== array2.length) {
      return false
    }
  
    const saleIds1 = new Set(array1.map(sale => sale.saleId))
    const saleIds2 = new Set(array2.map(sale => sale.saleId))
    
    if (saleIds1.size !== saleIds2.size) {
      return false
    }
    return Array.from(saleIds1).every(id => saleIds2.has(id))
  }, [])

  
  // HANDLE EDIT
  const handleEdit = useCallback(async () => {
    const lineData = productionDataMap.get(selectedLineId)
    if (!lineData || lineData.selectedItems.length > 0 || !lineData.productionLine.hasSales) {
      return
    }

    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productionLines/${selectedLineId}`, {
        hasSales: false
      })
      const updatedLines = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
    
      setProductionDataMap(prevMap => {
        const newMap = new Map(prevMap)
        updatedLines.data.forEach(line => {
          const existingData = newMap.get(line.id)
          newMap.set(line.id, { ...existingData, productionLine: line })
        })
        const lineData = newMap.get(selectedLineId)
        newMap.set(selectedLineId, { ...lineData, selectedItems: lineData.showSales })
        return newMap
      })
    } catch (error) {
      console.error('Error in editing production line sales: ', error)
    }
  }, [productionDataMap, selectedLineId])


  // HANDLE SAVE OF EDITED LIST
  const handleSave = useCallback(async () => {
    const lineData = productionDataMap.get(selectedLineId)
    if (!lineData || lineData.selectedItems.length === 0) {
      return
    }

    setIsSaving(true)

    try {

      const patchingResponse = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productions/${selectedLineId}`, {
        inProductionItems: lineData.selectedItems
      })
      const newProductionList = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productions/${selectedLineId}`)

      if (!areArraysIdentical(newProductionList.data.inProductionItems, patchingResponse.data.inProductionItems)) {
        throw new Error('Sales are not identical!')
      }

      setProductionDataMap(prevMap => {
        const newMap = new Map(prevMap)
        const lineData = newMap.get(selectedLineId)
        newMap.set(selectedLineId, {
          ...lineData, 
          inProductionItems: newProductionList.data.inProductionItems,
          selectedItems: []
        })
        return newMap
      })
    } catch (error) {
      console.error('Error saving data: ', error)
    } finally {
      setIsSaving(false)
    }

  }, [productionDataMap, selectedLineId, areArraysIdentical])


  const processItems = useCallback(async (items) => {
    const lineData = productionDataMap.get(selectedLineId)

    for (const item of items) {
      try {
        const timeToProcess = (item.quantity / lineData.productionLine.capacity) * 10000
        await new Promise(resolve => setTimeout(resolve, timeToProcess))

        await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productions/${selectedLineId}`, {
          inProductionItems: items.slice(1)
        })

        const customerResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${item.customerId}`)
        await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/customers/${item.customerId}`, {
          delivered: [...customerResponse.data.delivered, { ...item, status: true }]
        })

        setProductionDataMap(prevMap => {
          const newMap = new Map(prevMap)
          const lineData = newMap.get(selectedLineId)
          newMap.set(selectedLineId, { ...lineData, inProductionItems: items.slice(1) })
          return newMap
        })

      } catch (error) {
        console.error('Error in processing item: ', error)
        break
      }
    }
    setIsProcessing(false)
  }, [productionDataMap, selectedLineId])


  // BEGIN PRODUCTION
  const handleStart = useCallback(() => {
    const lineData = productionDataMap.get(selectedLineId)
    if (!lineData || isProcessing || lineData.inProductionItems.length === 0) {
      return
    }

    setIsProcessing(true)
    processItems(lineData.inProductionItems)
  }, [productionDataMap, selectedLineId, isProcessing, processItems])

  const lineData = productionDataMap.get(selectedLineId) || {}

  const { productionLine = {}, inProductionItems = [], productionItemCount = 0, showSales = [], selectedItems = [] } = lineData
  
  return (
      <div className="p-4 flex space-y-4">
        <aside className="flex flex-col gap-4 w-1/4">
          {[...productionDataMap.entries()].map(([id, productionLineData]) => (
            <Card key={id} onClick={() => {setSelectedLineId(id)}} disabled={isProcessing || isSaving} className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer transition-transform transform hover:scale-105">
              <CardHeader className="bg-gray-800 text-white p-4">{productionLineData.productionLine.name}</CardHeader>
              <CardContent className="p-2">
                <img src={productionLineData.productionLine.product_logoURL} alt={`Image of ${productionLineData.productionLine.name}`} className="w-full h-32 object-cover"/>
              </CardContent>
            </Card>
          ))}
        </aside>
        <div className="flex-1 space-y-4">
          <div className="space-y-4">
            {isSaving && (
              <Card className="bg-yellow-100 borger-yellow-300">
                <CardHeader className="bg-yellow-300">Saving changes...</CardHeader>
                <CardContent className="flex items-center justify-center p-4">
                  <Loader2 className="animate-spin mr-2"/>
                  <p>Please wait</p>
                </CardContent>
              </Card>
            )}
            {isProcessing && (
              <Card className="bg-blue-100 border-blue-300">
                <CardHeader className="bg-blue-300">{productionLine?.name} in progress</CardHeader>
                <CardContent className="p-4">
                  <p>{inProductionItems.length} / {productionItemCount}</p>
                </CardContent>
              </Card>
            )}
            {!isProcessing && productionItemCount > 0 && inProductionItems.length === 0 && (
              <Card className="bg-green-100 border-green-300">
                <CardHeader className="bg-green-300">{productionLine?.name} production completed!</CardHeader>
                <CardContent className="p-4">
                  <p>Well done!</p>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="flex space-x-4">
            <Card className="flex-1">
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
            <Card className="flex-1">
              <CardHeader className="bg-green-500 text-white flex justify-between items-center">
                <CardTitle>Selection</CardTitle>
                <Button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 ">SAVE</Button>
              </CardHeader>
              <CardContent>
                {selectedItems.length > 0 ? (
                  <ul ref={parentRef} className="space-y-2">
                    {selectedItems.map((item, index) => (
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
                    ))}
                  </ul>
                ) : (
                  <p>No items selected</p>
                )}
              </CardContent>
            </Card>
            <Card className="flex-1">
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
      </div>
    )
}

export default ManagerViewPage
