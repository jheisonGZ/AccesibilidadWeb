import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import Swal from "sweetalert2";
import { useFeedback } from "../hooks/useFeedback";
import "../styles/login.css";

export default function Login() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const fb = useFeedback();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [busy, setBusy]             = useState(false);
  const [cinematic, setCinematic]   = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = "/video/login.mp4";
    v.load();
    const onReady = () => setVideoReady(true);
    v.addEventListener("canplaythrough", onReady);
    return () => v.removeEventListener("canplaythrough", onReady);
  }, []);

  const playCinematic = () => {
    const v = videoRef.current;
    if (!v || !videoReady) { navigate("/home"); return; }
    setCinematic(true);
    v.currentTime = 0;
    v.play().catch(() => navigate("/home"));
    v.onended = () => navigate("/home");
    setTimeout(() => navigate("/home"), 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    const msg = await login(email, password);
    setBusy(false);
    if (msg) {
      fb.loginError();
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
      fb.loginSuccess();
      playCinematic();
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
      fb.loginSuccess();
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
      fb.loginError();
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
        preload="auto"
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
          <button className="btn btn-google" type="button" onClick={handleGoogle} disabled={busy}>
            Iniciar sesión con Google
          </button>
          <div className="login-register-link">
            <span className="login-register-text">¿No tienes una cuenta?</span>
            <Link to="/register" className="login-register-btn">Regístrate ahora</Link>
          </div>
        </form>
      </div>
    </div>
  );
}