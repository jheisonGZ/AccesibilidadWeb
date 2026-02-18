import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";


const QUESTIONS = [
  "Me he sentido nervioso/a o ansioso/a últimamente.",
  "He tenido dificultad para relajarme.",
  "Me ha costado concentrarme en mis actividades.",
  "He sentido tensión o irritabilidad.",
  "He sentido que necesito un descanso mental.",
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(0)); // 0..4

  const score = useMemo(() => answers.reduce((a, b) => a + b, 0), [answers]);

  const classification = useMemo(() => {
    if (score >= 15) return "ansiedad";
    if (score >= 8) return "estres";
    return "neutro";
  }, [score]);

  const handleChange = (idx, value) => {
    const next = [...answers];
    next[idx] = Number(value);
    setAnswers(next);
  };

  const handleSubmit = async () => {
  localStorage.setItem("emotion", classification);

  try {
    const user = auth.currentUser;
    console.log("currentUser:", user);

    if (!user) {

      console.log("UID:", user.uid);
      console.log("Email:", user.email);

      console.warn("No hay usuario autenticado. Te envío a login.");
      navigate("/");
      return;
    }

    console.log("Guardando Firestore para UID:", user.uid);

    // 1) Documento del usuario
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        lastEmotion: classification,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

      console.log("✅ user doc actualizado");


    // 2) Historial
    await setDoc(
      doc(db, "users", user.uid, "assessments", String(Date.now())),
      {
        email: user.email,
        score,
        classification,
        createdAt: serverTimestamp(),
      }

    );
    console.log("✅ assessment creado");
    console.log("✅ Guardado en Firestore OK");
    navigate("/avatar");
  } catch (e) {
    console.error("❌ Error guardando en Firestore:", e);
  }
};

  return (
    <div style={{ padding: 24 }}>
      <h1>Autoevaluación emocional</h1>
      <p>Responde rápido. Escala 0–4.</p>

      <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
        {QUESTIONS.map((q, idx) => (
          <div
            key={q}
            style={{
              border: "1px solid #444",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <p style={{ margin: 0, marginBottom: 8 }}>
              {idx + 1}. {q}
            </p>

            <select
              value={answers[idx]}
              onChange={(e) => handleChange(idx, e.target.value)}
            >
              <option value={0}>0 - Nada</option>
              <option value={1}>1 - Poco</option>
              <option value={2}>2 - Moderado</option>
              <option value={3}>3 - Alto</option>
              <option value={4}>4 - Muy alto</option>
            </select>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Puntaje:</strong> {score} | <strong>Clasificación:</strong>{" "}
        {classification}
      </div>

      <button onClick={handleSubmit} style={{ marginTop: 16 }}>
        Continuar a elegir avatar
      </button>
    </div>
  );
}
