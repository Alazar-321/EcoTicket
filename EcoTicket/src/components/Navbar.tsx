import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg border-bottom border-success border-5 bg-white">
  <div className="container-fluid px-4">

    {/* Logo */}
    <Link
      className="navbar-brand d-flex align-items-center fw-bold text-success ms-lg-5"
      to="/"
    >
      <img
        src="/logo.png"
        alt="EcoTíquet"
        height="60"
        className="me-2"
      />
    </Link>

    {/* Botón menú responsive */}
    <button
      className="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarEcoTicket"
      aria-controls="navbarEcoTicket"
      aria-expanded="false"
      aria-label="Abrir menu de navegacion"
    >
      <span className="navbar-toggler-icon"></span>
    </button>

    {/* Menú */}
    <div
      className="collapse navbar-collapse"
      id="navbarEcoTicket"
    >

      <ul className="navbar-nav mx-auto mb-2 mb-lg-0">

        <li className="nav-item">
          <Link
            className="nav-link text-secondary fw-semibold fs-5"
            to="/"
          >
            Inicio
          </Link>
        </li>

        <li className="nav-item">
          <Link
            className="nav-link text-secondary fw-semibold fs-5"
            to="/eventos"
          >
            Eventos
          </Link>
        </li>

        <li className="nav-item">
          <Link
            className="nav-link text-secondary fw-semibold fs-5"
            to="/soporte"
          >
            Soporte y Ayuda
          </Link>
        </li>

      </ul>

      {/* Mi cuenta */}
      <div className="d-flex align-items-center gap-3 me-lg-5">
        <Link
          className="fw-semibold text-success fs-5"
          to="/login"
        >
          Mi Cuenta
        </Link>

        <i className="bi bi-person-circle fs-2 text-success"></i>
      </div>

    </div>

  </div>
</nav>
  )
}

export default Navbar