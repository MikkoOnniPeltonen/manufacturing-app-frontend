import AllCustomersPage from './pages/AllCustomersPage'
import HomePage from './pages/HomePage'
import ManagerViewPage from './pages/ManagerViewPage'
import CustomerPage from './pages/CustomerPage'
import CreateCustomerPage from './pages/CreateCustomerPage'
import EditCustomerPage from './pages/EditCustomerPage'

import Navbar from './components/Navbar'

import { Routes, Route } from 'react-router-dom'
import './App.css'



function App() {

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/managerview" element={<ManagerViewPage />} />
        <Route path="/customers" element={<AllCustomersPage />} />
        <Route path="/customers/:customerId" element={<CustomerPage />} />
        <Route path="/customers/:customerId/edit" element={<EditCustomerPage />} />
        <Route path="/customers/create" element={<CreateCustomerPage />} />
      </Routes>
    </>
  )
}

export default App
