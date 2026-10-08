import type { Event } from '../types/event'
import { Link } from 'react-router-dom'

export type EventCardProps = {
    event: Event
    canReserve?: boolean
    showLoginCta?: boolean
    isReserved?: boolean
    onReserve?: () => void
}

export default function EventCard({
    event,
    canReserve = false,
    showLoginCta = false,
    isReserved = false,
    onReserve,
}: EventCardProps) {
    const parsedDate = event.date ? new Date(event.date) : null
    const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime())

    const day = isValidDate ? parsedDate.getDate() : '—'

    const month = isValidDate
        ? new Intl.DateTimeFormat('es-CO', { month: 'short' })
            .format(parsedDate)
            .replace('.', '')
            .toUpperCase()
        : 'DATE'

    const numericPrice = Number(event.price ?? 0)

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
        >
            <div className="position-relative ">
                <img
                    src={event.image}
                    className="card-img-top event-card-image"
                    alt={`Imagen del evento ${event.title}`}
                />

                <div
                    className="event-date-badge"
                    aria-label={
                        isValidDate
                            ? `Fecha del evento: ${parsedDate.toLocaleDateString('es-CO')}`
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

                    <h3 className="h6 mb-2 fw-bold text-dark text-uppercase">
                        {event.title}
                    </h3>

                    <p className="mb-2 text-secondary">
                        <span className="fw-semibold">
                            Organiza:
                        </span>{' '}
                        {event.organizer}
                    </p>

                    <p className="mb-3 text-secondary">
                        {event.description}
                    </p>

                    <dl className="mb-0 text-secondary">

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

                    </dl>

                </header>

                <dl className="mb-0 d-flex justify-content-between align-items-center pt-2 border-top border-light-subtle">
                    <dt className="text-muted small fw-normal">
                        Precio
                    </dt>

                    <dd
                        className={`mb-0 fw-bold ${
                            numericPrice === 0
                                ? 'text-success'
                                : 'text-dark'
                        }`}
                    >
                        {formattedPrice}
                    </dd>
                </dl>

                {canReserve && (
                    <button
                        type="button"
                        className="btn btn-success w-100 mt-2"
                        onClick={onReserve}
                        disabled={isReserved}
                        aria-label={
                            isReserved
                                ? `Reserva solicitada para ${event.title}`
                                : `Reservar el evento ${event.title}`
                        }
                    >
                        {isReserved
                            ? 'Reserva solicitada'
                            : 'Reservar evento'}
                    </button>
                )}

                {showLoginCta && (
                    <Link
                        to="/login"
                        className="btn btn-outline-success w-100 mt-2"
                    >
                        Inicia sesión para reservar
                    </Link>
                )}

            </div>
        </article>
    )
}