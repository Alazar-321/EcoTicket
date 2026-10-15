import { supabase } from '../lib/supabase'
import type { Event } from '../types/event'

export type ReservationStatus = 'SOLICITADA' | 'CONFIRMADA' | 'RECHAZADA' | 'PAGADA'

export type Reservation = {
  id: number
  eventId: number
  eventTitle: string
  customer: string
  createdAt: string
  status: ReservationStatus
  price?: number
  paidAt?: string
  user_id?: string | null 
}

const CART_KEY = 'eco_ticket_cart'
const DATA_CHANGE_EVENT = 'eco-ticket-data-change'

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase.from('events').select('*')
  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  return data as Event[]
}

export async function getEventById(id: number): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching event by id:', error)
    return null
  }
  return data as Event
}

export async function createEvent(event: Omit<Event, 'id'>): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    return null
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return data as Event
}

// Fila tal cual viene de Supabase (snake_case + join con events)
type ReservationRow = {
  id: number
  event_id: number
  user_id: string
  customer: string
  status: ReservationStatus
  price: number | null
  paid_at: string | null
  created_at: string
  events: { title: string } | null
}

export async function getReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, events(title)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reservations:', error)
    return []
  }

  return (data as unknown as ReservationRow[]).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.events?.title ?? '',
    customer: row.customer,
    createdAt: row.created_at,
    status: row.status,
    price: row.price ?? undefined,
    paidAt: row.paid_at ?? undefined,
  }))
}

export async function createReservation(event: Event, customer: string, userId: string): Promise<boolean> {
  if (!event.id) return false

  // Capacidad Check
  const { count } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)

  if (count !== null && event.capacity !== undefined && count >= event.capacity) {
    console.error('Evento lleno')
    return false
  }

  const reservation = {
    event_id: event.id,
    user_id: userId,
    customer,
    status: 'SOLICITADA',
    price: Number(event.price ?? 0),
  }

  const { error } = await supabase.from('reservations').insert([reservation])
  if (error) {
    console.error('Error creating reservation:', error)
    return false
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

export async function updateReservationStatus(id: string | number, status: ReservationStatus) {
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !reservation || reservation.status === 'PAGADA' || status === 'PAGADA') return

  const { error: updateError } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)

  if (updateError) {
    console.error('Error updating reservation status:', updateError)
    return
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))

  if (status !== 'CONFIRMADA') {
    const cart = getCartReservationIds()
    localStorage.setItem(CART_KEY, JSON.stringify(cart.filter((reservationId) => reservationId !== id)))
  }
}

export function getCartReservationIds(): number[] {
  const stored = localStorage.getItem(CART_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored) as number[]
  } catch {
    return []
  }
}

// El carrito vive en localStorage (estado transitorio de la UI).
// `_customer` se mantiene en la firma para no romper a quien llame a la función,
// pero no se usa: la validación de la reserva se hace en payForCart.
export function addReservationToCart(id: number, _customer: string): boolean {
  const cart = getCartReservationIds()
  if (cart.includes(id)) return false

  localStorage.setItem(CART_KEY, JSON.stringify([...cart, id]))
  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

export function removeReservationFromCart(id: number, _customer: string) {
  const cart = getCartReservationIds()
  localStorage.setItem(CART_KEY, JSON.stringify(cart.filter((reservationId) => reservationId !== id)))
  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
}

export async function payForCart(customer: string): Promise<boolean> {
  const cartIds = getCartReservationIds()
  if (cartIds.length === 0) return false

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .in('id', cartIds)
    .eq('customer', customer)
    .eq('status', 'CONFIRMADA')

  if (error || !reservations || reservations.length === 0) return false

  const paidAt = new Date().toISOString()

  // Solo se envían los campos a modificar; la columna en Supabase es snake_case (paid_at).
  for (const res of reservations) {
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ status: 'PAGADA', paid_at: paidAt })
      .eq('id', res.id)

    if (updateError) {
      console.error('Error paying reservation:', updateError)
      return false
    }
  }

  localStorage.setItem(CART_KEY, JSON.stringify([]))
  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

export type UserRole = 'AGENTE' | 'CLIENTE' | 'ADMINISTRADOR'

export type Profile = {
  id: string
  username: string
  fullName: string
  role: UserRole
}

type ProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  role: UserRole
}

export async function updateEvent(id: number, updates: any): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error)
    return null
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return data as Event
}

export async function deleteEvent(id: number): Promise<boolean> {
  // First, delete associated reservations to avoid foreign key violations
  const { error: resError } = await supabase
    .from('reservations')
    .delete()
    .eq('event_id', id)

  if (resError) {
    console.error('Error deleting event reservations:', resError)
  }

  const { error: eventError } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (eventError) {
    console.error('Error deleting event:', eventError)
    return false
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

// Lista clientes y agentes (los administradores no se pueden borrar, así que no se listan)
export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, role')
    .neq('role', 'ADMINISTRADOR')
    .order('username')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return ((data ?? []) as ProfileRow[]).map((row) => ({
    id: row.id,
    username: row.username ?? '',
    fullName: row.full_name ?? '',
    role: row.role,
  }))
}

// Borra al usuario llamando a la función SQL admin_delete_user (ver admin_delete_user.sql).
// La función comprueba en la base de datos que quien llama es ADMINISTRADOR.
// Sus reservas y su perfil se eliminan en cascada.
export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId })
  if (error) {
    console.error('Error deleting user:', error)
    return false
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

export function subscribeToEcoTicketData(callback: () => void) {
  window.addEventListener(DATA_CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  // Al iniciar o cerrar sesión hay que volver a pedir los datos: las políticas RLS
  // de Supabase devuelven resultados distintos según el usuario autenticado.
  window.addEventListener('auth-change', callback)
  return () => {
    window.removeEventListener(DATA_CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
    window.removeEventListener('auth-change', callback)
  }
}
