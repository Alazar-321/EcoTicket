// Categorías de boletería (zonas) y plano de asientos de un evento.
// Todo lo de aquí son funciones puras: se usan tanto en el plano como en el servicio.

export type EventZone = {
  id?: number
  eventId?: number
  name: string
  price: number
  rows: number
  seatsPerRow: number
  color: string
  sortOrder?: number
}

// Un asiento elegido por el cliente
export type SeatSelection = {
  zoneId: number
  zoneName: string
  label: string
  price: number
}

// Asiento ocupado: clave "idCategoría:etiqueta"
export type TakenSeats = Set<string>

export const MAX_ZONES = 6
export const MAX_ROWS = 30
export const MAX_SEATS_PER_ROW = 60
export const MAX_TOTAL_SEATS = 2000
export const MAX_SEATS_PER_BOOKING = 8

// Colores por defecto; cada uno se distingue bien de los otros y de los asientos ocupados (gris)
export const ZONE_COLORS = ['#7b2d8e', '#0aa2e8', '#f2b705', '#2e9e44', '#e8590c', '#d6336c']

export function seatKey(zoneId: number, label: string): string {
  return `${zoneId}:${label}`
}

// 0 -> A, 1 -> B ... 25 -> Z, 26 -> AA
export function rowLetter(index: number): string {
  let n = index
  let letters = ''
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return letters
}

export function seatLabel(rowIndex: number, seatNumber: number): string {
  return `${rowLetter(rowIndex)}${seatNumber}`
}

export function zoneSeatCount(zone: Pick<EventZone, 'rows' | 'seatsPerRow'>): number {
  return zone.rows * zone.seatsPerRow
}

export function totalSeats(zones: Pick<EventZone, 'rows' | 'seatsPerRow'>[]): number {
  return zones.reduce((sum, zone) => sum + zoneSeatCount(zone), 0)
}

// Todas las etiquetas válidas de una categoría (para comprobar que no se quitan asientos ya reservados)
export function zoneSeatLabels(zone: Pick<EventZone, 'rows' | 'seatsPerRow'>): Set<string> {
  const labels = new Set<string>()
  for (let r = 0; r < zone.rows; r += 1) {
    for (let s = 1; s <= zone.seatsPerRow; s += 1) labels.add(seatLabel(r, s))
  }
  return labels
}

// Devuelve un mensaje de error si la configuración no es válida
export function validateZones(zones: EventZone[]): string | null {
  if (zones.length > MAX_ZONES) return `Máximo ${MAX_ZONES} categorías por evento.`

  const names = new Set<string>()
  for (const zone of zones) {
    const name = zone.name.trim()
    if (!name) return 'Cada categoría necesita un nombre.'
    if (names.has(name.toLowerCase())) return `La categoría «${name}» está repetida.`
    names.add(name.toLowerCase())

    if (!Number.isFinite(zone.price) || zone.price < 0) return `El precio de «${name}» no es válido.`
    if (!Number.isInteger(zone.rows) || zone.rows < 1 || zone.rows > MAX_ROWS) {
      return `«${name}»: las filas deben estar entre 1 y ${MAX_ROWS}.`
    }
    if (!Number.isInteger(zone.seatsPerRow) || zone.seatsPerRow < 1 || zone.seatsPerRow > MAX_SEATS_PER_ROW) {
      return `«${name}»: los asientos por fila deben estar entre 1 y ${MAX_SEATS_PER_ROW}.`
    }
  }

  if (totalSeats(zones) > MAX_TOTAL_SEATS) {
    return `El evento no puede tener más de ${MAX_TOTAL_SEATS} asientos en total.`
  }
  return null
}

// ───────────────────────── Plano ─────────────────────────

export type SeatPoint = {
  zoneIndex: number
  row: number
  seat: number
  label: string
  x: number
  y: number
}

export type SeatLayout = {
  viewBox: string
  width: number
  height: number
  stage: { x: number; y: number; width: number; height: number }
  seats: SeatPoint[]
  seatRadius: number
}

const SEAT_GAP = 15 // separación mínima entre asientos de una misma fila
const ROW_GAP = 16 // separación entre filas
const ZONE_GAP = 14 // pasillo extra entre categorías
const FIRST_RADIUS = 70 // distancia del escenario a la primera fila
const FULL_SPAN = (200 * Math.PI) / 180 // las filas se abren como máximo 100° a cada lado del eje vertical
const MIN_SPAN = (60 * Math.PI) / 180

// Las categorías se dibujan como anillos concéntricos alrededor del escenario:
// la primera (la que tú pongas primero) queda más cerca del escenario.
// Todas las filas de una categoría cubren el mismo ángulo, así forman arcos paralelos;
// una categoría nunca es más angosta que la anterior, como en un recinto real.
export function computeLayout(zones: Pick<EventZone, 'rows' | 'seatsPerRow'>[]): SeatLayout {
  const seats: SeatPoint[] = []
  let radius = FIRST_RADIUS - ROW_GAP
  let span = MIN_SPAN

  zones.forEach((zone, zoneIndex) => {
    if (zoneIndex > 0) radius += ZONE_GAP
    const n = zone.seatsPerRow

    // Ángulo que ocupa esta categoría: el justo para que los asientos queden a SEAT_GAP en su primera fila
    const firstRadius = radius + ROW_GAP
    const wanted = n > 1 ? ((n - 1) * SEAT_GAP) / firstRadius : 0
    span = Math.min(FULL_SPAN, Math.max(span, wanted))
    // Si ni con el ángulo máximo caben, la primera fila se aleja del escenario
    const neededRadius = n > 1 ? ((n - 1) * SEAT_GAP) / span : 0
    radius = Math.max(firstRadius, neededRadius) - ROW_GAP

    for (let row = 0; row < zone.rows; row += 1) {
      radius += ROW_GAP

      for (let seat = 1; seat <= n; seat += 1) {
        const t = n === 1 ? 0 : -span / 2 + ((seat - 1) * span) / (n - 1)
        seats.push({
          zoneIndex,
          row,
          seat,
          label: seatLabel(row, seat),
          x: Math.round(radius * Math.sin(t) * 10) / 10,
          y: Math.round(radius * Math.cos(t) * 10) / 10,
        })
      }
    }
  })

  const maxRadius = Math.max(radius, FIRST_RADIUS)
  const margin = 24
  // El escenario está en el centro de los arcos
  const stage = { x: -62, y: -24, width: 124, height: 48 }

  const left = -maxRadius - margin
  const right = maxRadius + margin
  const top = -Math.max(Math.abs(stage.y), maxRadius * 0.18) - margin
  const bottom = maxRadius + margin

  const width = right - left
  const height = bottom - top

  return {
    viewBox: `${left} ${top} ${width} ${height}`,
    width,
    height,
    stage,
    seats,
    seatRadius: 5.4,
  }
}