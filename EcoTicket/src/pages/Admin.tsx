
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../auth/auth'
import AdminReports from '../components/AdminReports'

function Admin() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  return (
    <main className="container py-5">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-success fw-bold">
            Panel de Administrador
          </h1>

          <p className="text-muted mb-0">
            Bienvenido, {user?.username}
          </p>
        </div>

        <button
          className="btn btn-outline-success"
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