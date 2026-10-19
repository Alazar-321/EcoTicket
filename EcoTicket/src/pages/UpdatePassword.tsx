import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../auth/auth';
import logo from '../assets/logo_2.webp';

function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await updatePassword(password);
      if (authError) {
        setError(authError);
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError('Ocurrió un error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page py-5 d-flex justify-content-center align-items-center">
      <div className="container">
        <div className="row justify-content-center align-items-center">
          <div className="col-12 col-lg-10 col-xl-8">
            <div className="card shadow border-0 overflow-hidden">
              <div className="row g-0">
                <div className="col-md-5 bg-success text-white d-flex flex-column justify-content-center align-items-center p-4 text-center position-relative login_card">
                  <img src={logo} alt="Eco Tíquet Logo" height="80" className="mb-3" />
                  <h3 className="fw-bold mb-2 text-shadow">Nueva Contraseña</h3>
                  <p className="small text-bold mb-0 opacity-10 text-shadow">
                    Crea una contraseña segura para tu cuenta.
                  </p>
                </div>

                <div className="col-md-7">
                  <div className="card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                      <h2 className="text-success fw-bold">Actualizar Contraseña</h2>
                      <p className="text-muted small">
                        Establece tu nueva contraseña de acceso
                      </p>
                    </div>

                    {!submitted ? (
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label htmlFor="password" className="form-label fw-semibold">
                            Nueva Contraseña
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <i className="bi bi-lock text-success"></i>
                            </span>
                            <input
                              id="password"
                              type="password"
                              className={`form-control border-start-0 ${error ? 'is-invalid' : ''}`}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Mínimo 8 caracteres"
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label htmlFor="confirmPassword" className="form-label fw-semibold">
                            Confirmar Contraseña
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <i className="bi bi-shield-check text-success"></i>
                            </span>
                            <input
                              id="confirmPassword"
                              type="password"
                              className={`form-control border-start-0 ${error ? 'is-invalid' : ''}`}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Repite la contraseña"
                              required
                            />
                          </div>
                        </div>

                        {error && <div className="alert alert-danger py-2">{error}</div>}

                        <button type="submit" className="btn btn-success w-100" disabled={loading}>
                          {loading ? 'Actualizando...' : 'Guardar Contraseña'}
                        </button>
                        <div className="text-center mt-3">
                          <a href="/login" className="btn btn-link text-decoration-none small">
 la contraseña ya la recuerdo, ir al login
                          </a>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-3">
                        <div className="mb-3 text-success display-4">
                          <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h4 className="fw-bold text-success">¡Actualizado con éxito!</h4>
                        <p className="text-muted">
                          Tu contraseña ha sido cambiada. Ya puedes iniciar sesión con tus nuevas credenciales.
                        </p>
                        <button onClick={() => navigate('/login')} className="btn btn-success w-100 mt-3">
                          Ir al Login
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default UpdatePassword;
