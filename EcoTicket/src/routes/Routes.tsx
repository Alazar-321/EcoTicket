import { lazy, Suspense, useState, useEffect } from 'react'
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

// Páginas que ve cualquier visitante al entrar: se cargan con la aplicación
import Home from '../pages/Home'
import Eventos from '../pages/Eventos'
import Login from '../pages/Login'
import RegisterEcoTiquet from '../pages/RegisterEcoTiquet'
import ForgotPassword from '../pages/ForgotPassword'
import UpdatePassword from '../pages/UpdatePassword'

import Navbar from '../components/navbar'
import Footer from '../components/footer'

import { getCurrentUser, type User } from '../auth/auth'

// Páginas que se descargan solo al visitarlas (Recharts, QR, etc. no pesan en la portada)
const Mis_tickets = lazy(() => import('../pages/Mis_tickets'))
const Carrito = lazy(() => import('../pages/Carrito'))
const Admin = lazy(() => import('../pages/Admin'))
const Agente = lazy(() => import('../pages/Agente'))
const EditEvent = lazy(() => import('../pages/EditEvent'))
const Soporte = lazy(() => import('../pages/Soporte'))
const Terms = lazy(() => import('../pages/Terms'))

function PageFallback() {
  return (
    <div
      className="container py-5 text-center text-body-secondary"
      style={{ minHeight: '50vh' }}
      role="status"
    >
      Cargando...
    </div>
  )
}

function RoleRoute({
  role,
}: {
  role: 'ADMINISTRADOR' | 'AGENTE' | 'CLIENTE'
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <PageFallback />
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

      <Suspense fallback={<PageFallback />}>
        <Routes>

          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />

          <Route path="/eventos" element={<Eventos />} />

          <Route path="/soporte" element={<Soporte />} />

          <Route path="/login" element={<Login />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          <Route path="/register" element={<RegisterEcoTiquet />} />

          <Route path="/terminos" element={<Terms />} />


          {/* Reservas exclusivas de clientes */}
          <Route element={<RoleRoute role="CLIENTE" />}>
            <Route path="/mis_tickets" element={<Mis_tickets />} />
            <Route path="/carrito" element={<Carrito />} />
            
          </Route>


          {/* Solo ADMINISTRADOR */}
          <Route element={<RoleRoute role="ADMINISTRADOR" />}>
            <Route path="/admin" element={<Admin />} />
          </Route>


          {/* Solo AGENTE */}
          <Route element={<RoleRoute role="AGENTE" />}>
            <Route path="/agente" element={<Agente />} />
            <Route path="/edit-event/:id" element={<EditEvent />} />
          </Route>


          {/* Ruta desconocida */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>

      <Footer />
    </>
  )
}

const RoutesApp = () => {
  return (
    <RouteContent />
  )
}

export default RoutesApp
