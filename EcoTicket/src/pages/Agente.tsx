import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../auth/auth'
import useEcoTicketData from '../hooks/useEcoTicketData'
import {
  createEvent,
  updateReservationStatus,
  type ReservationStatus,
} from '../services/ecoTicketService'
import type { Event } from '../types/event'

function Agente() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const { events, reservations } = useEcoTicketData()
  const [notice, setNotice] = useState('')

  function handleCreateEvent(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    const form = new FormData(formEvent.currentTarget)

    createEvent({
      title: String(form.get('title')),
      organizer: user?.username ?? 'Eco Ticket',
      city: String(form.get('city')),
      category: String(form.get('category')),
      description: String(form.get('description')),
      date: String(form.get('date')),
      image: String(form.get('image')),
      price: Number(form.get('price')),
    })

    formEvent.currentTarget.reset()
    setNotice('El evento quedó registrado y ya está disponible en el catálogo.')
  }

  function formatPrice(price: Event['price']) {
    const numericPrice = Number(price ?? 0)
    return numericPrice === 0 ? 'Gratis' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numericPrice)
  }
  
  return (
    <main className="container py-5">

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h1 className="text-success fw-bold">
            Panel del Agente
          </h1>

          <p className="text-muted mb-0">
            Bienvenido, {user?.username}
          </p>
        </div>

        <button
          className="btn btn-outline-success"
          onClick={() => navigate('/')}
        >
          Ver sitio
        </button>

      </div>

      <div className="row g-5">
        <section className="col-lg-5" aria-labelledby="create-event-title">
          <h2 id="create-event-title" className="h4 fw-bold mb-3">Registrar evento</h2>
          {notice && <div className="alert alert-success py-2" role="status">{notice}</div>}
          <form onSubmit={handleCreateEvent} className="row g-3">
            <div className="col-12">
              <label htmlFor="event-title" className="form-label">Nombre del evento</label>
              <input id="event-title" name="title" className="form-control" required maxLength={100} />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-city" className="form-label">Ciudad</label>
              <input id="event-city" name="city" className="form-control" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-category" className="form-label">Categoría</label>
              <select id="event-category" name="category" className="form-select" required defaultValue="">
                <option value="" disabled>Selecciona una</option>
                <option value="music">Música</option>
                <option value="festival">Festival</option>
                <option value="theater">Teatro</option>
                <option value="concerts">Conciertos</option>
                <option value="crafting">Bricolaje</option>
                <option value="sports">Deportes</option>
                <option value="environment">Medio ambiente</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="event-date" className="form-label">Fecha</label>
              <input id="event-date" name="date" type="date" className="form-control" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-price" className="form-label">Precio (COP)</label>
              <input id="event-price" name="price" type="number" className="form-control" min="0" step="1000" defaultValue="0" required />
            </div>
            <div className="col-12">
              <label htmlFor="event-image" className="form-label">URL de imagen</label>
              <input id="event-image" name="image" type="url" className="form-control" placeholder="https://..." required />
            </div>
            <div className="col-12">
              <label htmlFor="event-description" className="form-label">Descripción</label>
              <textarea id="event-description" name="description" className="form-control" rows={3} required />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-success">Registrar evento</button>
            </div>
          </form>
        </section>

        <section className="col-lg-7" aria-labelledby="events-list-title">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 id="events-list-title" className="h4 fw-bold mb-0">Eventos registrados</h2>
            <span className="badge text-bg-light">{events.length}</span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle admin-table">
              <thead><tr><th>Evento</th><th>Ciudad</th><th>Fecha</th><th>Precio</th></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="fw-semibold">{event.title}</td>
                    <td>{event.city}</td>
                    <td>{event.date}</td>
                    <td>{formatPrice(event.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="col-12" aria-labelledby="reservations-title">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 id="reservations-title" className="h4 fw-bold mb-0">Administrar reservas</h2>
            <span className="badge text-bg-light">{reservations.length}</span>
          </div>
          {reservations.length === 0 ? (
            <p className="text-muted border-top py-4 mb-0">Todavía no hay reservas solicitadas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle admin-table">
                <thead><tr><th>Cliente</th><th>Evento</th><th>Fecha de solicitud</th><th>Estado</th></tr></thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>{reservation.customer}</td>
                      <td className="fw-semibold">{reservation.eventTitle}</td>
                      <td>{
                        reservation.createdAt
                          ? (new Date(reservation.createdAt).toString() === 'Invalid Date'
                              ? 'Fecha no disponible'
                              : new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(reservation.createdAt)))
                          : 'Fecha no disponible'
                      }</td>
                      <td>
                        {reservation.status === 'PAGADA' ? (
                          <span className="badge text-bg-success">Pagada</span>
                        ) : (
                          <select
                            className="form-select form-select-sm"
                            aria-label={`Estado de reserva de ${reservation.customer} para ${reservation.eventTitle}`}
                            value={reservation.status}
                            onChange={(event) => updateReservationStatus(reservation.id, event.target.value as ReservationStatus)}
                          >
                            <option value="SOLICITADA">Solicitada</option>
                            <option value="CONFIRMADA">Confirmada</option>
                            <option value="RECHAZADA">Rechazada</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

    </main>
  )
}

export default Agente