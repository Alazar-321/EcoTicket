import { useEffect, useState } from 'react'
import {
  getEvents,
  getCartReservationIds,
  getReservations,
  subscribeToEcoTicketData,
  type Reservation,
} from '../services/ecoTicketService'
import type { Event } from '../types/event'

export default function useEcoTicketData() {
  

  const [events, setEvents] = useState<Event[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [cartReservationIds, setCartReservationIds] = useState<number[]>([])

  const refreshData = async () => {
    const [eventsData, reservationsData] = await Promise.all([
      getEvents(),
      getReservations()
    ])

    

    setEvents(eventsData)
    setReservations(reservationsData)
    setCartReservationIds(getCartReservationIds())
  }

  useEffect(() => {
    // Carga inicial
    refreshData()

    // Suscripción a cambios
    return subscribeToEcoTicketData(() => {
      refreshData()
    })
  }, [])

  return { events, reservations, cartReservationIds }
}