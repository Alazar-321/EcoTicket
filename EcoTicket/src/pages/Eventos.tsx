import { useMemo, useState } from 'react'
import EventCards from '../components/EventCards'
import Filter, { type FilterSelection } from '../components/Filter'
import useEcoTicketData from '../hooks/useEcoTicketData'
import { daysFromToday, thisMonthKey, nextMonthKey } from '../utils/date'

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

// Sincronizado con las opciones de Filter.tsx y los valores reales de la base de datos
const categoryAliases: Record<string, string[]> = {
  Conciertos: ['conciertos', 'conciertos ecologicos', 'music', 'concerts'],
  Running: ['running', 'sports', 'deportes'],
  Bricolaje: ['bricolaje', 'diy', 'crafting'], // Añadido 'crafting' desde la BD
  Festivales: ['festivales', 'music'],
  'Medio ambiente': ['medio ambiente', 'medioambiente', 'ecologia', 'eco', 'environment'], // Añadido 'environment' desde la BD[cite: 1]
  Teatro: ['teatro', 'theater', 'simposios'],
}

const Eventos = () => {
  const { events, isLoading } = useEcoTicketData()
  const [filters, setFilters] = useState<FilterSelection>(defaultSelection)

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. FILTRO DE PRECIO
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

      // 2. FILTRO DE FECHAS
      const matchesDate =
        filters.date.length === 0 ||
        filters.date.some((option) => {
          const diffDays = daysFromToday(event.date)

          if (option === 'Hoy') return diffDays === 0
          if (option === 'Mañana') return diffDays === 1
          if (option === 'Esta Semana') return diffDays >= 0 && diffDays <= 6
          if (option === 'La próxima Semana') return diffDays >= 7 && diffDays <= 13
          if (option === 'Este Mes') return event.date?.startsWith(thisMonthKey())
          if (option === 'El próximo mes') return event.date?.startsWith(nextMonthKey())

          return false
        })

      // 3. FILTRO DE CATEGORÍAS
      const matchesCategory =
        filters.category.length === 0 ||
        filters.category.some((selectedCategory) => {
          const aliases = categoryAliases[selectedCategory] ?? [selectedCategory]
          return aliases.some((alias) => normalizeText(event.category ?? '') === normalizeText(alias))
        })

      return matchesPrice && matchesDate && matchesCategory
    })
  }, [events, filters])

  return (
    <main className="container-fluid px-3 px-lg-4 py-4">
      <div className="row g-4 align-items-start">
        <div className="col-12 col-lg-2">
          <Filter value={filters} onChange={setFilters} />
        </div>

        <div className="col-12 col-lg-10">
          <EventCards
            filteredEvents={filteredEvents}
            resetKey={JSON.stringify(filters)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </main>
  )
}

export default Eventos

