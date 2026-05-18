import { useRef, useCallback } from "react";
const RADIUS = 50;
const VirtualJoystick = ({ side, onMove }) => {
  const baseRef = useRef(); const knobRef = useRef();
  const touchId = useRef(null); const origin = useRef({ x: 0, y: 0 });
  const move = useCallback((cx, cy) => {
    let dx = cx - origin.current.x, dy = cy - origin.current.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d > RADIUS) { dx = dx/d*RADIUS; dy = dy/d*RADIUS; }
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px,${dy}px)`;
    onMove({ x: dx/RADIUS, y: -dy/RADIUS });
  }, [onMove]);
  const reset = useCallback(() => {
    if (knobRef.current) knobRef.current.style.transform = "translate(0,0)";
    onMove({ x: 0, y: 0 }); touchId.current = null;
  }, [onMove]);
  return (
    <div ref={baseRef} className={`vj-base vj-${side}`} style={{ touchAction: "none" }}
      onTouchStart={(e) => {
        if (touchId.current !== null) return;
        const t = e.changedTouches[0]; touchId.current = t.identifier;
        const r = baseRef.current.getBoundingClientRect();
        origin.current = { x: r.left + r.width/2, y: r.top + r.height/2 };
        move(t.clientX, t.clientY); e.preventDefault();
      }}
      onTouchMove={(e) => {
        for (const t of e.changedTouches) if (t.identifier === touchId.current) { move(t.clientX, t.clientY); break; }
        e.preventDefault();
      }}
      onTouchEnd={(e) => {
        for (const t of e.changedTouches) if (t.identifier === touchId.current) { reset(); break; }
      }}
    >
      <div ref={knobRef} className="vj-knob" />
    </div>
  );
};
export default VirtualJoystick;