
import axios from 'axios'
import { useState, useEffect } from 'react'

function ManagerViewPage() {

  const [productionLines, setProductionLines] = useState([])
  const [productionLineId, setProductionLineId] = useState(null)
  const [showSales, setShowSales] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [inProductionItems, setInProductionItems] = useState([])


  useEffect(() => {

    axios.get(`${import.meta.env.VITE_BACKEND_URL}/productionLines`)
    .then((response) => {
      setProductionLines(response.data)
    })
    .catch((err) => {
      console.log(err)
    })

  }, [])


  useEffect(() => {

    if (productionLineId) {
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/sales/${productionLineId}`)
      .then((response) => {
        setShowSales(response.data)
      })
      .catch((err) => {
        console.log(err)
      })
    }

  }, [productionLineId])

  const handleSelectItem = (item) => {
    setSelectedItems(prevItems => [...prevItems, item])
  }

  const handleSave = () => {
    axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`, {
      inProductionItems: selectedItems
    })
    .then(() => {
      setInProductionItems(selectedItems)
      setSelectedItems([])
    })
    .catch((err) => {
      console.log(err)
    })
  }

  const handleStart = () => {

    if (inProductionItems.length === 0) {
      return
    }

    const processNextItem = () => {

      const [firstItem, ...remainingItems] = inProductionItems

      const productionLine = productionLines.find(line => line.id === productionLineId)
      if (!productionLine) {
        console.error("Production line not found")
        return
      }
      const timeToProcess = (firstItem.quantity / productionLine.capacity) * 10000

      axios.patch(`${import.meta.env.VITE_BACKEND_URL}/productions/${productionLineId}`, {
        inProductionItems: remainingItems
      })
      .then(() => {

        axios.get(`${import.meta.env.VITE_BACKEND_URL}/customers/${firstItem.customerId}`)
        .then((response) => {
          const customer = response.data

          axios.patch(`${import.meta.env.VITE_BACKEND_URL}/customers/${firstItem.customerId}`, {
            delivered: [...customer.delivered, firstItem]
          })
          .then(() => {
            setInProductionItems(remainingItems)

            if (remainingItems.length > 0) {
              setTimeout(processNextItem, timeToProcess)
            }
          })
          .catch((err) => {
            console.log(err)
          })
        })
        .catch((err) => {
          console.log(err)
        })
      })
      .catch((err) => {
        console.log(err)
      })

    }
    processNextItem()
  }


  return (
    <div>
      <div>
        <div>
          {productionLines.map((productionLine) => {
            <button key={productionLine.id} onClick={() => {setProductionLineId(productionLine.id)}}>
              {productionLine.name}
            </button>
          })}
        </div>
        <div>
          <div>
            <button onClick={() => {}}>EDIT</button>
            <div>
              {showSales.map(item => (
                <div key={item.id} onClick={() => {handleSelectItem(item)}}>
                  <p>{item.productName} - {item.quantity}</p>
                  <p>{item.customerName} - {item.dateToDeliver}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <button onClick={handleSave}>SAVE</button>
            <div>
              {selectedItems.map(item => (
                <div key={item.id}>
                  <p>{item.productName} - {item.quantity}</p>
                  <p>{item.customerName} - {item.dateToDeliver}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <button onClick={handleStart}>START</button>
            <div>
              {inProductionItems.map(item => (
                <div key={item.id}>
                  <p>{item.productName} - {item.quantity}</p>
                  <p>{item.customerName} - {item.dateToDeliver}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerViewPage
