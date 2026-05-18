import { useStressRoom } from "../../context/StressRoomContext";
import STRESS_ITEMS from "./StressItemsData";

const StressHUD = ({ isMobile }) => {
  const { collected } = useStressRoom();
  return (
    <div className="stress-hud">
      <div className="sh-counter">
        <span className="sh-counter-val">{collected.length}</span>
        <span className="sh-counter-sep">/</span>
        <span className="sh-counter-total">{STRESS_ITEMS.length}</span>
        <span className="sh-counter-label">técnicas</span>
      </div>
      <div className="sh-items">
        {STRESS_ITEMS.map((item) => {
          const done = collected.includes(item.id);
          return (
            <div key={item.id} className={`sh-item ${done ? "sh-item-done" : "sh-item-pending"}`}
              style={{ "--c": item.color }} title={item.title}>
              <span className="sh-item-emoji">{item.emoji}</span>
              {done && <span className="sh-item-check">✓</span>}
            </div>
          );
        })}
      </div>
      {!isMobile && (
        <div className="sh-controls">
          <span>WASD / ↑↓←→ Mover</span>
          <span>Shift Correr</span>
          <span>Acércate a los objetos</span>
        </div>
      )}
    </div>
  );
};

export default StressHUD;