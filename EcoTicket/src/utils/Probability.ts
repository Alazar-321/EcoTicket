// Cálculo de probabilidades por evento a partir de sus reservas reales.
import type { Event } from '../types/event'
import type { Reservation, ReservationStatus } from '../services/ecoTicketService'
import { dateOnlyToDate } from './date'

export const STATUSES: ReservationStatus[] = ['SOLICITADA', 'CONFIRMADA', 'PAGADA', 'RECHAZADA']

// Fuerza del "conocimiento previo": equivale a 5 reservas ficticias repartidas como en el resto de eventos.
// Evita decir "100 % pagada" cuando un evento solo tiene 1 reserva.
const PRIOR_STRENGTH = 5

export type StatusProbabilities = {
  total: number
  counts: Record<ReservationStatus, number>
  probabilities: Record<ReservationStatus, number> // 0..1
}

function emptyCounts(): Record<ReservationStatus, number> {
  return { SOLICITADA: 0, CONFIRMADA: 0, PAGADA: 0, RECHAZADA: 0 }
}

export function countByStatus(reservations: Reservation[]) {
  const counts = emptyCounts()
  for (const r of reservations) if (r.status in counts) counts[r.status] += 1
  return counts
}

// Probabilidad de que una reserva del evento termine en cada estado.
// Mezcla lo observado en el evento con la distribución global (suavizado bayesiano).
export function statusProbabilities(
  eventReservations: Reservation[],
  allReservations: Reservation[]
): StatusProbabilities {
  const counts = countByStatus(eventReservations)
  const total = eventReservations.length
  const globalCounts = countByStatus(allReservations)
  const globalTotal = allReservations.length

  const probabilities = emptyCounts()
  for (const s of STATUSES) {
    const prior = globalTotal > 0 ? globalCounts[s] / globalTotal : 1 / STATUSES.length
    probabilities[s] = (counts[s] + PRIOR_STRENGTH * prior) / (total + PRIOR_STRENGTH)
  }
  return { total, counts, probabilities }
}

// P(X >= k) para X ~ Poisson(mean), calculado en escala logarítmica para no desbordar.
export function poissonAtLeast(k: number, mean: number): number {
  if (k <= 0) return 1
  if (mean <= 0) return 0
  let logFact = 0
  let cdf = 0 // P(X < k)
  const logMean = Math.log(mean)
  for (let i = 0; i < k; i += 1) {
    if (i > 0) logFact += Math.log(i)
    cdf += Math.exp(-mean + i * logMean - logFact)
    if (cdf >= 1) return 0
  }
  return Math.min(1, Math.max(0, 1 - cdf))
}

export type SelloutEstimate = {
  capacity: number | null
  committed: number // entradas ya comprometidas (esperadas)
  remaining: number | null
  daysLeft: number | null
  ratePerDay: number
  probability: number | null // 0..1, null si no se puede estimar
  reason?: string
}

const DAY_MS = 86_400_000

// Probabilidad de que el evento venda toda su capacidad antes de su fecha.
// Modelo: las reservas llegan con ritmo constante (proceso de Poisson) y las rechazadas no cuentan.
export function selloutEstimate(
  event: Event,
  eventReservations: Reservation[],
  statusProb: StatusProbabilities,
  now: Date = new Date()
): SelloutEstimate {
  const capacity = event.capacity && event.capacity > 0 ? event.capacity : null

  const counts = statusProb.counts
  // Las pendientes (solicitadas) aún pueden ser rechazadas: se cuentan según su probabilidad de no serlo
  const keep = 1 - statusProb.probabilities.RECHAZADA
  const committed = counts.PAGADA + counts.CONFIRMADA + counts.SOLICITADA * keep

  const date = dateOnlyToDate(event.date)
  const daysLeft = date ? Math.max(0, Math.ceil((date.getTime() - now.getTime()) / DAY_MS)) : null

  const valid = eventReservations.filter((r) => r.status !== 'RECHAZADA')
  let ratePerDay = 0
  if (valid.length > 0) {
    const times = valid.map((r) => new Date(r.createdAt).getTime()).filter((t) => !Number.isNaN(t))
    if (times.length > 0) {
      const first = Math.min(...times)
      const windowDays = Math.max(1, (now.getTime() - first) / DAY_MS)
      ratePerDay = (valid.length * keepFactor(counts, keep)) / windowDays
    }
  }

  const base = { capacity, committed, daysLeft, ratePerDay }
  if (capacity == null) return { ...base, remaining: null, probability: null, reason: 'El evento no tiene capacidad definida.' }

  const remaining = Math.max(0, capacity - Math.round(committed))
  if (remaining <= 0) return { ...base, remaining: 0, probability: 1 }
  if (event.status === 'CANCELADO') return { ...base, remaining, probability: 0, reason: 'Evento cancelado.' }
  if (event.status === 'FINALIZADO') return { ...base, remaining, probability: 0, reason: 'El evento ya finalizó sin agotarse.' }
  if (daysLeft == null) return { ...base, remaining, probability: null, reason: 'Fecha del evento no válida.' }
  if (daysLeft === 0 && date && date.getTime() < now.getTime() - DAY_MS) {
    return { ...base, remaining, probability: 0, reason: 'El evento ya pasó sin agotarse.' }
  }
  if (valid.length < 2) return { ...base, remaining, probability: null, reason: 'Hay muy pocas reservas para estimar el ritmo de venta.' }

  return { ...base, remaining, probability: poissonAtLeast(remaining, ratePerDay * daysLeft) }
}

// Las reservas "SOLICITADA" cuentan parcialmente en el ritmo, igual que en las entradas comprometidas
function keepFactor(counts: Record<ReservationStatus, number>, keep: number) {
  const valid = counts.PAGADA + counts.CONFIRMADA + counts.SOLICITADA
  if (valid === 0) return 0
  return (counts.PAGADA + counts.CONFIRMADA + counts.SOLICITADA * keep) / valid
}