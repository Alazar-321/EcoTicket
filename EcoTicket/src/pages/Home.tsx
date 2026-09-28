import { useState } from 'react'
import Buscador, { type SearchFilters } from '../components/Buscador'
import EventCards, { events } from '../components/EventCards'
import type { Event } from '../types/event'

function Home() {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events)

  function handleSearch({ city, category, date, query }: SearchFilters) {
    const normalize = (value: string) =>
      value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    setFilteredEvents(events.filter((event) => {
      const matchesCity = !city || normalize(event.city) === normalize(city)
      const matchesCategory = !category || event.category === category
      const matchesDate = !date || event.date === date
      const searchableText = normalize(`${event.title} ${event.organizer} ${event.city}`)
      const matchesQuery = !query || searchableText.includes(normalize(query))

      return matchesCity && matchesCategory && matchesDate && matchesQuery
    }))
  }

  return (
    <>
      <main className="container-fluid px-0 pt-0 pb-5" id="eventos">
        <section className="container-fluid d-flex justify-content-center align-items-center py-5 bg-success buscador ">
          <Buscador onSearch={handleSearch} />
        </section>
        <EventCards filteredEvents={filteredEvents} />
      </main>
    </>
  )
}

export default Home
