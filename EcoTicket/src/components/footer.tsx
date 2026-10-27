import { Link } from 'react-router-dom'
import callIcon from '../assets/call.png'

function Footer() {
  return (
    <footer className="bg_footer text-success-emphasis py-5 mt-1">
      <div className="container-fluid px-5">
        <div className="row row-cols-1 row-cols-md-3 g-4 align-items-start">

          {/* Columna 1: Logo, descripción y Redes Sociales */}
          <div className="col d-flex flex-column align-items-center text-center">
            <img
              src="/logo.webp"
              alt="EcoTíquet"
              width="198"
              height="72"
              loading="lazy"
              decoding="async"
              className="mb-3 object-fit-contain object-position-center"
            />
            <p className="mb-3">
              Encuentra y gestiona tus tickets de eventos.
            </p>

            {/* Redes Sociales */}
            <div className="d-flex gap-3 fs-4">
              <a
                href="https://instagram.com/tu_usuario"
                target="_blank"
                rel="noopener noreferrer"
                className="text-success-emphasis text-decoration-none"
                aria-label="Instagram"
              >
                <i className="bi bi-instagram" aria-hidden="true"></i>
              </a>
              <a
                href="https://facebook.com/tu_usuario"
                target="_blank"
                rel="noopener noreferrer"
                className="text-success-emphasis text-decoration-none"
                aria-label="Facebook"
              >
                <i className="bi bi-facebook" aria-hidden="true"></i>
              </a>
              <a
                href="https://tiktok.com/@tu_usuario"
                target="_blank"
                rel="noopener noreferrer"
                className="text-success-emphasis text-decoration-none"
                aria-label="TikTok"
              >
                <i className="bi bi-tiktok" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces */}
          <div className="col d-flex flex-column">
            <h2 className="h5 mb-1">Enlaces</h2>
            <nav className="d-flex flex-column gap-2" aria-label="Enlaces del pie de página">
              <Link className="text-success-emphasis text-decoration-none" to="/">
                Inicio
              </Link>
              <Link className="text-success-emphasis text-decoration-none" to="/eventos">
                Eventos
              </Link>
              <Link className="text-success-emphasis text-decoration-none" to="/mis_tickets">
                Reseñas
              </Link>
            </nav>
          </div>

          {/* Columna 3: Soporte y contacto */}
          <div className="col d-flex flex-column">
            <Link
              className="text-success-emphasis text-decoration-none fs-4 mb-3"
              to="/soporte"
            >
              Soporte
            </Link>

            {/* Fila alineada horizontalmente para la imagen y el texto */}
            <div className="d-flex align-items-center gap-2 mt-2">
              <img
                src={callIcon}
                alt=""
                aria-hidden="true"
                width="60"
                height="60"
                loading="lazy"
                decoding="async"
                style={{ width: '60px', height: 'auto' }}
              />
              <span>
                Llámanos al 123-456-7890
              </span>
            </div>
          </div>

        </div>
        <hr />
        <p className="text-center mb-0">© 2026 Eco Ticket</p>
      </div>
    </footer>
  )
}

export default Footer