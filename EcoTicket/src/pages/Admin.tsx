
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, type User } from '../auth/auth'
import AdminReports from '../components/AdminReports'

function Admin() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  // getCurrentUser es asíncrona (igual que en Navbar, EventCards y Agente)
  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  return (
    <main className="container py-5 admin-agente">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-light fw-bold">
            Panel de Administrador
          </h1>

          <p className="text-muted mb-0">
            Bienvenido, {user?.username}
          </p>
        </div>

        <button
          className="btn btn-outline-light"
          onClick={() => navigate('/')}
        >
          Ver sitio
        </button>
      </div>

      <AdminReports />

    </main>
  )
}

export default Admin