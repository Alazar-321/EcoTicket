import { useState, useEffect } from 'react'
import { getCurrentUser } from '../auth/auth'
import useEcoTicketData from '../hooks/useEcoTicketData'
import usePagination from '../hooks/usePagination'
import { Link, useNavigate } from 'react-router-dom'
import { addReservationToCart, type Reservation, getUsers } from '../services/ecoTicketService'
import Ticket from '../components/Ticket'
import Banners from '../components/Banners'
import Pagination from '../components/Pagination'
import { APP_TIME_ZONE, formatDateOnly } from '../utils/date'
import type { Profile } from '../types/user'

const PAGE_SIZE = 10

const statusLabels = {
  SOLICITADA: 'Solicitada',
  CONFIRMADA: 'Confirmada',
  RECHAZADA: 'Rechazada',
  PAGADA: 'Pagada',
}

// Fecha de un momento exacto (timestamp), mostrada siempre en hora de Colombia
function formatTimestamp(value?: string | number | Date): string {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: APP_TIME_ZONE,
  }).format(date)
}

function Mis_tickets() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const { events, reservations, cartReservationIds } = useEcoTicketData()
  // Reserva pagada cuyo ticket (con QR) se está viendo en la ventana emergente
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  // Reservas confirmadas marcadas para pagarlas juntas en el carrito
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    async function loadUserData() {
      const u = await getCurrentUser()
      setUser(u)
      if (u?.id) {
        const profiles = await getUsers()
        const profile = profiles.find(p => p.id === u.id)
        setUserProfile(profile)
      }
    }
    loadUserData()
  }, [])

  // Mientras el ticket está abierto: Esc lo cierra y la página de fondo no hace scroll
  useEffect(() => {
    if (!selectedReservation) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedReservation(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('modal-open')

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [selectedReservation])

  const myReservations = reservations.filter((reservation) =>
    reservation.customer === user?.username || reservation.user_id === user?.id
  )

  // Reservas que se pueden marcar: confirmadas y que todavía no están en el carrito
  const payableIds = myReservations
    .filter((reservation) => reservation.status === 'CONFIRMADA' && !cartReservationIds.includes(reservation.id))
    .map((reservation) => reservation.id)
  // Se descartan marcas de reservas que ya no son pagables (se pagaron, se agregaron o cambiaron de estado)
  const selectedPayableIds = checkedIds.filter((id) => payableIds.includes(id))

  const toggleChecked = (id: number) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleAllPayable = () => {
    setCheckedIds(selectedPayableIds.length === payableIds.length ? [] : payableIds)
  }

  // Agrega al carrito una o varias reservas y SOLO después abre el carrito.
  // addReservationToCart es asíncrona: sin await se navegaba antes de que terminara de guardar.
  async function addToCartAndGo(ids: number[]) {
    if (!user || ids.length === 0) return
    setIsAddingToCart(true)
    setCartError('')

    let added = 0
    for (const id of ids) {
      if (await addReservationToCart(id, user.username)) added += 1
    }

    setIsAddingToCart(false)
    if (added === 0) {
      setCartError('No se pudo agregar al carrito. Comprueba que la reserva siga confirmada.')
      return
    }
    setCheckedIds([])
    navigate('/carrito')
  }

  // IMPORTANTE: los hooks deben ir ANTES del return condicional de abajo
  const { pageItems, page, totalPages, setPage } = usePagination(
    myReservations,
    PAGE_SIZE,
    myReservations.length
  )

  const handlePageChange = (p: number) => {
    setPage(p)
    document.getElementById('mis-reservas')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!user) return <div className="container py-5 text-center">Cargando perfil...</div>

  return (
    <main className="container py-5">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-end">
          <div>
            <p className="text-success fw-semibold text-uppercase small mb-1">Cuenta de cliente</p>
            <h1 className="h2 fw-bold mb-1">Mis reservas</h1>
            <p className="text-body-secondary mb-0">Consulta el estado de tus solicitudes.</p>
          </div>

          {userProfile && 'points' in userProfile && (
            <div className="text-end">
              <div className="d-flex align-items-center justify-content-end gap-2 mb-1">
                <i className="bi bi-leaf-fill text-success fs-4" title="Puntos EcoTicket"></i>
                <span className="h5 mb-0 fw-bold text-dark">{userProfile.points} pts</span>
              </div>
              <div className="progress" style={{ width: '150px', height: '8px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${Math.min((userProfile.points / 50) * 100, 100)}%` }}
                ></div>
              </div>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                {userProfile.points >= 50
                  ? '¡Tienes un descuento del 50% disponible!'
                  : `${50 - userProfile.points} pts para tu descuento`}
              </small>
            </div>
          )}
        </div>
      </div>

      {myReservations.length === 0 ? (
        <div className="border-top border-bottom py-5 text-center">
          <i className="bi bi-ticket-perforated fs-1 text-success" aria-hidden="true" />
          <h2 className="h5 mt-3">Todavía no tienes reservas</h2>
          <p className="text-body-secondary mb-0">Explora los eventos disponibles para solicitar tu lugar.</p>
        </div>
      ) : (
        <>
          {cartError && (
            <div className="alert alert-danger py-2" role="alert">{cartError}</div>
          )}

          {selectedPayableIds.length > 0 && (
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border rounded p-3 mb-3">
              <span className="fw-semibold">
                {selectedPayableIds.length} {selectedPayableIds.length === 1 ? 'reserva seleccionada' : 'reservas seleccionadas'}
              </span>
              <button
                type="button"
                className="btn btn-success"
                disabled={isAddingToCart}
                onClick={() => addToCartAndGo(selectedPayableIds)}
              >
                {isAddingToCart ? 'Agregando...' : `Pagar seleccionadas (${selectedPayableIds.length})`}
              </button>
            </div>
          )}

          <div className="table-responsive" id="mis-reservas">
            <table className="table table-hover align-middle admin-table">
              <thead>
                <tr>
                  <th className="py-3" style={{ width: '2.5rem' }}>
                    {payableIds.length > 1 && (
                      <input
                        type="checkbox"
                        className="form-check-input"
                        aria-label="Seleccionar todas las reservas confirmadas"
                        checked={selectedPayableIds.length === payableIds.length}
                        onChange={toggleAllPayable}
                      />
                    )}
                  </th>
                  <th className="py-3">Evento</th>
                  <th className="py-3">Fecha del evento</th>
                  <th className="py-3">Solicitud</th>
                  <th className="py-3">Estado</th>
                  <th className="py-3">Pago</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((reservation) => {
                  const event = events.find((item) => item.id === reservation.eventId)
                  const canViewTicket = reservation.status === 'PAGADA' || reservation.status === 'CONFIRMADA'
                  const eventName = event?.title || reservation.eventTitle || 'Evento no encontrado'

                  return (
                    // Las reservas confirmadas o pagadas abren su ticket al pulsar en cualquier parte de la fila
                    <tr
                      key={reservation.id}
                      style={canViewTicket ? { cursor: 'pointer' } : undefined}
                      onClick={canViewTicket ? () => setSelectedReservation(reservation) : undefined}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        {payableIds.includes(reservation.id) && (
                          <input
                            type="checkbox"
                            className="form-check-input"
                            aria-label={`Seleccionar ${eventName} para pagar`}
                            checked={checkedIds.includes(reservation.id)}
                            onChange={() => toggleChecked(reservation.id)}
                          />
                        )}
                      </td>
                      <td className="fw-semibold">
                        {canViewTicket ? (
                          // El botón permite abrir el ticket con el teclado (Enter): el clic sube a la fila
                          <button
                            type="button"
                            className="btn btn-link p-to-none p-0 fw-semibold text-start text-decoration-none text-success"
                            aria-label={`Ver ticket y QR de ${eventName}`}
                          >
                            {eventName}
                            <i className="bi bi-qr-code ms-2" aria-hidden="true"></i>
                          </button>
                        ) : (
                          eventName
                        )}
                        {reservation.seatLabel && (
                          <div className="small fw-normal text-body-secondary">
                            {reservation.zoneName ? `${reservation.zoneName} · ` : ''}Asiento {reservation.seatLabel}
                          </div>
                        )}
                      </td>
                      <td>
                        {event?.date
                          ? formatDateOnly(event.date, { dateStyle: 'medium' }) || 'Fecha no disponible'
                          : 'Fecha no disponible'}
                      </td>
                      <td>{formatTimestamp(reservation.createdAt)}</td>
                      <td>
                        <span className={`badge ${
                          reservation.status === 'CONFIRMADA' || reservation.status === 'PAGADA'
                            ? 'text-bg-success'
                            : reservation.status === 'RECHAZADA'
                              ? 'text-bg-danger'
                              : 'text-bg-warning'
                        }`}>
                          {statusLabels[reservation.status as keyof typeof statusLabels] ?? reservation.status}
                        </span>
                      </td>
                      <td className="text-center">
                        {reservation.status === 'CONFIRMADA' && (
                          cartReservationIds.includes(reservation.id) ? (
                            <Link to="/carrito" className="btn btn-sm btn-success" onClick={(e) => e.stopPropagation()}>
                              Continuar al pago
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              disabled={isAddingToCart}
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCartAndGo([reservation.id])
                              }}
                            >
                              Pagar reserva
                            </button>
                          )
                        )}
                        {reservation.status === 'PAGADA' && (
                          <div className="text-success">
                            <span className="small fw-bold d-block">
                              <i className="bi bi-check-circle-fill me-1"></i> Pago recibido
                            </span>
                            <small className="text-body-secondary" style={{ fontSize: '0.75rem' }}>
                              Toca para ver tu QR
                            </small>
                          </div>
                        )}
                        {reservation.status === 'SOLICITADA' && (
                          <span className="text-body-secondary small fst-italic">En revisión...</span>
                        )}
                        {reservation.status === 'RECHAZADA' && (
                          <span className="text-danger small fw-semibold">No disponible</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}

      {/* Ticket con QR: ventana emergente; se cierra con la X, con Esc o pulsando fuera */}
      {selectedReservation && (
        <>
          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
            onClick={() => setSelectedReservation(null)}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header no-print">
                  <h2 className="modal-title h5" id="ticket-modal-title">Tu ticket</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    autoFocus
                    onClick={() => setSelectedReservation(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="tickets-print-area">
                    <Ticket
                      reservation={selectedReservation}
                      event={events.find((item) => item.id === selectedReservation.eventId)}
                    />
                  </div>
                </div>

                <div className="modal-footer no-print">
                  {/* <button type="button" className="btn btn-outline-success" onClick={() => window.print()}>
                    <i className="bi bi-printer me-2" aria-hidden="true" />
                    Imprimir / guardar PDF
                  </button> */}
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedReservation(null)}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show no-print"></div>
        </>
      )}
      <Banners />
    </main>
  )
}

export default Mis_tickets