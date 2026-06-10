// Canvas: crea el entorno 3D donde se renderiza toda la escena
import { Canvas } from "@react-three/fiber";

// useGLTF: permite cargar modelos .glb exportados desde Blender
import { useGLTF } from "@react-three/drei";

// Librería principal de Three.js
import * as THREE from "three";

// Hook de React para ejecutar código cuando el componente se monta
import { useEffect } from "react";

// Controlador del personaje
import PlayerController from "../components/3d/player/PlayerController";

// Controles táctiles para móviles
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";

// Mensaje que obliga a girar el dispositivo horizontalmente
import RotatePrompt from "../components/3d/mobile/RotatePrompt";

// Hook que maneja los botones virtuales del móvil
import { useMobileControls } from "../components/3d/mobile/useMobileControls";

// Hook que detecta si el dispositivo está en vertical u horizontal
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";


// ====================================================
// MODELO DEL ESCENARIO PRINCIPAL (BOSQUE)
// ====================================================
function Escenario() {

  // Carga el archivo exportado desde Blender
  const { scene } = useGLTF("/models/escenario1.glb");

  return (
    <primitive
      object={scene}

      // POSICIÓN DEL ESCENARIO
      // X = izquierda (-) / derecha (+)
      // Y = abajo (-) / arriba (+)
      // Z = atrás (-) / adelante (+)
      position={[-7, -5.0, -54]}

      // ROTACIÓN EN RADIANES
      // [X, Y, Z]
      rotation={[0, -2.45, 0.098]}

      // Escala general del modelo
      scale={1}

      // Recibe sombras
      receiveShadow

      // Proyecta sombras
      castShadow
    />
  );
}


// ====================================================
// SKYDOME (CIELO)
// ====================================================
function SkyDome() {

  // Carga el modelo del cielo
  const { scene } = useGLTF("/models/Otros/sky.glb");

  useEffect(() => {

    // Recorre todos los objetos del modelo
    scene.traverse((obj) => {

      // Solo modifica los Mesh
      if (obj.isMesh) {

        // Renderiza ambas caras del modelo
        obj.material.side = THREE.DoubleSide;

        // Evita conflictos de profundidad
        obj.material.depthWrite = false;

        // Fuerza actualización del material
        obj.material.needsUpdate = true;

        // Se renderiza antes que otros objetos
        obj.renderOrder = 0.1;
      }
    });

  }, [scene]);

  return (
    <primitive
      object={scene}

      // Centro de la escena
      position={[0, 0, 0]}

      // Tamaño original del cielo
      scale={1}
    />
  );
}


// ====================================================
// PRECARGA DE MODELOS
// ====================================================

// Se cargan antes de entrar al escenario
// para evitar pantallas de carga o parpadeos

useGLTF.preload("/models/escenario1.glb");
useGLTF.preload("/models/Otros/sky.glb");


// ====================================================
// ESCENA PRINCIPAL
// ====================================================
export default function SalaBosque() {

  // Obtiene el estado de los controles móviles
  const mobileControls = useMobileControls();

  // Detecta si el dispositivo está vertical
  const { isPortrait } = useLandscapeLock();


  // Detecta si el usuario está usando un dispositivo móvil
  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
      .test(navigator.userAgent);

  // Mostrar mensaje de rotación si está en vertical
  const showRotatePrompt = isMobile && isPortrait;

  return (
    <>
      <div
        style={{

          // Ocupa toda la pantalla
          width: "100vw",
          height: "100vh",

          // Evita scroll
          overflow: "hidden",

          // Fijo en pantalla
          position: "fixed",

          // Equivalente a:
          // top:0 right:0 bottom:0 left:0
          inset: 0,

          // Oculta la escena si se muestra el mensaje
          visibility: showRotatePrompt
            ? "hidden"
            : "visible",

          // Bloquea interacción mientras se muestra
          pointerEvents: showRotatePrompt
            ? "none"
            : "auto",
        }}
      >

        {/* ESCENA 3D */}
        <Canvas

          style={{
            width: "100%",
            height: "100%",
          }}

          // Cámara principal
          camera={{
            position: [0, 2, 10],
            fov: 60,
          }}

          // Configuración WebGL
          gl={{
            powerPreference: "high-performance",

            // Evita que el contexto WebGL se pierda
            onContextLost: (e) => e.preventDefault(),
          }}

          // Pausa el renderizado cuando aparece
          // el mensaje de rotación
          frameloop={
            showRotatePrompt
              ? "never"
              : "always"
          }
        >

          {/* Luz ambiental */}
          <ambientLight intensity={1.0} />

          {/* Luz principal tipo sol */}
          <directionalLight
            position={[5, 9, 6]}
            intensity={2}
            castShadow
          />

          {/* Cielo */}
          <SkyDome />

          {/* Bosque */}
          <Escenario />

          {/* Personaje */}
          <PlayerController
            controls={mobileControls}
          />

        </Canvas>

        {/* Controles táctiles para móvil */}
        {isMobile && !showRotatePrompt && (
          <MobileControlsOverlay
            controls={mobileControls}
          />
        )}

      </div>

      {/* Mensaje para girar el dispositivo */}
      {showRotatePrompt && (
        <RotatePrompt />
      )}

    </>
  );
}