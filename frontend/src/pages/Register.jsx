import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useAuth } from "../providers/AuthProvider";
import { auth } from "../services/firebase";
import Swal from "sweetalert2";
import { User, Mail, Lock } from "lucide-react";
import "../styles/register.css";

export default function Register() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(user, { displayName: name.trim() });
      await refreshUser();

      await Swal.fire({
        icon: "success",
        title: "¡Cuenta creada!",
        text: `Bienvenido, ${name.trim()}. Ya puedes iniciar sesión.`,
        confirmButtonText: "Ir al login",
        confirmButtonColor: "#e91e8c",
        iconColor: "#e91e8c",
        background: "#fff0f7",
        color: "#5a1a3a",
      });

      navigate("/");

    } catch {
      setError("No se pudo registrar. (Revisa contraseña 6+ caracteres)");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1 className="register-title">Crear cuenta</h1>

        <form className="register-form" onSubmit={onSubmit}>

          <div className="register-input-box">
            <User size={18} className="register-input-icon" />
            <input
              className="register-input"
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="register-input-box">
            <Mail size={18} className="register-input-icon" />
            <input
              className="register-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-input-box">
            <Lock size={18} className="register-input-icon" />
            <input
              className="register-input"
              type="password"
              placeholder="Contraseña (6+)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

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