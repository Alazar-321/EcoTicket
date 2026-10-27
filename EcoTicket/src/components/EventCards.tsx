import { useState, useEffect } from 'react'
import type { Event } from '../types/event'
import { getCurrentUser } from '../auth/auth'
import {
  createReservation,
  createSeatReservations,
  getZonesByEventIds,
} from '../services/ecoTicketService'
import type { EventZone, SeatSelection } from '../utils/seating'
import EventCard from './EventCard'
import EventDetailModal from './EventDetailModal'
import EventCardSkeleton from './EventCardSkeleton'
import { useNavigate } from 'react-router-dom'
import Pagination from './Pagination'

import usePagination from '../hooks/usePagination'
import useEcoTicketData from '../hooks/useEcoTicketData'

const PAGE_SIZE = 8

type EventCardsProps = {
  filteredEvents: Event[]
  resetKey?: string | number
  isLoading?: boolean
}

export default function EventCards({ filteredEvents, resetKey, isLoading = false }: EventCardsProps) {
  const navigate = useNavigate()
  const { reservations } = useEcoTicketData()
  const [user, setUser] = useState<any>(null)
  // Categorías de boletería de los eventos de la página actual, y evento abierto en el modal
  const [zonesByEvent, setZonesByEvent] = useState<Record<number, EventZone[]>>({})
  const [openEvent, setOpenEvent] = useState<Event | null>(null)

  const { pageItems, page, totalPages, setPage } = usePagination(
    filteredEvents,
    PAGE_SIZE,
    resetKey ?? filteredEvents.length
  )

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  // Una sola consulta con las categorías de todos los eventos visibles
  const visibleIds = pageItems.map((event) => event.id).filter((id): id is number => id != null)
  const visibleIdsKey = visibleIds.join(',')

  useEffect(() => {
    let active = true
    getZonesByEventIds(visibleIds).then((zones) => {
      if (active) setZonesByEvent((prev) => ({ ...prev, ...zones }))
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIdsKey])

  const handlePageChange = (p: number) => {
    setPage(p)
    document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth' })
  }

  // quantity es la cantidad de boletos que eligió el cliente en la tarjeta
  const handleReserve = async (event: Event, quantity: number) => {
    if (!user) {
      navigate('/register')
      return
    }

    try {
      const success = await createReservation(event, user.username, user.id, quantity)
      if (success) {
        alert(
          quantity > 1
            ? `¡${quantity} reservas solicitadas con éxito! Puedes seguir el estado en "Mis Tickets".`
            : '¡Reserva solicitada con éxito! Puedes seguir el estado en "Mis Tickets".'
        )
        navigate('/mis_tickets')
      } else {
        alert('No se pudo realizar la reserva: el evento no admite reservas o no hay cupos suficientes.')
      }
    } catch (error) {
      console.error('Error making reservation:', error)
      alert('Ocurrió un error al intentar reservar')
    }
  }

  // Reserva los asientos elegidos en el plano; si sale bien, igual que antes: aviso y a "Mis tickets"
  const handleReserveSeats = async (event: Event, seats: SeatSelection[]) => {
    if (!user) {
      navigate('/register')
      return { ok: false }
    }

    const result = await createSeatReservations(event, user.username, user.id, seats)
    if (result.ok) {
      setOpenEvent(null)
      alert(
        seats.length > 1
          ? `¡${seats.length} asientos solicitados con éxito! Puedes seguir el estado en "Mis Tickets".`
          : '¡Asiento solicitado con éxito! Puedes seguir el estado en "Mis Tickets".'
      )
      navigate('/mis_tickets')
    }
    return result
  }

  return (
    <section
      id="eventos"
      className="container-fluid px-3 px-md-5 py-4"
      aria-labelledby="events-title"
      aria-busy={isLoading}
    >
      <h2 id="events-title" className="mb-3 fs-4 fw-bold text-body">Eventos destacados</h2>
      <p className="visually-hidden" role="status">
        {isLoading
          ? 'Cargando eventos...'
          : filteredEvents.length === 1
            ? 'Se encontró 1 evento.'
            : `Se encontraron ${filteredEvents.length} eventos.`}
      </p>

      <div className="row g-4">
        {isLoading &&
          Array.from({ length: PAGE_SIZE }, (_, i) => (
            <div className="col-12 col-md-6 col-lg-3" key={`skeleton-${i}`}>
              <EventCardSkeleton />
            </div>
          ))}

        {!isLoading &&
          pageItems.map((event) => {
            const zones = event.id != null ? zonesByEvent[event.id] ?? [] : []
            const hasSeating = zones.length > 0
            // En eventos con asientos se pueden hacer varias reservas, así que nunca se bloquea la tarjeta
            const isReserved = Boolean(
              !hasSeating &&
                user &&
                reservations.some(
                  (reservation) =>
                    reservation.eventId === event.id && reservation.customer === user.username
                )
            )

            return (
              <div className="col-12 col-md-6 col-lg-3" key={event.id ?? `${event.date}-${event.title}`}>
                <EventCard
                  event={event}
                  canReserve={user?.role === 'CLIENTE'}
                  showLoginCta={!user}
                  isReserved={isReserved}
                  onReserve={(quantity) => handleReserve(event, quantity)}
                  onOpen={() => setOpenEvent(event)}
                  hasSeating={hasSeating}
                  priceFrom={hasSeating ? Math.min(...zones.map((zone) => zone.price)) : undefined}
                />
              </div>
            )
          })}

        {!isLoading && filteredEvents.length === 0 && (
          <div className="col-12">
            <p className="mb-0 text-center text-body-secondary">No encontramos eventos con esos filtros.</p>
          </div>
        )}
      </div>

      {!isLoading && (
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {openEvent && (
        <EventDetailModal
          event={openEvent}
          zones={openEvent.id != null ? zonesByEvent[openEvent.id] ?? [] : []}
          user={user}
          onClose={() => setOpenEvent(null)}
          onReserveSeats={(seats) => handleReserveSeats(openEvent, seats)}
          onReserveQuantity={async (quantity) => {
            setOpenEvent(null)
            await handleReserve(openEvent, quantity)
          }}
        />
      )}
    </section>
  )
}