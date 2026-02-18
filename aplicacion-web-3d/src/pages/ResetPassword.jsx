import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import "../styles/auth.css";

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
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Recuperar contraseña</h1>

        <form className="auth-form" onSubmit={onSubmit}>
          <input className="auth-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          {msg && <div className="auth-success">{msg}</div>}
          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button">Enviar enlace</button>

          <p className="auth-footer">
            <Link className="auth-link" to="/">Volver al login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
