import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigate("/questionnaire");
    } catch (err) {
      setError("No se pudo registrar. (Revisa contraseña 6+ caracteres)");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Register</h1>

        <form className="auth-form" onSubmit={onSubmit}>
          <input className="auth-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password (6+)" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button">Crear cuenta</button>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <Link className="auth-link" to="/">Volver</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
