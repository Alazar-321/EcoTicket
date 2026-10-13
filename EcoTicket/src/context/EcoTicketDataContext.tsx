import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getEvents,
  getCartReservationIds,
  getReservations,
  subscribeToEcoTicketData,
  type Reservation,
} from '../services/ecoTicketService'
import type { Event } from '../types/event'

export type EcoTicketData = {
  events: Event[]
  reservations: Reservation[]
  cartReservationIds: number[]
  isLoading: boolean
}

export const EcoTicketDataContext = createContext<EcoTicketData | null>(null)

export function EcoTicketDataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [cartReservationIds, setCartReservationIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    const refreshData = async () => {
      try {
        const [eventsData, reservationsData] = await Promise.all([
          getEvents(),
          getReservations(),
        ])
        if (!active) return

        setEvents(eventsData)
        setReservations(reservationsData)
        setCartReservationIds(getCartReservationIds())
      } catch (error) {
        console.error('Error cargando datos de EcoTíquet:', error)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    refreshData()
    const unsubscribe = subscribeToEcoTicketData(refreshData)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({ events, reservations, cartReservationIds, isLoading }),
    [events, reservations, cartReservationIds, isLoading]
  )

  return <EcoTicketDataContext.Provider value={value}>{children}</EcoTicketDataContext.Provider>
}