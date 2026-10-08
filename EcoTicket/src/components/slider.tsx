// 1. Definimos el tipo de dato para cada imagen
export interface SlideItem {
  id: string | number;
  url: string;
  alt?: string;
}

// 2. Definimos las Props que recibirá el componente
interface SliderProps {
  imagenes: SlideItem[];
}

export default function Slider({ imagenes }: SliderProps) {
  return (
    <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="true">
      {/* Botones/Indicadores dinámicos */}
      <div className="carousel-indicators">
        {imagenes.map((_, index) => (
          <button
            key={index}
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to={index}
            className={index === 0 ? 'active' : ''}
            aria-current={index === 0 ? 'true' : undefined}
            aria-label={`Slide ${index + 1}`}
          ></button>
        ))}
      </div>

      {/* Imágenes dinámicas */}
      <div className="carousel-inner">
        {imagenes.map((item, index) => (
          <div
            key={item.id}
            className={`carousel-item ${index === 0 ? 'active' : ''}`}
          >
            <img 
              src={item.url} 
              className="d-block w-100 slider-image" 
              alt={item.alt || `Slide ${index + 1}`} 
            />
          </div>
        ))}
      </div>

      {/* Controles de navegación */}
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleIndicators"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleIndicators"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
}