import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'

import {
  getCurrentUser,
  logout,
  type User,
} from '../auth/auth'
import useEcoTicketData from '../hooks/useEcoTicketData'

const Navbar = () => {
  
  const navigate = useNavigate()


  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { reservations, cartReservationIds } = useEcoTicketData()

  useEffect(() => {
    async function checkUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)
    }

    checkUser()

    const handleAuthChange = () => {
      getCurrentUser().then(setUser)
    }

    window.addEventListener('auth-change', handleAuthChange)
    return () => {
      window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [])

  console.log({
  user: user?.username,
  cart: cartReservationIds,
  reservas: (reservations || []).map((r) => ({
    id: r.id,
    customer: r.customer,
    status: r.status,
  })),
})

  const cartCount = (reservations || []).filter(
    (reservation) => reservation.customer === user?.username && cartReservationIds.includes(reservation.id) && reservation.status === 'CONFIRMADA'
  ).length

  function handleLogout() {
    logout()
    navigate('/')
  }

  if (isLoading) return null // Evita parpadeos mientras verifica la sesión

  return (
    <nav className="navbar navbar-expand-lg border-bottom border-success border-5 bg-white" aria-label="Navegación principal">
      <div className="container-fluid px-4">
        <Link
          className="navbar-brand d-flex align-items-center fw-bold text-success ms-lg-5"
          to="/"
        >
          <img
            src="/logo.png"
            alt="EcoTíquet"
            height="60"
            className="me-2"
          />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarEcoTicket"
          aria-controls="navbarEcoTicket"
          aria-expanded="false"
          aria-label="Menú de navegación"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="collapse navbar-collapse"
          id="navbarEcoTicket"
        >
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                className="nav-link text-secondary fw-semibold fs-5"
                to="/"
              >
                Inicio
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link text-secondary fw-semibold fs-5"
                to="/eventos"
              >
                Eventos
              </Link>
            </li>

            {/* Soporte y Ayuda: Solo visible si NO hay usuario logueado */}
            {!user && (
              <li className="nav-item">
                <Link
                  className="nav-link text-secondary fw-semibold fs-5"
                  to="/soporte"
                >
                  Soporte y Ayuda
                </Link>
              </li>
            )}

            {user?.role === 'CLIENTE' && (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link text-secondary fw-semibold fs-5"
                    to="/mis_tickets"
                  >
                    Mis Tickets
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-secondary fw-semibold fs-5 d-flex align-items-center gap-2" to="/carrito" aria-label={`Carrito de compras, ${cartCount} artículos`}>
                    <ShoppingCart size={19} aria-hidden="true" />
                    Carrito
                    <span className="badge text-bg-success">{cartCount}</span>
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3 me-lg-5">
            {!user ? (
              <>
                <Link
                  className="fw-semibold text-success fs-5"
                  to="/login"
                >
                  Mi Cuenta
                </Link>
                <i className="bi bi-person-circle fs-2 text-success" aria-hidden="true"></i>
              </>
            ) : (
              <>
                <div className="text-end">
                  <div className="fw-semibold text-success">
                    {user.username}
                  </div>
                  <small className="text-muted">
                    {user.role}
                  </small>
                </div>

                {user.role === 'ADMINISTRADOR' && (
                  <Link
                    to="/admin"
                    className="btn btn-outline-success"
                  >
                    Panel Admin
                  </Link>
                )}

                {user.role === 'AGENTE' && (
                  <Link
                    to="/agente"
                    className="btn btn-outline-success"
                  >
                    Panel Agente
                  </Link>
                )}

                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar