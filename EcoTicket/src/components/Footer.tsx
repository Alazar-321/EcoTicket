function Footer() {
  return (
    <footer className="bg_footer text-success py-5 mt-1">
      <div className="container-fluid px-5">
        <div className="row row-cols-1 row-cols-md-3 g-4 align-items-start">
          <div className="col d-flex flex-column align-items-center text-center">
            <img
              src="logo.png"
              alt="EcoTíquet"
              height="72"
              className="mb-3 object-fit-contain object-position-center"
            />
            <p className="mb-1 ">
              Encuentra y gestiona tus tickets de eventos.
            </p>
          </div>
          <div className="col d-flex flex-column">
            <h5 className="mb-1">Enlaces</h5>
            <nav className="d-flex flex-column gap-2">
              <a className="text-success text-decoration-none" href="/">
                Inicio
              </a>
              <a className="text-success text-decoration-none" href="/eventos">
                Eventos
              </a>
              <a
                className="text-success text-decoration-none"
                href="/mis-tickets"
              >
                Mis tickets
              </a>
            </nav>
          </div>
          <div className="col d-flex flex-column">
            <a
              className="text-success text-decoration-none fs-4 mb-3"
              href="/soporte"
            >
              Soporte
            </a>
            

            {/* Fila alineada horizontalmente para la imagen y el texto */}
            <div className="d-flex align-items-center gap-2 mt-2">
              <img
                src="/src/assets/call.png"
                alt="Soporte"
                style={{ width: "60px", height: "auto" }}
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
  );
}

export default Footer;