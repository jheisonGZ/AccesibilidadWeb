import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import "../styles/ResetPassword.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Revisa tu correo: te enviamos el enlace de recuperación.");
    } catch {
      setError("No se pudo enviar el correo. Revisa el email.");
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1 className="reset-title">Recuperar contraseña</h1>

        <form className="reset-form" onSubmit={onSubmit}>
          <input
            className="reset-input"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {msg && <div className="reset-success">{msg}</div>}
          {error && <div className="reset-error">{error}</div>}

          <button className="reset-button">
            Enviar enlace
          </button>

          <p className="reset-footer">
            <Link className="reset-link" to="/">
              Volver al login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
