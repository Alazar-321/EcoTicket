import { useState } from 'react'
import type { Event } from '../types/event'
import { Link } from 'react-router-dom'
import { dateOnlyToDate, formatDateOnly } from '../utils/date'

export type EventCardProps = {
    event: Event
    canReserve?: boolean
    showLoginCta?: boolean
    isReserved?: boolean
    onReserve?: (quantity: number) => void
    // Abre el modal con la información completa del evento
    onOpen?: () => void
    // El evento tiene categorías y plano de asientos: se reserva desde el modal
    hasSeating?: boolean
    // Precio más bajo entre las categorías (solo con plano)
    priceFrom?: number
}

export default function EventCard({
    event,
    canReserve = false,
    showLoginCta = false,
    isReserved = false,
    onReserve,
    onOpen,
    hasSeating = false,
    priceFrom,
}: EventCardProps) {
    const [quantity, setQuantity] = useState(1)

    // La fecha del evento es "YYYY-MM-DD": se formatea sin que la zona horaria la mueva de día
    const isValidDate = Boolean(dateOnlyToDate(event.date))

    const day = isValidDate ? Number(event.date.slice(8, 10)) : '—'

    const month = isValidDate
        ? formatDateOnly(event.date, { month: 'short' }).replace('.', '').toUpperCase()
        : 'DATE'

    const dateLabel = isValidDate
        ? formatDateOnly(event.date, { dateStyle: 'long' })
        : ''

    const numericPrice = Number(hasSeating && priceFrom != null ? priceFrom : event.price ?? 0)

    const formattedPrice =
        numericPrice === 0
            ? 'Gratis'
            : new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0,
            }).format(numericPrice)

    return (
        <article
            className="card h-100 overflow-hidden rounded-3 border-0 shadow-sm event-card"
            style={onOpen ? { cursor: 'pointer' } : undefined}
            onClick={onOpen}
        >
            <div className="position-relative">
                <img
                    src={event.image}
                    className="card-img-top event-card-image"
                    alt={`Imagen del evento ${event.title}`}
                    width="800"
                    height="600"
                    loading="lazy"
                    decoding="async"
                />

                <div
                    className="event-date-badge"
                    role="img"
                    aria-label={
                        isValidDate
                            ? `Fecha del evento: ${dateLabel}`
                            : 'Fecha no disponible'
                    }
                >
                    <span
                        className="event-date-month"
                        aria-hidden="true"
                    >
                        {month}
                    </span>

                    <span
                        className="event-date-day"
                        aria-hidden="true"
                    >
                        {day}
                    </span>
                </div>
            </div>

            <div className="card-body d-flex flex-column gap-2 p-3">

                <header className="flex-grow-1">

                    <h3 className="h6 mb-2 fw-bold text-body text-uppercase">
                        {onOpen ? (
                            // Botón real para poder abrir el detalle con el teclado
                            <button
                                type="button"
                                className="btn btn-link p-0 border-0 text-start text-body text-uppercase fw-bold text-decoration-none"
                                style={{ font: 'inherit' }}
                                aria-label={`Ver detalles de ${event.title}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpen()
                                }}
                            >
                                {event.title}
                            </button>
                        ) : (
                            event.title
                        )}
                    </h3>

                    <p className="mb-2 text-body-secondary">
                        <span className="fw-semibold">
                            Organiza:
                        </span>{' '}
                        {event.organizer}
                    </p>

                    <p className="mb-3 text-body-secondary">
                        {event.description}
                    </p>

                    <dl className="mb-0 text-body-secondary">
                        <div className="d-flex align-items-center mb-1">
                            <dt className="me-2">
                                <i
                                    className="bi bi-geo-alt"
                                    aria-hidden="true"
                                ></i>
                                <span className="visually-hidden">
                                    Ciudad:
                                </span>
                            </dt>
                            <dd className="mb-0">
                                {event.city}
                            </dd>
                        </div>
                        {event.location && (
                            <div className="d-flex align-items-center mb-1">
                                <dt className="me-2">
                                    <i
                                        className="bi bi-pin-map"
                                        aria-hidden="true"
                                    ></i>
                                    <span className="visually-hidden">
                                        Lugar:
                                    </span>
                                </dt>
                                <dd className="mb-0">
                                    {event.location}
                                </dd>
                            </div>
                        )}
                        {event.start_time && event.end_time && (
                            <div className="d-flex align-items-center mb-1">
                                <dt className="me-2">
                                    <i
                                        className="bi bi-clock"
                                        aria-hidden="true"
                                    ></i>
                                    <span className="visually-hidden">
                                        Hora:
                                    </span>
                                </dt>
                                <dd className="mb-0">
                                    {event.start_time} - {event.end_time}
                                </dd>
                            </div>
                        )}
                        {event.capacity && (
                            <div className="d-flex align-items-center mb-1">
                                <dt className="me-2">
                                    <i
                                        className="bi bi-people"
                                        aria-hidden="true"
                                    ></i>
                                    <span className="visually-hidden">
                                        Capacidad:
                                    </span>
                                </dt>
                                <dd className="mb-0">
                                    {event.capacity} cupos
                                </dd>
                            </div>
                        )}
                    </dl>

                </header>

                <dl className="mb-0 d-flex justify-content-between align-items-center pt-2 border-top">
                    <dt className="text-body-secondary small fw-normal">
                        {hasSeating ? 'Desde' : 'Precio unitario'}
                    </dt>

                    <dd
                        className={`mb-0 fw-bold ${
                            numericPrice === 0
                                ? 'text-success'
                                : 'text-body'
                        }`}
                    >
                        {formattedPrice}
                    </dd>
                </dl>

                {canReserve && hasSeating && (
                    <button
                        type="button"
                        className="btn btn-success w-100 mt-2"
                        onClick={(e) => {
                            e.stopPropagation()
                            onOpen?.()
                        }}
                    >
                        <i className="bi bi-grid-3x3-gap me-2" aria-hidden="true"></i>
                        Elegir asientos
                    </button>
                )}

                {canReserve && !hasSeating && (
                    <div
                        className="d-flex align-items-center gap-2 mb-3 mt-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex-grow-1">
                            <label htmlFor={`qty-${event.id}`} className="small fw-semibold text-muted mb-1 d-block">
                                Cantidad
                            </label>
                            <input
                                id={`qty-${event.id}`}
                                type="number"
                                className="form-control form-control-sm"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                            />
                        </div>
                        <div className="text-end" style={{ minWidth: '90px' }}>
                            <span className="text-muted small d-block">Total</span>
                            <span className="fw-bold text-success">
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numericPrice * quantity)}
                            </span>
                        </div>
                    </div>
                )}

                {canReserve && !hasSeating && (
                    <button
                        type="button"
                        className="btn btn-success w-100"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (onReserve) onReserve(quantity);
                        }}
                        disabled={isReserved}
                        aria-label={
                            isReserved
                                ? `Reserva solicitada para ${event.title}`
                                : `Reservar ${quantity} boleto(s) para el evento ${event.title}`
                        }
                    >
                        {isReserved
                            ? 'Reserva solicitada'
                            : `Reservar ${quantity} boleto(s)`}
                    </button>
                )}

                {showLoginCta && (
                    <Link
                        to="/login"
                        className="btn btn-outline-success w-100 mt-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Inicia sesión para reservar
                    </Link>
                )}

            </div>
        </article>
    )
}
