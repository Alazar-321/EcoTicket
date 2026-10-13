import { useState, useEffect } from 'react'
import { getCurrentUser } from '../auth/auth'
import useEcoTicketData from '../hooks/useEcoTicketData'
import usePagination from '../hooks/usePagination'
import { Link, useNavigate } from 'react-router-dom'
import { addReservationToCart, type Reservation } from '../services/ecoTicketService'
import Ticket from '../components/Ticket'
import Banners from '../components/Banners'
import Pagination from '../components/Pagination'
import { APP_TIME_ZONE, formatDateOnly } from '../utils/date'

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
  const { events, reservations, cartReservationIds } = useEcoTicketData()
  // Reserva pagada cuyo ticket (con QR) se está viendo en la ventana emergente
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
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
        <p className="text-success fw-semibold text-uppercase small mb-1">Cuenta de cliente</p>
        <h1 className="h2 fw-bold mb-1">Mis reservas</h1>
        <p className="text-body-secondary mb-0">Consulta el estado de tus solicitudes.</p>
      </div>

      {myReservations.length === 0 ? (
        <div className="border-top border-bottom py-5 text-center">
          <i className="bi bi-ticket-perforated fs-1 text-success" aria-hidden="true" />
          <h2 className="h5 mt-3">Todavía no tienes reservas</h2>
          <p className="text-body-secondary mb-0">Explora los eventos disponibles para solicitar tu lugar.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive" id="mis-reservas">
            <table className="table table-hover align-middle admin-table">
              <thead>
                <tr>
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
                  const isPaid = reservation.status === 'PAGADA'
                  const eventName = event?.title || reservation.eventTitle || 'Evento no encontrado'

                  return (
                    // Las reservas pagadas abren su ticket al pulsar en cualquier parte de la fila
                    <tr
                      key={reservation.id}
                      style={isPaid ? { cursor: 'pointer' } : undefined}
                      onClick={isPaid ? () => setSelectedReservation(reservation) : undefined}
                    >
                      <td className="fw-semibold">
                        {isPaid ? (
                          // El botón permite abrir el ticket con el teclado (Enter): el clic sube a la fila
                          <button
                            type="button"
                            className="btn btn-link p-0 fw-semibold text-start text-decoration-none text-success"
                            aria-label={`Ver ticket y QR de ${eventName}`}
                          >
                            {eventName}
                            <i className="bi bi-qr-code ms-2" aria-hidden="true"></i>
                          </button>
                        ) : (
                          eventName
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
                      <td>
                        {reservation.status === 'CONFIRMADA' && (
                          cartReservationIds.includes(reservation.id) ? (
                            <Link to="/carrito" className="btn btn-sm btn-success">Continuar al pago</Link>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => {
                                if (user && addReservationToCart(reservation.id, user.username)) navigate('/carrito')
                              }}
                            >
                              Pagar reserva
                            </button>
                          )
                        )}
                        {reservation.status === 'PAGADA' && (
                          <>
                            <span className="text-success small fw-bold">
                              <i className="bi bi-check-circle-fill me-1"></i> Pago recibido
                            </span>
                            <small className="d-block text-body-secondary">Toca para ver tu QR</small>
                          </>
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