import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import Swal from "sweetalert2";
import { useFeedback } from "../hooks/useFeedback";
import { Mail, Lock } from "lucide-react";
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
            <Mail size={18} className="input-icon" />
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
            <Lock size={18} className="input-icon" />
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
          <button className="btn btn-login" type="submit" disabled={busy}>
            {busy ? "Cargando..." : "Iniciar sesión"}
          </button>
          <button className="btn btn-google" type="button" onClick={handleGoogle} disabled={busy}>
            <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
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