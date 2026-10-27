import type { Event } from '../types/event'
import { dateOnlyToDate, formatDateOnly } from '../utils/date'

type Props = { event: Event; featured?: boolean; onOpen?: () => void }

export default function EventTile({ event, featured = false, onOpen }: Props) {
  // La fecha es "YYYY-MM-DD": se formatea sin que la zona horaria la mueva de día
  const valid = Boolean(dateOnlyToDate(event.date))

  const day = valid ? Number(event.date.slice(8, 10)) : '—'
  const month = valid ? formatDateOnly(event.date, { month: 'short' }).replace('.', '') : ''
  const weekday = valid ? formatDateOnly(event.date, { weekday: 'short' }).replace('.', '') : ''
  const dateLabel = valid ? formatDateOnly(event.date, { dateStyle: 'long' }) : 'Fecha no disponible'

  // Si recibe onOpen, toda la tarjeta se comporta como un botón (clic, Enter o Espacio)
  const interactive = onOpen
    ? {
        role: 'button' as const,
        tabIndex: 0,
        style: { cursor: 'pointer' },
        'aria-label': `Ver detalles de ${event.title}`,
        onClick: onOpen,
        onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        },
      }
    : {}

  return (
    <article className="event-tile bg-body-tertiary rounded-2 p-3 h-100 d-flex flex-column" {...interactive}>
      <div className={`event-tile-media ${featured ? 'is-featured' : 'ratio ratio-1x1'}`}>
        <img
          src={event.image}
          alt={`Imagen del evento ${event.title}`}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="d-flex justify-content-between gap-2 pt-3">
        <div className="min-w-0">
          <h3 className="event-tile-title mb-1">{event.title}</h3>
          <p className="mb-0 small text-body-secondary">{event.organizer}</p>
          <p className="mb-0 small text-body-secondary">{event.city}</p>
        </div>

        <div
          className="event-tile-date text-center flex-shrink-0"
          role="img"
          aria-label={valid ? `Fecha del evento: ${dateLabel}` : dateLabel}
        >
          <span className="d-block fs-5 fw-bold lh-1">{day}</span>
          <span className="d-block small fw-semibold text-capitalize">{month}</span>
          <span className="d-block small text-capitalize">{weekday}</span>
        </div>
      </div>
    </article>
  )
}