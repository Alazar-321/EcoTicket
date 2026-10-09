import React from 'react';

// Interfaces para tipar la estructura de datos
interface NavLink {
  label: string;
  href: string;
}

interface SocialLink {
  platform: string;
  handle: string;
  href: string;
}

interface ContactInfo {
  phone: string;
  email: string;
  instagram: SocialLink;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Eventos', href: '/eventos' },
  { label: 'Mis reservas', href: '/mis_tickets' },
];

const CONTACT_DATA: ContactInfo = {
  phone: '123-456-7890',
  email: 'contacto@ecotiquet.com',
  instagram: {
    platform: 'Instagram',
    handle: '@ecotiquet',
    href: 'https://instagram.com/ecotiquet',
  },
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg_footer text-success py-5 mt-1">
      <div className="container-fluid px-5">
        <div className="row row-cols-1 row-cols-md-3 g-4 align-items-start">
          
          {/* Columna 1: Marca e información */}
          <div className="col d-flex flex-column align-items-center text-center">
            <img
              src="logo.png"
              alt="EcoTíquet Logo"
              height={72}
              className="mb-3 object-fit-contain object-position-center"
            />
            <p className="mb-1">
              Encuentra y gestiona tus tickets de eventos.
            </p>
          </div>

          {/* Columna 2: Navegación */}
          <div className="col d-flex flex-column">
            <h2 className="h5 mb-3 fw-bold">Enlaces</h2>
            <nav className="d-flex flex-column gap-2" aria-label="Enlaces del pie de página">
              {NAV_LINKS.map((link) => (
                <a 
                  key={link.href} 
                  className="text-success text-decoration-none" 
                  href={link.href}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Columna 3: Soporte y Contacto */}
          <div className="col d-flex flex-column gap-2">
            <a
              className="text-success text-decoration-none fs-4 fw-bold mb-1"
              href="/soporte"
            >
              Soporte
            </a>

            {/* Teléfono */}
            <div className="d-flex align-items-center gap-2">
              <img
                src="/src/assets/call.png"
                alt=""
                aria-hidden="true"
                style={{ width: "32px", height: "auto" }}
              />
              <span>Llámanos al {CONTACT_DATA.phone}</span>
            </div>

            {/* Correo electrónico */}
            <div className="d-flex align-items-center gap-2">
              <span className="fs-5" aria-hidden="true">✉</span>
              <a 
                href={`mailto:${CONTACT_DATA.email}`}
                className="text-success text-decoration-none"
              >
                {CONTACT_DATA.email}
              </a>
            </div>

            {/* Instagram */}
            <div className="d-flex align-items-center gap-2">
              <span className="fs-5 fw-bold" aria-hidden="true">📷</span>
              <a 
                href={CONTACT_DATA.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-success text-decoration-none"
              >
                {CONTACT_DATA.instagram.handle}
              </a>
            </div>
          </div>

        </div>

        <hr className="my-4" />

        {/* Pie de página inferior */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 small">
          <p className="mb-0">© 2026 Eco Ticket. Todos los derechos reservados.</p>
          <div className="d-flex gap-3">
            <a href="/soporte" className="text-success text-decoration-none">
              Política de Privacidad
            </a>
            <a href="/soporte" className="text-success text-decoration-none">
              Términos de Servicio
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;