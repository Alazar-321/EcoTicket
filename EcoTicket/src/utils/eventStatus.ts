// Estados de un evento. Todo evento siempre tiene uno (por defecto: PROGRAMADO).
export type EventStatus = 'PROGRAMADO' | 'EN_BOLETERIA' | 'EN_VIVO' | 'FINALIZADO' | 'CANCELADO'

export const EVENT_STATUSES: EventStatus[] = [
  'PROGRAMADO',
  'EN_BOLETERIA',
  'EN_VIVO',
  'FINALIZADO',
  'CANCELADO',
]

export const EVENT_STATUS_BADGE: Record<EventStatus, { label: string; className: string }> = {
  PROGRAMADO: { label: 'Programado', className: 'text-bg-secondary' },
  EN_BOLETERIA: { label: 'En boletería', className: 'text-bg-primary' },
  EN_VIVO: { label: 'En vivo', className: 'text-bg-success' },
  FINALIZADO: { label: 'Finalizado', className: 'text-bg-dark' },
  CANCELADO: { label: 'Cancelado', className: 'text-bg-danger' },
}

// Solo se puede reservar mientras el evento no haya terminado ni esté cancelado
export function acceptsReservations(status?: string | null): boolean {
  return status !== 'FINALIZADO' && status !== 'CANCELADO'
}

// Código único legible, ej. EVT-000012
export function eventCode(id?: number): string {
  return id == null ? '' : `EVT-${String(id).padStart(6, '0')}`
}