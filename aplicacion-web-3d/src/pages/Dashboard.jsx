import { Link } from "react-router-dom";
import { auth } from "../services/firebase";

export default function Dashboard() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Dashboard</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        Bienvenido: <b>{auth.currentUser?.email}</b>
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <Link to="/home/questionnaire">📝 Hacer cuestionario</Link>
        <Link to="/home/avatar">🧍 Elegir avatar</Link>
        <Link to="/home/scene">🌍 Ir al escenario 3D</Link>
        <Link to="/home/progress">📊 Ver progreso</Link>
      </div>

      <p style={{ marginTop: 24, opacity: 0.7 }}>
        (Luego aquí mostramos historial y recomendaciones)
      </p>
    </div>
  );
}
