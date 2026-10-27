import { useState, useEffect } from 'react'
import type { Event } from '../types/event'
import { getZonesByEventIds } from '../services/ecoTicketService'
import type { EventZone } from '../utils/seating'
import EventCard from './EventCard'
import EventCardSkeleton from './EventCardSkeleton'
import Pagination from './Pagination'

import usePagination from '../hooks/usePagination'
import useEcoTicketData from '../hooks/useEcoTicketData'
import useEventModal from '../hooks/useEventModal'

const PAGE_SIZE = 8

type EventCardsProps = {
  filteredEvents: Event[]
  resetKey?: string | number
  isLoading?: boolean
}

export default function EventCards({ filteredEvents, resetKey, isLoading = false }: EventCardsProps) {
  const { reservations } = useEcoTicketData()
  // Modal de detalle (compartido con los destacados) y usuario con sesión
  const { user, openEvent, reserveByQuantity, modal } = useEventModal()
  // Categorías de boletería de los eventos de la página actual (para mostrar "Desde $X" en la tarjeta)
  const [zonesByEvent, setZonesByEvent] = useState<Record<number, EventZone[]>>({})

  const { pageItems, page, totalPages, setPage } = usePagination(
    filteredEvents,
    PAGE_SIZE,
    resetKey ?? filteredEvents.length
  )

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
                  onReserve={(quantity) => reserveByQuantity(event, quantity)}
                  onOpen={() => openEvent(event)}
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

      {modal}
    </section>
  )
}