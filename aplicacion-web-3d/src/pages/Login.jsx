import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import Swal from "sweetalert2";
import bgVideo from "../assets/video/login.mp4";
import "../styles/login.css";

export default function Login() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [busy, setBusy]           = useState(false);
  const [cinematic, setCinematic] = useState(false);

  const videoRef = useRef(null);

  const playCinematic = () => {
    setCinematic(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      videoRef.current.onended = () => navigate("/home");
    }
  };

  // ── LOGIN CORREO / CONTRASEÑA ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);

    const msg = await login(email, password);
    setBusy(false);

    if (msg) {
      // ❌ Error — verde oliva oscuro acorde al login
      Swal.fire({
        icon: "error",
        title: "Error al iniciar sesión",
        text: msg,
        confirmButtonText: "Intentar de nuevo",
        confirmButtonColor: "#4a6741",
        iconColor: "#4a6741",
        background: "#f2f5ee",
        color: "#2a3a22",
      });
    } else {
      playCinematic();
    }
  };

  // ── LOGIN CON GOOGLE ──
  const handleGoogle = async () => {
    setBusy(true);

    try {
      await loginWithGoogle();

      // ✅ Bienvenida Google — verde oliva, cierra solo en 2s
      await Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: "Iniciaste sesión con Google correctamente.",
        confirmButtonColor: "#4a6741",
        iconColor: "#4a6741",
        background: "#f2f5ee",
        color: "#2a3a22",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      playCinematic();

    } catch {
      // ❌ Error Google
      Swal.fire({
        icon: "error",
        title: "Error con Google",
        text: "No se pudo iniciar sesión con Google. Intenta de nuevo.",
        confirmButtonText: "Intentar de nuevo",
        confirmButtonColor: "#4a6741",
        iconColor: "#4a6741",
        background: "#f2f5ee",
        color: "#2a3a22",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">

      <video
        ref={videoRef}
        className={`login-bg-video ${cinematic ? "video-animate" : ""}`}
        muted
        playsInline
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className={`login-bg-overlay ${cinematic ? "overlay-dark" : ""}`}></div>

      <div className={`wrapper ${cinematic ? "wrapper-fade" : ""}`}>
        <form onSubmit={handleLogin}>
          <h1>Iniciar sesión</h1>

          <div className="input-box">
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-box">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="remember-forgot">
            <Link to="/reset-password">¿Olvidaste tu contraseña?</Link>
          </div>

          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Cargando..." : "Iniciar sesión"}
          </button>

          <button
            className="btn btn-google"
            type="button"
            onClick={handleGoogle}
            disabled={busy}
          >
            Iniciar sesión con Google
          </button>

          <div className="register-link">
            <p>
              ¿No tienes una cuenta?{" "}
              <Link to="/register">Regístrate ahora</Link>
            </p>
          </div>

          {user && <p className="login-mini">Sesión: {user.email}</p>}
        </form>
      </div>
    </div>
  );
}