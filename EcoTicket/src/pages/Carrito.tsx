import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const { events, reservations, cartReservationIds } = useEcoTicketData()
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  // Ids de las reservas pagadas en esta compra: con ellos se generan los tickets
  const [purchasedIds, setPurchasedIds] = useState<Reservation['id'][]>([])



  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  // Mientras el modal de felicitaciones está abierto, la página de fondo no hace scroll
  useEffect(() => {
    if (!showSuccessModal) return
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [showSuccessModal])

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
      const idsToPay = cartItems.map((item) => item.id)

      try {
        const success = await payForCart(user.username)
        if (success) {
          // Forzamos un evento de cambio de datos adicional para despertar al contexto
          window.dispatchEvent(new Event('eco-ticket-data-change'))

          setPurchasedIds(idsToPay)
          setPaymentComplete(true)
          setShowSuccessModal(true)
        }
      } catch (error) {
        console.error('Error en el proceso de pago:', error)
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

      {/* Modal de Felicitaciones */}
      {showSuccessModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
            <div className="modal-content border-0 shadow-lg text-center p-4">
              <div className="modal-body">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                  <h2 className="fw-bold mt-3">¡Felicidades!</h2>
                  <p className="text-muted">
                    Tu pago ha sido procesado con éxito.{' '}
                    {paidTickets.length > 1
                      ? `Ya tienes tus ${paidTickets.length} boletos disponibles.`
                      : 'Ya tienes tu boleto disponible.'}
                  </p>
                </div>

                {paidTickets.length === 0 && (
                  <p className="text-muted">Generando tus tickets…</p>
                )}

                <div className="tickets-print-area d-grid gap-4 mb-4">
                  {paidTickets.map((reservation) => (
                    <Ticket
                      key={reservation.id}
                      reservation={reservation}
                      event={events.find((item) => item.id === reservation.eventId)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-success btn-lg w-100 py-3 fw-bold"
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/mis_tickets');
                  }}
                >
                  Ir a mis tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                          <small className="text-muted">
                            Reserva #{reservation.id}
                            {reservation.seatLabel
                              ? ` · ${reservation.zoneName ? `${reservation.zoneName} · ` : ''}Asiento ${reservation.seatLabel}`
                              : ''}
                          </small>
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