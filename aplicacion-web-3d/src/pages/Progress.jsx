import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useAuth } from "../providers/AuthProvider";
import {
  Heart, AlertTriangle, AlertCircle, Activity,
  TrendingUp, Calendar, Award, BarChart3
} from "lucide-react";
import "../styles/progress.css";

// ── Clasificación ──
const CLASSIFY = {
  neutro:   { label: "Bienestar estable",  Icon: Heart,          color: "#7ecfff" },
  leve:     { label: "Leve malestar",      Icon: Activity,       color: "#34d399" },
  estres:   { label: "Estrés moderado",    Icon: AlertTriangle,  color: "#fbbf24" },
  ansiedad: { label: "Ansiedad elevada",   Icon: AlertCircle,    color: "#f87171" },
};

const fmt = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

export default function Progress() {
  const navigate              = useNavigate();
  const { user, alias }       = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/"); return; }

    const fetch = async () => {
      try {
        const ref = collection(db, "users", user.uid, "assessments");
        const q   = query(ref, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, navigate]);

  // ── Stats ──
  const total   = records.length;
  const avgScore = total ? Math.round(records.reduce((a, r) => a + (r.score ?? 0), 0) / total) : 0;
  const latest  = records[0];
  const best    = records.reduce((a, r) => (r.score ?? 99) < (a?.score ?? 99) ? r : a, null);

  const counts = records.reduce((acc, r) => {
    acc[r.classification] = (acc[r.classification] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="pr-page">
      <div className="pr-container">

        {/* ENCABEZADO */}
        <div className="pr-header">
          <div>
            <h1 className="pr-title">Tu progreso emocional</h1>
            <p className="pr-subtitle">Historial de autoevaluaciones de <b>{alias}</b></p>
          </div>
          <div className="pr-avatar-mini">
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" />
              : <span>{alias?.charAt(0).toUpperCase()}</span>
            }
          </div>
        </div>

        {loading ? (
          <div className="pr-loading">
            <Activity size={32} className="pr-spin" />
            <p>Cargando historial...</p>
          </div>
        ) : total === 0 ? (
          <div className="pr-empty">
            <BarChart3 size={48} opacity={0.3} />
            <p>Aún no tienes evaluaciones registradas.</p>
            <button className="pr-btn-start" onClick={() => navigate("/home/questionnaire")}>
              Hacer mi primera evaluación
            </button>
          </div>
        ) : (
          <>
            {/* STATS CARDS */}
            <div className="pr-stats">

              <div className="pr-stat-card">
                <Calendar size={20} style={{ color: "#7ecfff" }} />
                <div>
                  <span className="pr-stat-label">Evaluaciones</span>
                  <span className="pr-stat-value">{total}</span>
                </div>
              </div>

              <div className="pr-stat-card">
                <TrendingUp size={20} style={{ color: "#34d399" }} />
                <div>
                  <span className="pr-stat-label">Puntaje promedio</span>
                  <span className="pr-stat-value">{avgScore} <small>/ 21</small></span>
                </div>
              </div>

              <div className="pr-stat-card">
                <Award size={20} style={{ color: "#fbbf24" }} />
                <div>
                  <span className="pr-stat-label">Mejor resultado</span>
                  <span className="pr-stat-value" style={{ color: "#fbbf24" }}>
                    {best ? `${best.score} pts` : "—"}
                  </span>
                </div>
              </div>

              {latest && (() => {
                const cl = CLASSIFY[latest.classification] ?? CLASSIFY.neutro;
                const Ic = cl.Icon;
                return (
                  <div className="pr-stat-card">
                    <Ic size={20} style={{ color: cl.color }} />
                    <div>
                      <span className="pr-stat-label">Último estado</span>
                      <span className="pr-stat-value" style={{ color: cl.color }}>{cl.label}</span>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* DISTRIBUCIÓN */}
            <div className="pr-dist-card">
              <h3 className="pr-section-title">Distribución de estados</h3>
              <div className="pr-dist-bars">
                {Object.entries(CLASSIFY).map(([key, { label, color }]) => {
                  const count = counts[key] || 0;
                  const pct   = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <div className="pr-bar-row" key={key}>
                      <span className="pr-bar-label">{label}</span>
                      <div className="pr-bar-track">
                        <div
                          className="pr-bar-fill"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                      <span className="pr-bar-count" style={{ color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HISTORIAL */}
            <div className="pr-history">
              <h3 className="pr-section-title">Historial detallado</h3>
              <div className="pr-timeline">
                {records.map((r, i) => {
                  const cl = CLASSIFY[r.classification] ?? CLASSIFY.neutro;
                  const Ic = cl.Icon;
                  return (
                    <div className="pr-timeline-item" key={r.id}
                      style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="pr-tl-icon" style={{ color: cl.color, borderColor: cl.color }}>
                        <Ic size={16} />
                      </div>
                      <div className="pr-tl-body">
                        <div className="pr-tl-top">
                          <span className="pr-tl-state" style={{ color: cl.color }}>{cl.label}</span>
                          <span className="pr-tl-date">{fmt(r.createdAt)}</span>
                        </div>
                        <div className="pr-tl-score">
                          <div className="pr-tl-bar-track">
                            <div
                              className="pr-tl-bar-fill"
                              style={{
                                width: `${((r.score ?? 0) / 21) * 100}%`,
                                background: cl.color
                              }}
                            />
                          </div>
                          <span className="pr-tl-pts">{r.score ?? 0} / 21 pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTÓN */}
            <button className="pr-btn-new" onClick={() => navigate("/home/questionnaire")}>
              <Activity size={16} /> Nueva evaluación
            </button>
          </>
        )}

      </div>
    </div>
  );
}