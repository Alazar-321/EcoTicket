import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import { getCurrentUser, type User } from '../auth/auth'
import useEcoTicketData from '../hooks/useEcoTicketData'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  updateReservationStatus,
  type ReservationStatus,
} from '../services/ecoTicketService'
import type { Event } from '../types/event'
import { APP_TIME_ZONE, formatDateOnly, formatTime12h } from '../utils/date'

// Colores para la gráfica de reservas (Estados)
const STATUS_COLORS: Record<string, string> = {
  Solicitadas: '#ffc107', // Warning
  Confirmadas: '#0d6efd', // Primary
  Rechazadas: '#dc3545',  // Danger
  Pagadas: '#198754',     // Success
}

// Colores para la gráfica de categorías de eventos
const CATEGORY_COLORS = [
  '#198754', // Verde principal
  '#20c997', // Teal
  '#0dcaf0', // Cían
  '#0d6efd', // Azul
  '#6f42c1', // Morado
  '#d63384', // Rosado
  '#fd7e14', // Naranja
  '#6c757d', // Gris
]

// Mapeo legible para nombres de categoría
const CATEGORY_LABELS: Record<string, string> = {
  music: 'Música',
  festival: 'Festival',
  theater: 'Teatro',
  concerts: 'Conciertos',
  crafting: 'Bricolaje',
  sports: 'Deportes',
  environment: 'Medio ambiente',
  other: 'Otro',
}

function formatRequestDate(value?: string) {
  if (!value) return 'Fecha no disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: APP_TIME_ZONE,
  }).format(date)
}

function formatEventDate(value?: string) {
  return formatDateOnly(value, { dateStyle: 'medium' }) || 'Fecha no disponible'
}

function formatPrice(price: Event['price']) {
  const numericPrice = Number(price ?? 0)
  return numericPrice === 0
    ? 'Gratis'
    : new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(numericPrice)
}

function Agente() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const { events, reservations } = useEcoTicketData()
  const [notice, setNotice] = useState('')
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  // Estados para el filtro de eventos
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Estados para el filtro de reservas
  const [reservationSearchTerm, setReservationSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  async function handleCreateEvent(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    const formElement = formEvent.currentTarget
    const form = new FormData(formElement)

    const eventData = {
      title: String(form.get('title')),
      organizer: user?.username ?? 'Eco Ticket',
      city: String(form.get('city')),
      category: String(form.get('category')),
      description: String(form.get('description')),
      date: String(form.get('date')),
      start_time: String(form.get('start_time')),
      end_time: String(form.get('end_time')),
      capacity: Number(form.get('capacity')),
      location: String(form.get('location')),
      image: String(form.get('image')),
      price: Number(form.get('price')),
    }

    await createEvent(eventData)
    formElement.reset()
    setNotice('El evento quedó registrado y ya está disponible en el catálogo.')
  }

  async function handleDeleteEvent(id: number) {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción borrará también todas sus reservas y no se puede deshacer.')
    if (!confirmed) return

    setIsDeleting(id)
    const success = await deleteEvent(id)
    setIsDeleting(null)

    if (success) {
      setNotice('El evento ha sido eliminado correctamente.')
    } else {
      setNotice('Hubo un error al intentar eliminar el evento.')
    }
  }

  function startEditing(event: Event) {
    navigate(`/edit-event/${event.id}`)
  }

  // Filtrado de eventos
  const filteredEvents = events.filter((event) => {
    const matchesTitle = event.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || event.category === selectedCategory
    return matchesTitle && matchesCategory
  })

  // Filtrado de reservas
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customer.toLowerCase().includes(reservationSearchTerm.toLowerCase()) ||
      reservation.eventTitle.toLowerCase().includes(reservationSearchTerm.toLowerCase())
    const matchesStatus = selectedStatus === '' || reservation.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // -------------------------------------------------------------
  // TRANSFORMACIÓN DE DATOS PARA GRÁFICAS
  // -------------------------------------------------------------

  // 1. Eventos por ciudad (BarChart)
  const eventsByCityData = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((e) => {
      const city = e.city || 'Sin ciudad'
      counts[city] = (counts[city] || 0) + 1
    })

    return Object.entries(counts).map(([ciudad, cantidad]) => ({
      ciudad,
      cantidad,
    }))
  }, [events])

  // 2. Eventos por categoría (PieChart / Dona) -> NUEVA GRÁFICA
  const eventsByCategoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((e) => {
      const category = e.category || 'other'
      counts[category] = (counts[category] || 0) + 1
    })

    return Object.entries(counts).map(([catKey, cantidad]) => ({
      name: CATEGORY_LABELS[catKey] || catKey,
      cantidad,
    }))
  }, [events])

  // 3. Reservas por estado (PieChart / Dona)
  const reservationsByStatusData = useMemo(() => {
    const counts = {
      Solicitadas: 0,
      Confirmadas: 0,
      Rechazadas: 0,
      Pagadas: 0,
    }

    reservations.forEach((r) => {
      if (r.status === 'SOLICITADA') counts.Solicitadas += 1
      if (r.status === 'CONFIRMADA') counts.Confirmadas += 1
      if (r.status === 'RECHAZADA') counts.Rechazadas += 1
      if (r.status === 'PAGADA') counts.Pagadas += 1
    })

    return [
      { name: 'Solicitadas', value: counts.Solicitadas },
      { name: 'Confirmadas', value: counts.Confirmadas },
      { name: 'Rechazadas', value: counts.Rechazadas },
      { name: 'Pagadas', value: counts.Pagadas },
    ].filter((item) => item.value > 0)
  }, [reservations])

  return (
    <main className="container py-5  admin-agente">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-light fw-bold">Panel del Agente</h1>
          <p className="text-bold mb-0">Bienvenido, {user?.username}</p>
        </div>

        <button
          className="btn btn-success"
          onClick={() => navigate('/')}
        >
          Ver sitio
        </button>
      </div>

      {/* SECCIÓN SUPERIOR DE GRÁFICAS ESTADÍSTICAS */}
      <section className="row g-4 mb-5" aria-label="Métricas principales">
        <div className="col-md-7">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h3 className="h6 fw-bold text-muted mb-3">Eventos por Ciudad</h3>
              {events.length === 0 ? (
                <p className="text-muted small my-4 text-center">
                  No hay eventos para mostrar estadísticas.
                </p>
              ) : (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={eventsByCityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="ciudad" />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value) => [`${value} eventos`, 'Cantidad']} />
                      <Bar dataKey="cantidad" fill="#42467eec" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h3 className="h6 fw-bold text-muted mb-3">Reservas por Estado</h3>
              {reservations.length === 0 ? (
                <p className="text-muted small my-4 text-center">
                  No hay reservas para mostrar estadísticas.
                </p>
              ) : (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={reservationsByStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {reservationsByStatusData.map((entry) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={STATUS_COLORS[entry.name] || '#6c757d'}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} reservas`, 'Total']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="row g-5 ">
        {/* FORMULARIO DE REGISTRO DE EVENTO */}
        <section className="col-lg-5" aria-labelledby="create-event-title">
          <h2 id="create-event-title" className="h4 fw-bold mb-3">
            Registrar evento
          </h2>
          {notice && (
            <div className="alert alert-success py-2" role="status">
              {notice}
            </div>
          )}
          <form onSubmit={handleCreateEvent} className="row g-3">
            <div className="col-12">
              <label htmlFor="event-title" className="form-label">
                Nombre del evento
              </label>
              <input
                id="event-title"
                name="title"
                className="form-control"
                required
                maxLength={100}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-city" className="form-label">
                Ciudad
              </label>
              <input
                id="event-city"
                name="city"
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-category" className="form-label">
                Categoría
              </label>
              <select
                id="event-category"
                name="category"
                className="form-select"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona una
                </option>
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
              <label htmlFor="event-date" className="form-label">
                Fecha
              </label>
              <input
                id="event-date"
                name="date"
                type="date"
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-start-time" className="form-label">
                Hora de Inicio
              </label>
              <input
                id="event-start-time"
                name="start_time"
                type="time"
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-end-time" className="form-label">
                Hora de Fin
              </label>
              <input
                id="event-end-time"
                name="end_time"
                type="time"
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-price" className="form-label">
                Precio (COP)
              </label>
              <input
                id="event-price"
                name="price"
                type="number"
                className="form-control"
                min="0"
                step="1000"
                defaultValue="0"
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-capacity" className="form-label">
                Capacidad (Boletos)
              </label>
              <input
                id="event-capacity"
                name="capacity"
                type="number"
                className="form-control"
                min="1"
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="event-location" className="form-label">
                Lugar / Dirección
              </label>
              <input
                id="event-location"
                name="location"
                className="form-control"
                placeholder="Ej. Estadio Metropolitano"
                required
              />
            </div>
            <div className="col-12">
              <label htmlFor="event-image" className="form-label">
                URL de imagen
              </label>
              <input
                id="event-image"
                name="image"
                type="url"
                className="form-control"
                placeholder="https://..."
                required
              />
            </div>
            <div className="col-12">
              <label htmlFor="event-description" className="form-label">
                Descripción
              </label>
              <textarea
                id="event-description"
                name="description"
                className="form-control"
                rows={3}
                required
              />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-success">
                Registrar evento
              </button>
            </div>
          </form>
        </section>

        {/* TABLA DE EVENTOS REGISTRADOS Y NUEVA GRÁFICA DE CATEGORÍAS */}
        <section className="col-lg-7 d-flex flex-column" aria-labelledby="events-list-title">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 id="events-list-title" className="h4 fw-bold mb-0">
              Eventos registrados
            </h2>
            <span className="badge text-bg-light">
              {filteredEvents.length}{' '}
              {filteredEvents.length !== events.length
                ? `de ${events.length}`
                : ''}
            </span>
          </div>

          {/* Filtros Eventos */}
          <div className="row g-2 mb-3">
            <div className="col-md-7">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Buscar por nombre de evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <select
                className="form-select form-select-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
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
          </div>

          <div className="table-responsive mb-4">
            <table className="table table-hover align-middle admin-table mb-0">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Ciudad</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Capacidad</th>
                  <th>Precio</th>
                  <th>Edit/Borrar</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No se encontraron eventos con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="fw-semibold">{event.title}</td>
                      <td>{event.city}</td>
                      <td>{formatEventDate(event.date)}</td>
                      <td>{`${formatTime12h(event.start_time)} - ${formatTime12h(event.end_time)}`}</td>
                      <td>{event.capacity ?? '--'}</td>
                      <td>{formatPrice(event.price)}</td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => startEditing(event)}
                            aria-label={`Editar ${event.title}`}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={isDeleting === event.id}
                            onClick={() => handleDeleteEvent(event.id!)}
                            aria-label={`Eliminar ${event.title}`}
                          >
                            {isDeleting === event.id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <i className="bi bi-trash"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* NUEVA GRÁFICA DE EVENTOS POR CATEGORÍA (Debajo de la tabla) */}
          <div className="card shadow-sm border-0 mt-auto">
            <div className="card-body py-3">
              <h3 className="h6 fw-bold text-muted mb-3">
                Distribución por Categoría
              </h3>
              {events.length === 0 ? (
                <p className="text-muted small my-2 text-center">
                  Sin eventos registrados.
                </p>
              ) : (
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={eventsByCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="cantidad"
                        
                      >
                        {eventsByCategoryData.map((_, index) => (
                          <Cell
                            key={`cell-cat-${index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} eventos`, 'Categoría']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECCIÓN DE ADMINISTRACIÓN DE RESERVAS */}
        <section className="col-12" aria-labelledby="reservations-title">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 id="reservations-title" className="h4 fw-bold mb-0">
              Administrar reservas
            </h2>
            <span className="badge text-bg-light">
              {filteredReservations.length}{' '}
              {filteredReservations.length !== reservations.length
                ? `de ${reservations.length}`
                : ''}
            </span>
          </div>

          {reservations.length === 0 ? (
            <p className="text-muted border-top py-4 mb-0">
              Todavía no hay reservas solicitadas.
            </p>
          ) : (
            <>
              {/* Filtros Reservas */}
              <div className="row g-2 mb-3">
                <div className="col-md-7">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Buscar por cliente o evento..."
                    value={reservationSearchTerm}
                    onChange={(e) => setReservationSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-5">
                  <select
                    className="form-select form-select-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="SOLICITADA">Solicitada</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="RECHAZADA">Rechazada</option>
                    <option value="PAGADA">Pagada</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle admin-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Evento</th>
                      <th>Fecha de solicitud</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No se encontraron reservas con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td>{reservation.customer}</td>
                          <td className="fw-semibold">
                            {reservation.eventTitle}
                          </td>
                          <td>{formatRequestDate(reservation.createdAt)}</td>
                          <td>
                            {reservation.status === 'PAGADA' ? (
                              <span className="badge text-bg-success">
                                Pagada
                              </span>
                            ) : (
                              <select
                                className="form-select form-select-sm"
                                aria-label={`Estado de reserva de ${reservation.customer} para ${reservation.eventTitle}`}
                                value={reservation.status}
                                onChange={(event) =>
                                  updateReservationStatus(
                                    reservation.id,
                                    event.target.value as ReservationStatus
                                  )
                                }
                              >
                                <option value="SOLICITADA">Solicitada</option>
                                <option value="CONFIRMADA">Confirmada</option>
                                <option value="RECHAZADA">Rechazada</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

export default Agente