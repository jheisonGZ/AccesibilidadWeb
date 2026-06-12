import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { Gem, Lock, Trophy, Sparkles, CheckCircle, CheckCircle2, Map, LayoutDashboard } from "lucide-react";
import { auth, db } from "../services/firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

import PlayerController from "../components/3d/player/PlayerController";
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";
import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";

// ─────────────────────────────────────────────────────────
// DATOS DE MISIONES — CRISTALES
// ─────────────────────────────────────────────────────────
const CRISTAL_DATA = [
  {
    id: 0,
    position: [4, -2.2, 6],
    scale: 20,
    titulo: "Reconoce tus Logros",
    mensaje:
      "A veces nos enfocamos tanto en lo que falta por hacer que olvidamos todo lo que ya hemos conseguido. Piensa en un reto académico que hayas superado. Cada examen aprobado, proyecto entregado y dificultad enfrentada demuestra tu capacidad para avanzar. Reconocer tus logros fortalece la confianza en ti mismo y te recuerda que eres capaz de superar nuevos desafíos.",
    Icono: Gem,
  },
  {
    id: 1,
    position: [-5, -2.2, 12],
    scale: 20,
    titulo: "Confía en tus Capacidades",
    mensaje:
      "Todos enfrentamos momentos de duda, especialmente cuando las metas parecen difíciles de alcanzar. Recuerda una habilidad o fortaleza que te haya ayudado en el pasado. Puede ser tu creatividad, perseverancia, responsabilidad o capacidad para aprender. Confiar en tus capacidades te permite afrontar los desafíos con una actitud más positiva y segura.",
    Icono: Gem,
  },
  {
    id: 2,
    position: [6, -2, 16],
    scale: 20,
    titulo: "Avanza Paso a Paso",
    mensaje:
      "Los grandes objetivos no se alcanzan de una sola vez. Dividir una meta en pequeñas acciones hace que el camino sea más claro y menos abrumador. Cada pequeño avance cuenta. Lo importante no es la velocidad, sino la constancia con la que continúas avanzando hacia tus metas.",
    Icono: Gem,
  },
];

// ─────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL COFRE
// ─────────────────────────────────────────────────────────
const COFRE_CONFIG = {
  position: [0, -2.5, 5],
  scale: 0.10,
};

const PROXIMITY_RADIUS = 1.8;

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
// ESCENARIO ISLA
// ─────────────────────────────────────────────────────────
function Isla() {
  const { scene } = useGLTF("/models/Isla.glb");
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow    = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);
  return (
    <primitive
      object={scene}
      position={[0, -4.5, 10]}
      rotation={[0, 0, 0]}
      scale={1}
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
        obj.material.side       = THREE.DoubleSide;
        obj.material.depthWrite = false;
        obj.material.needsUpdate = true;
        obj.renderOrder         = 0.1;
      }
    });
  }, [scene]);
  return <primitive object={scene} position={[0, -5, 0]} scale={0.1} />;
}

// ─────────────────────────────────────────────────────────
// CRISTAL INDIVIDUAL
// ─────────────────────────────────────────────────────────
function Cristal({ data, playerRef, collected, onNearby }) {
  const { scene } = useGLTF("/models/cristal.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const meshRef = useRef();

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow    = true;
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
      scale={data.scale || 0.12}
      castShadow
    />
  );
}

// ─────────────────────────────────────────────────────────
// COFRE
// ─────────────────────────────────────────────────────────
function Cofre({ playerRef, allCollected, onNearby, shouldOpen, config, onOpenComplete, onCloseComplete }) {
  const { scene, animations } = useGLTF("/models/cofre.glb");
  const groupRef = useRef();
  const { actions, mixer } = useAnimations(animations, groupRef);
  const [isOpen,    setIsOpen]    = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
    });
  }, [scene]);

  // Abrir
  useEffect(() => {
    if (shouldOpen && !isOpen && !isClosing && !isOpening && actions) {
      const openAction = actions["Scene"];
      if (openAction) {
        setIsOpening(true);
        openAction.setEffectiveTimeScale(0.8);
        openAction.setLoop(THREE.LoopOnce, 1);
        openAction.clampWhenFinished = true;
        openAction.reset().play();
        if (mixer) {
          const onFinished = () => {
            setIsOpening(false);
            setIsOpen(true);
            openAction.setEffectiveTimeScale(1);
            if (onOpenComplete) onOpenComplete();
            mixer.removeEventListener("finished", onFinished);
          };
          mixer.addEventListener("finished", onFinished);
        }
      }
    }
  }, [shouldOpen, isOpen, isClosing, isOpening, actions, mixer, onOpenComplete]);

  // Cerrar
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
            mixer.removeEventListener("finished", onCloseFinished);
          };
          mixer.addEventListener("finished", onCloseFinished);
        }
      }
    }
  }, [isOpen, isClosing, actions, mixer, onCloseComplete]);

  useEffect(() => {
    if (groupRef.current) groupRef.current.closeCofre = closeCofre;
  }, [closeCofre]);

  // Proximidad
  useFrame(() => {
    if (!playerRef.current || isOpen || isClosing || isOpening) return;
    const px = playerRef.current.position.x;
    const pz = playerRef.current.position.z;
    const dx = px - config.position[0];
    const dz = pz - config.position[2];
    onNearby(Math.sqrt(dx * dx + dz * dz) < PROXIMITY_RADIUS);
  });

  // Brillo púrpura
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const shouldGlow = allCollected && !isOpen && !isOpening && !isClosing;
    groupRef.current.scale.set(config.scale, config.scale, config.scale);
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (shouldGlow) {
          child.material.emissive          = new THREE.Color("#a855f7");
          child.material.emissiveIntensity = 0.3 + Math.sin(clock.elapsedTime * 2.5) * 0.2;
        } else {
          child.material.emissive          = new THREE.Color("#000000");
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
            child.material.emissive          = new THREE.Color("#000000");
            child.material.emissiveIntensity = 0;
          }
        });
      }
    };
  }, []);

  return (
    <group ref={groupRef} position={config.position}>
      {allCollected && !isOpen && !isOpening && !isClosing && (
        <pointLight color="#a855f7" intensity={0.6} distance={3} decay={2} />
      )}
      <primitive object={scene} scale={config.scale} castShadow />
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// ESCENA 3D
// ─────────────────────────────────────────────────────────
function MisionScene({
  playerRef, mobileControls, collectedIds,
  onCristalNearby, nearbyCristalId,
  onCofreNearby, allCollected, cofreAbierto,
  onCofreOpenComplete, onCofreCloseComplete, cofreRef,
}) {
  return (
    <>
      <ambientLight intensity={1.0} color="#e0d0ff" />
      <directionalLight
        position={[20, 30, 10]}
        intensity={2.2}
        color="#f0e8ff"
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
      <Isla />

      {CRISTAL_DATA.map((data) => (
        <Cristal
          key={data.id}
          data={data}
          playerRef={playerRef}
          collected={collectedIds.includes(data.id)}
          onNearby={onCristalNearby}
        />
      ))}

      <Cofre
        ref={cofreRef}
        playerRef={playerRef}
        allCollected={allCollected}
        onNearby={onCofreNearby}
        shouldOpen={cofreAbierto}
        config={COFRE_CONFIG}
        onOpenComplete={onCofreOpenComplete}
        onCloseComplete={onCofreCloseComplete}
      />

      <PlayerController
        controls={mobileControls}
        startPosition={[0, -3, 5]}
        floorY={-2.6}
        playerRef={playerRef}
        limites={{ 
        xMin: -5,    // ← Límite izquierdo (más negativo = más a la izquierda)
        xMax: 5,     // ← Límite derecho (más positivo = más a la derecha)
        zMin: 5,      // ← Límite atrás (más bajo = más al fondo)
        zMax: 17      // ← Límite adelante (más alto = más al frente)
        }}
        avatarScale={1}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────
// MODAL CRISTAL
// ─────────────────────────────────────────────────────────
function ModalCristal({ data, totalCollected, onContinuar }) {
  if (!data) return null;
  const { Icono } = data;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalIconBig}>
          <Icono size={48} color="#a855f7" strokeWidth={1.5} />
        </div>
        <h2 style={{ ...styles.modalTitulo, color: "#a855f7" }}>{data.titulo}</h2>
        <p style={styles.modalMensaje}>{data.mensaje}</p>
        <div style={{ ...styles.contadorBadge, borderColor: "rgba(168, 85, 247, 0.4)", color: "#a855f7", background: "rgba(168, 85, 247, 0.15)" }}>
          {totalCollected} / 3 cristales descubiertos
        </div>
        <button style={{ ...styles.btnContinuar, background: "linear-gradient(135deg, #9333ea, #a855f7)" }} onClick={onContinuar}>
          Continuar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MODAL COFRE BLOQUEADO
// ─────────────────────────────────────────────────────────
function ModalCofreBloqueado({ onClose }) {
  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 380 }}>
        <div style={styles.modalIconBig}>
          <Lock size={48} color="#a855f7" strokeWidth={1.5} />
        </div>
        <h2 style={{ ...styles.modalTitulo, color: "#a855f7" }}>Cofre Sellado</h2>
        <p style={styles.modalMensaje}>
          Todavía quedan cristales por descubrir.
        </p>
        <p style={{ ...styles.modalMensaje, fontSize: 13, opacity: 0.8 }}>
          Encuentra los tres cristales para desbloquear el cofre.
        </p>
        <button style={{ ...styles.btnContinuar, background: "linear-gradient(135deg, #9333ea, #a855f7)" }} onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MODAL LOGRO FINAL
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
          ⭐ Explorador Estelar
        </p>
        <p style={styles.modalMensaje}>
          Has encontrado los tres cristales ancestrales y reunido sus enseñanzas. Ahora sabes que reconocer tus logros, confiar en tus capacidades y avanzar paso a paso son herramientas valiosas para fortalecer tu bienestar emocional.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ ...styles.btnContinuar, display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #9333ea, #a855f7)" }} onClick={onClose}>
            <Map size={18} />
            Continuar explorando
          </button>
          <button
            style={{ ...styles.btnContinuar, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", gap: 8 }}
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
// MODAL MISIÓN COMPLETADA (REENTRADA)
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
          <CheckCircle2 size={20} color="#f5c842" style={{ marginRight: 6, verticalAlign: "middle" }} />
          <span style={{ color: "#f5c842", fontSize: 14, fontWeight: 600 }}>Ya has completado la misión:</span>
        </div>
        <p style={{ ...styles.modalMensaje, fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
          ⭐ Explorador Estelar
        </p>
        <p style={{ ...styles.modalMensaje, fontSize: 14 }}>
          Has descubierto los tres cristales de sabiduría de la Isla de las Estrellas.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
          <button style={{ ...styles.btnContinuar, display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #9333ea, #a855f7)" }} onClick={onContinuar}>
            <Map size={18} />
            Continuar Explorando
          </button>
          <button
            style={{ ...styles.btnContinuar, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", gap: 8 }}
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
function HUDMision({ collectedIds, showECristal, showECofre, isMobile, onInteractMobile, cofreYaAbierto, misionCompletada }) {
  const allCollected = collectedIds.length === 3;
  return (
    <>
      {!cofreYaAbierto && !misionCompletada && (
        <div style={styles.hudContador}>
          <Gem size={16} color="#a855f7" style={{ marginRight: 4 }} />
          <span style={{ ...styles.hudTexto, color: "#a855f7" }}>
            {collectedIds.length} / 3 cristales
          </span>
        </div>
      )}

      {!cofreYaAbierto && !misionCompletada && !allCollected && (
        <div style={styles.hudMision}>
          ⭐ Misión: Explorador Estelar — Explora la isla y encuentra los tres cristales
        </div>
      )}

      {!cofreYaAbierto && !misionCompletada && allCollected && (
        <div style={{ ...styles.hudMision, borderColor: "#a855f7", color: "#a855f7" }}>
          <Sparkles size={14} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />
          Has reunido los tres cristales. ¡El cofre te espera!
        </div>
      )}

      {(cofreYaAbierto || misionCompletada) && (
        <div style={{ ...styles.hudMision, borderColor: "#a855f7", color: "#a855f7", background: "rgba(10, 8, 20, 0.85)" }}>
          <CheckCircle size={14} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />
          ¡Misión completada! Eres el Explorador Estelar ⭐
        </div>
      )}

      {showECristal && (
        <div style={styles.promptE}>
          {isMobile ? (
            <button style={styles.btnInteractMobile} onClick={onInteractMobile}>
              <Gem size={16} style={{ marginRight: 6 }} />
              Recoger cristal
            </button>
          ) : (
            <>
              <kbd style={styles.kbd}>E</kbd>
              <span style={styles.promptTexto}>Recoger cristal</span>
            </>
          )}
        </div>
      )}

      {showECofre && (
        <div style={styles.promptE}>
          {isMobile ? (
            <button style={styles.btnInteractMobile} onClick={onInteractMobile}>
              {allCollected
                ? <><Sparkles size={16} style={{ marginRight: 6 }} />Abrir cofre</>
                : <><Lock size={16} style={{ marginRight: 6 }} />Examinar cofre</>
              }
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
useGLTF.preload("/models/Isla.glb");
useGLTF.preload("/models/Otros/sky.glb");
useGLTF.preload("/models/cristal.glb");
useGLTF.preload("/models/cofre.glb");

// ─────────────────────────────────────────────────────────
// ESCENA PRINCIPAL
// ─────────────────────────────────────────────────────────
export default function SalaIsla({ onSalir }) {
  const mobileControls = useMobileControls();
  const { isPortrait }  = useLandscapeLock();
  const playerRef       = useRef();
  const cofreRef        = useRef();

  const [collectedIds,              setCollectedIds]              = useState([]);
  const [modalCristal,              setModalCristal]              = useState(null);
  const [modalCofreBloq,            setModalCofreBloq]            = useState(false);
  const [modalLogro,                setModalLogro]                = useState(false);
  const [cofreAbierto,              setCofreAbierto]              = useState(false);
  const [cofreYaAbierto,            setCofreYaAbierto]            = useState(false);
  const [modalMisionCompletada,     setModalMisionCompletada]     = useState(false);
  const [misionCompletadaPreviamente, setMisionCompletadaPreviamente] = useState(false);
  const [nearbyCristalId,           setNearbyCristalId]           = useState(null);
  const [isNearCofre,               setIsNearCofre]               = useState(false);

  const allCollected = collectedIds.length === 3;
  const modalOpen    = !!modalCristal || modalCofreBloq || modalLogro || modalMisionCompletada;

  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  const showRotatePrompt = isMobile && isPortrait;

  // Verificar si la misión ya fue completada
  useEffect(() => {
    const verificar = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data          = userDoc.data();
            const completedRooms = data.completedRooms || [];
            if (completedRooms.includes("isla")) {
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
    verificar();
  }, []);

  // Guardar logro en Firebase
  const handleCofreOpenComplete = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          achievements:  arrayUnion("explorador_estelar"),
          completedRooms: arrayUnion("isla"),
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
    if (cofreRef.current?.closeCofre) cofreRef.current.closeCofre();
  }, []);

  const handleSalirDashboard    = useCallback(() => { if (onSalir) onSalir(); }, [onSalir]);
  const handleContinuarExplorando = useCallback(() => setModalMisionCompletada(false), []);
  const handleCofreCloseComplete  = useCallback(() => setCofreAbierto(false), []);

  const handleCristalNearby = useCallback((id, isNear) => {
    setNearbyCristalId((prev) => {
      if (isNear) return id;
      if (prev === id) return null;
      return prev;
    });
  }, []);

  const handleCofreNearby = useCallback((isNear) => setIsNearCofre(isNear), []);

  // 🎯 handleInteract con animaciones
  const handleInteract = useCallback(() => {
    if (modalOpen) return;

    // ── Recoger cristal ──
    if (nearbyCristalId !== null && !collectedIds.includes(nearbyCristalId)) {
      const data = CRISTAL_DATA.find((c) => c.id === nearbyCristalId);
      if (!data) return;

      const enLaMitad = () => {
        setCollectedIds((prev) => [...prev, nearbyCristalId]);
        playSound("cristal");
      };

      const alTerminar = () => {
        setModalCristal(data);
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
  }, [modalOpen, nearbyCristalId, collectedIds, isNearCofre, allCollected, cofreAbierto, playerRef]);

  useKeyE(handleInteract);

  function playSound(tipo) {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (tipo === "cristal") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
      } else if (tipo === "bloqueado") {
        osc.type = "square";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else if (tipo === "cofre") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
      }
    } catch (_) {}
  }

  const showECristal = nearbyCristalId !== null && !collectedIds.includes(nearbyCristalId) && !modalOpen;
  const showECofre   = isNearCofre && !modalOpen && !cofreAbierto && !cofreYaAbierto;

  return (
    <>
      <div
        style={{
          width: "100vw", height: "100vh",
          overflow: "hidden", position: "absolute", inset: 0,
          visibility:   showRotatePrompt ? "hidden" : "visible",
          pointerEvents: showRotatePrompt ? "none"   : "auto",
        }}
      >
        <Canvas
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 2, 10], fov: 60 }}
          shadows
          gl={{ powerPreference: "high-performance", onContextLost: (e) => e.preventDefault() }}
          frameloop={showRotatePrompt ? "never" : "always"}
        >
          <MisionScene
            playerRef={playerRef}
            mobileControls={mobileControls}
            collectedIds={collectedIds}
            onCristalNearby={handleCristalNearby}
            nearbyCristalId={nearbyCristalId}
            onCofreNearby={handleCofreNearby}
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
            showECristal={showECristal}
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
        {modalCristal && (
          <ModalCristal
            data={modalCristal}
            totalCollected={collectedIds.length}
            onContinuar={() => setModalCristal(null)}
          />
        )}
        {modalCofreBloq && (
          <ModalCofreBloqueado onClose={() => setModalCofreBloq(false)} />
        )}
        {modalLogro && (
          <ModalLogroFinal onClose={handleCerrarLogro} onSalir={handleSalirDashboard} />
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
    const handler = (e) => { if (e.key === "e" || e.key === "E") callback(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callback]);
}

// ─────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: "absolute", inset: 0,
    background: "rgba(10, 8, 20, 0.80)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(6px)",
  },
  modal: {
    background: "linear-gradient(160deg, #0f0a1a 0%, #1a1030 100%)",
    border: "1.5px solid rgba(168, 85, 247, 0.45)",
    borderRadius: 20,
    padding: "36px 32px 28px",
    maxWidth: 420, width: "90%",
    textAlign: "center",
    boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 0 40px rgba(168,85,247,0.08)",
    animation: "fadeInModal 0.35s ease",
  },
  modalIconBig: {
    marginBottom: 10, display: "flex", justifyContent: "center",
    filter: "drop-shadow(0 2px 8px rgba(168,85,247,0.5))",
  },
  modalTitulo: {
    fontSize: 22, fontWeight: 700,
    margin: "0 0 12px", letterSpacing: "0.03em",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#a855f7",
  },
  modalMensaje: {
    color: "#d8c8f0", fontSize: 15, lineHeight: 1.65,
    margin: "0 0 20px", fontFamily: "'Segoe UI', sans-serif",
  },
  contadorBadge: {
    display: "inline-block",
    borderRadius: 30,
    padding: "5px 18px", fontSize: 13, fontWeight: 600,
    marginBottom: 20, letterSpacing: "0.04em",
  },
  btnContinuar: {
    color: "#0f0a1a", border: "none", borderRadius: 30,
    padding: "11px 36px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", letterSpacing: "0.04em", transition: "opacity 0.2s",
  },
  hudContador: {
    position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
    background: "rgba(10, 8, 20, 0.72)",
    border: "1px solid rgba(168, 85, 247, 0.35)",
    borderRadius: 30, padding: "7px 20px",
    display: "flex", alignItems: "center", gap: 6,
    zIndex: 100, backdropFilter: "blur(8px)",
  },
  hudTexto: {
    fontSize: 14, fontWeight: 600,
    fontFamily: "'Segoe UI', sans-serif", letterSpacing: "0.04em",
  },
  hudMision: {
    position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)",
    background: "rgba(10, 8, 20, 0.65)",
    border: "1px solid rgba(168, 85, 247, 0.2)",
    borderRadius: 20, padding: "6px 18px",
    color: "#c4a0f0", fontSize: 12,
    fontFamily: "'Segoe UI', sans-serif",
    zIndex: 100, backdropFilter: "blur(6px)",
    whiteSpace: "nowrap", maxWidth: "90vw",
    overflow: "hidden", textOverflow: "ellipsis",
  },
  promptE: {
    position: "absolute", bottom: 120, left: "50%", transform: "translateX(-50%)",
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(10, 8, 20, 0.85)",
    border: "1px solid rgba(168, 85, 247, 0.4)",
    borderRadius: 30, padding: "10px 22px",
    zIndex: 100, backdropFilter: "blur(8px)",
    animation: "pulsePrompt 1.8s ease-in-out infinite",
  },
  kbd: {
    background: "#a855f7", color: "#0f0a1a",
    borderRadius: 6, padding: "3px 10px",
    fontSize: 14, fontWeight: 800, fontFamily: "monospace",
  },
  promptTexto: {
    color: "#a855f7", fontSize: 14, fontWeight: 600,
    fontFamily: "'Segoe UI', sans-serif",
  },
  btnInteractMobile: {
    background: "linear-gradient(135deg, #9333ea, #a855f7)",
    color: "#0f0a1a", border: "none", borderRadius: 25,
    padding: "10px 24px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", letterSpacing: "0.03em",
    display: "flex", alignItems: "center",
  },
};

// CSS global para animaciones
const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes fadeInModal {
    from { opacity: 0; transform: scale(0.92) translateY(10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
  @keyframes pulsePrompt {
    0%, 100% { opacity: 1;    }
    50%      { opacity: 0.65; }
  }
`;
if (!document.head.querySelector("[data-isla-styles]")) {
  styleTag.setAttribute("data-isla-styles", "true");
  document.head.appendChild(styleTag);
}