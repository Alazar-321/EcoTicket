import type { Event } from '../types/event'
import EventTile from './EventTile'

export default function GridDestacados({ events }: { events: Event[] }) {
  const [featured, ...rest] = events.slice(0, 7) // 1 grande + 6 pequeños
  if (!featured) return null

  return (
    <section className="container-fluid px-3 px-md-5 py-4" aria-labelledby="featured-title">
      <h2 id="featured-title" className="mb-4 fs-3 fw-bold">Últimos Eventos</h2>

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <EventTile event={featured} featured />
        </div>

        <div className="col-12 col-lg-7">
          <div className="row g-3">
            {rest.map((event) => (
              <div className="col-6 col-md-4" key={event.id ?? `${event.date}-${event.title}`}>
                <EventTile event={event} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}