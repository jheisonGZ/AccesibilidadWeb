import VirtualJoystick from "./VirtualJoystick";
import { useState } from "react";
import {
  Footprints,        // ← Para CORRER (huellas)
  ArrowUpFromLine    // ← Para SALTAR
} from "lucide-react";

export default function MobileControlsOverlay({
  controls
}) {
  const [runPressed, setRunPressed] = useState(false);
  const [jumpPressed, setJumpPressed] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none"
      }}
    >
      {/* LEFT - Joystick de movimiento */}
      <div
        style={{
          position: "absolute",
          left: 50,
          bottom: 50,
          pointerEvents: "auto"
        }}
      >
        <VirtualJoystick
          side="left"
          onMove={(v) => {
            controls.current.move = v;
          }}
        />
      </div>

      {/* BOTONES DERECHA */}
      <div
        style={{
          position: "absolute",
          right: 30,
          bottom: 70,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          pointerEvents: "auto"
        }}
      >
        {/* CORRER - HUELLAS */}
        <button
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "none",
            outline: "none",
            background: runPressed ? "#2563eb" : "#3b82f6",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: runPressed 
              ? "0 0 15px rgba(59,130,246,0.5)" 
              : "0 0 20px rgba(0,0,0,0.3)",
            transform: runPressed ? "scale(0.92)" : "scale(1)",
            transition: "all 0.05s ease",
            cursor: "pointer",
            touchAction: "none"
          }}
          onTouchStart={(e) => {
            controls.current.run = true;
            setRunPressed(true);
          }}
          onTouchEnd={(e) => {
          
            controls.current.run = false;
            setRunPressed(false);
          }}
          onMouseDown={() => {
            controls.current.run = true;
            setRunPressed(true);
          }}
          onMouseUp={() => {
            controls.current.run = false;
            setRunPressed(false);
          }}
          onMouseLeave={() => {
            controls.current.run = false;
            setRunPressed(false);
          }}
        >
          <Footprints size={36} />
        </button>

        {/* SALTAR - FLECHA ARRIBA */}
        <button
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "none",
            outline: "none",
            background: jumpPressed ? "#059669" : "#10b981",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: jumpPressed 
              ? "0 0 15px rgba(16,185,129,0.5)" 
              : "0 0 20px rgba(0,0,0,0.3)",
            transform: jumpPressed ? "scale(0.92)" : "scale(1)",
            transition: "all 0.05s ease",
            cursor: "pointer",
            touchAction: "none"
          }}
          onTouchStart={(e) => {
            controls.current.jump = true;
            setJumpPressed(true);
          }}
          onTouchEnd={(e) => {
            
            controls.current.jump = false;
            setJumpPressed(false);
          }}
          onMouseDown={() => {
            controls.current.jump = true;
            setJumpPressed(true);
          }}
          onMouseUp={() => {
            controls.current.jump = false;
            setJumpPressed(false);
          }}
          onMouseLeave={() => {
            controls.current.jump = false;
            setJumpPressed(false);
          }}
        >
          <ArrowUpFromLine size={36} />
        </button>
      </div>
    </div>
  );
}