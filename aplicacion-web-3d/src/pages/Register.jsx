import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import "../styles/register.css";


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
      navigate("/home/questionnaire");
    } catch (err) {
      setError("No se pudo registrar. (Revisa contraseña 6+ caracteres)");
    }
  };

return (
  <div className="register-page">
    <div className="register-card">
      <h1 className="register-title">Crear cuenta</h1>

      <form className="register-form" onSubmit={onSubmit}>
        <input
          className="register-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="register-input"
          type="password"
          placeholder="Password (6+)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="register-error">{error}</div>}

        <button className="register-button">
          Crear cuenta
        </button>

        <p className="register-footer">
          ¿Ya tienes cuenta?{" "}
          <Link className="register-link" to="/">
            Volver
          </Link>
        </p>
      </form>
    </div>
  </div>
);

}
