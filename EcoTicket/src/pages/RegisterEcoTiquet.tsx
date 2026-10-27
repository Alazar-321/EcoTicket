import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";


// URL de imagen del Logo de EcoTiquet
const ECOTIQUET_LOGO_URL: string = "./src/assets/logo.png";

// Tipos para el tipo de cuenta
type AccountType = "Attendee" | "Organizer";

// Interface para el estado del formulario
interface FormData {
  fullName: string;
  identificationType: "CEDULA" | "PASAPORTE";
  identification: string;
  email: string;
  address: string;
  city: string;
  phones: string[];
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  acceptTerms: boolean;
  newsletter: boolean;
}

// Interface para los errores del formulario
interface FormErrors {
  fullName?: string;
  identification?: string;
  address?: string;
  city?: string;
  phones?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

// Interface para el cálculo de fuerza de contraseña
interface StrengthLabel {
  text: string;
  color: string;
  width: string;
}

export default function RegisterEcoTiquet(): React.JSX.Element {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    identificationType: "CEDULA",
    identification: "",
    email: "",
    address: "",
    city: "",
    phones: [""],
    password: "",
    confirmPassword: "",
    accountType: "Attendee",
    acceptTerms: false,
    newsletter: false,
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Calcular fuerza de la contraseña (0 - 4)
  const calculateStrength = (pass: string): number => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passStrength: number = calculateStrength(formData.password);

  const getStrengthLabel = (): StrengthLabel => {
    switch (passStrength) {
      case 1:
        return { text: "Débil", color: "bg-danger", width: "25%" };
      case 2:
        return { text: "Aceptable", color: "bg-warning", width: "50%" };
      case 3:
        return { text: "Buena", color: "bg-info", width: "75%" };
      case 4:
        return { text: "Excelente", color: "bg-success", width: "100%" };
      default:
        return { text: "Muy corta", color: "bg-secondary", width: "10%" };
    }
  };

  const handlePhoneChange = (index: number, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      phones: prev.phones.map((p, i) => (i === index ? value : p)),
    }));
    if (errors.phones) setErrors((prev) => ({ ...prev, phones: "" }));
  };

  const addPhone = (): void => {
    setFormData((prev) =>
      prev.phones.length >= 5 ? prev : { ...prev, phones: [...prev.phones, ""] }
    );
  };

  const removePhone = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = e.target instanceof HTMLInputElement ? e.target.checked : false;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre es requerido.";
    }

    if (!formData.identification.trim()) {
      newErrors.identification =
        formData.identificationType === "CEDULA"
          ? "El número de cédula es requerido."
          : "El número de pasaporte es requerido.";
    } else if (!/^[A-Za-z0-9]{5,20}$/.test(formData.identification.trim())) {
      newErrors.identification = "Usa entre 5 y 20 letras o números, sin espacios ni signos.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "La ciudad es requerida.";
    }

    const filledPhones = formData.phones.map((p) => p.trim()).filter(Boolean);
    if (filledPhones.length === 0) {
      newErrors.phones = "Ingresa al menos un número de teléfono.";
    } else if (filledPhones.some((p) => !/^\+?[0-9\s-]{7,15}$/.test(p))) {
      newErrors.phones = "Revisa los teléfonos: 7 a 15 dígitos, puede iniciar con +.";
    }

    if (!formData.email) {
      newErrors.email = "El correo es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El formato de correo no es válido.";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Debe tener al menos 8 caracteres.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debes aceptar los términos eco-sostenibles.";
    }

    return newErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up in Supabase Auth
      // Pasamos la metadata para que el Trigger de la base de datos la capture y cree el perfil
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.fullName.toLowerCase().replace(/\s+/g, "_"),
            role: formData.accountType === "Organizer" ? "AGENTE" : "CLIENTE",
            identification_type: formData.identificationType,
            identification: formData.identification.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            phones: formData.phones.map((p) => p.trim()).filter(Boolean),
          },
        },
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("No se pudo crear el usuario");

      setSubmitted(true);
    } catch (err: any) {
      const message: string = err.message || "Ocurrió un error al registrarse";
      // Si el documento ya existe, el trigger de la base de datos rechaza el registro
      if (/database error saving new user/i.test(message)) {
        setErrors({
          identification:
            "No se pudo crear la cuenta. Revisa que el documento no esté ya registrado.",
        });
      } else {
        setErrors({ email: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex justify-content-center align-items-center py-5">
      <div className="col-12 col-md-10 col-lg-8 col-xl-6">
        <div className="card eco-card p-4 p-md-5 bg-white">
          <div className="text-center mb-4">
            <img
              src={ECOTIQUET_LOGO_URL}
              alt="Logo EcoTiquet"
              className="logo-img mb-3"
            />
            <p className="text-muted small">
              Eventos sostenibles y boletería 100% digital
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate>
              <h4 className="fw-semibold mb-4 text-center text-dark">
                Crear Cuenta Ecológica
              </h4>

              <div className="mb-3">
                <label className="form-label font-medium text-secondary small text-uppercase fw-bold">
                  Tipo de perfil
                </label>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="radio"
                      className="btn-check"
                      name="accountType"
                      id="attendee"
                      value="Attendee"
                      checked={formData.accountType === "Attendee"}
                      onChange={handleChange}
                    />
                    <label
                      className="btn btn-outline-success w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                      htmlFor="attendee"
                    >
                      <i className="bi bi-person"></i> Cliente Eco
                    </label>
                  </div>
                  <div className="col-6">
                    <input
                      type="radio"
                      className="btn-check"
                      name="accountType"
                      id="organizer"
                      value="Organizer"
                      checked={formData.accountType === "Organizer"}
                      onChange={handleChange}
                    />
                    <label
                      className="btn btn-outline-success w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                      htmlFor="organizer"
                    >
                      <i className="bi bi-building"></i> Agente Eco
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="fullName" className="form-label">
                  Nombre Completo
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-person text-success"></i>
                  </span>
                  <input
                    type="text"
                    className={`form-control border-start-0 ${errors.fullName ? "is-invalid" : ""}`}
                    id="fullName"
                    name="fullName"
                    placeholder="Ej. Laura Gómez"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  {errors.fullName && (
                    <div className="invalid-feedback">{errors.fullName}</div>
                  )}
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-5">
                  <label htmlFor="identificationType" className="form-label">
                    Documento
                  </label>
                  <select
                    className="form-select"
                    id="identificationType"
                    name="identificationType"
                    value={formData.identificationType}
                    onChange={handleChange}
                  >
                    <option value="CEDULA">Cédula</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div className="col-sm-7">
                  <label htmlFor="identification" className="form-label">
                    Número de identificación
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.identification ? "is-invalid" : ""}`}
                    id="identification"
                    name="identification"
                    maxLength={20}
                    value={formData.identification}
                    onChange={handleChange}
                  />
                  {errors.identification && (
                    <div className="invalid-feedback">{errors.identification}</div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Correo Electrónico
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-envelope text-success"></i>
                  </span>
                  <input
                    type="email"
                    className={`form-control border-start-0 ${errors.email ? "is-invalid" : ""}`}
                    id="email"
                    name="email"
                    placeholder="ejemplo@ecotiquet.org"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-7">
                  <label htmlFor="address" className="form-label">
                    Dirección
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.address ? "is-invalid" : ""}`}
                    id="address"
                    name="address"
                    placeholder="Ej. Calle 10 # 5-20"
                    maxLength={150}
                    value={formData.address}
                    onChange={handleChange}
                  />
                  {errors.address && (
                    <div className="invalid-feedback">{errors.address}</div>
                  )}
                </div>
                <div className="col-sm-5">
                  <label htmlFor="city" className="form-label">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.city ? "is-invalid" : ""}`}
                    id="city"
                    name="city"
                    maxLength={80}
                    value={formData.city}
                    onChange={handleChange}
                  />
                  {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="phone-0" className="form-label">
                  Teléfonos
                </label>
                {formData.phones.map((phone, index) => (
                  <div className="input-group mb-2" key={index}>
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-telephone text-success"></i>
                    </span>
                    <input
                      type="tel"
                      className={`form-control border-start-0 ${errors.phones ? "is-invalid" : ""}`}
                      id={`phone-${index}`}
                      placeholder="Ej. +57 300 123 4567"
                      maxLength={20}
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                    />
                    {formData.phones.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        aria-label={`Quitar teléfono ${index + 1}`}
                        onClick={() => removePhone(index)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                ))}
                {errors.phones && (
                  <div className="text-danger small mb-2">{errors.phones}</div>
                )}
                {formData.phones.length < 5 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={addPhone}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    Agregar otro teléfono
                  </button>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Contraseña
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-success"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`form-control border-start-0 border-end-0 ${errors.password ? "is-invalid" : ""} `}
                    id="password"
                    name="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i
                      className={`bi bi-eye${showPassword ? "-slash" : ""}`}
                    ></i>
                  </button>
                  {errors.password && (
                    <div className="invalid-feedback d-block">
                      {errors.password}
                    </div>
                  )}
                </div>

                {formData.password && (
                  <div className="mt-2">
                    <div className="progress" style={{ height: "6px" }}>
                      <div
                        className={`progress-bar ${getStrengthLabel().color}`}
                        role="progressbar"
                        style={{ width: getStrengthLabel().width }}
                      ></div>
                    </div>
                    <small className="text-muted d-block mt-1">
                      Seguridad:{" "}
                      <span className="fw-semibold">
                        {getStrengthLabel().text}
                      </span>
                    </small>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmar Contraseña
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-shield-check text-success"></i>
                  </span>
                  <input
                    type="password"
                    className={`form-control border-start-0 ${errors.confirmPassword ? "is-invalid" : ""}`}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className={`form-check-input ${errors.acceptTerms ? "is-invalid" : ""}`}
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                />
                <label className="form-check-label small" htmlFor="acceptTerms">
                  Acepto los{" "}
                  <a
                    href="#terms"
                    className="text-success text-decoration-underline"
                  >
                    Términos Eco-Sostenibles
                  </a>{" "}
                  y la Política de Cero Huella de Carbono.
                </label>
              </div>

              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="newsletter"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                />
                <label
                  className="form-check-label small text-muted"
                  htmlFor="newsletter"
                >
                  Deseo recibir noticias sobre eventos verdes e iniciativas
                  ambientales.
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-eco w-100 mb-3 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  "Registrando..."
                ) : (
                  <>
                    Unirme a EcoTiquet{" "}
                    <i className="bi bi-arrow-right ms-1"></i>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="mb-3 text-success display-1">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h3 className="fw-bold text-success">
                ¡Bienvenido/a a EcoTiquet!
              </h3>
              <p className="text-muted">
                Hemos enviado un correo de confirmación a{" "}
                <strong>{formData.email}</strong>.
              </p>
              <div className="alert alert-success d-flex align-items-center gap-2 text-start my-4">
                <i className="bi bi-tree-fill fs-3"></i>
                <div className="small">
                  <strong>Impacto Inicial:</strong> Por registrarte en
                  EcoTiquet, has contribuido a la conservación de 1 digital m²
                  de bosque virtual.
                </div>
              </div>
              <button
                className="btn btn-eco w-100"
                onClick={() => navigate("/login")}
              >
                Ir a iniciar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}