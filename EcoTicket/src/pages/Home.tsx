import { useMemo, useState } from 'react'
import Buscador, { type SearchFilters } from '../components/Buscador'
import EventCards from '../components/EventCards'
import useEcoTicketData from '../hooks/useEcoTicketData'

function Home() {
  const { events } = useEcoTicketData()
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

  return (
    <>
      <main className="container-fluid px-0 pt-0 pb-5" id="main-content">
        <h1 className="visually-hidden">Encuentra eventos ecológicos en EcoTíquet</h1>
        <section className="container-fluid d-flex justify-content-center align-items-center py-5 bg-success buscador ">
          <Buscador onSearch={handleSearch} />
        </section>
        <EventCards filteredEvents={filteredEvents} />
      </main>
    </>
  )
}

export default Home