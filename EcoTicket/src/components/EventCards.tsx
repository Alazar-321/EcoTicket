import { useState, useEffect } from 'react'
import type { Event } from '../types/event'
import { getCurrentUser } from '../auth/auth'
import { createReservation } from '../services/ecoTicketService'
import EventCard from './EventCard'
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

  const { pageItems, page, totalPages, setPage } = usePagination(
    filteredEvents,
    PAGE_SIZE,
    resetKey ?? filteredEvents.length
  )

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleReserve = async (event: Event) => {
    if (!user) {
      navigate('/register')
      return
    }

    try {
      const success = await createReservation(event, user.username, user.id)
      if (success) {
        alert('¡Reserva solicitada con éxito! Puedes seguir el estado en "Mis Tickets".')
        navigate('/mis_tickets')
      } else {
        alert('Ya tienes una reserva para este evento')
      }
    } catch (error) {
      console.error('Error making reservation:', error)
      alert('Ocurrió un error al intentar reservar')
    }
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
            const isReserved = Boolean(
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
                  onReserve={() => handleReserve(event)}
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
    </section>
  )
}