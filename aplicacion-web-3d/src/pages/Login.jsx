import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import Swal from "sweetalert2";
import "../styles/login.css";

export default function Login() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [busy, setBusy]           = useState(false);
  const [cinematic, setCinematic] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const videoRef = useRef(null);

  // Carga el video solo después de que la página se montó
  // usando src dinámico en lugar de import estático
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Carga diferida — el video NO bloquea el render inicial
    v.src = "public/video/login.mp4"; // ← mueve el video a /public/video/login.mp4
    v.load();

    const onReady = () => setVideoReady(true);
    v.addEventListener("canplaythrough", onReady);
    return () => v.removeEventListener("canplaythrough", onReady);
  }, []);

  const playCinematic = () => {
    const v = videoRef.current;
    if (!v || !videoReady) {
      // Si el video no cargó todavía, navega directo sin esperar
      navigate("/home");
      return;
    }
    setCinematic(true);
    v.currentTime = 0;
    v.play().catch(() => navigate("/home")); // fallback si autoplay está bloqueado
    v.onended = () => navigate("/home");
    // Timeout de seguridad: si el video tarda más de 5s, navega igual
    setTimeout(() => navigate("/home"), 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    const msg = await login(email, password);
    setBusy(false);
    if (msg) {
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

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
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
      {/* VIDEO — sin autoPlay, sin preload eager, carga diferida */}
      <video
        ref={videoRef}
        className={`login-bg-video ${cinematic ? "video-animate" : ""}`}
        muted
        playsInline
        preload="none"
      />

      <div className={`login-bg-overlay ${cinematic ? "overlay-dark" : ""}`} />

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