import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import "../styles/login.css";

export default function Login() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const msg = await login(email, password);

    setBusy(false);

    if (msg) setError(msg);
    else navigate("/home");
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate("/home");
    } catch (e) {
      setError("No se pudo iniciar sesión con Google.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
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

          {error && <p className="login-error">{error}</p>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Cargando..." : "Iniciar sesión"}
          </button>

          <button className="btn btn-google" type="button" onClick={handleGoogle} disabled={busy}>
            Iniciar sesión con Google
          </button>

          <div className="register-link">
            <p>
              ¿No tienes una cuenta? <Link to="/register">Regístrate ahora</Link>
            </p>
          </div>

          {user && <p className="login-mini">Sesión: {user.email}</p>}
        </form>
      </div>
    </div>
  );
}
