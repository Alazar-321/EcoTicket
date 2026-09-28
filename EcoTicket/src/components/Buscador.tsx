import { CalendarDays, Grid3X3, MapPin, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'

export type SearchFilters = {
  city: string
  category: string
  date: string
  query: string
}

type BuscadorProps = {
  onSearch: (filters: SearchFilters) => void
}

type City = {
  id: number
  name: string
}

export default function Buscador({ onSearch }: BuscadorProps) {
  const dateRef = useRef<HTMLInputElement | null>(null)

  const [cities, setCities] = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(true)

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch(
          'https://api-colombia.com/api/v1/City'
        )

        if (!response.ok) {
          throw new Error('No se pudieron cargar las ciudades')
        }

        const data: City[] = await response.json()

        setCities(data)
      } catch (error) {
        console.error('Error al cargar las ciudades:', error)
      } finally {
        setLoadingCities(false)
      }
    }

    fetchCities()
  }, [])

  function openCalendar() {
    dateRef.current?.showPicker()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    onSearch({
      city: String(formData.get('city') ?? ''),
      category: String(formData.get('category') ?? ''),
      date: String(formData.get('date') ?? ''),
      query: String(formData.get('query') ?? '').trim().toLowerCase(),
    })
  }

  return (
    <section
      className="container-fluid px-2 px-md-5 py-4"
      aria-label="Buscar eventos"
    >
      <form
        className="row g-0 overflow-hidden rounded-2 border border-success-subtle bg-white shadow-sm"
        onSubmit={handleSubmit}
      >
        {/* CIUDAD */}
        <div className="col-12 col-md-6 col-xl-2 border-end border-bottom border-success-subtle">
          <div className="input-group h-100">
            <span className="input-group-text border-0 bg-white text-success">
              <MapPin size={21} aria-hidden="true" />
            </span>

            <select
              id="event-city"
              name="city"
              className="form-select border-0 bg-white ps-1 py-3"
              defaultValue=""
              aria-label="Ciudad"
              disabled={loadingCities}
            >
              <option value="" disabled>
                {loadingCities ? 'Cargando...' : 'Ciudad'}
              </option>

              {cities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CATEGORÍA */}
        <div className="col-12 col-md-6 col-xl-2 border-end border-bottom border-success-subtle">
          <div className="input-group h-100">
            <span className="input-group-text border-0 bg-white text-success">
              <Grid3X3 size={21} aria-hidden="true" />
            </span>

            <select
              id="event-category"
              name="category"
              className="form-select border-0 bg-white ps-1 py-3"
              defaultValue=""
              aria-label="Categoría"
            >
              <option value="" disabled>
                Categoría
              </option>
              <option value="music">Música</option>
              <option value="theater">Teatro</option>
              <option value="sports">Deportes</option>
              <option value="concerts">Conciertos</option>
              <option value="diy">Bricolaje</option>
            </select>
          </div>
        </div>

        {/* FECHA */}
        <div className="col-12 col-md-6 col-xl-2 border-end border-bottom border-success-subtle">
          <div className="input-group h-100">
            <button
              type="button"
              className="input-group-text border-0 bg-white text-success"
              onClick={openCalendar}
              aria-label="Abrir calendario"
            >
              <CalendarDays size={21} aria-hidden="true" />
            </button>

            <input
              ref={dateRef}
              id="event-date"
              name="date"
              type="date"
              className="form-control border-0 bg-white ps-1 py-3"
              aria-label="Fecha"
            />
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="col-12 col-md-6 col-xl-4 border-bottom border-success-subtle">
          <div className="input-group h-100">
            <span className="input-group-text border-0 bg-white text-success">
              <Search size={22} aria-hidden="true" />
            </span>

            <input
              id="event-search"
              name="query"
              type="search"
              className="form-control border-0 bg-white ps-1 py-3 fw-semibold"
              placeholder="Buscar por artista, evento..."
              aria-label="Buscar por artista o evento"
            />
          </div>
        </div>

        {/* BOTÓN */}
        <div className="col-12 col-xl-2">
          <button
            type="submit"
            className="btn btn-primary rounded-0 w-100 h-100 d-flex align-items-center justify-content-center gap-2 py-3"
          >
            <Search size={22} aria-hidden="true" />

            <span className="d-inline d-xl-none">
              Buscar eventos
            </span>
          </button>
        </div>
      </form>
    </section>
  )
}