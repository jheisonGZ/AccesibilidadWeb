import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { auth, db } from "../../../services/firebase";
import { doc, getDoc } from "firebase/firestore";

// =============================================================================
// MAPA DE AVATARES
// Relaciona cada avatar ID (guardado en Firestore/localStorage)
// con su modelo .glb y su animación idle correspondiente.
// Debe coincidir exactamente con los IDs del array AVATARS en AvatarSelect.
// =============================================================================
const AVATAR_MODELS = {
  "male-1":   { model: "/models/hombre2.glb", idle: "/models/animations/estatico.glb"  },
  "female-1": { model: "/models/mujer2.glb",  idle: "/models/animations/estatica.glb"  },
  "male-2":   { model: "/models/hombre.glb",  idle: "/models/animations/estatico.glb"  },
  "female-2": { model: "/models/mujer.glb",   idle: "/models/animations/estatica.glb"  },
};

// Fallback: si el ID guardado no existe en el mapa, usa este avatar
const FALLBACK = AVATAR_MODELS["male-2"];

// =============================================================================
// PlayerController
// Componente raíz. Su única responsabilidad es:
//   1. Leer qué avatar eligió el usuario (localStorage → Firestore)
//   2. Pasar las rutas correctas a AvatarScene
//   3. Forzar remontaje de AvatarScene cuando cambia el modelo (key=)
// =============================================================================
export default function PlayerController({ controls }) {

  // Inicializar desde localStorage para evitar flash del modelo incorrecto
  // mientras se resuelve la llamada a Firestore.
  const [avatarPaths, setAvatarPaths] = useState(() => {
    const saved = localStorage.getItem("avatar");
    return AVATAR_MODELS[saved] ?? FALLBACK;
  });

  // Confirmar con Firestore (fuente de verdad) al montar el componente.
  // Si Firestore devuelve un ID distinto al de localStorage, actualiza el estado
  // y sincroniza localStorage para la próxima carga.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const id = snap.data()?.avatar;
      if (id && AVATAR_MODELS[id]) {
        setAvatarPaths(AVATAR_MODELS[id]);
        localStorage.setItem("avatar", id);
      }
    });
  }, []);

  // key=avatarPaths.model garantiza que si las rutas cambian,
  // React desmonta y remonta AvatarScene desde cero,
  // evitando que Three.js mezcle meshes de modelos distintos.
  return (
    <AvatarScene
      key={avatarPaths.model}
      paths={avatarPaths}
      controls={controls}
    />
  );
}

// =============================================================================
// AvatarScene
// Contiene toda la lógica de movimiento, animaciones y cámara.
// Recibe `paths` con las rutas del modelo e idle del avatar seleccionado.
// Las animaciones de caminar, correr y saltar son compartidas por todos
// los avatares, por eso siguen siendo rutas fijas.
// =============================================================================
function AvatarScene({ paths, controls }) {

  const group = useRef();
  const { camera } = useThree();

  // ── Carga del modelo y animaciones ──────────────────────────────────────
  // paths.model y paths.idle vienen del avatar elegido por el usuario.
  // Las demás animaciones son iguales para todos los avatares.
  const model         = useGLTF(paths.model);
  const idleAnimation = useGLTF(paths.idle);
  const walkAnimation = useGLTF("/models/animations/caminar.glb");
  const runAnimation  = useGLTF("/models/animations/correr.glb");
  const jumpAnimation = useGLTF("/models/animations/saltar.glb");

  // Conectar cada clip de animación al grupo del modelo
  const idle = useAnimations(idleAnimation.animations, group);
  const walk = useAnimations(walkAnimation.animations, group);
  const run  = useAnimations(runAnimation.animations,  group);
  const jump = useAnimations(jumpAnimation.animations, group);

  // ── Referencias de estado ────────────────────────────────────────────────
  // Se usan refs en lugar de useState para no provocar re-renders en el loop.
  const keys             = useRef({});
  const movingRef        = useRef(false);
  const isRunningRef     = useRef(false);
  const currentAnimation = useRef("idle");
  const velocityY        = useRef(0);
  const isJumping        = useRef(false);
  const jumpConsumed     = useRef(false);
  const jumpFinishedCb   = useRef(null);

  // ── Escuchar teclado ─────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      const key = e.code === "Space" ? "space" : e.key.toLowerCase();
      keys.current[key] = true;
    };
    const up = (e) => {
      const key = e.code === "Space" ? "space" : e.key.toLowerCase();
      keys.current[key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup",   up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup",   up);
    };
  }, []);

  // ── Reproducir idle al montar ────────────────────────────────────────────
  // Se dispara una sola vez cuando el componente monta y las acciones
  // de animación ya están listas.
  useEffect(() => {
    const idleAction = Object.values(idle.actions || {})[0];
    if (idleAction) idleAction.play();
  }, [idle]);

  // ── Loop principal (60fps) ───────────────────────────────────────────────
  useFrame(() => {
    if (!group.current) return;

    // Booleano estricto: evita que undefined rompa comparaciones
    const isRunning = !!(keys.current["shift"] || controls?.current?.run);

    // Velocidad según si está corriendo o caminando
    const vel  = isRunning ? 0.1 : 0.05;
    let moving = false;

    // ── Detectar salto ───────────────────────────────────────────────────
    const jumpPressed = keys.current["space"] || controls?.current?.jump;
    // Resetear jumpConsumed cuando se suelta la tecla, para permitir saltar de nuevo
    if (!jumpPressed) jumpConsumed.current = false;
    if (jumpPressed && !isJumping.current && !jumpConsumed.current) {
      velocityY.current    = 0.15;
      isJumping.current    = true;
      jumpConsumed.current = true;
    }

    const move       = controls?.current?.move;
    const idleAction = Object.values(idle.actions || {})[0];
    const walkAction = Object.values(walk.actions || {})[0];
    const runAction  = Object.values(run.actions  || {})[0];
    const jumpAction = Object.values(jump.actions || {})[0];

    // ── Movimiento WASD ──────────────────────────────────────────────────
    if (keys.current["w"]) {
      group.current.position.z -= vel;
      group.current.rotation.y = Math.PI;
      moving = true;
    }
    if (keys.current["s"]) {
      group.current.position.z += vel;
      group.current.rotation.y = 0;
      moving = true;
    }
    if (keys.current["a"]) {
      group.current.position.x -= vel;
      group.current.rotation.y = -Math.PI / 2;
      moving = true;
    }
    if (keys.current["d"]) {
      group.current.position.x += vel;
      group.current.rotation.y = Math.PI / 2;
      moving = true;
    }

    // ── Joystick móvil ───────────────────────────────────────────────────
    if (move && (Math.abs(move.x) > 0.1 || Math.abs(move.y) > 0.1)) {
      group.current.position.x += move.x * vel;
      group.current.position.z -= move.y * vel;
      moving = true;
      if (Math.abs(move.x) > Math.abs(move.y)) {
        group.current.rotation.y = move.x > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        group.current.rotation.y = move.y > 0 ? Math.PI : 0;
      }
    }

    // ── Límites del escenario ────────────────────────────────────────────
    const borde = 100;
    group.current.position.x = Math.max(-borde, Math.min(borde, group.current.position.x));
    group.current.position.z = Math.max(-borde, Math.min(borde, group.current.position.z));

    // ── Lógica de animaciones ────────────────────────────────────────────
    // Solo recalcula cuando el estado de movimiento o sprint cambia,
    // no en cada frame, para evitar transiciones continuas.
    const estadoCambio =
      moving    !== movingRef.current ||
      isRunning !== isRunningRef.current;

    if (isJumping.current) {
      // El salto tiene prioridad sobre cualquier otra animación.
      // Solo inicia la transición una vez (cuando currentAnimation no es "jump").
      if (currentAnimation.current !== "jump") {
        currentAnimation.current = "jump";
        idleAction?.fadeOut(0.1);
        walkAction?.fadeOut(0.1);
        runAction?.fadeOut(0.1);

        if (jumpAction?._mixer) {
          jumpAction.reset().setEffectiveTimeScale(1.8).fadeIn(0.1).play();
          jumpAction.clampWhenFinished = true;

          // Limpiar listener anterior para evitar callbacks duplicados
          if (jumpFinishedCb.current) {
            jumpAction._mixer.removeEventListener("finished", jumpFinishedCb.current);
          }

          // Cuando termina la animación de salto, volver a idle
          jumpFinishedCb.current = () => {
            if (currentAnimation.current !== "jump") return;
            currentAnimation.current = "idle";
            jumpAction?.fadeOut(0.15);
            idleAction?.reset().fadeIn(0.2).play();
            jumpFinishedCb.current = null;
          };
          jumpAction._mixer.addEventListener("finished", jumpFinishedCb.current);
        }
      }

    } else if (estadoCambio) {
      // Actualizar refs para la próxima comparación
      movingRef.current    = moving;
      isRunningRef.current = isRunning;

      if (moving && isRunning && currentAnimation.current !== "run") {
        // Transición a correr
        currentAnimation.current = "run";
        idleAction?.fadeOut(0.2);
        walkAction?.fadeOut(0.2);
        if (!runAction?.isRunning()) runAction?.reset().fadeIn(0.2).play();
        else runAction?.fadeIn(0.2);

      } else if (moving && !isRunning && currentAnimation.current !== "walk") {
        // Transición a caminar
        currentAnimation.current = "walk";
        idleAction?.fadeOut(0.2);
        runAction?.fadeOut(0.25);
        if (!walkAction?.isRunning()) walkAction?.reset().fadeIn(0.2).play();
        else walkAction?.fadeIn(0.2);

      } else if (!moving && currentAnimation.current !== "idle") {
        // Transición a idle (parado)
        currentAnimation.current = "idle";
        walkAction?.fadeOut(0.3);
        runAction?.fadeOut(0.3);
        jumpAction?.fadeOut(0.2);
        idleAction?.reset().fadeIn(0.25).play();
      }
    }

    // ── Gravedad y colisión con el piso ──────────────────────────────────
    velocityY.current -= 0.008;
    group.current.position.y += velocityY.current;

    if (group.current.position.y <= -2) {
      group.current.position.y = -2;
      velocityY.current = 0;

      // Al aterrizar: cancelar estado de salto y limpiar callbacks
      if (isJumping.current) {
        isJumping.current = false;
        currentAnimation.current = "idle";

        // Remover el listener del salto para que no se dispare tarde
        if (jumpFinishedCb.current && jumpAction?._mixer) {
          jumpAction._mixer.removeEventListener("finished", jumpFinishedCb.current);
          jumpFinishedCb.current = null;
        }

        const _jumpAction = Object.values(jump.actions || {})[0];
        const _idleAction = Object.values(idle.actions || {})[0];
        _jumpAction?.fadeOut(0.15);
        _idleAction?.reset().fadeIn(0.2).play();

        // Sincronizar refs con el estado real actual
        movingRef.current    = moving;
        isRunningRef.current = isRunning;
      }
    }
  });

  // Renderizar el modelo del avatar seleccionado
  return (
    <primitive
      ref={group}
      object={model.scene}
      scale={0.6}
      position={[0, 1, 5.5]}  // Posición inicial del avatar
    />
  );
}