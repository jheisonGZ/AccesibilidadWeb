import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { auth, db } from "../../../services/firebase";
import { doc, getDoc } from "firebase/firestore";

const AVATAR_MODELS = {
  "male-1":   { model: "/models/hombre2.glb",     idle: "/models/animations/estatico.glb" },
  "female-1": { model: "/models/mujer2.glb",       idle: "/models/animations/estatica.glb" },
  "male-2":   { model: "/models/hombre.glb",       idle: "/models/animations/estatico.glb" },
  "female-2": { model: "/models/mujer.glb",        idle: "/models/animations/estatica.glb" },
  "male-3":   { model: "/models/hombre3.glb",      idle: "/models/animations/estatico.glb" },
  "female-3": { model: "/models/mujer3.glb",       idle: "/models/animations/estatica.glb" },
  "nb-1":     { model: "/models/no_binaria.glb",   idle: "/models/animations/estatica.glb" },
};

const FALLBACK = AVATAR_MODELS["male-2"];

export default function PlayerController({
  controls,
  startPosition = [0, 1, 5.5],
  floorY        = -2,
  playerRef,
  limites,
  avatarScale = 0.8,
}) {

  const [avatarPaths, setAvatarPaths] = useState(() => {
    const saved = localStorage.getItem("avatar");
    return AVATAR_MODELS[saved] ?? FALLBACK;
  });

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

return (
    <AvatarScene
      key={avatarPaths.model}
      paths={avatarPaths}
      controls={controls}
      startPosition={startPosition}
      floorY={floorY}
      playerRef={playerRef}
      limites={limites}
      avatarScale={avatarScale}
    />
  );
}

function AvatarScene({ paths, controls, startPosition, floorY, playerRef, limites, avatarScale }) {

  const localRef = useRef();
  const group    = playerRef ?? localRef;
  const { camera } = useThree();

  const model         = useGLTF(paths.model);
  const idleAnimation = useGLTF(paths.idle);
  const walkAnimation = useGLTF("/models/animations/caminar.glb");
  const runAnimation  = useGLTF("/models/animations/correr.glb");
  const jumpAnimation = useGLTF("/models/animations/saltar.glb");
  const tomarAnimation = useGLTF("/models/animations/tomar.glb");
  const abrirAnimation = useGLTF("/models/animations/abrir.glb");

  const idle  = useAnimations(idleAnimation.animations, group);
  const walk  = useAnimations(walkAnimation.animations, group);
  const run   = useAnimations(runAnimation.animations,  group);
  const jump  = useAnimations(jumpAnimation.animations, group);
  const tomar = useAnimations(tomarAnimation.animations, group);
  const abrir = useAnimations(abrirAnimation.animations, group);

  const keys             = useRef({});
  const movingRef        = useRef(false);
  const isRunningRef     = useRef(false);
  const currentAnimation = useRef("idle");
  const velocityY        = useRef(0);
  const isJumping        = useRef(false);
  const jumpConsumed     = useRef(false);
  const jumpFinishedCb   = useRef(null);

  // NUEVO: estado de animación contextual (tomar / abrir)
  const isActing       = useRef(false);
  const actingFinishedCb = useRef(null);

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

  useEffect(() => {
    const idleAction = Object.values(idle.actions || {})[0];
    if (idleAction) idleAction.play();
  }, [idle]);

  useEffect(() => {
  model.scene.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow    = true;
      obj.receiveShadow = true;
    }
  });
}, [model.scene]);


  useEffect(() => {
    if (group.current) {
      group.current.position.set(...startPosition);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────────────
  // NUEVO: reproducir animación contextual (tomar / abrir)
  // ───────────────────────────────────────────────────────
const playAnimation = useCallback((name, onComplete, onMidpoint) => {
  if (isActing.current) {
    onComplete?.();
    return;
  }

  const idleAction  = Object.values(idle.actions  || {})[0];
  const walkAction  = Object.values(walk.actions  || {})[0];
  const runAction   = Object.values(run.actions   || {})[0];
  const jumpAction  = Object.values(jump.actions  || {})[0];
  const tomarAction = Object.values(tomar.actions || {})[0];
  const abrirAction = Object.values(abrir.actions || {})[0];

  const targetAction = name === "tomar" ? tomarAction
                      : name === "abrir" ? abrirAction
                      : null;

  if (!targetAction || !targetAction._mixer) {
    onComplete?.();
    return;
  }

  isActing.current = true;
  currentAnimation.current = "action";

  idleAction?.fadeOut(0.1);
  walkAction?.fadeOut(0.1);
  runAction?.fadeOut(0.1);
  jumpAction?.fadeOut(0.1);

  targetAction.reset();
  targetAction.setLoop(THREE.LoopOnce, 1);
  targetAction.clampWhenFinished = true;
  
  // 🎯 Ajustar velocidad para sincronizar con el cofre
  if (name === "abrir") {
    targetAction.setEffectiveTimeScale(1.0);
  }
  
  targetAction.fadeIn(0.15).play();
  
  const mixer = targetAction._mixer;
  
  // 🎯 NUEVO: Detectar la mitad de la animación
  if (onMidpoint) {
    const duration = targetAction.getClip().duration;
    let midpointFired = false;
    
    const checkMidpoint = () => {
      if (!midpointFired && targetAction.time >= duration * 0.2) {
        midpointFired = true;
        onMidpoint();
      }
      if (!midpointFired && targetAction.isRunning()) {
        requestAnimationFrame(checkMidpoint);
      }
    };
    requestAnimationFrame(checkMidpoint);
  }

  if (actingFinishedCb.current) {
    mixer.removeEventListener("finished", actingFinishedCb.current);
  }

  actingFinishedCb.current = (e) => {
    if (e.action !== targetAction) return;
    isActing.current = false;
    currentAnimation.current = "idle";
    movingRef.current    = false;
    isRunningRef.current = false;
    targetAction.fadeOut(0.2);
    idleAction?.reset().fadeIn(0.2).play();
    mixer.removeEventListener("finished", actingFinishedCb.current);
    actingFinishedCb.current = null;
    onComplete?.();
  };

  mixer.addEventListener("finished", actingFinishedCb.current);
}, [idle, walk, run, jump, tomar, abrir]);

  // Exponer playAnimation en el ref del jugador
  useEffect(() => {
    if (group.current) {
      group.current.playAnimation = playAnimation;
    }
  }, [playAnimation]);



  useFrame(() => {

    if (!group.current) return;

    // Si está ejecutando "tomar" o "abrir", congelar movimiento
    if (isActing.current) return;

    const isRunning = !!(keys.current["shift"] || controls?.current?.run);
    const vel  = isRunning ? 0.1 : 0.05;
    let moving = false;

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

    const xMin = limites?.xMin ?? -100;
    const xMax = limites?.xMax ??  100;
    const zMin = limites?.zMin ?? -100;
    const zMax = limites?.zMax ??  100;
    group.current.position.x = Math.max(xMin, Math.min(xMax, group.current.position.x));
    group.current.position.z = Math.max(zMin, Math.min(zMax, group.current.position.z));

    const estadoCambio =
      moving    !== movingRef.current ||
      isRunning !== isRunningRef.current;

    if (isJumping.current) {
      if (currentAnimation.current !== "jump") {
        currentAnimation.current = "jump";
        idleAction?.fadeOut(0.1);
        walkAction?.fadeOut(0.1);
        runAction?.fadeOut(0.1);

        if (jumpAction?._mixer) {
          jumpAction.reset().setEffectiveTimeScale(1.8).fadeIn(0.1).play();
          jumpAction.clampWhenFinished = true;

          if (jumpFinishedCb.current) {
            jumpAction._mixer.removeEventListener("finished", jumpFinishedCb.current);
          }

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
      movingRef.current    = moving;
      isRunningRef.current = isRunning;

      if (moving && isRunning && currentAnimation.current !== "run") {
        currentAnimation.current = "run";
        idleAction?.fadeOut(0.10);
        walkAction?.fadeOut(0.10);
        if (!runAction?.isRunning()) runAction?.reset().fadeIn(0.2).play();
        else runAction?.fadeIn(0.2);

      } else if (moving && !isRunning && currentAnimation.current !== "walk") {
        currentAnimation.current = "walk";
        idleAction?.fadeOut(0.10);
        runAction?.fadeOut(0.10);
        if (!walkAction?.isRunning()) walkAction?.reset().fadeIn(0.2).play();
        else walkAction?.fadeIn(0.2);

            } else if (!moving && currentAnimation.current !== "idle") {
        currentAnimation.current = "idle";
        walkAction?.fadeOut(0.15);  // ← Antes 0.6 (muy lento)
        runAction?.fadeOut(0.15);   // ← Antes 0.6
        jumpAction?.fadeOut(0.15);  // ← Antes 0.6
        
        if (idleAction) {
          idleAction.reset();
          idleAction.play();
          idleAction.fadeIn(0.15);  // ← Antes 0.8
        }
      }
    }

    velocityY.current -= 0.008;
    group.current.position.y += velocityY.current;

    if (group.current.position.y <= floorY) {
      group.current.position.y = floorY;
      velocityY.current = 0;

      if (isJumping.current) {
        isJumping.current = false;
        currentAnimation.current = "idle";

        if (jumpFinishedCb.current && jumpAction?._mixer) {
          jumpAction._mixer.removeEventListener("finished", jumpFinishedCb.current);
          jumpFinishedCb.current = null;
        }

        const _jumpAction = Object.values(jump.actions || {})[0];
        const _idleAction = Object.values(idle.actions || {})[0];
        _jumpAction?.fadeOut(0.15);
        _idleAction?.reset().fadeIn(0.2).play();

        movingRef.current    = moving;
        isRunningRef.current = isRunning;
      }
    }
  });

return (
    <primitive
      ref={group}
      object={model.scene}
      scale={avatarScale}
      position={startPosition}
      castShadow
      receiveShadow
    />
  );
}

