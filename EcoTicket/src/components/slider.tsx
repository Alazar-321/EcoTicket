import { useId } from 'react'

export interface SlideItem {
  id: string | number
  url: string
  alt?: string
}

interface SliderProps {
  imagenes: SlideItem[]
  intervalo?: number
}

// Dimensiones reales de las imágenes: el navegador reserva el espacio y evita saltos de diseño (CLS)
const SLIDE_WIDTH = 1920
const SLIDE_HEIGHT = 550

export default function Slider({ imagenes, intervalo = 2500 }: SliderProps) {
  const carouselId = `carousel-${useId().replace(/:/g, '')}`

  if (imagenes.length === 0) return null

  return (
    <div
      id={carouselId}
      className="carousel slide"
      data-bs-ride="carousel"
      data-bs-interval={intervalo}
    >
      <div className="carousel-indicators">
        {imagenes.map((item, index) => (
          <button
            key={item.id}
            type="button"
            data-bs-target={`#${carouselId}`}
            data-bs-slide-to={index}
            className={index === 0 ? 'active' : ''}
            aria-current={index === 0 ? 'true' : undefined}
            aria-label={`Ir a la diapositiva ${index + 1}`}
          />
        ))}
      </div>

      <div className="carousel-inner">
        {imagenes.map((item, index) => (
          <div key={item.id} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
            <img
              src={item.url}
              className="d-block w-100 slider-image"
              alt={item.alt ?? `Diapositiva ${index + 1}`}
              width={SLIDE_WIDTH}
              height={SLIDE_HEIGHT}
              // Solo la primera se descarga al inicio y con prioridad alta; el resto, bajo demanda
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          </div>
        ))}
      </div>

      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target={`#${carouselId}`}
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Anterior</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target={`#${carouselId}`}
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Siguiente</span>
      </button>
    </div>
  )
}