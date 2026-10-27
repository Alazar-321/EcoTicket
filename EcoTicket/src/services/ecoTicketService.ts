import { supabase } from '../lib/supabase'
import { acceptsReservations } from '../utils/eventStatus'
import {
  MAX_SEATS_PER_BOOKING,
  seatKey,
  validateZones,
  totalSeats,
  zoneSeatLabels,
  type EventZone,
  type SeatSelection,
} from '../utils/seating'
import type { Event, CreateEvent, UpdateEvent } from '../types/event'
import type { Profile, UserRole, City, Country, Department } from '../types/user'

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
  // Categoría de boletería y asiento (solo en eventos con plano de asientos)
  zoneId?: number | null
  zoneName?: string | null
  seatLabel?: string | null
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

export async function createEvent(event: CreateEvent): Promise<Event | null> {
  const { data: profile } = await supabase.auth.getUser()
  const userId = profile?.user?.id

  const eventWithUser = {
    ...event,
    created_by: userId,
  }

  const { data, error } = await supabase
    .from('events')
    .insert([eventWithUser])
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    return null
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return data as Event
}

type ReservationRow = {
  id: number
  event_id: number
  user_id: string
  customer: string
  status: ReservationStatus
  price: number | null
  paid_at: string | null
  created_at: string
  zone_id: number | null
  zone_name: string | null
  seat_label: string | null
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
    user_id: row.user_id,
    zoneId: row.zone_id ?? null,
    zoneName: row.zone_name ?? null,
    seatLabel: row.seat_label ?? null,
  }))
}

export async function createReservation(event: Event, customer: string, userId: string, quantity: number = 1): Promise<boolean> {
  if (!event.id) return false

  // 0. No se reserva en eventos finalizados ni cancelados
  if (!acceptsReservations(event.status)) {
    console.error('Este evento ya no admite reservas (finalizado o cancelado).')
    return false
  }

  // 1. Verificación de capacidad para la cantidad solicitada
  const { count } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)

  // `!= null` (y no `!== undefined`): un evento sin capacidad llega como null desde la base de datos,
  // y `n > null` es true, lo que bloqueaba siempre la reserva
  if (event.capacity != null && (count ?? 0) + quantity > event.capacity) {
    console.error(`Capacidad insuficiente. Solo quedan ${event.capacity - (count ?? 0)} cupos disponibles.`)
    return false
  }

  // 2. Crear múltiples reservas (una por cada ticket)
  const reservations = Array.from({ length: quantity }).map(() => ({
    event_id: event.id,
    user_id: userId,
    customer,
    status: 'SOLICITADA',
    price: Number(event.price ?? 0),
  }))

  const { error } = await supabase.from('reservations').insert(reservations)
  if (error) {
    console.error('Error creating reservations:', error)
    return false
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

// ───────────────────────── Categorías de boletería y asientos ─────────────────────────

type ZoneRow = {
  id: number
  event_id: number
  name: string
  price: number | string
  seat_rows: number
  seats_per_row: number
  color: string
  sort_order: number
}

function mapZone(row: ZoneRow): EventZone {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    price: Number(row.price),
    rows: row.seat_rows,
    seatsPerRow: row.seats_per_row,
    color: row.color,
    sortOrder: row.sort_order,
  }
}

export async function getEventZones(eventId: number): Promise<EventZone[]> {
  const { data, error } = await supabase
    .from('event_zones')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order')
    .order('id')

  if (error) {
    console.error('Error fetching event zones:', error)
    return []
  }
  return (data as ZoneRow[]).map(mapZone)
}

// Categorías de varios eventos en una sola consulta (para las tarjetas del catálogo)
export async function getZonesByEventIds(eventIds: number[]): Promise<Record<number, EventZone[]>> {
  if (eventIds.length === 0) return {}

  const { data, error } = await supabase
    .from('event_zones')
    .select('*')
    .in('event_id', eventIds)
    .order('sort_order')
    .order('id')

  if (error) {
    console.error('Error fetching zones for events:', error)
    return {}
  }

  const grouped: Record<number, EventZone[]> = {}
  for (const row of data as ZoneRow[]) {
    ;(grouped[row.event_id] ??= []).push(mapZone(row))
  }
  return grouped
}

// Asientos ocupados del evento (claves "idCategoría:etiqueta")
export async function getTakenSeats(eventId: number): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('get_taken_seats', { p_event_id: eventId })
  if (error) {
    console.error('Error fetching taken seats:', error)
    return new Set()
  }
  return new Set(
    ((data ?? []) as { zone_id: number; seat_label: string }[]).map((row) =>
      seatKey(row.zone_id, row.seat_label)
    )
  )
}

// Guarda las categorías de un evento: actualiza las que ya existían, crea las nuevas y borra las quitadas.
// No deja quitar ni reducir una categoría si eso dejaría fuera asientos que ya están reservados.
export async function saveEventZones(
  eventId: number,
  zones: EventZone[]
): Promise<{ ok: boolean; message?: string }> {
  const invalid = validateZones(zones)
  if (invalid) return { ok: false, message: invalid }

  const current = await getEventZones(eventId)
  const taken = await getTakenSeats(eventId)

  const keptIds = new Set(zones.filter((zone) => zone.id != null).map((zone) => zone.id as number))
  const removed = current.filter((zone) => zone.id != null && !keptIds.has(zone.id))

  for (const zone of removed) {
    const hasTaken = [...taken].some((key) => key.startsWith(`${zone.id}:`))
    if (hasTaken) {
      return { ok: false, message: `No se puede quitar «${zone.name}»: tiene asientos reservados.` }
    }
  }

  for (const zone of zones) {
    if (zone.id == null) continue
    const valid = zoneSeatLabels(zone)
    const orphan = [...taken].find((key) => {
      const [zoneId, label] = key.split(':')
      return Number(zoneId) === zone.id && !valid.has(label)
    })
    if (orphan) {
      return {
        ok: false,
        message: `No se puede reducir «${zone.name}»: el asiento ${orphan.split(':')[1]} ya está reservado.`,
      }
    }
  }

  if (removed.length > 0) {
    const { error } = await supabase
      .from('event_zones')
      .delete()
      .in('id', removed.map((zone) => zone.id as number))
    if (error) {
      console.error('Error deleting zones:', error)
      return { ok: false, message: 'No se pudieron quitar las categorías.' }
    }
  }

  for (const [index, zone] of zones.entries()) {
    const payload = {
      event_id: eventId,
      name: zone.name.trim(),
      price: zone.price,
      seat_rows: zone.rows,
      seats_per_row: zone.seatsPerRow,
      color: zone.color,
      sort_order: index,
    }

    const { error } =
      zone.id != null
        ? await supabase.from('event_zones').update(payload).eq('id', zone.id)
        : await supabase.from('event_zones').insert(payload)

    if (error) {
      console.error('Error saving zone:', error)
      return {
        ok: false,
        message: 'No se pudo guardar la categoría. Comprueba que ejecutaste event_seating.sql y que eres el dueño del evento.',
      }
    }
  }

  // La capacidad del evento pasa a ser el total de asientos del plano
  if (zones.length > 0) {
    await supabase.from('events').update({ capacity: totalSeats(zones) }).eq('id', eventId)
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return { ok: true }
}

// Reserva asientos concretos: una reserva por asiento. La base de datos impide reservar dos veces el mismo.
export async function createSeatReservations(
  event: Event,
  customer: string,
  userId: string,
  seats: SeatSelection[]
): Promise<{ ok: boolean; message?: string }> {
  if (!event.id) return { ok: false, message: 'Evento no válido.' }
  if (!acceptsReservations(event.status)) {
    return { ok: false, message: 'Este evento ya no admite reservas (finalizado o cancelado).' }
  }
  if (seats.length === 0) return { ok: false, message: 'Elige al menos un asiento.' }
  if (seats.length > MAX_SEATS_PER_BOOKING) {
    return { ok: false, message: `Puedes reservar hasta ${MAX_SEATS_PER_BOOKING} asientos a la vez.` }
  }

  const rows = seats.map((seat) => ({
    event_id: event.id,
    user_id: userId,
    customer,
    status: 'SOLICITADA',
    zone_id: seat.zoneId,
    zone_name: seat.zoneName,
    seat_label: seat.label,
    price: seat.price,
  }))

  const { error } = await supabase.from('reservations').insert(rows)
  if (error) {
    console.error('Error creating seat reservations:', error)
    // 23505: violación del índice único = alguien reservó ese asiento antes
    if (error.code === '23505') {
      return {
        ok: false,
        message: 'Alguno de los asientos ya fue reservado por otra persona. Actualizamos el plano: elige otros.',
      }
    }
    return { ok: false, message: 'No se pudo realizar la reserva. Inténtalo de nuevo.' }
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return { ok: true }
}

// Devuelve true solo si la reserva se modificó de verdad.
export async function updateReservationStatus(id: string | number, status: ReservationStatus): Promise<boolean> {
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('*, events(*)')
    .eq('id', id)
    .single()

  if (fetchError || !reservation) {
    console.error('Error fetching reservation for status update:', fetchError)
    return false
  }

  // Regla de Negocio: Una reserva PAGADA no puede volver a otro estado
  if (reservation.status === 'PAGADA') {
    console.error('No se puede cambiar el estado de una reserva ya pagada.')
    return false
  }

  // Si pasamos a CONFIRMADA, fijamos el precio actual del evento en la reserva
  const updates: any = { status }
  // (si la reserva tiene categoría de boletería, conserva el precio de su categoría)
  if (status === 'CONFIRMADA' && reservation.zone_id == null) {
    const eventPrice = reservation.events?.price ?? 0
    updates.price = eventPrice
  }

  // .select('id') devuelve las filas realmente modificadas. Si las políticas RLS bloquean el
  // UPDATE, Supabase NO da error: simplemente llega una lista vacía.
  const { data: updated, error: updateError } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', id)
    .select('id')

  if (updateError) {
    console.error('Error updating reservation status:', updateError)
    return false
  }

  if (!updated || updated.length === 0) {
    console.error(
      `La reserva ${id} no se actualizó: la base de datos bloqueó el cambio. ` +
        'Revisa las políticas RLS de UPDATE en la tabla reservations.'
    )
    return false
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))

  if (status !== 'CONFIRMADA') {
    const cart = getCartReservationIds()
    localStorage.setItem(CART_KEY, JSON.stringify(cart.filter((reservationId) => reservationId !== id)))
  }

  return true
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

export async function addReservationToCart(id: number, _customer: string): Promise<boolean> {
  // 1. Verificación de seguridad: ¿Sigue la reserva confirmada en la DB?
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', id)
    .single()

  if (error || !reservation || reservation.status !== 'CONFIRMADA') {
    console.error('La reserva no puede ser agregada al carrito porque no está CONFIRMADA.')
    return false
  }

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

export async function payForCart(customer: string, usePoints: boolean = false): Promise<boolean> {
  const cartIds = getCartReservationIds()
  if (cartIds.length === 0) return false

  // 1. Obtener datos actualizados de las reservas y sus eventos.
  // Se buscan por nombre de cliente O por id de usuario, igual que las muestra el carrito:
  // filtrar solo por nombre dejaba sin pagar las reservas cuyo `customer` no coincidía.
  const { data: authData } = await supabase.auth.getUser()
  const authUserId = authData.user?.id
  const safeCustomer = customer.replace(/"/g, '')
  const ownerFilter = authUserId
    ? `customer.eq."${safeCustomer}",user_id.eq.${authUserId}`
    : `customer.eq."${safeCustomer}"`

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*, events(*)')
    .in('id', cartIds)
    .or(ownerFilter)
    .eq('status', 'CONFIRMADA')

  if (error || !reservations || reservations.length === 0) return false

  // 2. VALIDACIÓN CRÍTICA DE CAPACIDAD:
  for (const res of reservations) {
    const eventId = res.event_id
    const capacity = (res.events as any)?.capacity

    // `!= null`: un evento sin capacidad llega como null, y `n >= null` es siempre true
    // (null se convierte en 0), lo que bloqueaba el pago de cualquier evento sin capacidad
    if (capacity != null) {
      // Simplificamos la consulta para evitar errores 400 de Supabase
      const { data: paidReservations, error: countError } = await supabase
        .from('reservations')
        .select('id')
        .eq('event_id', eventId)
        .eq('status', 'PAGADA')

      if (countError) {
        console.error(`Error validando capacidad para evento ${eventId}:`, countError)
        // No bloqueamos el pago por un error de conteo, pero avisamos
      } else if (paidReservations && paidReservations.length >= capacity) {
        console.error(`Evento ${eventId} ya alcanzó su capacidad máxima de ${capacity} tickets pagados.`)
        return false
      }
    }
  }

  const paidAt = new Date().toISOString()

  // 3. Actualización atómica de las reservas validadas (confirmadas y del cliente).
  // .select('id') devuelve las filas realmente modificadas: si RLS bloquea el UPDATE llega una
  // lista vacía y SIN error (antes se daba el pago por bueno y se sumaban puntos igualmente).
  const idsToPay = reservations.map((res: any) => res.id)

  const { data: paidRows, error: updateError } = await supabase
    .from('reservations')
    .update({ status: 'PAGADA', paid_at: paidAt })
    .in('id', idsToPay)
    .eq('status', 'CONFIRMADA')
    .select('id')

  if (updateError) {
    console.error('Error paying reservations:', updateError)
    return false
  }

  if (!paidRows || paidRows.length === 0) {
    console.error(
      'El pago no se registró: la base de datos no modificó ninguna reserva. ' +
        'Revisa la política RLS de UPDATE para el cliente (reservations_pay_policy.sql).'
    )
    return false
  }

  // 4. Gestión de Puntos y Descuentos
  const ticketCount = paidRows.length

  // Buscamos el usuario asociado a la primera reserva para sumar/restar puntos
  const { data: firstRes } = await supabase
    .from('reservations')
    .select('user_id')
    .eq('id', idsToPay[0])
    .single()

  if (firstRes?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', firstRes.user_id)
      .single()

    let currentPoints = Number(profile?.points ?? 0)

    // Si usó el descuento, restamos 50 puntos. Si no, sumamos 5 por ticket.
    const newPoints = usePoints
      ? currentPoints - 50
      : currentPoints + (ticketCount * 5)

    await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', firstRes.user_id)
  }

  // Solo se quitan del carrito las reservas que realmente se pagaron;
  // las que no se pudieron pagar siguen visibles en el carrito.
  const paidIds = paidRows.map((row: any) => row.id as number)
  if (paidIds.length < cartIds.length) {
    console.warn(
      `Se pagaron ${paidIds.length} de ${cartIds.length} reservas del carrito. ` +
        'Las demás no están confirmadas, no son de este usuario o su evento ya no tiene cupos.'
    )
  }
  const remaining = getCartReservationIds().filter((id) => !paidIds.includes(id))
  localStorage.setItem(CART_KEY, JSON.stringify(remaining))
  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

export type UserRole = 'AGENTE' | 'CLIENTE' | 'ADMINISTRADOR'

export type Profile = {
  id: string
  username: string
  fullName: string
  role: UserRole
  updatedAt?: string
  // Datos comunes de todas las personas
  email?: string
  identificationType?: 'CEDULA' | 'PASAPORTE' | null
  identification?: string | null
  address?: string
  city?: string
  phones?: string[]
}

type ProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  role: UserRole
  updated_at: string | null
}

export async function updateEvent(id: number, updates: UpdateEvent): Promise<Event | null> {
  const { data: profile } = await supabase.auth.getUser()
  const userId = profile?.user?.id

  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', id)
    .single()

  if (fetchError || !event) {
    console.error('Error fetching event for permission check:', fetchError)
    return null
  }

  // Regla de Negocio: Solo el creador o el administrador pueden editar
  const isOwner = event.created_by === userId
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isAdmin = userProfile?.role === 'ADMINISTRADOR'

  if (!isOwner && !isAdmin) {
    console.error('No tienes permisos para editar este evento.')
    return null
  }

  const { data, error: updateError } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating event:', updateError)
    return null
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return data as Event
}

export async function deleteEvent(id: number): Promise<boolean> {
  const { data: profile } = await supabase.auth.getUser()
  const userId = profile?.user?.id

  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', id)
    .single()

  if (fetchError || !event) {
    console.error('Error fetching event for permission check:', fetchError)
    return false
  }

  const isOwner = event.created_by === userId
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isAdmin = userProfile?.role === 'ADMINISTRADOR'

  if (!isOwner && !isAdmin) {
    console.error('No tienes permisos para eliminar este evento.')
    return false
  }

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

export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('username')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return ((data ?? []) as any[]).map((row) => {
    const base: any = {
      id: row.id,
      username: row.username ?? '',
      fullName: row.full_name ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
      cityId: row.city_id ?? '',
      city: row.city ?? '',
      identificationType: row.identification_type ?? null,
      identification: row.identification ?? null,
      phones: row.phones ?? [],
      role: row.role,
      updatedAt: row.updated_at ?? undefined,
    }

    if (row.role === 'CLIENTE') {
      return { ...base, points: row.points ?? 0, showAds: row.show_ads ?? true }
    } else if (row.role === 'AGENTE') {
      return { ...base, commission: row.commission ?? 0, experience: row.experience ?? '' }
    } else if (row.role === 'ADMINISTRADOR') {
      return { ...base, salary: row.salary ?? 0, schedule: row.schedule ?? '' }
    }

    return base as Profile
  })
}

export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId })
  if (error) {
    console.error('Error deleting user:', error)
    return false
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

// Asigna el salario y el horario de un administrador.
// Usa la función SQL admin_update_admin_details (ver admin_update_admin_details.sql),
// que comprueba en la base de datos que quien llama es ADMINISTRADOR.
export async function updateAdminDetails(userId: string, salary: number, schedule: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_update_admin_details', {
    target_user_id: userId,
    new_salary: salary,
    new_schedule: schedule,
  })
  if (error) {
    console.error('Error updating admin details:', error)
    return false
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

// Asigna la comisión (%) y la experiencia de un agente.
// Usa la función SQL admin_update_agent_details (ver admin_update_agent_details.sql).
export async function updateAgentDetails(userId: string, commission: number, experience: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_update_agent_details', {
    target_user_id: userId,
    new_commission: commission,
    new_experience: experience,
  })
  if (error) {
    console.error('Error updating agent details:', error)
    return false
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
  return true
}

// Comisión y experiencia del usuario que tiene la sesión iniciada (para el dashboard del agente).
export async function getMyAgentDetails(): Promise<{ commission: number; experience: string } | null> {
  const { data: authData } = await supabase.auth.getUser()
  const authUser = authData.user
  if (!authUser) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('commission, experience')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching agent details:', error)
    return null
  }

  return {
    commission: Number(data.commission ?? 0),
    experience: data.experience ?? '',
  }
}

export function subscribeToEcoTicketData(callback: () => void) {
  window.addEventListener(DATA_CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  window.addEventListener('auth-change', callback)
  return () => {
    window.removeEventListener(DATA_CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
    window.removeEventListener('auth-change', callback)
  }
}