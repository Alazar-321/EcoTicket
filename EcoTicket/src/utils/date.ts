export const APP_TIME_ZONE = 'America/Bogota'

/** Fecha de hoy en Colombia, formato "YYYY-MM-DD" (en-CA da ese formato) */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Convierte "YYYY-MM-DD" en un Date a medianoche UTC (para formatear sin desfases) */
export function dateOnlyToDate(value?: string): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Formatea una fecha "YYYY-MM-DD" sin que la zona horaria la mueva de día */
export function formatDateOnly(value: string | undefined, options: Intl.DateTimeFormatOptions): string {
  const date = dateOnlyToDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('es-CO', { ...options, timeZone: 'UTC' }).format(date)
}

/** Días entre hoy (Colombia) y una fecha "YYYY-MM-DD". 0 = hoy, 1 = mañana, -1 = ayer */
export function daysFromToday(value: string): number {
  const [y, m, d] = value.split('-').map(Number)
  const [ty, tm, td] = todayISO().split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000)
}

/** Mes actual y siguiente de Colombia, formato "YYYY-MM" */
export function thisMonthKey(): string {
  return todayISO().slice(0, 7)
}

export function nextMonthKey(): string {
  const [y, m] = todayISO().split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}