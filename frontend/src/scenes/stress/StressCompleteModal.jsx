import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStressRoom } from "../../context/StressRoomContext";

const StressCompleteModal = () => {
  const { roomComplete, resetRoom } = useStressRoom();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomComplete) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [261.63, 329.63, 392, 523.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.18 + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.18 + 0.35);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.4);
      });
      navigator.vibrate?.([30, 40, 30, 40, 80]);
    } catch { }
  }, [roomComplete]);

  if (!roomComplete) return null;

  return (
    <div className="scm-overlay">
      <div className="scm-modal">
        <div className="scm-stars">
          {["⭐","🌟","✨","⭐","🌟"].map((s, i) => (
            <span key={i} className="scm-star" style={{ animationDelay: `${i * 0.15}s` }}>{s}</span>
          ))}
        </div>
        <div className="scm-icon">🧘</div>
        <h2 className="scm-title">¡Sala de Estrés Completada!</h2>
        <p className="scm-subtitle">Practicaste las 5 técnicas de manejo del estrés.<br />Tu bienestar emocional ha mejorado hoy.</p>
        <div className="scm-badges">
          {["🌬️","💪","🏔️","📓","🌱"].map((e, i) => (
            <div key={i} className="scm-badge" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>{e}</div>
          ))}
        </div>
        <div className="scm-actions">
          <button className="scm-btn scm-btn-primary" onClick={() => navigate("/home")}>🏠 Volver al inicio</button>
          <button className="scm-btn scm-btn-secondary" onClick={resetRoom}>🔄 Jugar de nuevo</button>
        </div>
      </div>
    </div>
  );
};

export default StressCompleteModal;