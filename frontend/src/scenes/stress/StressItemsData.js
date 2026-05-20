// =============================================================================
// src/components/stress/StressItemsData.js
// Items de bienestar — distribuidos por todo el jardín
//
// MODELOS DISPONIBLES PARA ITEMS INTERACTIVOS:
// No tenemos GLBs de "objetos de bienestar" específicos (banca, libro, vela…)
// → Los items usan geometría procedural (icosaedro brillante) que ya estaba.
//    Si consigues modelos en poly.pizza o kenney.nl puedes asignarlos en `modelUrl`.
//
// MODELOS SUGERIDOS A DESCARGAR (todos gratuitos CC0):
// 🌬️ Respiración  → poly.pizza: "wind chimes" / "meditation candle"
// 💪 Relajación   → poly.pizza: "yoga mat" / "exercise"
// 🏔️ Visualización → poly.pizza: "crystal" / "gem"
// 📓 Escritura    → poly.pizza: "notebook" / "journal book"
// 🌱 Grounding    → poly.pizza: "potted plant" / "leaf"
// Descarga en .glb y coloca en /models/Items/
// =============================================================================

const STRESS_ITEMS = [
  {
    id: 1,
    title: "Respiración 4-7-8",
    emoji: "🌬️",
    color: "#60a5fa",
    glowColor: "#3b82f6",
    // Posición en el jardín — cerca del árbol noreste
    position: [6, 1.5, -4],
    // modelUrl: "/models/Items/candle.glb",  ← descomenta cuando tengas el GLB
    description: "Técnica de respiración para activar el sistema nervioso parasimpático.",
    steps: [
      { text: "Siéntate cómodamente y cierra los ojos.",                                   duration: 4 },
      { text: "Inhala por la nariz contando mentalmente hasta 4.",                         duration: 4 },
      { text: "Mantén el aire contando hasta 7.",                                          duration: 7 },
      { text: "Exhala completamente por la boca contando hasta 8.",                        duration: 8 },
      { text: "Repite el ciclo 3 veces. Siente cómo baja la tensión.",                    duration: 5 },
    ],
  },
  {
    id: 2,
    title: "Relajación Muscular",
    emoji: "💪",
    color: "#a78bfa",
    glowColor: "#8b5cf6",
    // Posición — zona sureste junto a las flores moradas
    position: [-5, 1.5, 5],
    // modelUrl: "/models/Items/yoga_mat.glb",
    description: "Tensión y liberación progresiva para soltar el estrés acumulado en el cuerpo.",
    steps: [
      { text: "Cierra los ojos. Respira profundo.",                                        duration: 4 },
      { text: "Aprieta con fuerza los puños durante 5 segundos.",                          duration: 5 },
      { text: "Suéltalos de golpe. Siente la diferencia.",                                 duration: 5 },
      { text: "Ahora haz lo mismo con los hombros: súbelos y bájalos.",                    duration: 7 },
      { text: "Recorre todo tu cuerpo así. Cada músculo que sueltas es estrés que se va.", duration: 6 },
    ],
  },
  {
    id: 3,
    title: "Visualización Segura",
    emoji: "🏔️",
    color: "#34d399",
    glowColor: "#10b981",
    // Posición — fondo norte, entre los pinos
    position: [0, 1.5, -8],
    // modelUrl: "/models/Items/crystal.glb",
    description: "Crea un refugio mental donde el estrés no puede entrar.",
    steps: [
      { text: "Cierra los ojos. Respira dos veces profundo.",                              duration: 6 },
      { text: "Imagina un lugar donde te sientas completamente seguro y en paz.",          duration: 6 },
      { text: "¿Qué ves? ¿Qué colores? ¿Qué sonidos hay?",                                duration: 6 },
      { text: "Permanece ahí. Siente la calidez y la calma del lugar.",                   duration: 7 },
      { text: "Lleva esa sensación contigo al abrir los ojos.",                            duration: 5 },
    ],
  },
  {
    id: 4,
    title: "Escritura Expresiva",
    emoji: "📓",
    color: "#fbbf24",
    glowColor: "#f59e0b",
    // Posición — zona suroeste junto al tronco de madera
    position: [-6, 1.5, 3],
    // modelUrl: "/models/Items/notebook.glb",
    description: "Sacar el estrés del cuerpo y ponerlo en palabras libera tensión mental.",
    steps: [
      { text: "Toma papel y lápiz (o abre una nota en tu teléfono).",                     duration: 4 },
      { text: "Escribe sin filtros todo lo que te está generando estrés ahora mismo.",     duration: 8 },
      { text: "No corrijas ni juzgues. Solo escribe.",                                     duration: 6 },
      { text: "Cuando termines, lee lo que escribiste con compasión.",                     duration: 6 },
      { text: "Cierra la nota. Ya no está solo dentro de ti.",                             duration: 5 },
    ],
  },
  {
    id: 5,
    title: "Grounding 5-4-3-2-1",
    emoji: "🌱",
    color: "#f87171",
    glowColor: "#ef4444",
    // Posición — orilla del río / zona del agua
    position: [-11, 1.5, -7],
    // modelUrl: "/models/Items/plant.glb",
    description: "Conecta con el presente para salir de la espiral de estrés.",
    steps: [
      { text: "Mira a tu alrededor: nombra 5 cosas que puedes VER.",                      duration: 8 },
      { text: "Toca algo cercano: identifica 4 cosas que puedes SENTIR.",                 duration: 7 },
      { text: "Escucha con atención: 3 cosas que puedes OÍR ahora mismo.",                duration: 6 },
      { text: "Inhala profundo: ¿2 cosas que puedes OLER?",                               duration: 5 },
      { text: "¿1 cosa que puedes SABOREAR? Estás aquí. Estás bien.",                     duration: 5 },
    ],
  },
];

export default STRESS_ITEMS;