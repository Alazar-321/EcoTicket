import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Event } from '../types/event'
import { getTakenSeats } from '../services/ecoTicketService'
import { formatDateOnly } from '../utils/date'
import { EVENT_STATUS_BADGE, acceptsReservations, eventCode } from '../utils/eventStatus'
import {
  MAX_SEATS_PER_BOOKING,
  seatKey,
  zoneSeatCount,
  type EventZone,
  type SeatSelection,
} from '../utils/seating'
import SeatMap from './SeatMap'

type EventDetailModalProps = {
  event: Event
  zones: EventZone[]
  // Usuario con sesión (o null)
  user: { id: string; username: string; role?: string } | null
  onClose: () => void
  // Eventos con plano: reserva los asientos elegidos
  onReserveSeats: (seats: SeatSelection[]) => Promise<{ ok: boolean; message?: string }>
  // Eventos sin plano: reserva por cantidad
  onReserveQuantity: (quantity: number) => Promise<void>
}

const money = (value: number) =>
  value === 0
    ? 'Gratis'
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)

export default function EventDetailModal({
  event,
  zones,
  user,
  onClose,
  onReserveSeats,
  onReserveQuantity,
}: EventDetailModalProps) {
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<SeatSelection[]>([])
  const [activeZone, setActiveZone] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const hasSeating = zones.length > 0
  const canReserve = user?.role === 'CLIENTE' && acceptsReservations(event.status)
  const status = event.status ?? 'PROGRAMADO'

  const loadTaken = useCallback(async () => {
    if (event.id == null || !hasSeating) return
    setTaken(await getTakenSeats(event.id))
  }, [event.id, hasSeating])

  useEffect(() => {
    loadTaken()
  }, [loadTaken])

  // Esc cierra la ventana y la página de fondo no hace scroll mientras está abierta
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [isSaving, onClose])

  const selectedKeys = useMemo(
    () => new Set(selected.map((seat) => seatKey(seat.zoneId, seat.label))),
    [selected]
  )

  const total = hasSeating
    ? selected.reduce((sum, seat) => sum + seat.price, 0)
    : Number(event.price ?? 0) * quantity

  const freeSeats = (zone: EventZone) => {
    const used = [...taken].filter((key) => key.startsWith(`${zone.id}:`)).length
    return Math.max(0, zoneSeatCount(zone) - used)
  }

  const toggleSeat = (seat: SeatSelection) => {
    setMessage('')
    const key = seatKey(seat.zoneId, seat.label)
    if (selectedKeys.has(key)) {
      setSelected((prev) => prev.filter((item) => seatKey(item.zoneId, item.label) !== key))
      return
    }
    if (selected.length >= MAX_SEATS_PER_BOOKING) {
      setMessage(`Puedes reservar hasta ${MAX_SEATS_PER_BOOKING} asientos a la vez.`)
      return
    }
    setSelected((prev) => [...prev, seat])
  }

  const handleReserve = async () => {
    setMessage('')
    setIsSaving(true)
    try {
      if (hasSeating) {
        const result = await onReserveSeats(selected)
        if (!result.ok) {
          setMessage(result.message ?? 'No se pudo realizar la reserva.')
          // Se vuelve a pedir el plano: puede que otra persona haya tomado esos asientos
          setSelected([])
          await loadTaken()
        }
      } else {
        await onReserveQuantity(quantity)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const dateText = event.date ? formatDateOnly(event.date, { dateStyle: 'long' }) : ''
  const endDateText =
    event.end_date && event.end_date !== event.date ? formatDateOnly(event.end_date, { dateStyle: 'long' }) : ''
  const lowestPrice = hasSeating ? Math.min(...zones.map((zone) => zone.price)) : Number(event.price ?? 0)

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        onClick={() => !isSaving && onClose()}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2 className="modal-title h4 mb-1" id="event-modal-title">{event.title}</h2>
                <span className={`badge ${EVENT_STATUS_BADGE[status].className} me-2`}>
                  {EVENT_STATUS_BADGE[status].label}
                </span>
                <span className="small text-body-secondary">{eventCode(event.id)}</span>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                disabled={isSaving}
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              <div className="row g-4">
                {/* ── Información del evento ── */}
                <div className="col-lg-5">
                  <img
                    src={event.image}
                    alt={`Imagen del evento ${event.title}`}
                    className="img-fluid rounded mb-3 w-100"
                    style={{ maxHeight: 260, objectFit: 'cover' }}
                  />

                  {event.description && <p className="mb-3">{event.description}</p>}

                  <dl className="row mb-0 small">
                    <dt className="col-4 text-body-secondary">Organiza</dt>
                    <dd className="col-8">{event.organizer}</dd>

                    <dt className="col-4 text-body-secondary">Ciudad</dt>
                    <dd className="col-8">{event.city}</dd>

                    {event.location && (
                      <>
                        <dt className="col-4 text-body-secondary">Teatro / lugar</dt>
                        <dd className="col-8">{event.location}</dd>
                      </>
                    )}

                    <dt className="col-4 text-body-secondary">Inicio</dt>
                    <dd className="col-8">
                      {dateText}
                      {event.start_time ? ` · ${event.start_time}` : ''}
                    </dd>

                    {(event.end_time || endDateText) && (
                      <>
                        <dt className="col-4 text-body-secondary">Fin estimado</dt>
                        <dd className="col-8">
                          {endDateText || dateText}
                          {event.end_time ? ` · ${event.end_time}` : ''}
                        </dd>
                      </>
                    )}

                    {event.capacity != null && (
                      <>
                        <dt className="col-4 text-body-secondary">Capacidad</dt>
                        <dd className="col-8">{event.capacity} espectadores</dd>
                      </>
                    )}

                    <dt className="col-4 text-body-secondary">Precio</dt>
                    <dd className="col-8">
                      {hasSeating ? `Desde ${money(lowestPrice)}` : money(Number(event.price ?? 0))}
                    </dd>

                    {event.notes && (
                      <>
                        <dt className="col-4 text-body-secondary">Observaciones</dt>
                        <dd className="col-8" style={{ whiteSpace: 'pre-line' }}>{event.notes}</dd>
                      </>
                    )}
                  </dl>
                </div>

                {/* ── Boletería ── */}
                <div className="col-lg-7">
                  {hasSeating ? (
                    <>
                      <h3 className="h6 fw-bold">Categorías</h3>
                      <div className="row g-2 mb-3">
                        {zones.map((zone, index) => (
                          <div className="col-12 col-sm-6 col-xl-4" key={zone.id}>
                            <button
                              type="button"
                              className={`btn w-100 text-start border ${activeZone === index ? 'border-dark border-2' : ''}`}
                              aria-pressed={activeZone === index}
                              onClick={() => setActiveZone((prev) => (prev === index ? null : index))}
                            >
                              <span
                                className="d-inline-block rounded-circle me-2 align-middle"
                                style={{ width: 14, height: 14, background: zone.color }}
                                aria-hidden="true"
                              ></span>
                              <span className="fw-semibold">{zone.name}</span>
                              <span className="d-block small">{money(zone.price)}</span>
                              <span className="d-block small text-body-secondary">
                                {freeSeats(zone)} de {zoneSeatCount(zone)} libres
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>

                      <h3 className="h6 fw-bold">Elige tus asientos</h3>
                      <SeatMap
                        zones={zones}
                        taken={taken}
                        selectedKeys={selectedKeys}
                        onToggleSeat={toggleSeat}
                        activeZoneIndex={activeZone}
                        interactive={canReserve}
                      />

                      {selected.length > 0 && (
                        <ul className="list-group mt-3">
                          {selected.map((seat) => (
                            <li
                              key={seatKey(seat.zoneId, seat.label)}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <span>
                                <span className="fw-semibold">{seat.zoneName}</span> · asiento {seat.label}
                              </span>
                              <span className="d-flex align-items-center gap-2">
                                {money(seat.price)}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  aria-label={`Quitar el asiento ${seat.label}`}
                                  onClick={() => toggleSeat(seat)}
                                >
                                  <i className="bi bi-x-lg" aria-hidden="true"></i>
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    canReserve && (
                      <div>
                        <h3 className="h6 fw-bold">Boletería</h3>
                        <p className="text-body-secondary small">
                          Este evento no tiene plano de asientos: reservas por cantidad.
                        </p>
                        <label htmlFor="modal-qty" className="form-label small fw-semibold">Cantidad</label>
                        <input
                          id="modal-qty"
                          type="number"
                          min="1"
                          className="form-control mb-2"
                          style={{ maxWidth: 140 }}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </div>
                    )
                  )}

                  {!user && (
                    <div className="alert alert-light border mt-3 mb-0">
                      <Link to="/login" onClick={onClose}>Inicia sesión</Link> para reservar tus boletos.
                    </div>
                  )}
                  {user && user.role !== 'CLIENTE' && (
                    <p className="small text-body-secondary mt-3 mb-0">
                      Solo las cuentas de cliente pueden reservar. Aquí puedes ver el plano del evento.
                    </p>
                  )}
                  {user?.role === 'CLIENTE' && !acceptsReservations(event.status) && (
                    <div className="alert alert-warning mt-3 mb-0" role="status">
                      Este evento ya no admite reservas.
                    </div>
                  )}
                  {message && (
                    <div className="alert alert-danger mt-3 mb-0" role="alert">{message}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer justify-content-between">
              <div>
                {canReserve && (
                  <>
                    <span className="text-body-secondary small d-block">
                      {hasSeating ? `${selected.length} asiento(s)` : `${quantity} boleto(s)`}
                    </span>
                    <span className="fw-bold fs-5">{money(total)}</span>
                  </>
                )}
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" disabled={isSaving} onClick={onClose}>
                  Cerrar
                </button>
                {canReserve && (
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={isSaving || (hasSeating && selected.length === 0)}
                    onClick={handleReserve}
                  >
                    {isSaving
                      ? 'Reservando...'
                      : hasSeating
                        ? `Reservar ${selected.length || ''} asiento(s)`
                        : `Reservar ${quantity} boleto(s)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}