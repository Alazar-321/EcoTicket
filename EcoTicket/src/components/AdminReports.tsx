import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import useEcoTicketData from '../hooks/useEcoTicketData'
import {
  deleteUser,
  getUsers,
  type Profile,
  type ReservationStatus,
} from '../services/ecoTicketService'
import type { Event } from '../types/event'
import ReservationGraph from './ReservationGraph'
import { APP_TIME_ZONE, formatDateOnly } from '../utils/date'

// ───────────────────────── Utilidades ─────────────────────────

const STATUS_BADGE: Record<ReservationStatus, { label: string; className: string }> = {
  SOLICITADA: { label: 'Solicitada', className: 'text-bg-warning' },
  CONFIRMADA: { label: 'Confirmada', className: 'text-bg-primary' },
  PAGADA: { label: 'Pagada', className: 'text-bg-success' },
  RECHAZADA: { label: 'Rechazada', className: 'text-bg-danger' },
}

function statusBadge(status: ReservationStatus) {
  return STATUS_BADGE[status] ?? { label: status, className: 'text-bg-secondary' }
}

function formatEventPrice(price: Event['price']) {
  const value = Number(price ?? 0)
  return value === 0 ? 'Gratis' : `$${value.toLocaleString('es-CO')}`
}

// Fecha de un momento exacto (timestamp), mostrada siempre en hora de Colombia
function formatRequestDate(value?: string) {
  if (!value) return 'Fecha no disponible'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: APP_TIME_ZONE,
  }).format(date)
}

// Fecha del evento ("YYYY-MM-DD"): se formatea sin que la zona horaria la mueva de día
function formatEventDate(value?: string) {
  return formatDateOnly(value, { dateStyle: 'medium' }) || 'Fecha no disponible'
}

function roleLabel(role: Profile['role']) {
  return role === 'AGENTE' ? 'Agente' : 'Cliente'
}

// Las gráficas son más bajas en pantallas pequeñas para no ocupar toda la vista
function useChartHeight() {
  const compute = () => (window.innerWidth < 576 ? 240 : 300)
  const [height, setHeight] = useState(compute)

  useEffect(() => {
    const onResize = () => setHeight(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return height
}

// ───────────────────────── Componente ─────────────────────────

function AdminReports() {
  const { events, reservations } = useEcoTicketData()
  const chartHeight = useChartHeight()

  // Usuarios (clientes y agentes)
  const [users, setUsers] = useState<Profile[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userNotice, setUserNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  async function handleDeleteUser(target: Profile) {
    const confirmed = window.confirm(
      `¿Eliminar a ${target.username}? Se borrarán también sus reservas. Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setDeletingId(target.id)
    const ok = await deleteUser(target.id)
    setDeletingId(null)

    if (ok) {
      setUsers((prev) => prev.filter((item) => item.id !== target.id))
      setUserNotice({ type: 'success', text: `${target.username} fue eliminado.` })
    } else {
      setUserNotice({
        type: 'danger',
        text: 'No se pudo eliminar el usuario. Comprueba que tienes permisos de administrador.',
      })
    }
  }

  // Estadísticas
  const totalEvents = events.length
  const averagePrice =
    totalEvents === 0
      ? 0
      : events.reduce((total, event) => total + Number(event.price ?? 0), 0) / totalEvents
  const cities = new Set(events.map((event) => event.city))

  const eventsByCity = Object.values(
    events.reduce(
      (acc, event) => {
        if (!acc[event.city]) {
          acc[event.city] = {
            city: event.city,
            events: 0,
          }
        }

        acc[event.city].events += 1

        return acc
      },
      {} as Record<string, { city: string; events: number }>
    )
  )

  const reservationsByStatus = [
    { status: 'Solicitadas', total: reservations.filter((item) => item.status === 'SOLICITADA').length },
    { status: 'Confirmadas', total: reservations.filter((item) => item.status === 'CONFIRMADA').length },
    { status: 'Pagadas', total: reservations.filter((item) => item.status === 'PAGADA').length },
    { status: 'Rechazadas', total: reservations.filter((item) => item.status === 'RECHAZADA').length },
  ]

  const stats = [
    { label: 'Eventos registrados', value: totalEvents, icon: 'bi bi-calendar-event' },
    {
      label: 'Precio promedio',
      value: `$${averagePrice.toLocaleString('es-CO')}`,
      icon: 'bi bi-cash-stack',
    },
    { label: 'Reservas recibidas', value: reservations.length, icon: 'bi bi-ticket-perforated' },
  ]

  return (
    <section className="card shadow-sm border-0 admin-reports mt-4">
      <div className="card-body p-3 p-md-4 p-lg-5">
        {/* ── Encabezado ── */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
          <div>
            <p className="text-light fw-semibold text-uppercase mb-1 small-letter-spacing">
              Resumen
            </p>
            <h2 className="h4 mb-0 text-dark fw-bold">Estadísticas del sistema</h2>
          </div>

          <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 align-self-start align-self-md-auto">
            {cities.size} {cities.size === 1 ? 'ciudad' : 'ciudades'}
          </span>
        </div>

        {/* ── Tarjetas de resumen: 1 columna en móvil, 3 desde tablet ── */}
        <div className="row g-3 mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className="col-12 col-md-4">
              <div className="card border-0 h-100 admin-stat-card">
                <div className="card-body d-flex align-items-center gap-3 p-3">
                  <div className="admin-stat-icon bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                    <i className={stat.icon}></i>
                  </div>

                  <div>
                    <p className="text-muted mb-1 admin-stat-label">{stat.label}</p>
                    <h3 className="admin-stat-value mb-0 text-break">{stat.value}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Gráficas: apiladas hasta escritorio, lado a lado desde lg ── */}
        <div className="row g-4">
          <div className="report-section col-12 col-lg-6">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h3 className="h5 mb-0 text-dark fw-bold">Eventos por ciudad</h3>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={eventsByCity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(25, 135, 84, 0.05)' }} />
                  <Bar dataKey="events" name="Eventos" fill="#198754" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="report-section col-12 col-lg-6">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h3 className="h5 mb-0 text-dark fw-bold">Reservas por estado</h3>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={reservationsByStatus} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(25, 135, 84, 0.05)' }} />
                  <Bar dataKey="total" name="Reservas" fill="#198754" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Grafo (hace scroll horizontal dentro de su propia tarjeta en móvil) ── */}
        <div className="report-section mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h3 className="h5 mb-0 text-dark fw-bold">Grafo de reservas</h3>
          </div>
          <ReservationGraph events={events} reservations={reservations} />
        </div>

        {/* ── Eventos: tarjetas en móvil, tabla desde tablet ── */}
        <div className="report-section mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h3 className="h5 mb-0 text-dark fw-bold">Eventos registrados</h3>
            <span className="badge text-bg-light">{events.length}</span>
          </div>

          <ul className="list-group d-md-none">
            {events.map((event) => (
              <li key={event.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <span className="fw-semibold text-break">{event.title}</span>
                  <span className="badge text-bg-light flex-shrink-0">{formatEventPrice(event.price)}</span>
                </div>
                <div className="small text-muted mt-1">
                  {event.city} · {formatEventDate(event.date)}
                </div>
              </li>
            ))}
            {events.length === 0 && (
              <li className="list-group-item text-center text-muted py-4">No hay eventos registrados.</li>
            )}
          </ul>

          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0 admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Evento</th>
                  <th>Ciudad</th>
                  <th>Fecha</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td>{event.title}</td>
                    <td>{event.city}</td>
                    <td>{formatEventDate(event.date)}</td>
                    <td>{formatEventPrice(event.price)}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">No hay eventos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Reservas: tarjetas en móvil, tabla desde tablet ── */}
        <div className="report-section mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h3 className="h5 mb-0 text-dark fw-bold">Reservas registradas</h3>
            <span className="badge text-bg-light">{reservations.length}</span>
          </div>

          <ul className="list-group d-md-none">
            {reservations.map((reservation) => {
              const badge = statusBadge(reservation.status)
              return (
                <li key={reservation.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <span className="fw-semibold text-break">{reservation.customer}</span>
                    <span className={`badge ${badge.className} flex-shrink-0`}>{badge.label}</span>
                  </div>
                  <div className="small text-break">{reservation.eventTitle}</div>
                  <div className="small text-muted">{formatRequestDate(reservation.createdAt)}</div>
                </li>
              )
            })}
            {reservations.length === 0 && (
              <li className="list-group-item text-center text-muted py-4">No hay reservas registradas.</li>
            )}
          </ul>

          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0 admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Evento</th>
                  <th>Fecha de solicitud</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => {
                  const badge = statusBadge(reservation.status)
                  return (
                    <tr key={reservation.id}>
                      <td>{reservation.customer}</td>
                      <td>{reservation.eventTitle}</td>
                      <td>{formatRequestDate(reservation.createdAt)}</td>
                      <td>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                    </tr>
                  )
                })}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">No hay reservas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Usuarios: tarjetas en móvil, tabla desde tablet ── */}
        <div className="report-section mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h3 className="h5 mb-0 text-dark fw-bold">Usuarios</h3>
            <span className="badge text-bg-light">{users.length}</span>
          </div>

          {userNotice && (
            <div className={`alert alert-${userNotice.type} py-2`} role="status">
              {userNotice.text}
            </div>
          )}

          <ul className="list-group d-md-none">
            {users.map((item) => (
              <li key={item.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <span className="fw-semibold text-break">{item.username}</span>
                  <span className="badge text-bg-light flex-shrink-0">{roleLabel(item.role)}</span>
                </div>
                <div className="small text-muted text-break">{item.fullName}</div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger w-100 mt-2"
                  disabled={deletingId === item.id}
                  aria-label={`Eliminar a ${item.username}`}
                  onClick={() => handleDeleteUser(item)}
                >
                  {deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </li>
            ))}
            {users.length === 0 && (
              <li className="list-group-item text-center text-muted py-4">
                No hay clientes ni agentes registrados.
              </li>
            )}
          </ul>

          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0 admin-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th><span className="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.username}</td>
                    <td>{item.fullName}</td>
                    <td>{roleLabel(item.role)}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={deletingId === item.id}
                        aria-label={`Eliminar a ${item.username}`}
                        onClick={() => handleDeleteUser(item)}
                      >
                        {deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      No hay clientes ni agentes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminReports
