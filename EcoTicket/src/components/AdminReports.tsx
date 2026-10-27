import { useEffect, useState, type FormEvent } from 'react'
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
  deleteEvent,
  updateAdminDetails,
  updateAgentDetails,
  type Profile,
  type ReservationStatus,
} from '../services/ecoTicketService'
import type { Event } from '../types/event'
import ReservationGraph from './ReservationGraph'
import { APP_TIME_ZONE, formatDateOnly } from '../utils/date'

// ───────────────────────── Utilidades ─────────────────────────

const STATUS_BADGE: Record<ReservationStatus, { label: string; className: string }> = {
  SOLICITADA: { label: 'Solicitada', className: 'bg-warning text-dark' },
  CONFIRMADA: { label: 'Confirmada', className: 'bg-primary text-white' },
  PAGADA: { label: 'Pagada', className: 'bg-success text-white' },
  RECHAZADA: { label: 'Rechazada', className: 'bg-danger text-white' },
}

function statusBadge(status: ReservationStatus) {
  return STATUS_BADGE[status] ?? { label: status, className: 'bg-secondary text-white' }
}

function formatEventPrice(price: Event['price']) {
  const value = Number(price ?? 0)
  return value === 0 ? 'Gratis' : `$${value.toLocaleString('es-CO')}`
}

function formatRequestDate(value?: string) {
  if (!value) return 'Fecha no disponible'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: APP_TIME_ZONE,
  }).format(date)
}

function formatEventDate(value?: string) {
  return formatDateOnly(value, { dateStyle: 'medium' }) || 'Fecha no disponible'
}

function roleBadge(role: Profile['role']) {
  switch (role) {
    case 'ADMINISTRADOR':
      return { label: 'Administrador', className: 'bg-danger-subtle text-danger border border-danger' }
    case 'AGENTE':
      return { label: 'Agente', className: 'bg-primary-subtle text-primary border border-primary' }
    case 'CLIENTE':
      return { label: 'Cliente', className: 'bg-success-subtle text-success border border-success' }
    default:
      return { label: role, className: 'bg-secondary-subtle text-secondary border border-secondary' }
  }
}

type AdminExtras = { salary?: number | null; schedule?: string | null }
type AgentExtras = { experience?: string | null }

function personalDetails(user: Profile) {
  const idLabel = user.identificationType === 'PASAPORTE' ? 'Pasaporte' : 'Cédula'
  const parts = [
    user.identification ? `${idLabel}: ${user.identification}` : 'Sin documento',
    user.email || '',
    [user.address, user.city].filter(Boolean).join(', '),
    user.phones && user.phones.length > 0 ? `Tel: ${user.phones.join(' / ')}` : '',
  ]
  return parts.filter(Boolean).join(' · ')
}

function roleDetails(user: Profile) {
  if ('points' in user) {
    return `Puntos: ${user.points}`
  }
  if ('commission' in user) {
    const { experience } = user as Profile & AgentExtras
    return [
      `Comisión: ${user.commission}%`,
      `Experiencia: ${experience?.trim() || 'No definida'}`,
    ].join(' · ')
  }
  if (user.role === 'ADMINISTRADOR') {
    const { salary, schedule } = user as Profile & AdminExtras
    return [
      `Salario: $${Number(salary ?? 0).toLocaleString('es-CO')}`,
      `Horario: ${schedule?.trim() || 'No definido'}`,
    ].join(' · ')
  }
  return ''
}

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

  const [users, setUsers] = useState<Profile[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userNotice, setUserNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  const [editingAdmin, setEditingAdmin] = useState<Profile | null>(null)
  const [salaryInput, setSalaryInput] = useState('')
  const [scheduleInput, setScheduleInput] = useState('')
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [editError, setEditError] = useState('')

  const [editingAgent, setEditingAgent] = useState<Profile | null>(null)
  const [commissionInput, setCommissionInput] = useState('')
  const [experienceInput, setExperienceInput] = useState('')
  const [savingAgent, setSavingAgent] = useState(false)
  const [agentError, setAgentError] = useState('')

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  useEffect(() => {
    if (!editingAdmin) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingAdmin) setEditingAdmin(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [editingAdmin, savingAdmin])

  useEffect(() => {
    if (!editingAgent) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingAgent) setEditingAgent(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [editingAgent, savingAgent])

  async function handleDeleteUser(target: Profile) {
    const confirmed = window.confirm(
      `¿Eliminar a ${target.username}? Se borrarrán también sus reservas. Esta acción no se puede deshacer.`
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

  function openAdminEditor(target: Profile) {
    const { salary, schedule } = target as Profile & AdminExtras
    setSalaryInput(String(Number(salary ?? 0)))
    setScheduleInput(schedule ?? '')
    setEditError('')
    setEditingAdmin(target)
  }

  async function handleSaveAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingAdmin) return

    const salary = Number(salaryInput)
    if (salaryInput.trim() === '' || !Number.isFinite(salary) || salary < 0) {
      setEditError('Ingresa un salario válido (0 o mayor).')
      return
    }
    const schedule = scheduleInput.trim()

    setSavingAdmin(true)
    setEditError('')
    const ok = await updateAdminDetails(editingAdmin.id, salary, schedule)
    setSavingAdmin(false)

    if (!ok) {
      setEditError(
        'No se pudo guardar. Comprueba que tienes permisos de administrador y que la función SQL admin_update_admin_details existe.'
      )
      return
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === editingAdmin.id ? ({ ...item, salary, schedule } as Profile) : item
      )
    )
    setUserNotice({ type: 'success', text: `Se actualizaron el salario y el horario de ${editingAdmin.username}.` })
    setEditingAdmin(null)
  }

  function openAgentEditor(target: Profile) {
    const { commission, experience } = target as Profile & { commission?: number | null } & AgentExtras
    setCommissionInput(String(Number(commission ?? 0)))
    setExperienceInput(experience ?? '')
    setAgentError('')
    setEditingAgent(target)
  }

  async function handleSaveAgent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingAgent) return

    const commission = Number(commissionInput)
    if (commissionInput.trim() === '' || !Number.isFinite(commission) || commission < 0 || commission > 100) {
      setAgentError('Ingresa una comisión válida entre 0 y 100.')
      return
    }
    const experience = experienceInput.trim()

    setSavingAgent(true)
    setAgentError('')
    const ok = await updateAgentDetails(editingAgent.id, commission, experience)
    setSavingAgent(false)

    if (!ok) {
      setAgentError(
        'No se pudo guardar. Comprueba que tienes permisos de administrador y que la función SQL admin_update_agent_details existe.'
      )
      return
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === editingAgent.id ? ({ ...item, commission, experience } as Profile) : item
      )
    )
    setUserNotice({ type: 'success', text: `Se actualizaron la comisión y la experiencia de ${editingAgent.username}.` })
    setEditingAgent(null)
  }

  async function handleDeleteEvent(id: number) {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar este evento? Se borrarrán también sus reservas. Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    const ok = await deleteEvent(id)
    if (ok) {
      setUserNotice({ type: 'success', text: 'El evento fue eliminado correctamente.' })
    } else {
      setUserNotice({
        type: 'danger',
        text: 'No se pudo eliminar el evento. Comprueba tus permisos.',
      })
    }
  }

  const totalEvents = events.length
  const averagePrice =
    totalEvents === 0
      ? 0
      : events.reduce((total, event) => total + Number(event.price ?? 0), 0) / totalEvents

  const citiesSet = new Set(
    events.map((event) => event.city?.trim())
  )
  const cities = Array.from(citiesSet).filter(Boolean)

  const eventsByCity = Object.values(
    events.reduce(
      (acc, event) => {
        const city = event.city?.trim() || 'Sin ciudad'
        if (!acc[city]) {
          acc[city] = {
            city: city,
            events: 0,
          }
        }

        acc[city].events += 1

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
    { label: 'Eventos registrados', value: totalEvents, icon: 'bi bi-calendar-event', color: 'text-primary' },
    {
      label: 'Precio promedio',
      value: `$${Math.round(averagePrice).toLocaleString('es-CO')}`,
      icon: 'bi bi-cash-stack',
      color: 'text-success',
    },
    { label: 'Reservas recibidas', value: reservations.length, icon: 'bi bi-ticket-perforated', color: 'text-info' },
  ]

  return (
    <section className="container-fluid py-4 px-md-4">
      {/* ── Encabezado Principal ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
        <div>
          <h2 className="h3 mb-1 fw-bold text-dark">Panel de Administración</h2>
          <p className="text-muted mb-0">Monitorea el rendimiento y gestiona los recursos del sistema.</p>
        </div>
        <div className="d-flex gap-2">
          <span className="badge bg-white text-dark border rounded-pill px-3 py-2 shadow-sm">
            <i className="bi bi-geo-alt me-1 text-primary"></i>
            {cities.length} {cities.length === 1 ? 'ciudad' : 'ciudades'}
          </span>
          <span className="badge bg-white text-dark border rounded-pill px-3 py-2 shadow-sm">
            <i className="bi bi-people me-1 text-primary"></i>
            {users.length} usuarios
          </span>
        </div>
      </div>

      {/* ── KPIs (Tarjetas de Resumen) ── */}
      <div className="row g-4 mb-5">
        {stats.map((stat) => (
          <div key={stat.label} className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100 p-2">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`rounded-circle d-flex align-items-center justify-content-center bg-light ${stat.color}`} style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                  <i className={stat.icon}></i>
                </div>
                <div>
                  <p className="text-muted mb-0 small fw-medium">{stat.label}</p>
                  <h3 className="h4 mb-0 fw-bold">{stat.value}</h3>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sección de Gráficas ── */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h3 className="h5 mb-4 fw-bold">Eventos por Ciudad</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={eventsByCity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="events" name="Eventos" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h3 className="h5 mb-4 fw-bold">Estado de Reservas</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={reservationsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="total" name="Reservas" fill="#198754" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grafo de Reservas ── */}
      <div className="card border-0 shadow-sm mb-5">
        <div className="card-body p-4">
          <h3 className="h5 mb-4 fw-bold">Mapa de Relaciones (Grafo)</h3>
          <div className="overflow-auto p-2 bg-light rounded-3">
            <ReservationGraph events={events} reservations={reservations} />
          </div>
        </div>
      </div>

      {/* ── Tablas de Datos ── */}
      <div className="row g-4">
        {/* Eventos */}
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
              <h3 className="h6 mb-0 fw-bold text-uppercase text-muted">Eventos Registrados</h3>
              <span className="badge bg-light text-dark border">{events.length}</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Evento</th>
                      <th>Ciudad</th>
                      <th>Fecha</th>
                      <th>Precio</th>
                      <th className="text-end pe-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="ps-3 fw-medium">{event.title}</td>
                        <td>{event.city}</td>
                        <td>{formatEventDate(event.date)}</td>
                        <td>{formatEventPrice(event.price)}</td>
                        <td className="text-end pe-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger border-0"
                            onClick={() => handleDeleteEvent(event.id!)}
                            title={`Eliminar ${event.title}`}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
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
          </div>
        </div>

        {/* Reservas */}
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
              <h3 className="h6 mb-0 fw-bold text-uppercase text-muted">Últimas Reservas</h3>
              <span className="badge bg-light text-dark border">{reservations.length}</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Cliente</th>
                      <th>Evento</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => {
                      const badge = statusBadge(reservation.status)
                      return (
                        <tr key={reservation.id}>
                          <td className="ps-3 fw-medium">{reservation.customer}</td>
                          <td>{reservation.eventTitle}</td>
                          <td>{formatRequestDate(reservation.createdAt)}</td>
                          <td>
                            <span className={`badge rounded-pill ${badge.className}`}>{badge.label}</span>
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
          </div>
        </div>

        {/* Usuarios */}
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
              <h3 className="h6 mb-0 fw-bold text-uppercase text-muted">Gestión de Usuarios</h3>
              <span className="badge bg-light text-dark border">{users.length}</span>
            </div>
            <div className="card-body p-0">
              {userNotice && (
                <div className={`alert alert-${userNotice.type} m-3 py-2 small`} role="status">
                  {userNotice.text}
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Usuario</th>
                      <th>Nombre Completo</th>
                      <th>Rol</th>
                      <th>Detalles</th>
                      <th className="text-end pe-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => (
                      <tr key={item.id}>
                        <td className="ps-3 fw-medium">{item.username}</td>
                        <td>
                          <div className="text-dark">{item.fullName}</div>
                          <div className="small text-muted">{personalDetails(item)}</div>
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${roleBadge(item.role).className}`}>
                            {roleBadge(item.role).label}
                          </span>
                        </td>
                        <td><span className="small text-muted">{roleDetails(item)}</span></td>
                        <td className="text-end pe-3">
                          {item.role === 'ADMINISTRADOR' ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-pill px-3"
                              onClick={() => openAdminEditor(item)}
                            >
                              <i className="bi bi-pencil me-1"></i> Editar
                            </button>
                          ) : (
                            <div className="d-flex gap-2 justify-content-end">
                              {item.role === 'AGENTE' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                  onClick={() => openAgentEditor(item)}
                                >
                                  <i className="bi bi-pencil me-1"></i> Editar
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                disabled={deletingId === item.id}
                                onClick={() => handleDeleteUser(item)}
                              >
                                {deletingId === item.id ? '...' : 'Eliminar'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">No hay usuarios registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {editingAdmin && (
        <>
          <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" onClick={() => !savingAdmin && setEditingAdmin(null)}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <form className="modal-content border-0 shadow-lg" onSubmit={handleSaveAdmin} noValidate>
                <div className="modal-header border-0 pb-0">
                  <h2 className="modal-title h5 fw-bold" id="admin-edit-title">Editar Administrador</h2>
                  <button type="button" className="btn-close" disabled={savingAdmin} onClick={() => setEditingAdmin(null)}></button>
                </div>
                <div className="modal-body py-4">
                  <div className="mb-4 p-2 bg-light rounded text-center">
                    <strong className="d-block">{editingAdmin.username}</strong>
                    <span className="small text-muted">{editingAdmin.fullName}</span>
                  </div>
                  {editError && <div className="alert alert-danger py-2 small" role="alert">{editError}</div>}
                  <div className="mb-3">
                    <label htmlFor="admin-salary" className="form-label small fw-bold">Salario (COP)</label>
                    <input id="admin-salary" type="number" className="form-control" min="0" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} autoFocus required />
                  </div>
                  <div className="mb-1">
                    <label htmlFor="admin-schedule" className="form-label small fw-bold">Horario</label>
                    <input id="admin-schedule" type="text" className="form-control" maxLength={120} placeholder="Ej. Lunes a viernes, 8:00 a 17:00" value={scheduleInput} onChange={(e) => setScheduleInput(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light border px-4" disabled={savingAdmin} onClick={() => setEditingAdmin(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={savingAdmin}>{savingAdmin ? 'Guardando...' : 'Guardar'}</button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {editingAgent && (
        <>
          <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" onClick={() => !savingAgent && setEditingAgent(null)}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <form className="modal-content border-0 shadow-lg" onSubmit={handleSaveAgent} noValidate>
                <div className="modal-header border-0 pb-0">
                  <h2 className="modal-title h5 fw-bold" id="agent-edit-title">Editar Agente</h2>
                  <button type="button" className="btn-close" disabled={savingAgent} onClick={() => setEditingAgent(null)}></button>
                </div>
                <div className="modal-body py-4">
                  <div className="mb-4 p-2 bg-light rounded text-center">
                    <strong className="d-block">{editingAgent.username}</strong>
                    <span className="small text-muted">{editingAgent.fullName}</span>
                  </div>
                  {agentError && <div className="alert alert-danger py-2 small" role="alert">{agentError}</div>}
                  <div className="mb-3">
                    <label htmlFor="agent-commission" className="form-label small fw-bold">Comisión (%)</label>
                    <input id="agent-commission" type="number" className="form-control" min="0" max="100" value={commissionInput} onChange={(e) => setCommissionInput(e.target.value)} autoFocus required />
                  </div>
                  <div className="mb-1">
                    <label htmlFor="agent-experience" className="form-label small fw-bold">Experiencia</label>
                    <textarea id="agent-experience" className="form-control" rows={3} maxLength={300} placeholder="Ej. 5 años organizando conciertos" value={experienceInput} onChange={(e) => setExperienceInput(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light border px-4" disabled={savingAgent} onClick={() => setEditingAgent(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={savingAgent}>{savingAgent ? 'Guardando...' : 'Guardar'}</button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </section>
  )
}

export default AdminReports
