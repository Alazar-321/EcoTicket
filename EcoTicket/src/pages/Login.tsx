import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../auth/auth'
import logo from '../assets/logo_2.webp'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const from = location.state?.from || '/'

  async function handleSubmit(event: React.ChangeEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')

    const user = await login(username, password)

    if (!user) {
      setError('Usuario o contraseña incorrectos')
      return
    }

    switch (user.role) {
      case 'ADMINISTRADOR':
        navigate('/admin')
        break

      case 'AGENTE':
        navigate('/agente')
        break

      case 'CLIENTE':
        navigate(from)
        break
    }
  }

  return (
    <main className="login-page py-5 d-flex justify-content-center align-items-center">
      <div className="container">
        <div className="row justify-content-center align-items-center">
          <div className="col-12 col-lg-10 col-xl-8">
            <div className="card shadow border-0 overflow-hidden">
              <div className="row g-0">
                <div
                  className="col-md-5 bg-success text-white d-flex flex-column justify-content-center align-items-center p-4 text-center position-relative login_card"
                >
                  <img
                    src={logo}
                    alt="Eco Tíquet Logo"
                    height="80"
                    className="mb-3"
                  />
                  <h3 className="fw-bold mb-2 text-shadow">¡Bienvenido!</h3>
                  <p className="small text-bold mb-0 opacity-10 text-shadow">
                    Gestión sostenible e inteligente para tus tíquets.
                  </p>
                </div>

                <div className="col-md-7">
                  <div className="card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                      <h2 className="text-success fw-bold">Iniciar sesión</h2>
                      <p className="text-muted small">
                        Accede a tu cuenta de Eco Tíquet
                      </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="username" className="form-label fw-semibold">
                          Usuario
                        </label>

                        <input
                          id="username"
                          type="text"
                          className="form-control"
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                          placeholder="Introduce tu usuario"
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="password" className="form-label fw-semibold">
                          Contraseña
                        </label>

                        <input
                          id="password"
                          type="password"
                          className="form-control"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Introduce tu contraseña"
                          required
                        />
                      </div>

                      <div className="text-end mb-3">
                        <a href="/forgot-password" className="small text-success text-decoration-none fw-semibold">
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>

                      {error && <div className="alert alert-danger py-2">{error}</div>}

                      <button type="submit" className="btn btn-success w-100">
                        Iniciar sesión
                      </button>
                      <a href="/Register" className="btn btn-link w-100 mt-2 text-decoration-none">No tienes cuenta? Crea una</a>
                    </form>

                    <hr className="my-4" />

                    <div className="small text-muted">
                      <p className="mb-1 fw-semibold">Usuarios de prueba:</p>
                      <p className="mb-1">
                        Admin: <strong>admin@ecoticket.com/ querty1234</strong>
                      </p>
                      {/* <p className="mb-1">
                        Agente: <strong>agente / 1234</strong>
                      </p>
                      <p className="mb-0">
                        Cliente: <strong>cliente / 1234</strong>
                      </p> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login