import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPasswordRequest } from '../auth/auth';
import logo from '../assets/logo_2.webp';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    // Basic email validation regex from RegisterEcoTiquet
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, introduce un formato de correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await resetPasswordRequest(email);
      if (authError) {
        setError(authError);
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError('Ocurrió un error al procesar la solicitud.');
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
                  <h3 className="fw-bold mb-2 text-shadow">Recuperar Acceso</h3>
                  <p className="small text-bold mb-0 opacity-10 text-shadow">
                    No te preocupes, te ayudamos a volver a entrar.
                  </p>
                </div>

                <div className="col-md-7">
                  <div className="card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                      <h2 className="text-success fw-bold">Restablecer Contraseña</h2>
                      <p className="text-muted small">
                        Introduce tu correo para recibir instrucciones
                      </p>
                    </div>

                    {!submitted ? (
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label fw-semibold">
                            Correo Electrónico
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <i className="bi bi-envelope text-success"></i>
                            </span>
                            <input
                              id="email"
                              type="email"
                              className={`form-control border-start-0 ${error ? 'is-invalid' : ''}`}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="ejemplo@correo.com"
                              required
                            />
                          </div>
                          {error && <div className="text-danger small mt-1">{error}</div>}
                        </div>

                        <button type="submit" className="btn btn-success w-100" disabled={loading}>
                          {loading ? 'Enviando...' : 'Enviar instrucciones'}
                        </button>
                        <div className="text-center mt-3">
                          <a href="/login" className="btn btn-link text-decoration-none small">
                            Volver al inicio de sesión
                          </a>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-3">
                        <div className="mb-3 text-success display-4">
                          <i className="bi bi-envelope-check-fill"></i>
                        </div>
                        <h4 className="fw-bold text-success">¡Correo enviado!</h4>
                        <p className="text-muted">
                          Si el correo electrónico existe en nuestro sistema, recibirás un mensaje con el enlace para restablecer tu contraseña.
                        </p>
                        <button onClick={() => navigate('/login')} className="btn btn-success w-100 mt-3">
                          Volver al Login
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

export default ForgotPassword;
