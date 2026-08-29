import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Wind, Heart, Smile, Lock, Trophy, Sparkles, CheckCircle, CheckCircle2, Map, LayoutDashboard } from "lucide-react";
import { auth, db } from "../services/firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

import PlayerController from "../components/3d/player/PlayerController";
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";
import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";
import DevPerf from "../components/3d/DevPerf";

// ─────────────────────────────────────────────────────────
// DATOS DE MISIONES - TÓTEMS DEL BOSQUE
// ─────────────────────────────────────────────────────────
const TOTEM_DATA = [
  {
    id: 0,
    position: [8, -12.5, 18],
    scale: 1.5,
    titulo: "Respiración Consciente",
    mensaje:
      "Respira lentamente y presta atención a cada inhalación y exhalación. Esta técnica te ayudará a encontrar la calma en momentos de agitación.",
    Icono: Wind,
  },
  {
    id: 1,
    position: [-14, -12, -12],
    scale: 1.5,
    titulo: "Pensamiento Positivo",
    mensaje:
      "Identifica una preocupación y reemplázala por una acción concreta que puedas realizar. Transforma la inquietud en movimiento positivo.",
    Icono: Smile,
  },
  {
    id: 2,
    position: [19, -12, -5],
    scale: 1.5,
    titulo: "Reconocimiento Emocional",
    mensaje:
      "Reconoce cómo te sientes sin juzgar tus emociones. Date permiso para sentir y observa tus emociones con compasión.",
    Icono: Heart,
  },
];

// ─────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL COFRE
// ─────────────────────────────────────────────────────────
const COFRE_CONFIG = {
  position: [0, -12.7, -5],
  scale: 0.13,
};

const PROXIMITY_RADIUS = 1.5;

// ─────────────────────────────────────────────────────────
// CÁMARA QUE SIGUE AL PERSONAJE
// ─────────────────────────────────────────────────────────
function FollowCamera({ target }) {
  const { camera } = useThree();

  useFrame(() => {
    if (!target.current) return;
    camera.position.x = target.current.position.x;
    camera.position.z = target.current.position.z + 10;
    camera.position.y = target.current.position.y + 4;
    camera.lookAt(
      target.current.position.x,
      target.current.position.y + 1,
      target.current.position.z
    );
  });

  return null;
}

// ─────────────────────────────────────────────────────────
// PARTÍCULAS DEL BOSQUE (Verde)
// ─────────────────────────────────────────────────────────
function ForestParticles() {
  const count = 150;
  const mesh = useRef();

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 5 - 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      spd.push(0.015 + Math.random() * 0.03);
    }
    return [pos, spd];
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += speeds[i];
      pos[i * 3 + 1] += speeds[i] * 0.15;
      if (pos[i * 3] > 30) {
        pos[i * 3] = -30;
        pos[i * 3 + 1] = Math.random() * 5 - 1;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#86efac"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────
// ESCENARIO BOSQUE
// ─────────────────────────────────────────────────────────
function Bosque() {
  const { scene } = useGLTF("/models/escenario1.glb");

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive
    // position={[X, Y, Z]}
// X: (-) izquierda  | (+) derecha
// Y: (-) abajo      | (+) arriba
// Z: (-) atrás      | (+) adelante
      object={scene}
      position={[-1, -1, -5]}  // // position={[izquierda/derecha, abajo/arriba, atrás/adelante]}
      rotation={[0.1, -2.49, 0.04]}
      scale={0.8}
      receiveShadow
      castShadow
    />
  );
}

// ─────────────────────────────────────────────────────────
// SKYDOME
// ─────────────────────────────────────────────────────────
function SkyDome() {
  const { scene } = useGLTF("/models/Otros/sky.glb");

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.material.side = THREE.DoubleSide;
        obj.material.depthWrite = false;
        obj.material.needsUpdate = true;
        obj.renderOrder = 0.1;
      }
    });
  }, [scene]);

  return <primitive object={scene} position={[0, 0, 0]} scale={1} />;
}

// ─────────────────────────────────────────────────────────
// TÓTEM INDIVIDUAL
// ─────────────────────────────────────────────────────────
function Totem({ data, playerRef, collected, onNearby, isNearby }) {
  const { scene } = useGLTF("/models/totem.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const meshRef = useRef();

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  // Flotación suave
  useFrame(({ clock }) => {
    if (!meshRef.current || collected) return;
    meshRef.current.position.y =
      data.position[1] + Math.sin(clock.elapsedTime * 1.2 + data.id) * 0.15;
    meshRef.current.rotation.y += 0.005;
  });

  // Detección de proximidad
  useFrame(() => {
    if (!playerRef.current || collected) return;
    const px = playerRef.current.position.x;
    const pz = playerRef.current.position.z;
    const dx = px - data.position[0];
    const dz = pz - data.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    onNearby(data.id, dist < PROXIMITY_RADIUS);
  });

  if (collected) return null;

  return (
    <primitive
      ref={meshRef}
      object={clonedScene}
      position={data.position}
      scale={data.scale || 1}
      castShadow
    />
  );
}

// ─────────────────────────────────────────────────────────
// COFRE CON BRILLO VERDE QUE SE DETIENE AL ABRIR
// ─────────────────────────────────────────────────────────
function Cofre({ playerRef, allCollected, onNearby, isNearby, shouldOpen, config, onOpenComplete, onCloseComplete }) {
  const { scene, animations } = useGLTF("/models/cofre.glb");
  const groupRef = useRef();
  const { actions, mixer } = useAnimations(animations, groupRef);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  // Abrir el cofre
  useEffect(() => {
    if (shouldOpen && !isOpen && !isClosing && !isOpening && actions) {
      const openAction = actions["Scene"];

      if (openAction) {
        setIsOpening(true);

        openAction.setEffectiveTimeScale(1.5);
        openAction.setLoop(THREE.LoopOnce, 1);
        openAction.clampWhenFinished = true;
        openAction.reset().play();

        if (mixer) {
          const onFinished = () => {
            setIsOpening(false);
            setIsOpen(true);
            openAction.setEffectiveTimeScale(1);
            if (onOpenComplete) onOpenComplete();
            mixer.removeEventListener('finished', onFinished);
          };
          mixer.addEventListener('finished', onFinished);
        }
      }
    }
  }, [shouldOpen, isOpen, isClosing, isOpening, actions, mixer, onOpenComplete]);

  // Función para cerrar el cofre
  const closeCofre = useCallback(() => {
    if (isOpen && !isClosing && actions) {
      const openAction = actions["Scene"];

      if (openAction) {
        setIsClosing(true);

        openAction.setEffectiveTimeScale(-1.5);
        openAction.setLoop(THREE.LoopOnce, 1);
        openAction.clampWhenFinished = true;
        openAction.paused = false;
        openAction.play();

        if (mixer) {
          const onCloseFinished = () => {
            setIsOpen(false);
            setIsClosing(false);
            openAction.setEffectiveTimeScale(1);
            if (onCloseComplete) onCloseComplete();
            mixer.removeEventListener('finished', onCloseFinished);
          };
          mixer.addEventListener('finished', onCloseFinished);
        }
      }
    }
  }, [isOpen, isClosing, actions, mixer, onCloseComplete]);

  // Exponer closeCofre al padre
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.closeCofre = closeCofre;
    }
  }, [closeCofre]);

  // Detección de proximidad al cofre
  useFrame(() => {
    if (!playerRef.current || isOpen || isClosing || isOpening) return;
    const px = playerRef.current.position.x;
    const pz = playerRef.current.position.z;
    const dx = px - config.position[0];
    const dz = pz - config.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    onNearby(dist < PROXIMITY_RADIUS);
  });

  // BRILLO VERDE - Se detiene al presionar E
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const shouldGlow = allCollected && !isOpen && !isOpening && !isClosing;

    groupRef.current.scale.set(config.scale, config.scale, config.scale);

    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (shouldGlow) {
          child.material.emissive = new THREE.Color("#4ade80");
          child.material.emissiveIntensity = 0.3 + Math.sin(clock.elapsedTime * 2.5) * 0.2;
        } else {
          child.material.emissive = new THREE.Color("#000000");
          child.material.emissiveIntensity = 0;
        }
      }
    });
  });

  useEffect(() => {
    return () => {
      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.emissive = new THREE.Color("#000000");
            child.material.emissiveIntensity = 0;
          }
        });
      }
    };
  }, []);

  return (
    <group ref={groupRef} position={config.position}>
      {allCollected && !isOpen && !isOpening && !isClosing && (
        <pointLight
          color="#4ade80"
          intensity={0.6}
          distance={3}
          decay={2}
        />
      )}
      <primitive object={scene} scale={config.scale} castShadow />
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// ESCENA 3D
// ─────────────────────────────────────────────────────────
function MisionScene({
  playerRef,
  mobileControls,
  collectedIds,
  onTotemNearby,
  nearbyTotemId,
  onCofreNearby,
  isNearCofre,
  allCollected,
  cofreAbierto,
  onCofreOpenComplete,
  onCofreCloseComplete,
  cofreRef,
}) {
  return (
    <>
      <ambientLight intensity={0.7} color="#86efac" />
      <directionalLight
        position={[20, 30, 10]}
        intensity={2.4}
        color="#ecfdf5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.001}
      />

      <FollowCamera target={playerRef} />
      <SkyDome />
      <ForestParticles />
      <Bosque />

      {TOTEM_DATA.map((data) => (
        <Totem
          key={data.id}
          data={data}
          playerRef={playerRef}
          collected={collectedIds.includes(data.id)}
          onNearby={onTotemNearby}
          isNearby={nearbyTotemId === data.id}
        />
      ))}

      <Cofre
        ref={cofreRef}
        playerRef={playerRef}
        allCollected={allCollected}
        onNearby={onCofreNearby}
        isNearby={isNearCofre}
        shouldOpen={cofreAbierto}
        config={COFRE_CONFIG}
        onOpenComplete={onCofreOpenComplete}
        onCloseComplete={onCofreCloseComplete}
      />

<PlayerController
  controls={mobileControls}
  startPosition={[6, -13.0, 19]}
  floorY={-13.0}
  playerRef={playerRef}
  limites={{ 
    xMin: -15,    // ← Solo 11 unidades a la izquierda del inicio
    xMax: 22,    // ← 9 unidades a la derecha del inicio
    zMin: -12,     // ← 14 unidades atrás del inicio
    zMax: 24.2     // ← 6 unidades adelante del inicio 
  }}
  avatarScale={1.2}
/>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// MODAL DE TÓTEM
// ─────────────────────────────────────────────────────────
function ModalTotem({ data, totalCollected, onContinuar }) {
  if (!data) return null;
  const { Icono } = data;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalIconBig}>
          <Icono size={48} color="#4ade80" strokeWidth={1.5} />
        </div>
        <h2 style={styles.modalTitulo}>{data.titulo}</h2>
        <p style={styles.modalMensaje}>{data.mensaje}</p>
        <div style={styles.contadorBadge}>
          {totalCollected} / 3 enseñanzas descubiertas
        </div>
        <button style={styles.btnContinuar} onClick={onContinuar}>
          Continuar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MODAL DE COFRE BLOQUEADO
// ─────────────────────────────────────────────────────────
function ModalCofreBloqueado({ onClose }) {
  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 380 }}>
        <div style={styles.modalIconBig}>
          <Lock size={48} color="#4ade80" strokeWidth={1.5} />
        </div>
        <h2 style={styles.modalTitulo}>Cofre Sellado</h2>
        <p style={styles.modalMensaje}>
          Todavía quedan enseñanzas por descubrir.
        </p>
        <p style={{ ...styles.modalMensaje, fontSize: 13, opacity: 0.8 }}>
          Encuentra los tres tótems para desbloquear el cofre.
        </p>
        <button style={styles.btnContinuar} onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MODAL DE LOGRO FINAL
// ─────────────────────────────────────────────────────────
function ModalLogroFinal({ onClose, onSalir }) {
  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 420 }}>
        <div style={styles.modalIconBig}>
          <Trophy size={52} color="#4ade80" strokeWidth={1.5} />
        </div>
        <h2 style={{ ...styles.modalTitulo, color: "#4ade80" }}>
          ¡Logro Desbloqueado!
        </h2>
        <p style={{ ...styles.modalMensaje, fontWeight: 700, fontSize: 18 }}>
          Guardián del Bosque
        </p>
        <p style={styles.modalMensaje}>
          Has completado la misión del Bosque de la Calma y descubierto tres técnicas para fortalecer la calma y la regulación emocional.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ ...styles.btnContinuar, display: "flex", alignItems: "center", gap: 8 }} onClick={onClose}>
            <Map size={18} />
            Continuar explorando
          </button>
          <button
            style={{
              ...styles.btnContinuar,
              background: "linear-gradient(135deg, #4ade80, #22c55e)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
            onClick={onSalir}
          >
            <LayoutDashboard size={18} />
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MODAL DE MISIÓN COMPLETADA (REENTRADA)
// ─────────────────────────────────────────────────────────
function ModalMisionCompletada({ onContinuar, onSalir }) {
  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 440 }}>
        <div style={styles.modalIconBig}>
          <Trophy size={52} color="#4ade80" strokeWidth={1.5} />
        </div>
        <h2 style={{ ...styles.modalTitulo, color: "#4ade80" }}>
          🏆 Misión Completada
        </h2>
        <div style={{ marginBottom: 16 }}>
          <CheckCircle2 size={20} color="#4ade80" style={{ marginRight: 6, verticalAlign: "middle" }} />
          <span style={{ color: "#4ade80", fontSize: 14, fontWeight: 600 }}>Ya has completado la misión:</span>
        </div>
        <p style={{ ...styles.modalMensaje, fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
          Guardián del Bosque
        </p>
        <p style={{ ...styles.modalMensaje, fontSize: 14 }}>
          Has descubierto las tres técnicas para la calma y regulación emocional del Bosque de la Calma.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
          <button
            style={{ ...styles.btnContinuar, display: "flex", alignItems: "center", gap: 8 }}
            onClick={onContinuar}
          >
            <Map size={18} />
            Continuar Explorando
          </button>
          <button
            style={{
              ...styles.btnContinuar,
              background: "linear-gradient(135deg, #4ade80, #22c55e)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
            onClick={onSalir}
          >
            <LayoutDashboard size={18} />
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────────
function HUDMision({ collectedIds, showETotem, showECofre, isMobile, onInteractMobile, cofreYaAbierto, misionCompletada }) {
  const allCollected = collectedIds.length === 3;

  return (
    <>
      {/* Contador de enseñanzas */}
      {!cofreYaAbierto && !misionCompletada && (
        <div style={styles.hudContador}>
          <Wind size={16} color="#4ade80" style={{ marginRight: 4 }} />
          <span style={styles.hudTexto}>
            {collectedIds.length} / 3 enseñanzas
          </span>
        </div>
      )}

      {/* Misión activa */}
      {!cofreYaAbierto && !misionCompletada && !allCollected && (
        <div style={styles.hudMision}>
          🌲 Misión: Guardián del Bosque — Explora el Bosque de la Calma y encuentra los tres tótems ancestrales
        </div>
      )}

      {!cofreYaAbierto && !misionCompletada && allCollected && (
        <div style={{ ...styles.hudMision, borderColor: "#4ade80", color: "#4ade80" }}>
          <Sparkles size={14} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />
          Has reunido las tres enseñanzas. El cofre ha despertado. ¡Ábrelo!
        </div>
      )}

      {/* Mensaje final después del logro */}
      {(cofreYaAbierto || misionCompletada) && (
        <div style={{ ...styles.hudMision, borderColor: "#4ade80", color: "#4ade80", background: "rgba(5, 15, 5, 0.85)" }}>
          <CheckCircle size={14} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />
          ¡Misión completada! Eres el Guardián del Bosque
        </div>
      )}

      {/* Prompt tótem */}
      {showETotem && (
        <div style={styles.promptE}>
          {isMobile ? (
            <button style={styles.btnInteractMobile} onClick={onInteractMobile}>
              <Wind size={16} style={{ marginRight: 6 }} />
              Inspeccionar
            </button>
          ) : (
            <>
              <kbd style={styles.kbd}>E</kbd>
              <span style={styles.promptTexto}>Inspeccionar tótem</span>
            </>
          )}
        </div>
      )}

      {/* Prompt cofre */}
      {showECofre && (
        <div style={styles.promptE}>
          {isMobile ? (
            <button style={styles.btnInteractMobile} onClick={onInteractMobile}>
              {allCollected ? (
                <><Sparkles size={16} style={{ marginRight: 6 }} />Abrir cofre</>
              ) : (
                <><Lock size={16} style={{ marginRight: 6 }} />Examinar cofre</>
              )}
            </button>
          ) : (
            <>
              <kbd style={styles.kbd}>E</kbd>
              <span style={styles.promptTexto}>
                {allCollected ? "Abrir cofre" : "Examinar cofre"}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// PRECARGA
// ─────────────────────────────────────────────────────────
useGLTF.preload("/models/escenario1.glb");
useGLTF.preload("/models/Otros/sky.glb");
useGLTF.preload("/models/totem.glb");
useGLTF.preload("/models/cofre.glb");

// ─────────────────────────────────────────────────────────
// ESCENA PRINCIPAL
// ─────────────────────────────────────────────────────────
export default function SalaBosque({ onSalir }) {
  const mobileControls = useMobileControls();
  const { isPortrait } = useLandscapeLock();
  const playerRef = useRef();
  const cofreRef = useRef();

  const [collectedIds, setCollectedIds] = useState([]);
  const [modalTotem, setModalTotem] = useState(null);
  const [modalCofreBloq, setModalCofreBloq] = useState(false);
  const [modalLogro, setModalLogro] = useState(false);
  const [cofreAbierto, setCofreAbierto] = useState(false);
  const [cofreYaAbierto, setCofreYaAbierto] = useState(false);

  const [modalMisionCompletada, setModalMisionCompletada] = useState(false);
  const [misionCompletadaPreviamente, setMisionCompletadaPreviamente] = useState(false);

  const [nearbyTotemId, setNearbyTotemId] = useState(null);
  const [isNearCofre, setIsNearCofre] = useState(false);

  const allCollected = collectedIds.length === 3;
  const modalOpen = !!modalTotem || modalCofreBloq || modalLogro || modalMisionCompletada;

  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );
  const showRotatePrompt = isMobile && isPortrait;

  // Verificar si la misión ya fue completada al cargar
  useEffect(() => {
    const verificarMisionCompletada = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const completedRooms = data.completedRooms || [];
            if (completedRooms.includes("bosque")) {
              setMisionCompletadaPreviamente(true);
              setModalMisionCompletada(true);
              setCofreYaAbierto(true);
            }
          }
        }
      } catch (error) {
        console.error("Error verificando misión:", error);
      }
    };

    verificarMisionCompletada();
  }, []);

  // Guardar logro en Firebase cuando se abre el cofre
  const handleCofreOpenComplete = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          achievements: arrayUnion("guardian_del_bosque"),
          completedRooms: arrayUnion("bosque")
        });
      }
    } catch (error) {
      console.error("Error guardando logro:", error);
    }
    setTimeout(() => setModalLogro(true), 500);
  }, []);

  const handleCerrarLogro = useCallback(() => {
    setModalLogro(false);
    setCofreYaAbierto(true);
    if (cofreRef.current && cofreRef.current.closeCofre) {
      cofreRef.current.closeCofre();
    }
  }, []);

  const handleSalirDashboard = useCallback(() => {
    if (onSalir) onSalir();
  }, [onSalir]);

  const handleContinuarExplorando = useCallback(() => {
    setModalMisionCompletada(false);
  }, []);

  const handleCofreCloseComplete = useCallback(() => {
    setCofreAbierto(false);
  }, []);

  const handleTotemNearby = useCallback((id, isNear) => {
    setNearbyTotemId((prev) => {
      if (isNear) return id;
      if (prev === id) return null;
      return prev;
    });
  }, []);

  const handleCofreNearby = useCallback((isNear) => {
    setIsNearCofre(isNear);
  }, []);

  // 🎯 NUEVO: handleInteract con animaciones (como en la playa)
  const handleInteract = useCallback(() => {
    if (modalOpen) return;

    // ── Recoger tótem ──
    if (nearbyTotemId !== null && !collectedIds.includes(nearbyTotemId)) {
      const data = TOTEM_DATA.find((t) => t.id === nearbyTotemId);
      if (!data) return;

      // 🎯 Callback que se ejecuta a MITAD de la animación
      const enLaMitad = () => {
        setCollectedIds((prev) => [...prev, nearbyTotemId]);
        playSound("totem");
      };

      // 🎯 Callback cuando TERMINA toda la animación
      const alTerminar = () => {
        setModalTotem(data);
      };

      if (playerRef.current?.playAnimation) {
        playerRef.current.playAnimation("tomar", alTerminar, enLaMitad);
      } else {
        enLaMitad();
        alTerminar();
      }
      return;
    }

    // ── Cofre ──
    if (isNearCofre) {
      if (!allCollected) {
        setModalCofreBloq(true);
        playSound("bloqueado");
      } else if (!cofreAbierto) {
        // 🎯 PRIMERO: Abrimos el cofre INMEDIATAMENTE
        setCofreAbierto(true);
        playSound("cofre");
        
        // 🎯 SEGUNDO: El personaje hace su animación AL MISMO TIEMPO
        if (playerRef.current?.playAnimation) {
          playerRef.current.playAnimation("abrir");
        }
      }
    }
  }, [modalOpen, nearbyTotemId, collectedIds, isNearCofre, allCollected, cofreAbierto, playerRef]);

  useKeyE(handleInteract);

  function playSound(tipo) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tipo === "totem") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (tipo === "bloqueado") {
        osc.type = "square";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (tipo === "cofre") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (_) {}
  }

  const showETotem =
    nearbyTotemId !== null &&
    !collectedIds.includes(nearbyTotemId) &&
    !modalOpen;
  const showECofre = isNearCofre && !modalOpen && !cofreAbierto && !cofreYaAbierto;

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "absolute",
          inset: 0,
          visibility: showRotatePrompt ? "hidden" : "visible",
          pointerEvents: showRotatePrompt ? "none" : "auto",
        }}
      >
        <Canvas
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 2, 10], fov: 60 }}
          shadows
          gl={{
            powerPreference: "high-performance",
            onContextLost: (e) => e.preventDefault(),
          }}
          frameloop={showRotatePrompt ? "never" : "always"}
        >
           <DevPerf />
          <MisionScene
            playerRef={playerRef}
            mobileControls={mobileControls}
            collectedIds={collectedIds}
            onTotemNearby={handleTotemNearby}
            nearbyTotemId={nearbyTotemId}
            onCofreNearby={handleCofreNearby}
            isNearCofre={isNearCofre}
            allCollected={allCollected}
            cofreAbierto={cofreAbierto}
            onCofreOpenComplete={handleCofreOpenComplete}
            onCofreCloseComplete={handleCofreCloseComplete}
            cofreRef={cofreRef}
          />
        </Canvas>

        {!modalOpen && (
          <HUDMision
            collectedIds={collectedIds}
            showETotem={showETotem}
            showECofre={showECofre}
            isMobile={isMobile}
            onInteractMobile={handleInteract}
            cofreYaAbierto={cofreYaAbierto}
            misionCompletada={misionCompletadaPreviamente}
          />
        )}

        {isMobile && !showRotatePrompt && !modalOpen && (
          <MobileControlsOverlay controls={mobileControls} />
        )}

        {modalMisionCompletada && (
          <ModalMisionCompletada
            onContinuar={handleContinuarExplorando}
            onSalir={handleSalirDashboard}
          />
        )}

        {modalTotem && (
          <ModalTotem
            data={modalTotem}
            totalCollected={collectedIds.length}
            onContinuar={() => setModalTotem(null)}
          />
        )}
        {modalCofreBloq && (
          <ModalCofreBloqueado onClose={() => setModalCofreBloq(false)} />
        )}
        {modalLogro && (
          <ModalLogroFinal
            onClose={handleCerrarLogro}
            onSalir={handleSalirDashboard}
          />
        )}
      </div>

      {showRotatePrompt && <RotatePrompt />}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// HOOK TECLA E
// ─────────────────────────────────────────────────────────
function useKeyE(callback) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "e" || e.key === "E") callback();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callback]);
}

// ─────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(5, 15, 5, 0.78)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(6px)",
  },
  modal: {
    background: "linear-gradient(160deg, #0a1a0a 0%, #0d200d 100%)",
    border: "1.5px solid rgba(74, 222, 128, 0.45)",
    borderRadius: 20,
    padding: "36px 32px 28px",
    maxWidth: 420,
    width: "90%",
    textAlign: "center",
    boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 0 40px rgba(74,222,128,0.08)",
    animation: "fadeInModal 0.35s ease",
  },
  modalIconBig: {
    marginBottom: 10,
    display: "flex",
    justifyContent: "center",
    filter: "drop-shadow(0 2px 8px rgba(74,222,128,0.5))",
  },
  modalTitulo: {
    color: "#4ade80",
    fontSize: 22,
    fontWeight: 700,
    margin: "0 0 12px",
    letterSpacing: "0.03em",
    fontFamily: "'Segoe UI', sans-serif",
  },
  modalMensaje: {
    color: "#a0d4a0",
    fontSize: 15,
    lineHeight: 1.65,
    margin: "0 0 20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  contadorBadge: {
    display: "inline-block",
    background: "rgba(74, 222, 128, 0.15)",
    border: "1px solid rgba(74, 222, 128, 0.4)",
    color: "#4ade80",
    borderRadius: 30,
    padding: "5px 18px",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 20,
    letterSpacing: "0.04em",
  },
  btnContinuar: {
    background: "linear-gradient(135deg, #22c55e, #4ade80)",
    color: "#052e16",
    border: "none",
    borderRadius: 30,
    padding: "11px 36px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.04em",
    transition: "opacity 0.2s",
  },
  hudContador: {
    position: "absolute",
    top: 18,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(5, 15, 5, 0.72)",
    border: "1px solid rgba(74, 222, 128, 0.35)",
    borderRadius: 30,
    padding: "7px 20px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    zIndex: 100,
    backdropFilter: "blur(8px)",
  },
  hudTexto: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: "0.04em",
  },
  hudMision: {
    position: "absolute",
    top: 60,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(5, 15, 5, 0.65)",
    border: "1px solid rgba(74, 222, 128, 0.2)",
    borderRadius: 20,
    padding: "6px 18px",
    color: "#86c086",
    fontSize: 12,
    fontFamily: "'Segoe UI', sans-serif",
    zIndex: 100,
    backdropFilter: "blur(6px)",
    whiteSpace: "nowrap",
    maxWidth: "90vw",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  promptE: {
    position: "absolute",
    bottom: 120,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(5, 15, 5, 0.8)",
    border: "1px solid rgba(74, 222, 128, 0.4)",
    borderRadius: 30,
    padding: "10px 22px",
    zIndex: 100,
    backdropFilter: "blur(8px)",
    animation: "pulsePrompt 1.8s ease-in-out infinite",
  },
  kbd: {
    background: "#4ade80",
    color: "#052e16",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 14,
    fontWeight: 800,
    fontFamily: "monospace",
  },
  promptTexto: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Segoe UI', sans-serif",
  },
  btnInteractMobile: {
    background: "linear-gradient(135deg, #22c55e, #4ade80)",
    color: "#052e16",
    border: "none",
    borderRadius: 25,
    padding: "10px 24px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.03em",
    display: "flex",
    alignItems: "center",
  },
};

// CSS global para animaciones
const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes fadeInModal {
    from { opacity: 0; transform: scale(0.92) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes pulsePrompt {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.65; }
  }
`;
if (!document.head.querySelector("[data-bosque-styles]")) {
  styleTag.setAttribute("data-bosque-styles", "true");
  document.head.appendChild(styleTag);
}