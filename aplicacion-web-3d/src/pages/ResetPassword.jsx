import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import Swal from "sweetalert2";
import "../styles/ResetPassword.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      await sendPasswordResetEmail(auth, email.trim());

      // ✅ Éxito — tono azulito
      await Swal.fire({
        icon: "info",
        title: "¡Correo enviado!",
        text: "Revisa tu bandeja de entrada y sigue el enlace para recuperar tu contraseña.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#2f80ed",
        iconColor: "#2f80ed",
        background: "#f0f7ff",
        color: "#1a3a5c",
      });

    } catch {
      // ❌ Error
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo enviar el correo. Revisa que el email sea correcto.",
        confirmButtonText: "Intentar de nuevo",
        confirmButtonColor: "#2f80ed",
      });
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