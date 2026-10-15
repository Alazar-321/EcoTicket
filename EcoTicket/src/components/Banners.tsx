export default function BannerDigital() {
  return (
    <section className="banner-digital container py-4 shadow" aria-label="Entradas digitales">
      <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-3 gap-md-4 text-center text-md-start">
        <svg
          className="banner-digital-icon flex-shrink-0"
          viewBox="0 0 100 160"
          role="img"
          aria-label="Celular mostrando un código QR"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Cuerpo del celular */}
          <rect x="8" y="4" width="84" height="152" rx="16" strokeWidth="5" />
          {/* Botón inferior */}
          <circle cx="50" cy="138" r="5" strokeWidth="3" />
          {/* Esquinas del visor QR */}
          <path
            d="M28 54 V44 H38 M62 44 H72 V54 M72 90 V100 H62 M38 100 H28 V90"
            strokeWidth="4"
          />
          {/* Módulos del código QR */}
          <rect x="36" y="52" width="10" height="10" strokeWidth="3" />
          <rect x="54" y="52" width="10" height="10" strokeWidth="3" />
          <rect x="36" y="82" width="10" height="10" strokeWidth="3" />
          <path d="M54 74 H64 M54 82 V92 M64 82 V92 M54 92 H64" strokeWidth="3" />
        </svg>

        <div>
          <h2 className="banner-digital-title mb-1">100% Digital &amp; Zero Paper</h2>
          <p className="banner-digital-subtitle mb-3">
            Tu entrada siempre en tu móvil con código QR
          </p>
        </div>
      </div>
    </section>
  )
}