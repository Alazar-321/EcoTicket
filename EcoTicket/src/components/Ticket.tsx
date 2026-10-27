import { QRCodeSVG } from 'qrcode.react'
import type { Reservation } from '../services/ecoTicketService'
import type { Event } from '../types/event'
// import './Ticket.css'

// Por si tu tipo Event no declara estos campos opcionales
type TicketEvent = Event & { location?: string | null; organizer?: string }

type Props = {
  reservation: Reservation
  event?: Event
}

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Las fechas "AAAA-MM-DD" se leen como fecha local para que no se desplacen un día
function parseDate(value?: string) {
  if (!value) return null
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return isNaN(date.getTime()) ? null : date
}

function formatEventDate(value?: string) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'full' }).format(date)
    : 'Fecha no disponible'
}

function formatPaidDate(value?: string) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : '—'
}

function Ticket({ reservation, event }: Props) {
  const ticketEvent = event as TicketEvent | undefined

  const ticketNumber = `ECO-${String(reservation.id).padStart(6, '0')}`
  const title = ticketEvent?.title || reservation.eventTitle || 'Evento'
  const city = ticketEvent?.city || '—'
  const place = ticketEvent?.location || ''
  const organizer = ticketEvent?.organizer || ''
  const price = Number(reservation.price) || Number(ticketEvent?.price) || 0
  const priceText = price === 0 ? 'Gratis' : currency.format(price)
  const eventDate = formatEventDate(ticketEvent?.date)
  const paidAt = formatPaidDate(reservation.paidAt)
  // Categoría y asiento (solo en eventos con plano de asientos)
  const seatText = reservation.seatLabel
    ? `${reservation.zoneName ? `${reservation.zoneName} · ` : ''}Asiento ${reservation.seatLabel}`
    : ''

  // Texto legible: cualquier lector de QR del móvil mostrará la información del ticket
  const qrValue = [
    'ECOTICKET',
    `Ticket: ${ticketNumber}`,
    `Evento: ${title}`,
    `Fecha: ${eventDate}`,
    `Ciudad: ${city}`,
    place ? `Lugar: ${place}` : null,
    seatText ? `Ubicación: ${seatText}` : null,
    organizer ? `Organiza: ${organizer}` : null,
    `Cliente: ${reservation.customer}`,
    `Valor: ${priceText}`,
    `Pagado: ${paidAt}`,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <article className="ticket-card" aria-label={`Ticket ${ticketNumber}`}>
      <div className="ticket-main">
        <p className="ticket-brand">EcoTicket</p>
        <h3 className="ticket-title">{title}</h3>

        <dl className="ticket-details">
          <div>
            <dt>Fecha</dt>
            <dd>{eventDate}</dd>
          </div>
          <div>
            <dt>Ciudad</dt>
            <dd>{city}</dd>
          </div>
          {place && (
            <div>
              <dt>Lugar</dt>
              <dd>{place}</dd>
            </div>
          )}
          {organizer && (
            <div>
              <dt>Organiza</dt>
              <dd>{organizer}</dd>
            </div>
          )}
          {seatText && (
            <div>
              <dt>Ubicación</dt>
              <dd>{seatText}</dd>
            </div>
          )}
          <div>
            <dt>Cliente</dt>
            <dd>{reservation.customer}</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd>{priceText}</dd>
          </div>
          <div>
            <dt>Pagado</dt>
            <dd>{paidAt}</dd>
          </div>
        </dl>
      </div>

      <div className="ticket-stub">
        <QRCodeSVG
          value={qrValue}
          size={176}
          level="M"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#000000"
          title={`Código QR del ticket ${ticketNumber}`}
        />
        <p className="ticket-number">{ticketNumber}</p>
        <p className="ticket-hint">Presenta este código en la entrada</p>
      </div>
    </article>
  )
}

export default Ticket