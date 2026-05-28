import { useRef, useEffect } from "react";

import {
  useFrame,
  useThree
} from "@react-three/fiber";

import {
  useGLTF,
  useAnimations
} from "@react-three/drei";

export default function PlayerController({ controls }) {

  const group = useRef();
  const { camera } = useThree();

  // ── Carga del modelo y animaciones ──────────────────
  const model = useGLTF("/models/hombre.glb");

  const idleAnimation = useGLTF("/models/animations/estatico.glb");
  const walkAnimation = useGLTF("/models/animations/caminar.glb");
  const runAnimation  = useGLTF("/models/animations/correr.glb");
  const jumpAnimation = useGLTF("/models/animations/saltar.glb");

  const idle = useAnimations(idleAnimation.animations, group);
  const walk = useAnimations(walkAnimation.animations, group);
  const run  = useAnimations(runAnimation.animations,  group);
  const jump = useAnimations(jumpAnimation.animations, group);

  // ── Referencias de estado (no causan re-render) ──────
  const keys             = useRef({});
  const movingRef        = useRef(false);
  const isRunningRef     = useRef(false); // FIX 1 — ref espejo para comparación estricta
  const currentAnimation = useRef("idle");
  const velocityY        = useRef(0);
  const isJumping        = useRef(false);
  const jumpConsumed     = useRef(false);
  const jumpFinishedCb   = useRef(null);  // FIX 5 — ref del callback para cleanup

  // ── Escuchar teclado ─────────────────────────────────
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

  // ── Reproducir idle al montar ────────────────────────
  useEffect(() => {
    const idleAction = Object.values(idle.actions || {})[0];
    if (idleAction) idleAction.play();
  }, [idle]);

  // ── Loop principal (60fps) ───────────────────────────
  useFrame(() => {
    if (!group.current) return;

    // FIX 1 — booleano estricto: evita que undefined rompa las comparaciones
    const isRunning = !!(keys.current["shift"] || controls?.current?.run);

    // FIX 2 — velocidad unificada en una sola variable
    // Antes: speed usaba run, y vel multiplicaba speed*2 si isRunning → 4x en móvil
    const vel  = isRunning ? 0.1 : 0.05;
    let moving = false;

    // ── Detectar salto ─────────────────────────────────
    const jumpPressed = keys.current["space"] || controls?.current?.jump;
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

    // ── Movimiento WASD ────────────────────────────────
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

    // ── Joystick móvil ─────────────────────────────────
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

    // ── Límites del escenario ──────────────────────────
    const borde = 3.7;
    group.current.position.x = Math.max(-borde, Math.min(borde, group.current.position.x));
    group.current.position.z = Math.max(-borde, Math.min(borde, group.current.position.z));

    // ── Lógica de animaciones ──────────────────────────
    // La condición solo se evalúa cuando algo REALMENTE cambia:
    //   - moving cambió (empezó o paró de moverse)
    //   - isRunning cambió (shift presionado/soltado)
    // FIX 1: isRunning es bool estricto → comparación estable cada frame
    const estadoCambio =
      moving    !== movingRef.current ||
      isRunning !== isRunningRef.current;

    if (isJumping.current) {
      // El salto tiene prioridad — solo inicia la transición una vez
      if (currentAnimation.current !== "jump") {
        currentAnimation.current = "jump";
        idleAction?.fadeOut(0.1);
        walkAction?.fadeOut(0.1);
        runAction?.fadeOut(0.1);

        // FIX 4 — guard: solo operar si jumpAction y su mixer existen
        if (jumpAction?._mixer) {
          jumpAction.reset().setEffectiveTimeScale(1.8).fadeIn(0.1).play();
          jumpAction.clampWhenFinished = true;

          // FIX 5 — limpiar listener anterior antes de registrar uno nuevo
          if (jumpFinishedCb.current) {
            jumpAction._mixer.removeEventListener("finished", jumpFinishedCb.current);
          }
          jumpFinishedCb.current = () => {
            // FIX 6 — solo actuar si todavía estamos en "jump"
            // (puede que ya aterrizó por gravedad antes de que el mixer terminara)
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
      // Guardar estado actual para la próxima comparación
      movingRef.current    = moving;
      isRunningRef.current = isRunning;

      if (moving && isRunning && currentAnimation.current !== "run") {
        // Caminar → Correr
        currentAnimation.current = "run";
        idleAction?.fadeOut(0.2);
        walkAction?.fadeOut(0.2);   // FIX 7 — fadeOut más largo para suavidad
        if (!runAction?.isRunning()) runAction?.reset().fadeIn(0.2).play();
        else runAction?.fadeIn(0.2);

      } else if (moving && !isRunning && currentAnimation.current !== "walk") {
        // Correr → Caminar  o  idle → Caminar
        currentAnimation.current = "walk";
        idleAction?.fadeOut(0.2);
        runAction?.fadeOut(0.25);   // FIX 7 — run→walk más suave
        if (!walkAction?.isRunning()) walkAction?.reset().fadeIn(0.2).play();
        else walkAction?.fadeIn(0.2);

      } else if (!moving && currentAnimation.current !== "idle") {
        // Cualquier movimiento → Parado
        currentAnimation.current = "idle";
        walkAction?.fadeOut(0.3);   // FIX 7 — transición a idle más suave
        runAction?.fadeOut(0.3);
        jumpAction?.fadeOut(0.2);
        idleAction?.reset().fadeIn(0.25).play();
      }
    }

    // ── Gravedad y colisión con el piso ───────────────
    velocityY.current -= 0.008;
    group.current.position.y += velocityY.current;

    if (group.current.position.y <= 0.3) {
      group.current.position.y = 0.3;
      velocityY.current = 0;
      if (isJumping.current) {
        isJumping.current = false;
        currentAnimation.current = "idle";

        // FIX 6 — limpiar el callback del salto para que no se ejecute
        // después cuando el mixer despache "finished"
        if (jumpFinishedCb.current && jumpAction?._mixer) {
          jumpAction._mixer.removeEventListener("finished", jumpFinishedCb.current);
          jumpFinishedCb.current = null;
        }

        const _jumpAction = Object.values(jump.actions || {})[0];
        const _idleAction = Object.values(idle.actions || {})[0];
        _jumpAction?.fadeOut(0.15);
        _idleAction?.reset().fadeIn(0.2).play();

        // Sincronizar refs para que la siguiente comparación sea correcta
        movingRef.current    = moving;
        isRunningRef.current = isRunning;
      }
    }

  }); // ── fin useFrame ──────────────────────────────────

  return (
    <primitive
      ref={group}
      object={model.scene}
      scale={0.5}
      position={[0, 0.3, 0]}
    />
  );
}