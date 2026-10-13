
import { Link } from 'react-router-dom'

const sections = [
  { id: 'objeto', title: '1. Objeto y ámbito de aplicación' },
  { id: 'registro', title: '2. Registro y cuenta de usuario' },
  { id: 'reservas', title: '3. Eventos y reservas' },
  { id: 'pagos', title: '4. Precios y pagos' },
  { id: 'cancelaciones', title: '5. Cancelaciones y reembolsos' },
  { id: 'conducta', title: '6. Normas de conducta' },
  { id: 'responsabilidad', title: '7. Responsabilidad' },
  { id: 'propiedad', title: '8. Propiedad intelectual' },
  { id: 'datos', title: '9. Protección de datos' },
  { id: 'modificaciones', title: '10. Modificaciones de los términos' },
  { id: 'legislacion', title: '11. Legislación aplicable' },
  { id: 'contacto', title: '12. Contacto' },
]

export default function Terms() {
  return (
    <main className="container py-5">
      {/* Encabezado */}
      <header className="text-center mb-5">
        <span className="badge rounded-pill text-bg-success mb-3 px-3 py-2">
          <i className="bi bi-leaf me-2" aria-hidden="true" />
          EcoTiquet
        </span>

        <h1 className="display-5 fw-bold mb-3">
          Términos y condiciones
        </h1>

        <p className="lead text-secondary mx-auto" style={{ maxWidth: '720px' }}>
          Conoce las condiciones de uso de EcoTiquet para disfrutar de
          eventos, actividades y experiencias comprometidas con el medio ambiente.
        </p>

        <p className="small text-secondary mb-0">
          Última actualización: 12 de octubre de 2026
        </p>
      </header>

      <div className="row g-4">
        {/* Índice de navegación */}
        <aside className="col-lg-4">
          <nav
            className="card border-0 shadow-sm rounded-4 p-4 sticky-lg-top"
            aria-label="Índice de términos y condiciones"
            style={{ top: '2rem' }}
          >
            <h2 className="h5 fw-bold mb-3">
              <i className="bi bi-list-ul me-2 text-success" aria-hidden="true" />
              Contenido
            </h2>

            <ul className="list-unstyled mb-0">
              {sections.map((section) => (
                <li key={section.id} className="mb-2">
                  <a
                    href={`#${section.id}`}
                    className="text-decoration-none text-secondary small"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Contenido legal */}
        <div className="col-lg-8">
          <article className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
            <p className="text-secondary">
              Estos términos y condiciones regulan el acceso y uso de la
              plataforma EcoTiquet. Al utilizar sus funcionalidades, el
              usuario declara haber leído y comprendido las condiciones
              aplicables a su actividad en la plataforma.
            </p>

            <section id="objeto" className="mb-4">
              <h2 className="h4 fw-bold">1. Objeto y ámbito de aplicación</h2>
              <p>
                EcoTiquet es una plataforma destinada a la consulta,
                difusión y gestión de eventos y actividades, incluidas
                aquellas relacionadas con la sostenibilidad y el cuidado
                del medio ambiente.
              </p>
              <p>
                Estas condiciones se aplican a las personas que visitan
                la plataforma, crean una cuenta, consultan eventos o
                realizan reservas a través de sus funcionalidades.
              </p>
            </section>

            <section id="registro" className="mb-4">
              <h2 className="h4 fw-bold">2. Registro y cuenta de usuario</h2>
              <p>Para utilizar determinadas funcionalidades, puede ser
                necesario registrarse y proporcionar información veraz,
                completa y actualizada.</p>
              <ul>
                <li>El usuario es responsable de mantener la confidencialidad
                  de sus credenciales.</li>
                <li>Debe comunicar cualquier uso no autorizado de su cuenta
                  cuando tenga conocimiento de ello.</li>
                <li>No debe suplantar la identidad de otras personas ni
                  proporcionar información engañosa.</li>
                <li>EcoTiquet podrá limitar el acceso ante usos fraudulentos
                  o incumplimientos, respetando la normativa aplicable.</li>
              </ul>
            </section>

            <section id="reservas" className="mb-4">
              <h2 className="h4 fw-bold">3. Eventos y reservas</h2>
              <p>
                La disponibilidad, las fechas, los horarios, las ubicaciones,
                los precios y las condiciones particulares de cada actividad
                se mostrarán en la información del evento correspondiente.
              </p>
              <p>
                Una solicitud de reserva no debe considerarse confirmada
                hasta que la plataforma indique expresamente su confirmación.
                El usuario deberá revisar los datos antes de completar el proceso.
              </p>
              <p>
                La asistencia podrá estar sujeta a requisitos específicos
                establecidos para cada evento, que deberán comunicarse
                previamente a los participantes.
              </p>
            </section>

            <section id="pagos" className="mb-4">
              <h2 className="h4 fw-bold">4. Precios y pagos</h2>
              <p>
                Los eventos podrán ser gratuitos o tener un precio asociado.
                Cuando exista un coste, se informará de su importe y de los
                posibles gastos adicionales antes de finalizar la compra
                o reserva.
              </p>
              <p>
                Los pagos, si están habilitados, se realizarán mediante los
                métodos que la plataforma ponga a disposición del usuario.
                No se considerará realizado un pago hasta que exista la
                confirmación correspondiente.
              </p>
              <p>
                Las condiciones fiscales, los comprobantes y cualquier
                información adicional sobre el cobro deberán ajustarse
                a la normativa vigente y al modelo de funcionamiento
                de EcoTiquet.
              </p>
            </section>

            <section id="cancelaciones" className="mb-4">
              <h2 className="h4 fw-bold">5. Cancelaciones y reembolsos</h2>
              <p>
                Las condiciones de cancelación dependerán de las características
                del evento, de las condiciones comunicadas antes de reservar
                y de los derechos que reconozca la legislación aplicable.
              </p>
              <p>
                Si un evento se cancela o modifica, se informará a los
                usuarios afectados por los medios de contacto disponibles
                y se indicarán las opciones que correspondan en cada caso.
              </p>
              <p>
                Las solicitudes de reembolso se tramitarán de acuerdo con
                las condiciones aplicables y los derechos legales del usuario.
                Ninguna condición de esta sección limita los derechos
                irrenunciables reconocidos por la normativa de consumo.
              </p>
            </section>

            <section id="conducta" className="mb-4">
              <h2 className="h4 fw-bold">6. Normas de conducta</h2>
              <p>Los usuarios se comprometen a utilizar EcoTiquet de forma
                responsable y respetuosa. En particular, deberán evitar:</p>
              <ul>
                <li>Utilizar la plataforma para actividades ilegales o fraudulentas.</li>
                <li>Interferir en su funcionamiento o intentar acceder a sistemas
                  sin autorización.</li>
                <li>Publicar contenido ilícito, engañoso o que vulnere derechos
                  de terceros.</li>
                <li>Realizar acciones que comprometan la seguridad de otros
                  usuarios o de los organizadores.</li>
              </ul>
              <p>
                En los eventos presenciales, los asistentes deberán respetar
                las instrucciones de organización, las normas de seguridad
                y las reglas específicas del recinto.
              </p>
            </section>

            <section id="responsabilidad" className="mb-4">
              <h2 className="h4 fw-bold">7. Responsabilidad</h2>
              <p>
                EcoTiquet procurará mantener la plataforma disponible y la
                información actualizada, sin garantizar una disponibilidad
                ininterrumpida ni la ausencia absoluta de errores.
              </p>
              <p>
                Cuando un evento sea organizado por un tercero, las
                responsabilidades relativas a su celebración, contenido
                y condiciones dependerán de las funciones efectivamente
                asumidas por cada parte y de la legislación aplicable.
              </p>
              <p>
                Nada de lo dispuesto en estas condiciones excluye o limita
                responsabilidades que legalmente no puedan excluirse
                o limitarse.
              </p>
            </section>

            <section id="propiedad" className="mb-4">
              <h2 className="h4 fw-bold">8. Propiedad intelectual</h2>
              <p>
                Los elementos propios de EcoTiquet, incluidos su diseño,
                logotipo, textos y componentes de software, estarán protegidos
                por los derechos de propiedad intelectual o industrial que
                correspondan.
              </p>
              <p>
                Las imágenes, marcas y contenidos aportados por terceros
                seguirán sujetos a los derechos de sus respectivos titulares.
                No se permite su reproducción o explotación sin autorización
                cuando esta sea necesaria.
              </p>
            </section>

            <section id="datos" className="mb-4">
              <h2 className="h4 fw-bold">9. Protección de datos</h2>
              <p>
                Los datos personales se tratarán conforme a la normativa
                de protección de datos aplicable, incluido el Reglamento
                General de Protección de Datos (RGPD) y la legislación
                española correspondiente.
              </p>
              <p>
                La información sobre el responsable del tratamiento,
                las finalidades, la base jurídica, los plazos de conservación,
                los destinatarios y el ejercicio de derechos deberá
                consultarse en la política de privacidad de EcoTiquet.
              </p>
              <p>
                <strong>Importante:</strong> antes de publicar la plataforma,
                debe añadirse un enlace a una política de privacidad real
                y completa.
              </p>
              <Link to="/privacidad" className="link-success fw-semibold">
                Consultar la política de privacidad
                <i className="bi bi-arrow-up-right ms-2" aria-hidden="true" />
              </Link>
            </section>

            <section id="modificaciones" className="mb-4">
              <h2 className="h4 fw-bold">10. Modificaciones de los términos</h2>
              <p>
                EcoTiquet podrá actualizar estas condiciones cuando sea
                necesario por cambios legales, técnicos o funcionales.
                La versión vigente estará disponible en la plataforma,
                indicando su fecha de actualización.
              </p>
              <p>
                Cuando una modificación requiera una comunicación específica
                o una nueva aceptación, se procederá conforme a la normativa
                aplicable.
              </p>
            </section>

            <section id="legislacion" className="mb-4">
              <h2 className="h4 fw-bold">11. Legislación aplicable</h2>
              <p>
                Estas condiciones se regirán por la legislación que resulte
                aplicable. Cuando corresponda, se respetarán las normas
                imperativas de protección de consumidores y usuarios y
                las reglas legales de competencia judicial.
              </p>
            </section>

            <section id="contacto" className="mb-2">
              <h2 className="h4 fw-bold">12. Contacto</h2>
              <p>
                Para consultas sobre estos términos, reservas o el
                funcionamiento de la plataforma, el usuario podrá
                ponerse en contacto con EcoTiquet a través de los
                canales oficiales de atención.
              </p>
              <p className="mb-0">
                <strong>Correo electrónico:</strong>{' '}
                <span className="text-secondary">
                  Info@ecotiquet.com
                </span>
              </p>
            </section>

            <hr className="my-4" />

            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-between align-items-sm-center">
              <Link to="/" className="btn btn-outline-success">
                <i className="bi bi-arrow-left me-2" aria-hidden="true" />
                Volver al inicio
              </Link>

              <span className="small text-secondary">
                EcoTiquet · Eventos con conciencia ambiental
              </span>
            </div>
          </article>
        </div>
      </div>
    </main>
  )
}
