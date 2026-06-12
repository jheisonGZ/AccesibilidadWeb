import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Wind, ListTodo, StretchHorizontal, Lock, Trophy, Sparkles, CheckCircle, CheckCircle2, Map, LayoutDashboard } from "lucide-react";
import { auth, db } from "../services/firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

import PlayerController from "../components/3d/player/PlayerController";
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";
import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";


// ─────────────────────────────────────────────────────────
// DATOS DE MISIONES
// ─────────────────────────────────────────────────────────
const JARRON_DATA = [
  {
    id: 0,
    position: [19, -6, 9],
    scale: 1,
    titulo: "Respiración Consciente",
    mensaje:
      "Cuando sientas estrés, utiliza la técnica de respiración 4-4-4. Inhala durante 4 segundos, mantén el aire durante 4 segundos y exhala lentamente durante 4 segundos. Repite varias veces para recuperar la calma.",
    Icono: Wind,
  },
  {
    id: 1,
    position: [11, -6, 18],
    scale: 1,
    titulo: "Organización de Tareas",
    mensaje:
      "Una buena organización ayuda a reducir la sensación de sobrecarga. Identifica la tarea más importante, divídela en pasos pequeños y concéntrate en completar una acción a la vez.",
    Icono: ListTodo,
  },
  {
    id: 2,
    position: [-5, -5, 9],
    scale: 1,
    titulo: "Pausa Activa",
    mensaje:
      "Las pausas activas favorecen la concentración y el bienestar. Levántate, estira tu cuerpo durante unos minutos y respira profundamente antes de continuar con tus actividades.",
    Icono: StretchHorizontal,
  },
];

// ─────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL COFRE
// ─────────────────────────────────────────────────────────
const COFRE_CONFIG = {
  position: [16, -6.3, 3],
  scale: 0.10,
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
// PARTÍCULAS DE ARENA
// ─────────────────────────────────────────────────────────
function SandParticles() {
  const count = 130;
  const mesh = useRef();

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 4 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      spd.push(0.02 + Math.random() * 0.04);
    }
    return [pos, spd];
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += speeds[i];
      pos[i * 3 + 1] += speeds[i] * 0.1;
      if (pos[i * 3] > 30) {
        pos[i * 3] = -30;
        pos[i * 3 + 1] = Math.random() * 4 - 2;
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
        color="#e8c97a"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────
// ESCENARIO VALLE
// ─────────────────────────────────────────────────────────
function Valle() {
  const { scene } = useGLTF("/models/valle.glb");

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
      object={scene}
      position={[2.5, -15, 0]}
      rotation={[0, 85 * (Math.PI / 2), 0]}
      scale={26}
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

  return <primitive object={scene} position={[0, -5, 0]} scale={0.1} />;
}

// ─────────────────────────────────────────────────────────
// JARRÓN INDIVIDUAL
// ─────────────────────────────────────────────────────────
function Jarron({ data, playerRef, collected, onNearby, isNearby }) {
  const { scene } = useGLTF("/models/jarron.glb");
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
    meshRef.current.rotation.y += 0.008;
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
      scale={data.scale || 0.1}
      castShadow
    />
  );
}

// ─────────────────────────────────────────────────────────
// COFRE CON BRILLO QUE SE DETIENE AL ABRIR
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

  // BRILLO DORADO - Se detiene al presionar E
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    const shouldGlow = allCollected && !isOpen && !isOpening && !isClosing;
    
    groupRef.current.scale.set(config.scale, config.scale, config.scale);
    
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (shouldGlow) {
          child.material.emissive = new THREE.Color("#ffd700");
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
          color="#ffd700"
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
  onJarronNearby,
  nearbyJarronId,
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
      <ambientLight intensity={0.6} color="#ffe0a0" />
      <directionalLight
        position={[20, 30, 10]}
        intensity={2.4}
        color="#fff5cc"
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
      <SandParticles />
      <Valle />

      {JARRON_DATA.map((data) => (
        <Jarron
          key={data.id}
          data={data}
          playerRef={playerRef}
          collected={collectedIds.includes(data.id)}
          onNearby={onJarronNearby}
          isNearby={nearbyJarronId === data.id}
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
        startPosition={[17, -8.1, 27]}  // ✅ Corregido: mismo Y que floorY
        floorY={-6.8}
        playerRef={playerRef}
        limites={{ 
        xMin: -15,    // ← Solo 11 unidades a la izquierda del inicio
        xMax: 18,    // ← 9 unidades a la derecha del inicio
        zMin: -1,     // ← 14 unidades atrás del inicio
        zMax: 21     // ← 6 unidades adelante del inicio 
      }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────
// MODAL DE JARRÓN
// ─────────────────────────────────────────────────────────
function ModalJarron({ data, totalCollected, onContinuar }) {
  if (!data) return null;
  const { Icono } = data;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalIconBig}>
          <Icono size={48} color="#e8c97a" strokeWidth={1.5} />
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
          <Lock size={48} color="#e8c97a" strokeWidth={1.5} />
        </div>
        <h2 style={styles.modalTitulo}>Cofre Sellado</h2>
        <p style={styles.modalMensaje}>
          Todavía quedan enseñanzas por descubrir.
        </p>
        <p style={{ ...styles.modalMensaje, fontSize: 13, opacity: 0.8 }}>
          Encuentra los tres jarrones para desbloquear el cofre.
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
          <Trophy size={52} color="#f5c842" strokeWidth={1.5} />
        </div>
        <h2 style={{ ...styles.modalTitulo, color: "#f5c842" }}>
          ¡Logro Desbloqueado!
        </h2>
        <p style={{ ...styles.modalMensaje, fontWeight: 700, fontSize: 18 }}>
          Guardián del Oasis
        </p>
        <p style={styles.modalMensaje}>
          Has completado la misión del Valle Escondido y descubierto tres estrategias para el manejo del estrés.
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
          <Trophy size={52} color="#f5c842" strokeWidth={1.5} />
        </div>
        <h2 style={{ ...styles.modalTitulo, color: "#f5c842" }}>
          🏆 Misión Completada
        </h2>
        <div style={{ marginBottom: 16 }}>
          <CheckCircle2 size={20} color="#4ade80" style={{ marginRight: 6, verticalAlign: "middle" }} />
          <span style={{ color: "#4ade80", fontSize: 14, fontWeight: 600 }}>Ya has completado la misión:</span>
        </div>
        <p style={{ ...styles.modalMensaje, fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
          Guardián del Oasis
        </p>
        <p style={{ ...styles.modalMensaje, fontSize: 14 }}>
          Has descubierto las tres técnicas para el manejo del estrés y restaurado el equilibrio del Valle Escondido.
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
function HUDMision({ collectedIds, showEJarron, showECofre, isMobile, onInteractMobile, cofreYaAbierto, misionCompletada }) {
  const allCollected = collectedIds.length === 3;

  return (
    <>
      {/* Contador de enseñanzas */}
      {!cofreYaAbierto && !misionCompletada && (
        <div style={styles.hudContador}>
          <Wind size={16} color="#e8c97a" style={{ marginRight: 4 }} />
          <span style={styles.hudTexto}>
            {collectedIds.length} / 3 enseñanzas
          </span>
        </div>
      )}

      {/* Misión activa */}
      {!cofreYaAbierto && !misionCompletada && !allCollected && (
        <div style={styles.hudMision}>
          🏜️ Misión: Guardián del Oasis — Explora el Valle Escondido y encuentra los tres jarrones antiguos
        </div>
      )}
      
      {!cofreYaAbierto && !misionCompletada && allCollected && (
        <div style={{ ...styles.hudMision, borderColor: "#f5c842", color: "#f5c842" }}>
          <Sparkles size={14} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />
          Has reunido las tres enseñanzas. El cofre dorado ha despertado. ¡Ábrelo!
        </div>
      )}

      {/* Mensaje final después del logro */}
      {(cofreYaAbierto || misionCompletada) && (
        <div style={{ ...styles.hudMision, borderColor: "#4ade80", color: "#4ade80", background: "rgba(15, 9, 3, 0.85)" }}>
          <CheckCircle size={14} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />
          ¡Misión completada! Eres el Guardián del Oasis
        </div>
      )}

      {/* Prompt jarrón */}
      {showEJarron && (
        <div style={styles.promptE}>
          {isMobile ? (
            <button style={styles.btnInteractMobile} onClick={onInteractMobile}>
              <Wind size={16} style={{ marginRight: 6 }} />
              Inspeccionar
            </button>
          ) : (
            <>
              <kbd style={styles.kbd}>E</kbd>
              <span style={styles.promptTexto}>Inspeccionar jarrón</span>
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
useGLTF.preload("/models/valle.glb");
useGLTF.preload("/models/Otros/sky.glb");
useGLTF.preload("/models/jarron.glb");
useGLTF.preload("/models/cofre.glb");

// ─────────────────────────────────────────────────────────
// ESCENA PRINCIPAL
// ─────────────────────────────────────────────────────────
export default function SalaValle({ onSalir }) {
  const mobileControls = useMobileControls();
  const { isPortrait } = useLandscapeLock();
  const playerRef = useRef();
  const cofreRef = useRef();

  const [collectedIds, setCollectedIds] = useState([]);
  const [modalJarron, setModalJarron] = useState(null);
  const [modalCofreBloq, setModalCofreBloq] = useState(false);
  const [modalLogro, setModalLogro] = useState(false);
  const [cofreAbierto, setCofreAbierto] = useState(false);
  const [cofreYaAbierto, setCofreYaAbierto] = useState(false);
  
  const [modalMisionCompletada, setModalMisionCompletada] = useState(false);
  const [misionCompletadaPreviamente, setMisionCompletadaPreviamente] = useState(false);

  const [nearbyJarronId, setNearbyJarronId] = useState(null);
  const [isNearCofre, setIsNearCofre] = useState(false);

  const allCollected = collectedIds.length === 3;
  const modalOpen = !!modalJarron || modalCofreBloq || modalLogro || modalMisionCompletada;

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
            if (completedRooms.includes("valle")) {
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
          achievements: arrayUnion("guardian_del_oasis"),
          completedRooms: arrayUnion("valle")
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

  const handleJarronNearby = useCallback((id, isNear) => {
    setNearbyJarronId((prev) => {
      if (isNear) return id;
      if (prev === id) return null;
      return prev;
    });
  }, []);

  const handleCofreNearby = useCallback((isNear) => {
    setIsNearCofre(isNear);
  }, []);

  // 🎯 NUEVO: handleInteract con animaciones
  const handleInteract = useCallback(() => {
    if (modalOpen) return;

    // ── Recoger jarrón ──
    if (nearbyJarronId !== null && !collectedIds.includes(nearbyJarronId)) {
      const data = JARRON_DATA.find((j) => j.id === nearbyJarronId);
      if (!data) return;

      const enLaMitad = () => {
        setCollectedIds((prev) => [...prev, nearbyJarronId]);
        playSound("jarron");
      };

      const alTerminar = () => {
        setModalJarron(data);
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
        setCofreAbierto(true);
        playSound("cofre");
        
        if (playerRef.current?.playAnimation) {
          playerRef.current.playAnimation("abrir");
        }
      }
    }
  }, [modalOpen, nearbyJarronId, collectedIds, isNearCofre, allCollected, cofreAbierto, playerRef]);

  useKeyE(handleInteract);

  function playSound(tipo) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tipo === "jarron") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (tipo === "bloqueado") {
        osc.type = "square";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (tipo === "cofre") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (_) {}
  }

  const showEJarron =
    nearbyJarronId !== null &&
    !collectedIds.includes(nearbyJarronId) &&
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
          <MisionScene
            playerRef={playerRef}
            mobileControls={mobileControls}
            collectedIds={collectedIds}
            onJarronNearby={handleJarronNearby}
            nearbyJarronId={nearbyJarronId}
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
            showEJarron={showEJarron}
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

        {modalJarron && (
          <ModalJarron
            data={modalJarron}
            totalCollected={collectedIds.length}
            onContinuar={() => setModalJarron(null)}
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
    background: "rgba(10, 6, 2, 0.78)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(6px)",
  },
  modal: {
    background: "linear-gradient(160deg, #1a120a 0%, #2a1d0e 100%)",
    border: "1.5px solid rgba(232, 185, 100, 0.45)",
    borderRadius: 20,
    padding: "36px 32px 28px",
    maxWidth: 420,
    width: "90%",
    textAlign: "center",
    boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 0 40px rgba(232,185,100,0.08)",
    animation: "fadeInModal 0.35s ease",
  },
  modalIconBig: {
    marginBottom: 10,
    display: "flex",
    justifyContent: "center",
    filter: "drop-shadow(0 2px 8px rgba(232,185,100,0.5))",
  },
  modalTitulo: {
    color: "#e8c97a",
    fontSize: 22,
    fontWeight: 700,
    margin: "0 0 12px",
    letterSpacing: "0.03em",
    fontFamily: "'Segoe UI', sans-serif",
  },
  modalMensaje: {
    color: "#d4c4a0",
    fontSize: 15,
    lineHeight: 1.65,
    margin: "0 0 20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  contadorBadge: {
    display: "inline-block",
    background: "rgba(232, 185, 100, 0.15)",
    border: "1px solid rgba(232, 185, 100, 0.4)",
    color: "#e8c97a",
    borderRadius: 30,
    padding: "5px 18px",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 20,
    letterSpacing: "0.04em",
  },
  btnContinuar: {
    background: "linear-gradient(135deg, #c8951f, #e8c97a)",
    color: "#1a0e00",
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
    background: "rgba(15, 9, 3, 0.72)",
    border: "1px solid rgba(232, 185, 100, 0.35)",
    borderRadius: 30,
    padding: "7px 20px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    zIndex: 100,
    backdropFilter: "blur(8px)",
  },
  hudTexto: {
    color: "#e8c97a",
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
    background: "rgba(15, 9, 3, 0.65)",
    border: "1px solid rgba(232, 185, 100, 0.2)",
    borderRadius: 20,
    padding: "6px 18px",
    color: "#c4b07a",
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
    background: "rgba(15, 9, 3, 0.8)",
    border: "1px solid rgba(232, 185, 100, 0.4)",
    borderRadius: 30,
    padding: "10px 22px",
    zIndex: 100,
    backdropFilter: "blur(8px)",
    animation: "pulsePrompt 1.8s ease-in-out infinite",
  },
  kbd: {
    background: "#e8c97a",
    color: "#1a0e00",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 14,
    fontWeight: 800,
    fontFamily: "monospace",
  },
  promptTexto: {
    color: "#e8c97a",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Segoe UI', sans-serif",
  },
  btnInteractMobile: {
    background: "linear-gradient(135deg, #c8951f, #e8c97a)",
    color: "#1a0e00",
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
if (!document.head.querySelector("[data-valle-styles]")) {
  styleTag.setAttribute("data-valle-styles", "true");
  document.head.appendChild(styleTag);
}