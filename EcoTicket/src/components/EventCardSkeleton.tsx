export default function EventCardSkeleton() {
  return (
    <article
      className="card h-100 overflow-hidden rounded-3 border-0 shadow-sm"
      aria-hidden="true"
    >
      {/* Imagen */}
      <div className="placeholder-glow">
        <div className="placeholder w-100 d-block rounded-0" style={{ aspectRatio: '4 / 3' }} />
      </div>

      <div className="card-body d-flex flex-column gap-2 p-3 placeholder-glow">
        {/* Título */}
        <span className="placeholder col-9 mb-1" />

        {/* Organizador */}
        <span className="placeholder col-6" />

        {/* Descripción */}
        <span className="placeholder col-12" />
        <span className="placeholder col-10" />

        {/* Ciudad */}
        <span className="placeholder col-4 mt-1" />

        {/* Precio */}
        <div className="d-flex justify-content-between pt-2 border-top mt-2">
          <span className="placeholder col-3" />
          <span className="placeholder col-4" />
        </div>

        {/* Botón */}
        <span className="placeholder col-12 btn disabled mt-2" />
      </div>
    </article>
  )
}