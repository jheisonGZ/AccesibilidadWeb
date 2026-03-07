import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";
import Swal from "sweetalert2";

export default function TopBar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Muestra el botón Dashboard en cualquier ruta que no sea /home exacto
  const showBack  = location.pathname !== "/home";

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "¿Cerrar sesión?",
      text: "¿Seguro que deseas salir de tu cuenta?",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2c5364",
      cancelButtonColor: "#4a5568",
    });
    if (result.isConfirmed) {
      await signOut(auth);
      navigate("/");
    }
  };

  const btnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 16px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: "rgba(255,255,255,0.8)",
    fontSize: "0.82rem",
    fontWeight: "500",
    letterSpacing: "0.3px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const hoverOn = (e) => {
    e.currentTarget.style.background    = "rgba(255,255,255,0.14)";
    e.currentTarget.style.borderColor   = "rgba(255,255,255,0.35)";
    e.currentTarget.style.color         = "#fff";
  };

  const hoverOff = (e) => {
    e.currentTarget.style.background    = "rgba(255,255,255,0.07)";
    e.currentTarget.style.borderColor   = "rgba(255,255,255,0.18)";
    e.currentTarget.style.color         = "rgba(255,255,255,0.8)";
  };

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0,
      zIndex: 10,
      padding: "14px 28px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>

      {/* IZQUIERDA — botón dashboard o espacio vacío */}
      <div>
        {showBack && (
          <button
            style={btnStyle}
            onClick={() => navigate("/home")}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>
        )}
      </div>

      {/* DERECHA — logout */}
      <button
        style={btnStyle}
        onClick={handleLogout}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        <LogOut size={15} />
        Logout
      </button>

    </div>
  );
}