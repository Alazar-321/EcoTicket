import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../auth/auth'
import useEcoTicketData from '../hooks/useEcoTicketData'
import { payForCart, removeReservationFromCart, type Reservation } from '../services/ecoTicketService'
import Ticket from '../components/Ticket'

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function Carrito() {
  const [user, setUser] = useState<any>(null)
  const { events, reservations, cartReservationIds } = useEcoTicketData()
  const [paymentComplete, setPaymentComplete] = useState(false)
  // Ids de las reservas pagadas en esta compra: con ellos se generan los tickets
  const [purchasedIds, setPurchasedIds] = useState<Reservation['id'][]>([])

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  const cartItems = reservations.filter(
    (reservation) =>
      (reservation.customer === user?.username || reservation.user_id === user?.id) &&
      cartReservationIds.includes(reservation.id) &&
      reservation.status === 'CONFIRMADA'
  )

  // Tickets: reservas de esta compra que ya figuran como PAGADA en la base de datos
  const paidTickets = reservations.filter(
    (reservation) => purchasedIds.includes(reservation.id) && reservation.status === 'PAGADA'
  )

  const total = cartItems.reduce((sum, reservation) => {
    const event = events.find((item) => item.id === reservation.eventId)
    return sum + Number(reservation.price ?? event?.price ?? 0)
  }, 0)

  async function handlePayment() {
    if (user) {
      // Se guardan los ids antes de pagar: al pagar, el carrito se vacía
      const idsToPay = cartItems.map((item) => item.id)
      const success = await payForCart(user.username)
      if (success) {
        setPurchasedIds(idsToPay)
        setPaymentComplete(true)
      }
    }
  }

  if (!user) return <div className="container py-5 text-center">Cargando perfil...</div>

  return (
    <main className="container py-5">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-3 mb-4">
        <div>
          <p className="text-success fw-semibold text-uppercase small mb-1">Cliente</p>
          <h1 className="h2 fw-bold mb-1">Carrito de compras</h1>
          <p className="text-muted mb-0">Paga tus reservas confirmadas.</p>
        </div>
        <Link to="/mis_tickets" className="btn btn-outline-success">Volver a mis reservas</Link>
      </div>

      {paymentComplete && (
        <div className="alert alert-success" role="status">
          Pago simulado completado. Tus reservas ahora aparecen como pagadas.
        </div>
      )}

      {paymentComplete && (
        <section className="mb-5" aria-labelledby="tickets-title">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 no-print">
            <h2 id="tickets-title" className="h4 fw-bold mb-0">Tus tickets</h2>
            {paidTickets.length > 0 && (
              <button type="button" className="btn btn-outline-success" onClick={() => window.print()}>
                <i className="bi bi-printer me-2" aria-hidden="true" />
                Imprimir / guardar PDF
              </button>
            )}
          </div>

          {paidTickets.length === 0 ? (
            <p className="text-muted no-print">Generando tus tickets…</p>
          ) : (
            <div className="tickets-print-area d-grid gap-4">
              {paidTickets.map((reservation) => (
                <Ticket
                  key={reservation.id}
                  reservation={reservation}
                  event={events.find((item) => item.id === reservation.eventId)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {cartItems.length === 0 ? (
        <div className="border-top border-bottom py-5 text-center">
          <i className="bi bi-cart3 fs-1 text-success" aria-hidden="true" />
          <h2 className="h5 mt-3">Tu carrito está vacío</h2>
          <p className="text-muted">Agrega aquí las reservas que ya fueron confirmadas.</p>
          <Link to="/mis_tickets" className="btn btn-success">Ver mis reservas</Link>
        </div>
      ) : (
        <div className="row g-5 align-items-start">
          <section className="col-lg-8" aria-label="Reservas en el carrito">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr><th>Evento</th><th>Fecha</th><th>Precio</th><th><span className="visually-hidden">Acciones</span></th></tr>
                </thead>
                <tbody>
                  {cartItems.map((reservation) => {
                    const event = events.find((item) => item.id === reservation.eventId)
                    const price = Number(reservation.price ?? event?.price ?? 0)

                    return (
                      <tr key={reservation.id}>
                        <td>
                          <div className="fw-semibold">{reservation.eventTitle}</div>
                          <small className="text-muted">Reserva #{reservation.id}</small>
                        </td>
                        <td>{event?.date ?? 'Fecha no disponible'}</td>
                        <td className="fw-semibold">{price === 0 ? 'Gratis' : formatPrice(price)}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            aria-label={`Quitar ${reservation.eventTitle} del carrito`}
                            onClick={() => user && removeReservationFromCart(reservation.id, user.username)}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="col-lg-4" aria-label="Resumen de compra">
            <div className="border-top border-bottom py-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Reservas</span><span>{cartItems.length}</span>
              </div>
              <div className="d-flex justify-content-between align-items-baseline fw-bold fs-5">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
              <button type="button" className="btn btn-success w-100 mt-3" onClick={handlePayment}>
                Confirmar pago
              </button>
              <p className="small text-muted mt-2 mb-0">Demostración local: no se realiza ningún cargo real.</p>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}

export default Carrito