import { Route, Routes } from 'react-router-dom'
import './App.css'
import { BookingPage } from './pages/BookingPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { HomePage } from './pages/HomePage'
import { OwnerPage } from './pages/OwnerPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/book/confirmation" element={<ConfirmationPage />} />
      <Route path="/owner" element={<OwnerPage />} />
    </Routes>
  )
}

export default App
