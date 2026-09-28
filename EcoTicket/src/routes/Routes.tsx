import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import Home from '../pages/Home'
import Eventos from '../pages/Eventos'
import Mis_tickets from '../pages/Mis_tickets'
import Soporte from '../pages/Soporte'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'


const RoutesApp = () => {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />

        <Route path="/eventos" element={<Eventos />} />

        <Route path="/mis_tickets" element={<Mis_tickets />} />

        <Route path="/soporte" element={<Soporte />} />


      </Routes>

      <Footer />

    </BrowserRouter>
  )
}

export default RoutesApp