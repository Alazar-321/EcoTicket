import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Event } from '../types/event'
import { getCurrentUser } from '../auth/auth'
import { createReservation, createSeatReservations, getEventZones } from '../services/ecoTicketService'
import type { EventZone, SeatSelection } from '../utils/seating'
import EventDetailModal from '../components/EventDetailModal'

// Modal de detalle de un evento (información completa, categorías y plano de asientos) con su lógica de reserva.
// Lo usan el catálogo (EventCards) y los destacados (GridDestacados): así se comporta igual en los dos sitios.
//
//   const { openEvent, modal } = useEventModal()
//   <button onClick={() => openEvent(event)}>Ver</button>
//   {modal}            // se pone una sola vez, al final del componente
export default function useEventModal() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [current, setCurrent] = useState<Event | null>(null)
  const [zones, setZones] = useState<EventZone[]>([])

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  // Las categorías se piden antes de abrir: así el modal no parpadea entre "por cantidad" y "con asientos"
  const openEvent = useCallback(async (event: Event) => {
    setZones(event.id != null ? await getEventZones(event.id) : [])
    setCurrent(event)
  }, [])

  const close = useCallback(() => setCurrent(null), [])

  // Reserva por cantidad (eventos sin plano de asientos)
  const reserveByQuantity = async (event: Event, quantity: number) => {
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

  // Reserva los asientos elegidos en el plano; si sale bien: aviso y a "Mis tickets"
  const reserveSeats = async (event: Event, seats: SeatSelection[]) => {
    if (!user) {
      navigate('/register')
      return { ok: false }
    }

    const result = await createSeatReservations(event, user.username, user.id, seats)
    if (result.ok) {
      setCurrent(null)
      alert(
        seats.length > 1
          ? `¡${seats.length} asientos solicitados con éxito! Puedes seguir el estado en "Mis Tickets".`
          : '¡Asiento solicitado con éxito! Puedes seguir el estado en "Mis Tickets".'
      )
      navigate('/mis_tickets')
    }
    return result
  }

  const modal: ReactNode = current ? (
    <EventDetailModal
      event={current}
      zones={zones}
      user={user}
      onClose={close}
      onReserveSeats={(seats) => reserveSeats(current, seats)}
      onReserveQuantity={async (quantity) => {
        setCurrent(null)
        await reserveByQuantity(current, quantity)
      }}
    />
  ) : null

  return { user, openEvent, reserveByQuantity, modal }
}