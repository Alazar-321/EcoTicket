import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'
import { useState, useEffect } from 'react'


import Home from '../pages/Home'
import Eventos from '../pages/Eventos'
import Mis_tickets from '../pages/Mis_tickets'
import Carrito from '../pages/Carrito'
import Soporte from '../pages/Soporte'
import Login from '../pages/Login'
import Admin from '../pages/Admin'
import Agente from '../pages/Agente'
import RegisterEcoTiquet from '../pages/RegisterEcoTiquet'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { getCurrentUser, type User } from '../auth/auth'

function RoleRoute({
  role,
}: {
  role: 'ADMINISTRADOR' | 'AGENTE' | 'CLIENTE'
}) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  if (user === null) {
    return null // O un spinner de carga
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== role) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function RouteContent() {
  const location = useLocation()

  return (
    <>
      {location.pathname === '/' && (
        <a className="skip-link" href="#main-content">
          Saltar al contenido principal
        </a>
      )}
      <Navbar />

      <Routes>

        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />

        <Route path="/eventos" element={<Eventos />} />

        <Route path="/soporte" element={<Soporte />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<RegisterEcoTiquet />} />  


        {/* Reservas exclusivas de clientes */}
        <Route element={<RoleRoute role="CLIENTE" />}>
          <Route path="/mis_tickets" element={<Mis_tickets />} />
          <Route path="/carrito" element={<Carrito />} />
        </Route>


        {/* Solo ADMINISTRADOR */}
        <Route element={<RoleRoute role="ADMINISTRADOR" />}>

          <Route
            path="/admin"
            element={<Admin />}
          />

        </Route>


        {/* Solo AGENTE */}
        <Route element={<RoleRoute role="AGENTE" />}>

          <Route
            path="/agente"
            element={<Agente />}
          />

        </Route>


        {/* Ruta desconocida */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

      <Footer />
    </>
  )
}

const RoutesApp = () => {
  return (
    <BrowserRouter>
      <RouteContent />
    </BrowserRouter>
  )
}

export default RoutesApp