import { useMemo, useState } from 'react'
import Buscador, { type SearchFilters } from '../components/buscador'
import EventCards from '../components/EventCards'
import GridDestacados from '../components/GridDestacados'
import useEcoTicketData from '../hooks/useEcoTicketData'
import Slider, { type SlideItem } from '../components/slider'
import BannerDigital from '../components/Banners'
import { todayISO } from '../utils/date'

import slide1 from '/slide1.webp'
import slide2 from '../assets/Slider2.webp'
import slide3 from '../assets/slider3.webp'

const slides: SlideItem[] = [
  { id: 1, url: slide1, alt: 'Festival de música' },
  { id: 2, url: slide2, alt: 'Jornada de limpieza' },
  { id: 3, url: slide3, alt: 'Taller de bricolaje' },
]

function Home() {
  const { events, isLoading } = useEcoTicketData()
  const [filters, setFilters] = useState<SearchFilters>({ city: '', category: '', date: '', query: '' })

  function handleSearch({ city, category, date, query }: SearchFilters) {
    setFilters({ city, category, date, query })
  }

  const filteredEvents = useMemo(() => {
    const normalize = (value: string) =>
      value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    return events.filter((event) => {
      const matchesCity = !filters.city || normalize(event.city) === normalize(filters.city)
      const matchesCategory = !filters.category || event.category === filters.category
      const matchesDate = !filters.date || event.date === filters.date
      const searchableText = normalize(`${event.title} ${event.organizer} ${event.city}`)
      const matchesQuery = !filters.query || searchableText.includes(normalize(filters.query))

      return matchesCity && matchesCategory && matchesDate && matchesQuery
    })
  }, [events, filters])

  // Próximos eventos según la fecha de Colombia (incluye los de hoy)
  const featuredEvents = useMemo(() => {
    const today = todayISO()
    return [...events]
      .filter((event) => event.date && event.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 7)
  }, [events])

  return (
    <>
      <main className="container-fluid px-0 pt-0 pb-5" id="main-content">
        <h1 className="visually-hidden">Encuentra eventos ecológicos en EcoTíquet</h1>

        <Slider imagenes={slides} />

        <section className="container-fluid d-flex justify-content-center align-items-center py-3 bg-success buscador">
          <Buscador onSearch={handleSearch} />
        </section>

        <EventCards
          filteredEvents={filteredEvents}
          resetKey={JSON.stringify(filters)}
          isLoading={isLoading}
        />

        <BannerDigital />

        <GridDestacados events={featuredEvents} />
      </main>
    </>
  )
}

export default Home