import { useMemo, useState } from 'react'
import EventCards, { events } from '../components/EventCards'
import Filter, { type FilterSelection } from '../components/Filter'

const defaultSelection: FilterSelection = {
  price: [],
  date: [],
  category: [],
}

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const toLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const categoryAliases: Record<string, string[]> = {
  'Conciertos Ecológicos': ['conciertos ecologicos', 'music', 'concerts'],
  Running: ['running', 'sports'],
  Bricolaje: ['bricolaje', 'diy'],
  Festivales: ['festivales', 'music'],
  'Simpósios': ['simposios', 'theater'],
}

const Eventos = () => {
  const [filters, setFilters] = useState<FilterSelection>(defaultSelection)

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesPrice =
        filters.price.length === 0 ||
        filters.price.some((option) => {
          const numericPrice = Number(event.price ?? 0)

          if (option === 'Gratis') {
            return numericPrice === 0 || normalizeText(String(event.price ?? '')).includes('gratis')
          }

          if (option === 'Pago') {
            return numericPrice > 0
          }

          return false
        })

      const matchesDate =
        filters.date.length === 0 ||
        filters.date.some((option) => {
          const eventDate = toLocalDate(event.date)
          const today = new Date()
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const diffDays = Math.round((eventDate.getTime() - todayStart.getTime()) / 86400000)
          const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
          const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)

          if (option === 'Hoy') return diffDays === 0
          if (option === 'Mañana') return diffDays === 1
          if (option === 'Esta Semana') return diffDays >= 0 && diffDays <= 6
          if (option === 'La próxima Semana') return diffDays >= 7 && diffDays <= 13
          if (option === 'Este Mes') {
            return (
              eventDate >= currentMonthStart &&
              eventDate <= currentMonthEnd &&
              eventDate.getMonth() === today.getMonth() &&
              eventDate.getFullYear() === today.getFullYear()
            )
          }
          if (option === 'El próximo mes') {
            return (
              eventDate >= nextMonthStart &&
              eventDate <= nextMonthEnd &&
              eventDate.getMonth() === nextMonthStart.getMonth() &&
              eventDate.getFullYear() === nextMonthStart.getFullYear()
            )
          }

          return false
        })

      const matchesCategory =
        filters.category.length === 0 ||
        filters.category.some((selectedCategory) => {
          const aliases = categoryAliases[selectedCategory] ?? [selectedCategory]
          return aliases.some((alias) => normalizeText(event.category) === normalizeText(alias))
        })

      return matchesPrice && matchesDate && matchesCategory
    })
  }, [filters])

  return (
    <main className="container-fluid px-3 px-lg-4 py-4">
      <div className="row g-4 align-items-start">
        <div className="col-12 col-lg-3">
          <Filter value={filters} onChange={setFilters} />
        </div>

        <div className="col-12 col-lg-9">
          <EventCards filteredEvents={filteredEvents} />
        </div>
      </div>
    </main>
  )
}

export default Eventos