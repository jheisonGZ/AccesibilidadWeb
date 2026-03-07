import { Link } from "react-router-dom";
import "../styles/dashboard.css";
import Swal from "sweetalert2";
import { ClipboardList, User, Globe, BarChart3 } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";

export default function Dashboard() {

  const { alias, user } = useAuth();

  const questionnaireCompleted = false;
  const avatarSelected = false;

  const showQuestionnaireReminder = () => {
    Swal.fire({
      icon: "warning",
      title: "Debes completar el cuestionario",
      text: "Primero debes llenar el cuestionario para poder elegir un avatar.",
      confirmButtonText: "Entendido"
    });
  };

  const showAvatarReminder = () => {
    Swal.fire({
      icon: "info",
      title: "Selecciona un avatar",
      text: "Debes elegir un avatar antes de entrar al escenario 3D.",
      confirmButtonText: "Entendido"
    });
  };

  const initial = alias?.charAt(0).toUpperCase();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* ── BIENVENIDA — arriba izquierda con avatar ── */}
        <div className="dashboard-welcome">
          <div className="dashboard-avatar">
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" />
              : <span>{initial}</span>
            }
          </div>
          <div className="dashboard-welcome-text">
            <span className="dashboard-welcome-label">Bienvenido</span>
            <span className="dashboard-welcome-alias">{alias}</span>
          </div>
        </div>

        {/* ── TÍTULO ACORDE A LA TESIS ── */}
        <div className="dashboard-header-text">
          <h1 className="dashboard-title">Tu espacio de bienestar emocional</h1>
          <p className="dashboard-subtitle">
            Explora las herramientas diseñadas para acompañarte durante tu vida universitaria.
          </p>
        </div>

        {/* ── TARJETAS ── */}
        <div className="dashboard-grid">

          <Link to="/home/questionnaire" className="dashboard-card">
            <ClipboardList size={28}/>
            <h3>Hacer cuestionario</h3>
            <p>Completa el test de accesibilidad</p>
          </Link>

          {questionnaireCompleted ? (
            <Link to="/home/avatar" className="dashboard-card">
              <User size={28}/>
              <h3>Elegir avatar</h3>
              <p>Selecciona tu representación</p>
            </Link>
          ) : (
            <div className="dashboard-card disabled" onClick={showQuestionnaireReminder}>
              <User size={28}/>
              <h3>Elegir avatar</h3>
              <p>Completa el cuestionario primero</p>
            </div>
          )}

          {avatarSelected ? (
            <Link to="/home/scene" className="dashboard-card">
              <Globe size={28}/>
              <h3>Escenario 3D</h3>
              <p>Explora el entorno interactivo</p>
            </Link>
          ) : (
            <div className="dashboard-card disabled" onClick={showAvatarReminder}>
              <Globe size={28}/>
              <h3>Escenario 3D</h3>
              <p>Elige un avatar primero</p>
            </div>
          )}

          <Link to="/home/progress" className="dashboard-card">
            <BarChart3 size={28}/>
            <h3>Ver progreso</h3>
            <p>Consulta tus resultados</p>
          </Link>

        </div>

        <p className="dashboard-footer">
          Aquí aparecerán recomendaciones y tu historial.
        </p>

      </div>
    </div>
  );
}