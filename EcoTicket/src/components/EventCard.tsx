import type { Event } from '../types/event'

export type EventCardProps = {
    event: Event
}

export default function EventCard({ event }: EventCardProps) {
    const localDate = event.date
        ? (() => {
            const [year, month, day] = event.date.split('-').map(Number)
            return new Date(year, month - 1, day)
          })()
        : null

    const isValidDate = localDate && !Number.isNaN(localDate.getTime())

    const day = isValidDate ? localDate.getDate() : '—'
    const month = isValidDate
        ? new Intl.DateTimeFormat('es-CO', { month: 'short' })
            .format(localDate)
            .replace('.', '')
            .toUpperCase()
        : 'DATE'

    const numericPrice = Number(event.price ?? 0)
    const formattedPrice = numericPrice === 0 ? 'Gratis' : new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(numericPrice)

    return (
        <article className="card h-100 overflow-hidden rounded-3 border-0 shadow-sm event-card">
            <div className="position-relative">
                <img
                    src={event.image}
                    className="card-img-top event-card-image"
                    alt={`Imagen del evento ${event.title}`}
                />

                <div className="event-date-badge">
                    <span className="event-date-month">{month}</span>
                    <span className="event-date-day">{day}</span>
                </div>
            </div>

            <div className="card-body d-flex flex-column gap-2 p-3">
                <div className="flex-grow-1">
                    <h3 className="h6 mb-2 fw-bold text-dark text-uppercase">
                        {event.title}
                    </h3>

                    <p className="mb-1 text-secondary">
                        {event.organizer}
                    </p>

                    <p className="mb-0 text-secondary">
                        {event.city}
                    </p>
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light-subtle">
                    <span className="text-muted small">Precio</span>
                    <strong className={numericPrice === 0 ? 'text-success' : 'text-dark'}>
                        {formattedPrice}
                    </strong>
                </div>
            </div>
        </article>
    )
}