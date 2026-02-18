import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AVATARS = [
  { id: "chibi-1", name: "Chibi 1", emoji: "🧑‍🎓" },
  { id: "chibi-2", name: "Chibi 2", emoji: "👩‍💻" },
  { id: "chibi-3", name: "Chibi 3", emoji: "🧑‍🎨" },
];

export default function AvatarSelect() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("chibi-1");

  const handleContinue = () => {
    localStorage.setItem("avatar", selected);
    navigate("/scene");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Elige tu avatar (chibi)</h1>
      <p>Selecciona un avatar para entrar al escenario.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        {AVATARS.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a.id)}
            style={{
              padding: 16,
              borderRadius: 12,
              border: selected === a.id ? "2px solid black" : "1px solid #ccc",
              minWidth: 120,
              cursor: "pointer",
            }}
            aria-pressed={selected === a.id}
          >
            <div style={{ fontSize: 32 }}>{a.emoji}</div>
            <div>{a.name}</div>
          </button>
        ))}
      </div>

      <button onClick={handleContinue} style={{ marginTop: 24 }}>
        Entrar al escenario 3D
      </button>
    </div>
  );
}
