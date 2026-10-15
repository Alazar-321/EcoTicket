import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventById, updateEvent } from '../services/ecoTicketService'
import type { Event } from '../types/event'

export default function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    async function loadEvent() {
      if (!id) return
      const data = await getEventById(Number(id))
      setEvent(data)
      setIsLoading(false)
    }
    loadEvent()
  }, [id])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNotice(null)
    const formData = new FormData(e.currentTarget)

    const updates = {
      title: String(formData.get('title')),
      city: String(formData.get('city')),
      category: String(formData.get('category')),
      description: String(formData.get('description')),
      date: String(formData.get('date')),
      start_time: String(formData.get('start_time')),
      end_time: String(formData.get('end_time')),
      capacity: Number(formData.get('capacity')),
      location: String(formData.get('location')),
      image: String(formData.get('image')),
      price: Number(formData.get('price')),
    }

    if (!id) return

    const success = await updateEvent(Number(id), updates)
    if (success) {
      navigate('/agente')
    } else {
      setNotice({ type: 'danger', text: 'Hubo un error al actualizar el evento.' })
    }
  }

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-body-secondary">Cargando datos del evento...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-5 text-center ">
        <h2 className="h4 text-danger">Evento no encontrado</h2>
        <p className="text-body-secondary mb-4">El evento que intentas editar no existe o ha sido eliminado.</p>
        <button className="btn btn-primary" onClick={() => navigate('/agente')}>
          Volver al panel
        </button>
      </div>
    )
  }

  return (
    <main className="container py-5 admin-agente">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex align-items-center gap-3 mb-4">
            <button
              className="btn btn-outline-light"
              onClick={() => navigate('/agente')}
              aria-label="Volver"
            >
              <i className="bi bi-arrow-left"></i> Volver
            </button>
            <h2 className="h4 text-light fw-bold mb-0">Editar Evento</h2>
          </div>

          {notice && (
            <div className={`alert alert-${notice.type} py-2`} role="status">
              {notice.text}
            </div>
          )}

          <div className="card shadow-sm border-0 edit_event">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">Nombre del evento</label>
                  <input
                    name="title"
                    className="form-control"
                    defaultValue={event.title}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Ciudad</label>
                  <input
                    name="city"
                    className="form-control"
                    defaultValue={event.city}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Categoría</label>
                  <select
                    name="category"
                    className="form-select"
                    required
                    defaultValue={event.category}
                  >
                    <option value="music">Música</option>
                    <option value="festival">Festival</option>
                    <option value="theater">Teatro</option>
                    <option value="concerts">Conciertos</option>
                    <option value="crafting">Bricolaje</option>
                    <option value="sports">Deportes</option>
                    <option value="environment">Medio ambiente</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Fecha</label>
                  <input
                    name="date"
                    type="date"
                    className="form-control"
                    defaultValue={event.date}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Hora de Inicio</label>
                  <input
                    name="start_time"
                    type="time"
                    className="form-control"
                    defaultValue={event.start_time}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Hora de Fin</label>
                  <input
                    name="end_time"
                    type="time"
                    className="form-control"
                    defaultValue={event.end_time}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Precio (COP)</label>
                  <input
                    name="price"
                    type="number"
                    className="form-control"
                    min="0"
                    step="1000"
                    defaultValue={event.price ?? '0'}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Capacidad (Boletos)</label>
                  <input
                    name="capacity"
                    type="number"
                    className="form-control"
                    min="1"
                    defaultValue={event.capacity || ''}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Lugar / Dirección</label>
                  <input
                    name="location"
                    className="form-control"
                    placeholder="Ej. Estadio Metropolitano"
                    defaultValue={event.location}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">URL de imagen</label>
                  <input
                    name="image"
                    type="url"
                    className="form-control"
                    placeholder="https://..."
                    defaultValue={event.image}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Descripción</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows={3}
                    required
                    defaultValue={event.description}
                  />
                </div>

                <div className="col-12 d-flex gap-2 mt-4">
                  <button type="submit" className="btn btn-success px-4">
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/agente')}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
