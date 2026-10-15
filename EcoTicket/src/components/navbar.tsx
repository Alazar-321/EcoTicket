import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Moon, Sun } from 'lucide-react'

import {
  getCurrentUser,
  logout,
  type User,
} from '../auth/auth'
import useEcoTicketData from '../hooks/useEcoTicketData'
import useTheme from '../hooks/useTheme'

const Navbar = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

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

  const cartCount = (reservations || []).filter(
    (reservation) =>
      reservation.customer === user?.username &&
      (cartReservationIds || []).includes(reservation.id) &&
      reservation.status === 'CONFIRMADA'
  ).length

  function handleLogout() {
    logout()
    navigate('/')
  }


  return (
    <nav
      className="navbar navbar-expand-lg border-bottom border-success border-5 bg-body-tertiary sticky-top"
      aria-label="Navegación principal"
    >
      <div className="container-fluid px-4">
        <Link
          className="navbar-brand d-flex align-items-center fw-bold ms-lg-5"
          to="/"
        >
          <img
            src="/logo.webp"
            alt="EcoTíquet"
            width="165"
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

        <div className="collapse navbar-collapse" id="navbarEcoTicket">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link text-body-secondary fw-semibold fs-5" to="/">
                Inicio
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link text-body-secondary fw-semibold fs-5" to="/eventos">
                Eventos
              </Link>
            </li>

            {/* Soporte y Ayuda: solo visible si NO hay usuario logueado */}
            {!isLoading && !user && (
              <li className="nav-item">
                <Link className="nav-link text-body-secondary fw-semibold fs-5" to="/soporte">
                  Soporte y Ayuda
                </Link>
              </li>
            )}

            {user?.role === 'CLIENTE' && (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link text-body-secondary fw-semibold fs-5"
                    to="/mis_tickets"
                  >
                    Mis Tiquets
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link text-body-secondary fw-semibold fs-5 d-flex align-items-center gap-2"
                    to="/carrito"
                    aria-label={`Carrito de compras, ${cartCount} artículos`}
                  >
                    <ShoppingCart size={19} aria-hidden="true" />
                    Carrito
                    <span className="badge text-bg-success">{cartCount}</span>
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3 me-lg-5">
            <button
              type="button"
              className="btn btn-outline-success d-flex align-items-center"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun size={18} aria-hidden="true" />
              ) : (
                <Moon size={18} aria-hidden="true" />
              )}
            </button>

            {!isLoading && (
              !user ? (
                <>
                  <Link className="fw-semibold text-success-emphasis fs-5" to="/login">
                    Mi Cuenta
                  </Link>
                  <i className="bi bi-person-circle fs-2 text-success-emphasis" aria-hidden="true"></i>
                </>
              ) : (
                <>
                  <div className="text-end">
                    <div className="fw-semibold text-success-emphasis">{user.username}</div>
                    <small className="text-body-secondary">{user.role}</small>
                  </div>

                  {user.role === 'ADMINISTRADOR' && (
                    <Link to="/admin" className="btn btn-outline-success">
                      Panel Admin
                    </Link>
                  )}

                  {user.role === 'AGENTE' && (
                    <Link to="/agente" className="btn btn-outline-success">
                      Panel Agente
                    </Link>
                  )}

                  <button type="button" className="btn btn-success" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar