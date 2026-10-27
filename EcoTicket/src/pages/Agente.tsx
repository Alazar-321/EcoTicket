import { useEffect, useState, useMemo, type FormEvent, type ReactNode } from 'react'
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
  saveEventZones,
  deleteEvent,
  updateEvent,
  getMyAgentDetails,
  subscribeToEcoTicketData,
  updateReservationStatus,
  type ReservationStatus,
} from '../services/ecoTicketService'
import type { Event } from '../types/event'
import {
  EVENT_STATUSES,
  EVENT_STATUS_BADGE,
  eventCode,
  type EventStatus,
} from '../utils/eventStatus'
import { APP_TIME_ZONE, formatDateOnly, formatTime12h } from '../utils/date'
import { validateZones, type EventZone } from '../utils/seating'
import ZonesEditor from '../components/ZonesEditor'

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

// Misma altura para las tres gráficas: así las tarjetas de la fila quedan alineadas
const CHART_HEIGHT = 240

type Tab = 'eventos' | 'reservas' | 'nuevo'
type Notice = { type: 'success' | 'danger'; text: string }

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

// Tarjeta de métrica: icono, valor grande y una línea de apoyo
function StatTile({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: string
  label: string
  value: ReactNode
  hint?: string
  tone: 'success' | 'primary' | 'warning' | 'info'
}) {
  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-body d-flex align-items-center gap-3">
        <span
          className={`d-none d-sm-inline-flex align-items-center justify-content-center rounded-3 bg-${tone}-subtle text-${tone}-emphasis flex-shrink-0`}
          style={{ width: 48, height: 48 }}
          aria-hidden="true"
        >
          <i className={`bi ${icon} fs-4`}></i>
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="text-muted small text-uppercase fw-semibold">{label}</div>
          <div className="fs-4 fw-bold lh-sm text-break">{value}</div>
          {hint && <div className="small text-muted">{hint}</div>}
        </div>
      </div>
    </div>
  )
}

// Tarjeta de gráfica con encabezado uniforme
function ChartCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-body">
        <h3 className="h6 fw-bold text-muted mb-3">
          <i className={`bi ${icon} me-2`} aria-hidden="true"></i>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

function Agente() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const { events, reservations } = useEcoTicketData()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('eventos')
  // Categorías de boletería del evento que se está creando (opcional) y precio base para sugerirlas
  const [zones, setZones] = useState<EventZone[]>([])
  const [basePrice, setBasePrice] = useState(0)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Estados para el filtro de eventos
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Estados para el filtro de reservas
  const [reservationSearchTerm, setReservationSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  // Comisión y experiencia asignadas por el administrador
  const [agentInfo, setAgentInfo] = useState<{ commission: number; experience: string } | null>(null)

  useEffect(() => {
    let active = true
    const load = () => {
      getMyAgentDetails().then((details) => {
        if (active) setAgentInfo(details)
      })
    }
    load()
    const unsubscribe = subscribeToEcoTicketData(load)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function handleCreateEvent(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    const formElement = formEvent.currentTarget
    const form = new FormData(formElement)

    const eventData = {
      title: String(form.get('title')),
      // El organizador lo escribe quien crea el evento; si lo deja vacío se usa su usuario
      organizer: String(form.get('organizer') ?? '').trim() || user?.username || 'Eco Ticket',
      city: String(form.get('city')),
      category: String(form.get('category')),
      description: String(form.get('description')),
      date: String(form.get('date')),
      start_time: String(form.get('start_time')),
      end_time: String(form.get('end_time')),
      // Si no se indica fecha de fin, el evento termina el mismo día en que empieza
      end_date: String(form.get('end_date') || form.get('date')),
      notes: String(form.get('notes') ?? '').trim(),
      status: String(form.get('status') || 'PROGRAMADO') as EventStatus,
      capacity: Number(form.get('capacity')),
      location: String(form.get('location')),
      image: String(form.get('image')),
      price: Number(form.get('price')),
    }

    // Se validan las categorías antes de crear el evento para no dejarlo a medias
    const zonesError = zones.length > 0 ? validateZones(zones) : null
    if (zonesError) {
      setNotice({ type: 'danger', text: zonesError })
      return
    }

    setIsCreating(true)
    const created = await createEvent(eventData)
    if (!created) {
      setIsCreating(false)
      setNotice({ type: 'danger', text: 'No se pudo registrar el evento.' })
      return
    }

    if (zones.length > 0 && created.id != null) {
      const saved = await saveEventZones(created.id, zones)
      if (!saved.ok) {
        setIsCreating(false)
        setNotice({
          type: 'danger',
          text: `El evento se creó, pero sus categorías no se guardaron: ${saved.message}. Puedes agregarlas editando el evento.`,
        })
        formElement.reset()
        setZones([])
        setActiveTab('eventos')
        return
      }
    }

    setIsCreating(false)
    formElement.reset()
    setZones([])
    setBasePrice(0)
    setNotice({ type: 'success', text: 'El evento quedó registrado y ya está disponible en el catálogo.' })
    // Al terminar se vuelve a la lista para ver el evento recién creado
    setActiveTab('eventos')
  }

  async function handleDeleteEvent(id: number) {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción borrará también todas sus reservas y no se puede deshacer.')
    if (!confirmed) return

    setIsDeleting(id)
    const success = await deleteEvent(id)
    setIsDeleting(null)

    if (success) {
      setNotice({ type: 'success', text: 'El evento ha sido eliminado correctamente.' })
    } else {
      setNotice({ type: 'danger', text: 'Hubo un error al intentar eliminar el evento.' })
    }
  }

  async function handleStatusChange(event: Event, status: EventStatus) {
    if (event.id == null) return
    const updated = await updateEvent(event.id, { status })
    setNotice(
      updated
        ? { type: 'success', text: `El evento «${event.title}» ahora está ${EVENT_STATUS_BADGE[status].label.toLowerCase()}.` }
        : { type: 'danger', text: 'No se pudo cambiar el estado del evento.' }
    )
  }

  function startEditing(event: Event) {
    navigate(`/edit-event/${event.id}`)
  }

  const isAdmin = user?.role === 'ADMINISTRADOR'
  // Solo el dueño del evento o un administrador puede cambiarlo o borrarlo
  const canManageEvent = (event: Event) => isAdmin || event.created_by === user?.id

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
  // MÉTRICAS Y DATOS PARA GRÁFICAS
  // -------------------------------------------------------------

  const myEventsCount = events.filter(canManageEvent).length
  const pendingCount = reservations.filter((r) => r.status === 'SOLICITADA').length
  const paidRevenue = reservations
    .filter((r) => r.status === 'PAGADA')
    .reduce((sum, r) => sum + Number(r.price ?? 0), 0)

  // 1. Eventos por ciudad (BarChart)
  const eventsByCityData = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((e) => {
      const city = e.city?.trim() || 'Sin ciudad'
      counts[city] = (counts[city] || 0) + 1
    })

    return Object.entries(counts).map(([ciudad, cantidad]) => ({
      ciudad,
      cantidad,
    }))
  }, [events])

  // 2. Eventos por categoría (PieChart / Dona)
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

  // Selector de estado (si puede gestionarlo) o etiqueta (si no): se usa en la tabla y en las tarjetas
  const renderEventStatus = (event: Event) => {
    const status = event.status ?? 'PROGRAMADO'
    if (!canManageEvent(event)) {
      return <span className={`badge ${EVENT_STATUS_BADGE[status].className}`}>{EVENT_STATUS_BADGE[status].label}</span>
    }
    return (
      <select
        className="form-select form-select-sm"
        aria-label={`Estado del evento ${event.title}`}
        value={status}
        onChange={(e) => handleStatusChange(event, e.target.value as EventStatus)}
      >
        {EVENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {EVENT_STATUS_BADGE[s].label}
          </option>
        ))}
      </select>
    )
  }

  const renderEventActions = (event: Event) => {
    if (!canManageEvent(event)) return null
    return (
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
    )
  }

  const tabButton = (tab: Tab, icon: string, label: string, count?: number) => (
    <button
      key={tab}
      type="button"
      role="tab"
      aria-selected={activeTab === tab}
      className={`btn flex-shrink-0 ${activeTab === tab ? 'btn-light fw-semibold' : 'btn-outline-light'}`}
      onClick={() => setActiveTab(tab)}
    >
      <i className={`bi ${icon} me-2`} aria-hidden="true"></i>
      {label}
      {count != null && (
        <span className={`badge ms-2 ${activeTab === tab ? 'text-bg-success' : 'text-bg-light'}`}>{count}</span>
      )}
    </button>
  )

  return (
    <main className="container py-4 py-md-5 admin-agente">
      {/* ENCABEZADO: saludo, experiencia y acceso al sitio */}
      <header className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex flex-column flex-md-row align-items-md-center gap-3">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white fw-bold flex-shrink-0"
            style={{ width: 56, height: 56, fontSize: '1.5rem' }}
            aria-hidden="true"
          >
            {(user?.username ?? '?').charAt(0).toUpperCase()}
          </span>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <p className="text-success fw-semibold text-uppercase small mb-0">Panel del agente</p>
            <h1 className="h3 fw-bold mb-1 text-break">Bienvenido, {user?.username}</h1>
            <p className="text-muted small mb-0" style={{ whiteSpace: 'pre-line' }}>
              <i className="bi bi-award me-1" aria-hidden="true"></i>
              <span className="fw-semibold">Experiencia: </span>
              {agentInfo?.experience?.trim() || 'Aún no tienes experiencia registrada. El administrador puede agregarla.'}
            </p>
          </div>
          <button className="btn btn-success align-self-md-center" onClick={() => navigate('/')}>
            <i className="bi bi-box-arrow-up-right me-2" aria-hidden="true"></i>
            Ver sitio
          </button>
        </div>
      </header>

      {/* MÉTRICAS */}
      <section className="row g-3 mb-4" aria-label="Resumen">
        <div className="col-6 col-lg-3">
          <StatTile
            icon="bi-percent"
            label="Mi comisión"
            value={agentInfo ? `${agentInfo.commission}%` : '--'}
            hint="Del administrador"
            tone="success"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatTile
            icon="bi-calendar-event"
            label={isAdmin ? 'Eventos' : 'Mis eventos'}
            value={myEventsCount}
            hint={`${events.length} en total`}
            tone="primary"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatTile
            icon="bi-hourglass-split"
            label="Por atender"
            value={pendingCount}
            hint="Reservas solicitadas"
            tone="warning"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatTile
            icon="bi-cash-coin"
            label="Pagado"
            value={formatPrice(paidRevenue)}
            hint="Reservas pagadas"
            tone="info"
          />
        </div>
      </section>

      {/* GRÁFICAS: las tres en una misma fila */}
      <section className="row g-3 mb-4" aria-label="Estadísticas">
        <div className="col-lg-4">
          <ChartCard title="Eventos por ciudad" icon="bi-geo-alt">
            {events.length === 0 ? (
              <p className="text-muted small my-5 text-center">No hay eventos para mostrar estadísticas.</p>
            ) : (
              <div style={{ width: '100%', height: CHART_HEIGHT }}>
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
          </ChartCard>
        </div>

        <div className="col-md-6 col-lg-4">
          <ChartCard title="Reservas por estado" icon="bi-pie-chart">
            {reservations.length === 0 ? (
              <p className="text-muted small my-5 text-center">No hay reservas para mostrar estadísticas.</p>
            ) : (
              <div style={{ width: '100%', height: CHART_HEIGHT }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={reservationsByStatusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reservationsByStatusData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || '#6c757d'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} reservas`, 'Total']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        <div className="col-md-6 col-lg-4">
          <ChartCard title="Distribución por categoría" icon="bi-tags">
            {events.length === 0 ? (
              <p className="text-muted small my-5 text-center">Sin eventos registrados.</p>
            ) : (
              <div style={{ width: '100%', height: CHART_HEIGHT }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={eventsByCategoryData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="cantidad"
                    >
                      {eventsByCategoryData.map((_, index) => (
                        <Cell key={`cell-cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} eventos`, 'Categoría']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </section>

      {/* NAVEGACIÓN ENTRE SECCIONES: una sola zona de trabajo en vez de columnas desiguales */}
      <div
        className="d-flex gap-2 mb-3 pb-1 overflow-auto"
        role="tablist"
        aria-label="Secciones del panel"
      >
        {tabButton('eventos', 'bi-calendar-event', 'Eventos', events.length)}
        {tabButton('reservas', 'bi-ticket-perforated', 'Reservas', reservations.length)}
        {tabButton('nuevo', 'bi-plus-circle', 'Nuevo evento')}
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} alert-dismissible py-2`} role={notice.type === 'danger' ? 'alert' : 'status'}>
          {notice.text}
          <button type="button" className="btn-close" aria-label="Cerrar aviso" onClick={() => setNotice(null)}></button>
        </div>
      )}

      {/* ───────────── EVENTOS REGISTRADOS ───────────── */}
      {activeTab === 'eventos' && (
        <section className="card border-0 shadow-sm" aria-labelledby="events-list-title" role="tabpanel">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 id="events-list-title" className="h5 fw-bold mb-0">
                Eventos registrados
                <span className="badge text-bg-light ms-2">
                  {filteredEvents.length}
                  {filteredEvents.length !== events.length ? ` de ${events.length}` : ''}
                </span>
              </h2>
              <button type="button" className="btn btn-success btn-sm" onClick={() => setActiveTab('nuevo')}>
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                Nuevo evento
              </button>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Buscar por nombre de evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select form-select-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <p className="text-center text-muted py-4 mb-0">No se encontraron eventos con los filtros aplicados.</p>
            ) : (
              <>
                {/* Pantallas medianas y grandes: tabla */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover align-middle admin-table mb-0">
                    <thead>
                      <tr>
                        <th>Evento</th>
                        <th>Fecha y hora</th>
                        <th>Cupo</th>
                        <th>Precio</th>
                        <th style={{ minWidth: 150 }}>Estado</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => (
                        <tr key={event.id}>
                          <td>
                            <div className="fw-semibold">{event.title}</div>
                            <div className="small text-muted">
                              {eventCode(event.id)} · {event.city}
                              {event.organizer ? ` · ${event.organizer}` : ''}
                            </div>
                          </td>
                          <td>
                            <div>{formatEventDate(event.date)}</div>
                            <div className="small text-muted">
                              {`${formatTime12h(event.start_time)} - ${formatTime12h(event.end_time)}`}
                            </div>
                            {event.end_date && event.end_date !== event.date && (
                              <div className="small text-muted">hasta {formatEventDate(event.end_date)}</div>
                            )}
                          </td>
                          <td>{event.capacity ?? '--'}</td>
                          <td>{formatPrice(event.price)}</td>
                          <td>{renderEventStatus(event)}</td>
                          <td className="text-end text-nowrap">{renderEventActions(event)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Móviles: una tarjeta por evento */}
                <ul className="list-unstyled d-md-none mb-0">
                  {filteredEvents.map((event) => (
                    <li key={event.id} className="border rounded-3 p-3 mb-2">
                      <div className="fw-semibold text-break">{event.title}</div>
                      <div className="small text-muted mb-2">
                        {eventCode(event.id)} · {event.city}
                      </div>
                      <div className="small">
                        <i className="bi bi-calendar3 me-1" aria-hidden="true"></i>
                        {formatEventDate(event.date)} · {formatTime12h(event.start_time)} - {formatTime12h(event.end_time)}
                      </div>
                      <div className="small mb-2">
                        <i className="bi bi-people me-1" aria-hidden="true"></i>
                        {event.capacity ?? '--'} cupos · {formatPrice(event.price)}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div className="flex-grow-1">{renderEventStatus(event)}</div>
                        {renderEventActions(event)}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      {/* ───────────── ADMINISTRAR RESERVAS ───────────── */}
      {activeTab === 'reservas' && (
        <section className="card border-0 shadow-sm" aria-labelledby="reservations-title" role="tabpanel">
          <div className="card-body">
            <h2 id="reservations-title" className="h5 fw-bold mb-3">
              Administrar reservas
              <span className="badge text-bg-light ms-2">
                {filteredReservations.length}
                {filteredReservations.length !== reservations.length ? ` de ${reservations.length}` : ''}
              </span>
            </h2>

            {reservations.length === 0 ? (
              <p className="text-muted border-top py-4 mb-0">Todavía no hay reservas solicitadas.</p>
            ) : (
              <>
                <div className="row g-2 mb-3">
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Buscar por cliente o evento..."
                      value={reservationSearchTerm}
                      onChange={(e) => setReservationSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
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
                  <table className="table table-hover align-middle admin-table mb-0">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Evento</th>
                        <th>Fecha de solicitud</th>
                        <th style={{ minWidth: 150 }}>Estado</th>
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
                              {reservation.seatLabel && (
                                <div className="small fw-normal text-muted">
                                  {reservation.zoneName ? `${reservation.zoneName} · ` : ''}Asiento {reservation.seatLabel}
                                </div>
                              )}
                            </td>
                            <td>{formatRequestDate(reservation.createdAt)}</td>
                            <td>
                              {reservation.status === 'PAGADA' ? (
                                <span className="badge text-bg-success">Pagada</span>
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
          </div>
        </section>
      )}

      {/* ───────────── REGISTRAR EVENTO ───────────── */}
      {/* Siempre montado (solo se oculta): si cambias de pestaña a mitad del formulario no pierdes lo escrito */}
      {(
        <section
          className={`card border-0 shadow-sm ${activeTab === 'nuevo' ? '' : 'd-none'}`}
          aria-labelledby="create-event-title"
          role="tabpanel"
          hidden={activeTab !== 'nuevo'}
        >
          <div className="card-body">
            <h2 id="create-event-title" className="h5 fw-bold mb-4">
              Registrar evento
            </h2>

            <form onSubmit={handleCreateEvent} className="row g-3">
              <div className="col-12">
                <h3 className="h6 text-uppercase text-muted border-bottom pb-2 mb-0">Información general</h3>
              </div>
              <div className="col-md-6">
                <label htmlFor="event-title" className="form-label">
                  Nombre del evento
                </label>
                <input id="event-title" name="title" className="form-control" required maxLength={100} />
              </div>
              <div className="col-md-6">
                <label htmlFor="event-organizer" className="form-label">
                  Organiza
                </label>
                {/* key: el campo se vuelve a crear cuando se carga el usuario y así trae su nombre por defecto */}
                <input
                  key={user?.username ?? 'sin-usuario'}
                  id="event-organizer"
                  name="organizer"
                  className="form-control"
                  defaultValue={user?.username ?? ''}
                  placeholder="Nombre de quien organiza el evento"
                  required
                  maxLength={100}
                />
                <div className="form-text">Aparece como organizador. Puedes escribir el nombre que quieras.</div>
              </div>
              <div className="col-md-4">
                <label htmlFor="event-category" className="form-label">
                  Categoría
                </label>
                <select id="event-category" name="category" className="form-select" required defaultValue="">
                  <option value="" disabled>
                    Selecciona una
                  </option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label htmlFor="event-city" className="form-label">
                  Ciudad
                </label>
                <input id="event-city" name="city" className="form-control" required />
              </div>
              <div className="col-md-4">
                <label htmlFor="event-location" className="form-label">
                  Teatro / Lugar
                </label>
                <input
                  id="event-location"
                  name="location"
                  className="form-control"
                  placeholder="Ej. Estadio Metropolitano"
                  required
                />
              </div>

              <div className="col-12 mt-4">
                <h3 className="h6 text-uppercase text-muted border-bottom pb-2 mb-0">Fecha y horario</h3>
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="event-date" className="form-label">
                  Fecha de inicio
                </label>
                <input id="event-date" name="date" type="date" className="form-control" required />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="event-start-time" className="form-label">
                  Hora de inicio
                </label>
                <input id="event-start-time" name="start_time" type="time" className="form-control" required />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="event-end-date" className="form-label">
                  Fecha de fin
                </label>
                <input id="event-end-date" name="end_date" type="date" className="form-control" />
                <div className="form-text">Vacía = el mismo día.</div>
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="event-end-time" className="form-label">
                  Hora estimada de fin
                </label>
                <input id="event-end-time" name="end_time" type="time" className="form-control" required />
              </div>

              <div className="col-12 mt-4">
                <h3 className="h6 text-uppercase text-muted border-bottom pb-2 mb-0">Boletería y estado</h3>
              </div>
              <div className="col-md-4">
                <label htmlFor="event-price" className="form-label">
                  Precio base (COP)
                </label>
                <input
                  id="event-price"
                  name="price"
                  type="number"
                  className="form-control"
                  min="0"
                  step="1000"
                  defaultValue="0"
                  onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="event-capacity" className="form-label">
                  Capacidad (boletos)
                </label>
                <input id="event-capacity" name="capacity" type="number" className="form-control" min="1" required />
                <div className="form-text">Si agregas categorías con asientos, se calcula sola.</div>
              </div>
              <div className="col-md-4">
                <label htmlFor="event-status" className="form-label">
                  Estado
                </label>
                <select id="event-status" name="status" className="form-select" defaultValue="PROGRAMADO" required>
                  {EVENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {EVENT_STATUS_BADGE[status].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <ZonesEditor value={zones} onChange={setZones} basePrice={basePrice} />
              </div>

              <div className="col-12 mt-4">
                <h3 className="h6 text-uppercase text-muted border-bottom pb-2 mb-0">Detalles</h3>
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
              <div className="col-md-6">
                <label htmlFor="event-description" className="form-label">
                  Descripción
                </label>
                <textarea id="event-description" name="description" className="form-control" rows={3} required />
              </div>
              <div className="col-md-6">
                <label htmlFor="event-notes" className="form-label">
                  Observaciones
                </label>
                <textarea
                  id="event-notes"
                  name="notes"
                  className="form-control"
                  rows={3}
                  maxLength={500}
                  placeholder="Opcional. Ej. Puertas abren 1 hora antes"
                />
              </div>

              <div className="col-12 d-flex flex-wrap gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveTab('eventos')}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success px-4" disabled={isCreating}>
                  {isCreating ? 'Registrando...' : 'Registrar evento'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </main>
  )
}

export default Agente