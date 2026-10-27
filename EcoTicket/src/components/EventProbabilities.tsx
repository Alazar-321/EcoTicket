import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { Event } from '../types/event'
import type { Reservation, ReservationStatus } from '../services/ecoTicketService'
import { formatDateOnly } from '../utils/date'
import { STATUSES, selloutEstimate, statusProbabilities } from '../utils/probability'

const STATUS_META: Record<ReservationStatus, { label: string; color: string }> = {
  SOLICITADA: { label: 'Solicitada', color: '#e0a800' },
  CONFIRMADA: { label: 'Confirmada', color: '#0d6efd' },
  PAGADA: { label: 'Pagada', color: '#198754' },
  RECHAZADA: { label: 'Rechazada', color: '#dc3545' },
}

const pct = (value: number) => `${(value * 100).toFixed(value > 0 && value < 0.1 ? 1 : 0)} %`

function sellColor(p: number) {
  if (p >= 0.66) return '#198754'
  if (p >= 0.33) return '#e0a800'
  return '#dc3545'
}

// Tarjeta blanca para que las gráficas contrasten con el fondo
function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
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

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border rounded-3 bg-white p-2 px-3 h-100">
      <div className="small text-secondary">{label}</div>
      <div className="fs-5 fw-bold">{value}</div>
      {hint && <div className="small text-secondary">{hint}</div>}
    </div>
  )
}

type Props = { events: Event[]; reservations: Reservation[]; chartHeight?: number }

export default function EventProbabilities({ events, reservations, chartHeight = 300 }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(events[0]?.id ?? null)

  // Cálculo de todos los eventos (sirve para el ranking y para el evento elegido)
  const rows = useMemo(() => {
    const now = new Date()
    return events.map((event) => {
      const own = reservations.filter((r) => r.eventId === event.id)
      const status = statusProbabilities(own, reservations)
      const sellout = selloutEstimate(event, own, status, now)
      return { event, status, sellout }
    })
  }, [events, reservations])

  if (events.length === 0) {
    return <p className="text-secondary mb-0">Todavía no hay eventos para calcular probabilidades.</p>
  }

  const current = rows.find((row) => row.event.id === selectedId) ?? rows[0]
  const { event, status, sellout } = current

  const statusData = STATUSES.map((s) => ({
    key: s,
    name: STATUS_META[s].label,
    percent: Math.round(status.probabilities[s] * 1000) / 10,
    count: status.counts[s],
    color: STATUS_META[s].color,
  }))

  const ranking = rows
    .filter((row) => row.sellout.probability != null)
    .map((row) => ({
      id: row.event.id,
      name: row.event.title.length > 22 ? `${row.event.title.slice(0, 21)}…` : row.event.title,
      percent: Math.round((row.sellout.probability ?? 0) * 1000) / 10,
    }))
    .sort((a, b) => b.percent - a.percent)

  const p = sellout.probability

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex flex-column flex-md-row align-items-md-center gap-2">
        <label htmlFor="prob-event" className="fw-semibold mb-0 text-nowrap">Evento</label>
        <select
          id="prob-event"
          className="form-select bg-white"
          value={event.id ?? ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          {events.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} · {formatDateOnly(item.date, { dateStyle: 'medium' })}
            </option>
          ))}
        </select>
      </div>

      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <Kpi label="Reservas" value={String(status.total)} hint="del evento" />
        </div>
        <div className="col-6 col-lg-3">
          <Kpi label="Capacidad" value={sellout.capacity != null ? String(sellout.capacity) : '—'} hint={sellout.capacity != null ? `${sellout.remaining} libres (est.)` : 'sin definir'} />
        </div>
        <div className="col-6 col-lg-3">
          <Kpi label="Días restantes" value={sellout.daysLeft != null ? String(sellout.daysLeft) : '—'} />
        </div>
        <div className="col-6 col-lg-3">
          <Kpi label="Ritmo de reservas" value={`${sellout.ratePerDay.toFixed(2)} / día`} />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <Card title="Probabilidad de que una reserva termine en cada estado" icon="bi-percent">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={statusData} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} />
                <YAxis unit=" %" domain={[0, 100]} width={58} />
                <Tooltip
                  formatter={(value, _name, item) => [`${value} % (${item.payload.count} reservas reales)`, 'Probabilidad']}
                />
                <Bar dataKey="percent" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {statusData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                  <LabelList dataKey="percent" position="top" formatter={(v) => `${v} %`} style={{ fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="small text-secondary mb-0 mt-2">
              Se calcula con las reservas del evento, suavizadas con la tendencia de todos los eventos para que pocas
              reservas no den porcentajes extremos.
            </p>
          </Card>
        </div>

        <div className="col-12 col-lg-5">
          <Card title="Probabilidad de agotar las entradas" icon="bi-ticket-perforated">
            {p == null ? (
              <p className="text-secondary mb-0">{sellout.reason ?? 'No se puede estimar.'}</p>
            ) : (
              <>
                <div className="text-center my-2">
                  <div className="display-4 fw-bold" style={{ color: sellColor(p) }}>{pct(p)}</div>
                  <div className="small text-secondary">de agotarse antes del {formatDateOnly(event.date, { dateStyle: 'long' })}</div>
                </div>
                <div className="progress" role="progressbar" aria-valuenow={Math.round(p * 100)} aria-valuemin={0} aria-valuemax={100} style={{ height: 14 }}>
                  <div className="progress-bar" style={{ width: `${p * 100}%`, backgroundColor: sellColor(p) }}></div>
                </div>
                {sellout.reason && <p className="small text-secondary mt-2 mb-0">{sellout.reason}</p>}
              </>
            )}
            <p className="small text-secondary mb-0 mt-3">
              Estimación: ritmo de reservas observado × días que faltan, frente a las entradas que quedan libres
              (modelo de Poisson). Las reservas rechazadas no cuentan.
            </p>
          </Card>
        </div>
      </div>

      {ranking.length > 0 && (
        <Card title="Probabilidad de agotarse por evento" icon="bi-bar-chart-steps">
          <ResponsiveContainer width="100%" height={Math.max(160, ranking.length * 38 + 30)}>
            <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" unit=" %" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} interval={0} />
              <Tooltip formatter={(value) => [`${value} %`, 'Probabilidad']} />
              <Bar dataKey="percent" radius={[0, 6, 6, 0]} isAnimationActive={false} onClick={(d) => d?.id != null && setSelectedId(Number(d.id))} style={{ cursor: 'pointer' }}>
                {ranking.map((entry) => (
                  <Cell key={entry.id} fill={sellColor(entry.percent / 100)} />
                ))}
                <LabelList dataKey="percent" position="right" formatter={(v) => `${v} %`} style={{ fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="small text-secondary mb-0 mt-2">
            Haz clic en una barra para ver el detalle de ese evento.
            {ranking.length < rows.length && ` Se omiten ${rows.length - ranking.length} evento(s) sin datos suficientes para estimar.`}
          </p>
        </Card>
      )}
    </div>
  )
}