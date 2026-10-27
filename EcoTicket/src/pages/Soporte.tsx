import React, { useState } from 'react';
import { Search, Sprout, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  articles: string[];
}

export default function SoporteAyuda(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const categories: Category[] = [
    {
      id: 'tickets',
      title: 'Tus Eco Tickets',
      description: 'Cambios, devoluciones, como descargar tus Eco Tickets',
      icon: <Sprout size={28} className="text-success" />,
      articles: [
        '¿Cómo descargar mis entradas en formato ecológico?',
        'Política de cancelación y devoluciones',
        'Transferir mi Eco Ticket a otra persona'
      ]
    },
    {
      id: 'eventos',
      title: 'Eventos',
      description: 'Información sobre normativas, Impacto Ambiental',
      icon: <ShieldCheck size={28} className="text-success" />,
      articles: [
        'Calculadora de huella de carbono por evento',
        'Normativa de residuos cero en recintos',
        'Puntos de reciclaje y transporte sostenible'
      ]
    },
    {
      id: 'perfil',
      title: 'Perfil y Cuenta',
      description: 'Actualiza tu información personal, contraseña y preferencias',
      icon: <UserCheck size={28} className="text-success" />,
      articles: [
        'Cambiar contraseña o datos de usuario',
        'Configurar notificaciones sostenibles',
        'Eliminar mi cuenta e historial'
      ]
    }
  ];

  const filteredCategories: Category[] = categories.filter((cat) =>
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.articles.some((article) =>
      article.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <main className="container py-5">
      {/* Clases personalizadas para el esquema de color de Eco Tíquet */}
      <style>{`
        .bg-eco-green { background-color: #126134 !important; }
        .text-eco-green { color: #124d27 !important; }
        .bg-eco-card { background-color: #f4ece8 !important; }
        .eco-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .eco-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>

      {/* Título Principal */}
      <h1 className="fw-bold text-eco-green mb-4 display-6">
        Soporte y Ayuda
      </h1>

      {/* Banner Verde de Búsqueda */}
      <div className="bg-eco-green text-white p-4 p-md-5 rounded-4 shadow mb-4">
        <h2 className="fw-bold mb-3 h3">
          ¿En qué podemos ayudarte hoy?
        </h2>

        <div className="bg-white rounded-pill p-1 p-md-2 d-flex align-items-center shadow-sm">
          <Search size={22} className="text-muted ms-3 me-2 flex-shrink-0" />
          <input
            type="text"
            className="form-control border-0 shadow-none px-2"
            placeholder="Busca políticas de reserva, guías de usuario..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
          <button
            type="button"
            className="btn bg-eco-green text-white rounded-pill px-4 py-2 fw-semibold me-1"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tarjetas de Categorías con Grid de Bootstrap */}
      <div className="row g-4">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="col-12 col-md-4">
            <div
              className="bg-eco-card rounded-4 p-4 h-100 d-flex flex-column justify-content-between eco-card-hover border-0 shadow-sm"
              onClick={() => setActiveCategory(cat)}
            >
              <div>
                {/* Icono + Título */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-white p-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center">
                    {cat.icon}
                  </div>
                  <h3 className="fw-bold text-eco-green h5 m-0">
                    {cat.title}
                  </h3>
                </div>

                {/* Descripción */}
                <p className="text-secondary small mb-4">
                  {cat.description}
                </p>
              </div>

              {/* Link Ver Artículos */}
              <div className="d-flex align-items-center gap-2 fw-bold text-eco-green small">
                <span>Ver Artículos</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal interactivo de Bootstrap */}
      {activeCategory && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow p-3">
              <div className="modal-header border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                  {activeCategory.icon}
                  <h5 className="modal-title fw-bold text-eco-green">
                    {activeCategory.title}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveCategory(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small">{activeCategory.description}</p>
                <h6 className="fw-bold text-dark mt-3 mb-2">Artículos recomendados:</h6>
                <ul className="list-group list-group-flush">
                  {activeCategory.articles.map((article, idx) => (
                    <li
                      key={idx}
                      className="list-group-item bg-transparent text-eco-green ps-0 border-0 py-1"
                    >
                      • {article}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}