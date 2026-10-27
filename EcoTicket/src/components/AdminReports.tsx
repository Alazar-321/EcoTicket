import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
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
import EventProbabilities from '../components/EventProbabilities'
import { APP_TIME_ZONE, formatDateOnly } from '../utils/date'
import { EVENT_STATUS_BADGE, eventCode } from '../utils/eventStatus'

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

function roleBadge(role: Profile['role']) {
  switch (role) {
    case 'ADMINISTRADOR':
      return { label: 'Administrador', className: 'bg-danger' }
    case 'AGENTE':
      return { label: 'Agente', className: 'bg-primary' }
    case 'CLIENTE':
      return { label: 'Cliente', className: 'bg-success' }
    default:
      return { label: role, className: 'bg-secondary' }
  }
}

// Datos adicionales de los administradores (columnas salary y schedule de profiles)
type AdminExtras = { salary?: number | null; schedule?: string | null }

// Datos adicionales de los agentes (columnas commission y experience de profiles)
type AgentExtras = { experience?: string | null }

// Datos comunes a toda persona: identificación, correo, dirección, ciudad y teléfonos
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

type Tab = 'usuarios' | 'eventos' | 'reservas' | 'grafo' | 'probabilidades'

// Tarjeta de métrica: icono, valor grande y una línea de apoyo (el icono se oculta en móvil para dar espacio al texto)
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
    <div className="card h-100 border shadow-sm">
      <div className="card-body d-flex align-items-center gap-3 p-3">
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
    <div className="card h-100 border shadow-sm bg-white" style={{ backgroundColor: '#fff' }}>
      <div className="card-body">
        <h3 className="h6 fw-bold text-secondary mb-3">
          <i className={`bi ${icon} me-2`} aria-hidden="true"></i>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

// ───────────────────────── Componente ─────────────────────────

function AdminReports() {
  const { events, reservations } = useEcoTicketData()
  const chartHeight = useChartHeight()

  // Usuarios (clientes y agentes)
  const [users, setUsers] = useState<Profile[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userNotice, setUserNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  // Edición del salario y el horario de un administrador
  const [editingAdmin, setEditingAdmin] = useState<Profile | null>(null)
  const [salaryInput, setSalaryInput] = useState('')
  const [scheduleInput, setScheduleInput] = useState('')
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [editError, setEditError] = useState('')

  // Pestaña activa y filtros de cada lista
  const [activeTab, setActiveTab] = useState<Tab>('usuarios')
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [reservationSearch, setReservationSearch] = useState('')
  const [reservationStatus, setReservationStatus] = useState('')

  // Edición de la comisión y la experiencia de un agente
  const [editingAgent, setEditingAgent] = useState<Profile | null>(null)
  const [commissionInput, setCommissionInput] = useState('')
  const [experienceInput, setExperienceInput] = useState('')
  const [savingAgent, setSavingAgent] = useState(false)
  const [agentError, setAgentError] = useState('')

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  // Mientras la ventana de edición está abierta: Esc la cierra y el fondo no hace scroll
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

    // Se actualiza la fila en pantalla sin volver a pedir los usuarios
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
      `¿Estás seguro de que deseas eliminar este evento? Se borrarán también sus reservas. Esta acción no se puede deshacer.`
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

  // ── Métricas ──
  const totalEvents = events.length
  const averagePrice =
    totalEvents === 0
      ? 0
      : events.reduce((total, event) => total + Number(event.price ?? 0), 0) / totalEvents
  const paidRevenue = reservations
    .filter((item) => item.status === 'PAGADA')
    .reduce((sum, item) => sum + Number(item.price ?? 0), 0)

  // Limpiamos y normalizamos los nombres de las ciudades para evitar duplicados por espacios o mayúsculas
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
    { status: 'Solicitadas', total: reservations.filter((item) => item.status === 'SOLICITADA').length, color: '#ffc107' },
    { status: 'Confirmadas', total: reservations.filter((item) => item.status === 'CONFIRMADA').length, color: '#0d6efd' },
    { status: 'Pagadas', total: reservations.filter((item) => item.status === 'PAGADA').length, color: '#198754' },
    { status: 'Rechazadas', total: reservations.filter((item) => item.status === 'RECHAZADA').length, color: '#dc3545' },
  ]

  // Usuarios por rol (mismos colores que las etiquetas de rol)
  const usersByRole = [
    { name: 'Clientes', value: users.filter((item) => item.role === 'CLIENTE').length, color: '#198754' },
    { name: 'Agentes', value: users.filter((item) => item.role === 'AGENTE').length, color: '#0d6efd' },
    { name: 'Administradores', value: users.filter((item) => item.role === 'ADMINISTRADOR').length, color: '#dc3545' },
  ].filter((item) => item.value > 0)

  // ── Filtros de cada lista ──
  const filteredUsers = users.filter((item) => {
    const term = userSearch.trim().toLowerCase()
    const matchesRole = userRole === '' || item.role === userRole
    const matchesSearch =
      term === '' ||
      [item.username, item.fullName, item.email, item.identification]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    return matchesRole && matchesSearch
  })

  const filteredEvents = events.filter((event) => {
    const term = eventSearch.trim().toLowerCase()
    return (
      term === '' ||
      [event.title, event.city, event.organizer].some((value) => (value ?? '').toLowerCase().includes(term))
    )
  })

  const filteredReservations = reservations.filter((item) => {
    const term = reservationSearch.trim().toLowerCase()
    const matchesStatus = reservationStatus === '' || item.status === reservationStatus
    const matchesSearch =
      term === '' ||
      item.customer.toLowerCase().includes(term) ||
      item.eventTitle.toLowerCase().includes(term)
    return matchesStatus && matchesSearch
  })

  const agentCount = users.filter((item) => item.role === 'AGENTE').length

  const stats = [
    { label: 'Eventos registrados', value: totalEvents, hint: `${cities.length} ${cities.length === 1 ? 'ciudad' : 'ciudades'}`, icon: 'bi-calendar-event', tone: 'primary' as const },
    { label: 'Precio promedio', value: `$${Math.round(averagePrice).toLocaleString('es-CO')}`, hint: 'Por evento', icon: 'bi-cash-stack', tone: 'success' as const },
    { label: 'Reservas recibidas', value: reservations.length, hint: `$${paidRevenue.toLocaleString('es-CO')} pagados`, icon: 'bi-ticket-perforated', tone: 'warning' as const },
    { label: 'Usuarios', value: users.length, hint: `${agentCount} ${agentCount === 1 ? 'agente' : 'agentes'}`, icon: 'bi-people', tone: 'info' as const },
  ]

  const tabButton = (tab: Tab, icon: string, label: string, count?: number) => (
    <button
      key={tab}
      type="button"
      role="tab"
      aria-selected={activeTab === tab}
      className={`btn flex-shrink-0 ${activeTab === tab ? 'btn-success' : 'btn-light border-success text-success'}`}
      onClick={() => setActiveTab(tab)}
    >
      <i className={`bi ${icon} me-2`} aria-hidden="true"></i>
      {label}
      {count != null && (
        <span className={`badge ms-2 ${activeTab === tab ? 'text-bg-light' : 'text-bg-success'}`}>{count}</span>
      )}
    </button>
  )

  // Filtros comunes de cada lista: buscador y, opcionalmente, un selector
  const listFilters = (
    search: string,
    onSearch: (value: string) => void,
    placeholder: string,
    select?: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; all: string }
  ) => (
    <div className="row g-2 mb-3">
      <div className={select ? 'col-md-8' : 'col-12'}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {select && (
        <div className="col-md-4">
          <select
            className="form-select form-select-sm"
            value={select.value}
            onChange={(e) => select.onChange(e.target.value)}
          >
            <option value="">{select.all}</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )

  // Botones de acción de un usuario: se usan igual en la tabla y en las tarjetas del móvil
  const renderUserActions = (item: Profile, block: boolean) => {
    // Administradores: se edita su salario y horario, pero no se eliminan desde aquí
    if (item.role === 'ADMINISTRADOR') {
      return (
        <button
          type="button"
          className={`btn btn-sm btn-outline-primary ${block ? 'w-100' : ''}`}
          aria-label={`Editar salario y horario de ${item.username}`}
          onClick={() => openAdminEditor(item)}
        >
          <i className="bi bi-pencil me-1" aria-hidden="true"></i>
          {block ? 'Editar salario y horario' : 'Editar'}
        </button>
      )
    }

    return (
      <div className={`d-flex gap-2 ${block ? '' : 'justify-content-end'}`}>
        {item.role === 'AGENTE' && (
          <button
            type="button"
            className={`btn btn-sm btn-outline-primary ${block ? 'flex-fill' : ''}`}
            aria-label={`Editar comisión y experiencia de ${item.username}`}
            onClick={() => openAgentEditor(item)}
          >
            <i className="bi bi-pencil me-1" aria-hidden="true"></i>
            Editar
          </button>
        )}
        <button
          type="button"
          className={`btn btn-sm btn-outline-danger ${block ? 'flex-fill' : ''}`}
          disabled={deletingId === item.id}
          aria-label={`Eliminar a ${item.username}`}
          onClick={() => handleDeleteUser(item)}
        >
          {deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    )
  }

  const seatText = (item: { zoneName?: string | null; seatLabel?: string | null }) =>
    item.seatLabel ? `${item.zoneName ? `${item.zoneName} · ` : ''}Asiento ${item.seatLabel}` : ''

  return (
    <section className="card shadow-sm border-0 admin-reports mt-4">
      <div className="card-body p-3 p-md-4 p-lg-5">
        {/* ── Encabezado ── */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
          <div>
            <p className="text-success fw-semibold text-uppercase mb-1 small">Resumen</p>
            <h2 className="h4 mb-0 text-dark fw-bold">Estadísticas del sistema</h2>
          </div>

          <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 align-self-start align-self-md-auto">
            <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
            {cities.length} {cities.length === 1 ? 'ciudad' : 'ciudades'}
          </span>
        </div>

        {/* ── Métricas: 2 columnas en móvil, 4 desde escritorio ── */}
        <div className="row g-3 mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className="col-6 col-lg-3">
              <StatTile {...stat} />
            </div>
          ))}
        </div>

        {/* ── Gráficas: tres tarjetas iguales en una fila ── */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-4">
            <ChartCard title="Eventos por ciudad" icon="bi-geo-alt">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={eventsByCity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(25, 135, 84, 0.05)' }} />
                  <Bar dataKey="events" name="Eventos" fill="#2296c0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <ChartCard title="Reservas por estado" icon="bi-bar-chart">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={reservationsByStatus} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(25, 135, 84, 0.05)' }} />
                  <Bar dataKey="total" name="Reservas" radius={[6, 6, 0, 0]}>
                    {reservationsByStatus.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <ChartCard title="Usuarios por rol" icon="bi-people">
              {usersByRole.length === 0 ? (
                <p className="text-muted small text-center my-5">Sin usuarios para mostrar.</p>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {usersByRole.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Usuarios']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>

        {/* ── Secciones: una sola zona de trabajo en vez de tres listas largas una tras otra ── */}
        <div className="d-flex gap-2 mb-3 pb-1 overflow-auto" role="tablist" aria-label="Secciones del reporte">
          {tabButton('usuarios', 'bi-people', 'Usuarios', users.length)}
          {tabButton('eventos', 'bi-calendar-event', 'Eventos', events.length)}
          {tabButton('reservas', 'bi-ticket-perforated', 'Reservas', reservations.length)}
          {tabButton('grafo', 'bi-diagram-3', 'Grafo')}
          {tabButton('probabilidades', 'bi-percent', 'Probabilidades')}
        </div>

        {userNotice && (
          <div
            className={`alert alert-${userNotice.type} alert-dismissible py-2`}
            role={userNotice.type === 'danger' ? 'alert' : 'status'}
          >
            {userNotice.text}
            <button type="button" className="btn-close" aria-label="Cerrar aviso" onClick={() => setUserNotice(null)}></button>
          </div>
        )}

        {/* ───────────── USUARIOS ───────────── */}
        {activeTab === 'usuarios' && (
          <div className="border rounded-3 p-3" role="tabpanel">
            {listFilters(userSearch, setUserSearch, 'Buscar por usuario, nombre, correo o documento...', {
              value: userRole,
              onChange: setUserRole,
              all: 'Todos los roles',
              options: [
                { value: 'CLIENTE', label: 'Clientes' },
                { value: 'AGENTE', label: 'Agentes' },
                { value: 'ADMINISTRADOR', label: 'Administradores' },
              ],
            })}

            <ul className="list-group d-md-none">
              {filteredUsers.map((item) => (
                <li key={item.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <span className="fw-semibold text-break">{item.username}</span>
                    <span className={`badge ${roleBadge(item.role).className} flex-shrink-0`}>{roleBadge(item.role).label}</span>
                  </div>
                  <div className="small text-muted text-break">{item.fullName}</div>
                  <div className="small text-muted text-break">{personalDetails(item)}</div>
                  {roleDetails(item) && <div className="small text-muted">{roleDetails(item)}</div>}
                  <div className="mt-2">{renderUserActions(item, true)}</div>
                </li>
              ))}
              {filteredUsers.length === 0 && (
                <li className="list-group-item text-center text-muted py-4">
                  No hay usuarios con esos filtros.
                </li>
              )}
            </ul>

            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0 admin-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre y datos</th>
                    <th>Rol</th>
                    <th>Detalles</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.username}</td>
                      <td>
                        <div>{item.fullName}</div>
                        <div className="small text-muted">{personalDetails(item)}</div>
                      </td>
                      <td className="text-nowrap">
                        <span className={`badge ${roleBadge(item.role).className}`}>{roleBadge(item.role).label}</span>
                      </td>
                      <td><span className="small text-muted">{roleDetails(item)}</span></td>
                      <td className="text-end text-nowrap">{renderUserActions(item, false)}</td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No hay usuarios con esos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────── EVENTOS ───────────── */}
        {activeTab === 'eventos' && (
          <div className="border rounded-3 p-3" role="tabpanel">
            {listFilters(eventSearch, setEventSearch, 'Buscar por evento, ciudad u organizador...')}

            <ul className="list-group d-md-none">
              {filteredEvents.map((event) => {
                const status = EVENT_STATUS_BADGE[event.status ?? 'PROGRAMADO']
                return (
                  <li key={event.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <span className="fw-semibold text-break">{event.title}</span>
                      <span className="badge text-bg-light flex-shrink-0">{formatEventPrice(event.price)}</span>
                    </div>
                    <div className="small text-muted mt-1">
                      {eventCode(event.id)} · {event.city} · {formatEventDate(event.date)}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className={`badge ${status.className}`}>{status.label}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteEvent(event.id!)}
                        aria-label={`Eliminar ${event.title}`}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </li>
                )
              })}
              {filteredEvents.length === 0 && (
                <li className="list-group-item text-center text-muted py-4">No hay eventos con esos filtros.</li>
              )}
            </ul>

            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0 admin-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Fecha</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => {
                    const status = EVENT_STATUS_BADGE[event.status ?? 'PROGRAMADO']
                    return (
                      <tr key={event.id}>
                        <td>
                          <div className="fw-semibold">{event.title}</div>
                          <div className="small text-muted">
                            {eventCode(event.id)} · {event.city}
                            {event.organizer ? ` · ${event.organizer}` : ''}
                          </div>
                        </td>
                        <td>{formatEventDate(event.date)}</td>
                        <td>{formatEventPrice(event.price)}</td>
                        <td><span className={`badge ${status.className}`}>{status.label}</span></td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteEvent(event.id!)}
                            aria-label={`Eliminar ${event.title}`}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">No hay eventos con esos filtros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────── RESERVAS ───────────── */}
        {activeTab === 'reservas' && (
          <div className="border rounded-3 p-3" role="tabpanel">
            {listFilters(reservationSearch, setReservationSearch, 'Buscar por cliente o evento...', {
              value: reservationStatus,
              onChange: setReservationStatus,
              all: 'Todos los estados',
              options: (Object.keys(STATUS_BADGE) as ReservationStatus[]).map((key) => ({
                value: key,
                label: STATUS_BADGE[key].label,
              })),
            })}

            <ul className="list-group d-md-none">
              {filteredReservations.map((reservation) => {
                const badge = statusBadge(reservation.status)
                return (
                  <li key={reservation.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <span className="fw-semibold text-break">{reservation.customer}</span>
                      <span className={`badge ${badge.className} flex-shrink-0`}>{badge.label}</span>
                    </div>
                    <div className="small text-break">{reservation.eventTitle}</div>
                    {seatText(reservation) && <div className="small text-muted">{seatText(reservation)}</div>}
                    <div className="small text-muted">{formatRequestDate(reservation.createdAt)}</div>
                  </li>
                )
              })}
              {filteredReservations.length === 0 && (
                <li className="list-group-item text-center text-muted py-4">No hay reservas con esos filtros.</li>
              )}
            </ul>

            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0 admin-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Evento</th>
                    <th>Fecha de solicitud</th>
                    <th>Valor</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => {
                    const badge = statusBadge(reservation.status)
                    return (
                      <tr key={reservation.id}>
                        <td>{reservation.customer}</td>
                        <td>
                          <div className="fw-semibold">{reservation.eventTitle}</div>
                          {seatText(reservation) && <div className="small text-muted">{seatText(reservation)}</div>}
                        </td>
                        <td>{formatRequestDate(reservation.createdAt)}</td>
                        <td>{reservation.price == null ? '—' : formatEventPrice(reservation.price)}</td>
                        <td>
                          <span className={`badge ${badge.className}`}>{badge.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredReservations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">No hay reservas con esos filtros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────── GRAFO ───────────── */}
        {activeTab === 'grafo' && (
          <div className="border rounded-3 p-3 bg-white" style={{ backgroundColor: '#fff' }} role="tabpanel">
            <p className="text-muted small mb-3">
              Cada evento aparece conectado a las reservas que ha recibido. En móvil se desplaza dentro de su propia tarjeta.
            </p>
            <ReservationGraph events={events} reservations={reservations} />
          </div>
        )}
        {/* ───────────── PROBABILIDADES ───────────── */}
        {activeTab === 'probabilidades' && (
          <div role="tabpanel">
            <EventProbabilities events={events} reservations={reservations} chartHeight={chartHeight} />
          </div>
        )}
      </div>

      {/* ── Ventana para asignar salario y horario a un administrador ── */}
      {editingAdmin && (
        <>
          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-edit-title"
            onClick={() => !savingAdmin && setEditingAdmin(null)}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <form className="modal-content" onSubmit={handleSaveAdmin} noValidate>
                <div className="modal-header">
                  <h2 className="modal-title h5" id="admin-edit-title">
                    Salario y horario
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    disabled={savingAdmin}
                    onClick={() => setEditingAdmin(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <p className="text-muted small">
                    Administrador: <strong>{editingAdmin.username}</strong>
                    {editingAdmin.fullName ? ` · ${editingAdmin.fullName}` : ''}
                  </p>

                  {editError && (
                    <div className="alert alert-danger py-2" role="alert">
                      {editError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="admin-salary" className="form-label">Salario (COP)</label>
                    <input
                      id="admin-salary"
                      type="number"
                      className="form-control"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={salaryInput}
                      onChange={(e) => setSalaryInput(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="mb-1">
                    <label htmlFor="admin-schedule" className="form-label">Horario</label>
                    <input
                      id="admin-schedule"
                      type="text"
                      className="form-control"
                      maxLength={120}
                      placeholder="Ej. Lunes a viernes, 8:00 a 17:00"
                      value={scheduleInput}
                      onChange={(e) => setScheduleInput(e.target.value)}
                    />
                    <div className="form-text">Déjalo vacío para dejarlo sin definir.</div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={savingAdmin}
                    onClick={() => setEditingAdmin(null)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success" disabled={savingAdmin}>
                    {savingAdmin ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
      {/* ── Ventana para asignar comisión y experiencia a un agente ── */}
      {editingAgent && (
        <>
          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-edit-title"
            onClick={() => !savingAgent && setEditingAgent(null)}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <form className="modal-content" onSubmit={handleSaveAgent} noValidate>
                <div className="modal-header">
                  <h2 className="modal-title h5" id="agent-edit-title">
                    Comisión y experiencia
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    disabled={savingAgent}
                    onClick={() => setEditingAgent(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <p className="text-muted small">
                    Agente: <strong>{editingAgent.username}</strong>
                    {editingAgent.fullName ? ` · ${editingAgent.fullName}` : ''}
                  </p>

                  {agentError && (
                    <div className="alert alert-danger py-2" role="alert">
                      {agentError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="agent-commission" className="form-label">Comisión (%)</label>
                    <input
                      id="agent-commission"
                      type="number"
                      className="form-control"
                      min="0"
                      max="100"
                      step="any"
                      inputMode="decimal"
                      value={commissionInput}
                      onChange={(e) => setCommissionInput(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="mb-1">
                    <label htmlFor="agent-experience" className="form-label">Experiencia</label>
                    <textarea
                      id="agent-experience"
                      className="form-control"
                      rows={3}
                      maxLength={300}
                      placeholder="Ej. 5 años organizando conciertos y festivales"
                      value={experienceInput}
                      onChange={(e) => setExperienceInput(e.target.value)}
                    />
                    <div className="form-text">El agente la verá en su panel. Déjala vacía para dejarla sin definir.</div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={savingAgent}
                    onClick={() => setEditingAgent(null)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success" disabled={savingAgent}>
                    {savingAgent ? 'Guardando...' : 'Guardar'}
                  </button>
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
