import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { ArrowRight, Check } from "lucide-react";
import "../styles/avatar.css";
import LoadingScreen from "../components/LoadingScreen";

const AVATARS = [
  {
    id: "male-1",
    name: "Alejandro",
    gender: "Masculino",
    desc: "Estudiante universitario, activo y curioso.",
    img: "https://models.readyplayer.me/64c3f4b9b8a4e17e99d3b5e1.png?scene=fullbody-portrait-v1",
  },
  {
    id: "female-1",
    name: "Valentina",
    gender: "Femenino",
    desc: "Estudiante creativa, empática y decidida.",
    img: "https://models.readyplayer.me/64c3f4b9b8a4e17e99d3b5e2.png?scene=fullbody-portrait-v1",
  },
  {
    id: "male-2",
    name: "Sebastián",
    gender: "Masculino",
    desc: "Apasionado por la tecnología y el bienestar.",
    img: "https://models.readyplayer.me/64c3f4b9b8a4e17e99d3b5e3.png?scene=fullbody-portrait-v1",
  },
  {
    id: "female-2",
    name: "Mariana",
    gender: "Femenino",
    desc: "Equilibrada, reflexiva y siempre lista para aprender.",
    img: "https://models.readyplayer.me/64c3f4b9b8a4e17e99d3b5e4.png?scene=fullbody-portrait-v1",
  },
];

const AvatarImg = ({ src, name, gender }) => {
  const isFemale = gender === "Femenino";
  return (
    <div className="av-img-wrap">
      <img
        src={src}
        alt={name}
        className="av-img"
        onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
      />
      <div className="av-img-fallback" style={{ display: "none" }}>
        <svg viewBox="0 0 100 140" width="90" height="126" fill="none">
          <circle cx="50" cy="32" r="22" fill={isFemale ? "#f9a8d4" : "#93c5fd"} />
          <ellipse cx="50" cy="105" rx="32" ry="35" fill={isFemale ? "#f9a8d4" : "#93c5fd"} />
          <circle cx="50" cy="32" r="16" fill={isFemale ? "#fce7f3" : "#dbeafe"} />
          {isFemale
            ? <path d="M26 60 Q50 90 74 60 Q74 105 50 118 Q26 105 26 60Z" fill="#f472b6"/>
            : <path d="M26 60 Q50 85 74 60 Q74 105 50 118 Q26 105 26 60Z" fill="#60a5fa"/>
          }
        </svg>
      </div>
    </div>
  );
};

export default function AvatarSelect() {
  const navigate  = useNavigate();
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [filter,     setFilter]     = useState("Todos");
  const [navigating, setNavigating] = useState(false); // ← controla LoadingScreen

  const filtered = filter === "Todos" ? AVATARS : AVATARS.filter(a => a.gender === filter);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) { navigate("/"); return; }

      await setDoc(doc(db, "users", user.uid), { avatar: selected }, { merge: true });
      localStorage.setItem("avatar", selected);

      const av = AVATARS.find(a => a.id === selected);
      await Swal.fire({
        icon: "success",
        title: `¡${av.name} seleccionado!`,
        text: "Tu avatar está listo. Entrando al escenario 3D...",
        confirmButtonText: "¡Vamos!",
        confirmButtonColor: "#2c5364",
        background: "#0f2027",
        color: "#fff",
        iconColor: "#7ecfff",
        timer: 2500,
        timerProgressBar: true,
      });

      // ── Mostrar LoadingScreen antes de navegar ──
      setNavigating(true);
      setTimeout(() => navigate("/home/scene"), 2200);

    } catch (e) {
      console.error(e);
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el avatar.",
        confirmButtonColor: "#2c5364",
      });
    }
  };

  // ── LOADING SCREEN de transición ──
  if (navigating) {
    return <LoadingScreen message="Cargando escenario 3D" />;
  }

  return (
    <div className="av-page">
      <div className="av-container">

        {/* ENCABEZADO */}
        <div className="av-header">
          <h1 className="av-title">Elige tu avatar</h1>
          <p className="av-subtitle">
            Selecciona el personaje que te representará en el escenario 3D interactivo.
          </p>
        </div>

        {/* FILTROS */}
        <div className="av-filters">
          {["Todos", "Masculino", "Femenino"].map(f => (
            <button
              key={f}
              className={`av-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* GRID DE AVATARES */}
        <div className="av-grid">
          {filtered.map(av => (
            <div
              key={av.id}
              className={`av-card ${selected === av.id ? "selected" : ""}`}
              onClick={() => setSelected(av.id)}
            >
              {selected === av.id && (
                <div className="av-check">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              <AvatarImg src={av.img} name={av.name} gender={av.gender} />
              <div className="av-info">
                <span className="av-gender-tag">{av.gender}</span>
                <h3 className="av-name">{av.name}</h3>
                <p className="av-desc">{av.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BOTÓN */}
        <button
          className="av-btn"
          onClick={handleContinue}
          disabled={!selected || loading}
        >
          {loading
            ? "Guardando..."
            : selected
              ? <><span>Entrar al escenario 3D</span><ArrowRight size={18} /></>
              : "Selecciona un avatar para continuar"
          }
        </button>

      </div>
    </div>
  );
}