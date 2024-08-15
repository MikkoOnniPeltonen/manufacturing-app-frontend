import AllProductsPage from '../pages/AllProductsPage'
import HomePage from '../pages/HomePage'
import ManagerViewPage from '../pages/ManagerViewPage'
import Navbar from './components/Navbar'

import { Routes, Route } from 'react-router-dom'
import ProductPage from '../pages/ProductPage'
import './App.css'
import ArchivesPage from '../pages/ArchivesPage'

function App() {

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/managerview" element={<ManagerViewPage />} />
        <Route path="/products" element={<AllProductsPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/managerview/archives" element={<ArchivesPage />} />
      </Routes>
    </>
  )
}

export default App
