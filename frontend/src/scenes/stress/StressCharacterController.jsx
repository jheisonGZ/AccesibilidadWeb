import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import { MathUtils, Vector3, AnimationMixer, LoopRepeat, LoopOnce } from "three";
import { degToRad } from "three/src/math/MathUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const normalizeAngle = (a) => {
  while (a >  Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
const lerpAngle = (s, e, t) => {
  s = normalizeAngle(s); e = normalizeAngle(e);
  if (Math.abs(e - s) > Math.PI) { if (e > s) s += 2 * Math.PI; else e += 2 * Math.PI; }
  return normalizeAngle(s + (e - s) * t);
};

// ─────────────────────────────────────────────────────────────────────────────
// Modelos base
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_MODELS = {
  "male-1":   "/models/hombre2.glb",
  "female-1": "/models/mujer2.glb",
  "male-2":   "/models/hombre.glb",
  "female-2": "/models/mujer.glb",
};

// ─────────────────────────────────────────────────────────────────────────────
// Animaciones (Mixamo sin skin exportados desde Blender)
// ─────────────────────────────────────────────────────────────────────────────
const ANIM_PATHS = {
  idle_m: "/models/animations/estatico.glb",
  idle_f: "/models/animations/estatica.glb",
  walk:   "/models/animations/caminar.glb",
  run:    "/models/animations/correr.glb",
  jump:   "/models/animations/saltar.glb",
};
const MIXAMO_CLIP = "Armature|mixamo.com|Layer0";

// ─────────────────────────────────────────────────────────────────────────────
// AvatarAnimated
// ─────────────────────────────────────────────────────────────────────────────
function AvatarAnimated({ modelUrl, animState, isFemale }) {
  const { scene } = useGLTF(modelUrl);
  const { animations: idleAnims } = useGLTF(isFemale ? ANIM_PATHS.idle_f : ANIM_PATHS.idle_m);
  const { animations: walkAnims } = useGLTF(ANIM_PATHS.walk);
  const { animations: runAnims  } = useGLTF(ANIM_PATHS.run);
  const { animations: jumpAnims } = useGLTF(ANIM_PATHS.jump);

  const mixerRef   = useRef(null);
  const actionsRef = useRef({});
  const currentRef = useRef(null);

  useEffect(() => {
    const mixer = new AnimationMixer(scene);
    mixerRef.current = mixer;

    const makeAction = (anims, loop = LoopRepeat) => {
      const clip = anims.find((a) => a.name === MIXAMO_CLIP) ?? anims[0];
      if (!clip) return null;
      const action = mixer.clipAction(clip);
      action.setLoop(loop, loop === LoopOnce ? 1 : Infinity);
      if (loop === LoopOnce) action.clampWhenFinished = true;
      return action;
    };

    actionsRef.current = {
      idle: makeAction(idleAnims),
      walk: makeAction(walkAnims),
      run:  makeAction(runAnims),
      jump: makeAction(jumpAnims, LoopOnce),
    };

    // Arrancar idle
    actionsRef.current.idle?.play();
    currentRef.current = "idle";

    return () => mixer.stopAllAction();
  }, [scene, idleAnims, walkAnims, runAnims, jumpAnims]);

  // Cambiar animación
  useEffect(() => {
    const actions = actionsRef.current;
    const next = animState;
    if (!actions[next] || currentRef.current === next) return;

    const from = actions[currentRef.current];
    const to   = actions[next];

    if (from) from.fadeOut(0.15);
    to.reset().fadeIn(0.15).play();
    currentRef.current = next;
  }, [animState]);

  // Avanzar mixer
  useFrame((_, delta) => mixerRef.current?.update(delta));

  return <primitive object={scene} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// StressCharacterController
// ─────────────────────────────────────────────────────────────────────────────
const WALK_SPEED     = 4;
const RUN_SPEED      = 9;
const ROTATION_SPEED = degToRad(0.5);
const FLOOR_Y        = 0;
const ROOM_LIMIT     = 26;
const JUMP_FORCE     = 8;
const GRAVITY        = -20;

const StressCharacterController = ({
  avatarId = "male-1",
  avatarPosRef,
  mobileControls,
  isMobile = false,
}) => {
  const groupRef       = useRef();
  const container      = useRef();
  const characterRef   = useRef();
  const cameraPosition = useRef();
  const cameraTarget   = useRef();

  const cameraWorldPos = useRef(new Vector3());
  const cameraLookAtWP = useRef(new Vector3());
  const cameraLookAt   = useRef(new Vector3());

  const [, get]       = useKeyboardControls();
  const charRotTarget = useRef(0);
  const rotTarget     = useRef(0);
  const pos           = useRef(new Vector3(0, FLOOR_Y, 0));
  const velY          = useRef(0);
  const isOnGround    = useRef(true);
  const jumpPressed   = useRef(false);

  const [animState, setAnimState] = useState("idle");

  const modelUrl = AVATAR_MODELS[avatarId] || AVATAR_MODELS["male-1"];
  const isFemale = avatarId === "female-1" || avatarId === "female-2";

  useFrame(({ camera }, delta) => {
    const el = document.activeElement;
    if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA") return;

    const kb  = get();
    const mob = mobileControls?.current;

    // ── Movimiento horizontal ────────────────────────────────────────────────
    const mv = { x: 0, z: 0 };
    if (kb.forward  || (mob?.move?.y ?? 0) >  0.2) mv.z = -1;
    if (kb.backward || (mob?.move?.y ?? 0) < -0.2) mv.z =  1;
    if (kb.left     || (mob?.move?.x ?? 0) >  0.2) mv.x = -1;
    if (kb.right    || (mob?.move?.x ?? 0) < -0.2) mv.x =  1;

    // Joystick derecho → rotar cámara
    const lookX = mob?.look?.x ?? 0;
    if (Math.abs(lookX) > 0.1) rotTarget.current += degToRad(lookX * 1.5);

    const speed  = kb.run ? RUN_SPEED : WALK_SPEED;
    const moving = mv.x !== 0 || mv.z !== 0;

    if (moving) {
      charRotTarget.current = Math.atan2(mv.x, mv.z);
      if (mv.x !== 0) rotTarget.current += ROTATION_SPEED * mv.x;

      const nx = pos.current.x + Math.sin(rotTarget.current + charRotTarget.current) * speed * delta;
      const nz = pos.current.z + Math.cos(rotTarget.current + charRotTarget.current) * speed * delta;

      // Límites de sala
      pos.current.x = Math.max(-ROOM_LIMIT, Math.min(ROOM_LIMIT, nx));
      pos.current.z = Math.max(-ROOM_LIMIT, Math.min(ROOM_LIMIT, nz));
    }

    // ── Salto y gravedad ─────────────────────────────────────────────────────
    if (kb.jump && !jumpPressed.current && isOnGround.current) {
      velY.current = JUMP_FORCE;
      isOnGround.current = false;
      jumpPressed.current = true;
      setAnimState("jump");
    }
    if (!kb.jump) jumpPressed.current = false;

    if (!isOnGround.current) {
      velY.current += GRAVITY * delta;
      pos.current.y += velY.current * delta;

      if (pos.current.y <= FLOOR_Y) {
        pos.current.y = FLOOR_Y;
        velY.current  = 0;
        isOnGround.current = true;
      }
    } else {
      pos.current.y = FLOOR_Y;
    }

    // ── Animación ─────────────────────────────────────────────────────────────
    if (isOnGround.current) {
      if (moving) {
        setAnimState(kb.run ? "run" : "walk");
      } else {
        setAnimState("idle");
      }
    }
    // Si está en el aire mantiene "jump" hasta aterrizar (el useEffect lo maneja)

    // ── Aplicar posición ──────────────────────────────────────────────────────
    if (groupRef.current) groupRef.current.position.copy(pos.current);
    if (avatarPosRef)     avatarPosRef.current = pos.current;

    // ── Rotaciones suaves ─────────────────────────────────────────────────────
    if (characterRef.current) {
      characterRef.current.rotation.y = lerpAngle(
        characterRef.current.rotation.y,
        charRotTarget.current,
        0.1
      );
    }
    if (container.current) {
      container.current.rotation.y = MathUtils.lerp(
        container.current.rotation.y,
        rotTarget.current,
        0.1
      );
    }

    // ── Cámara tercera persona ─────────────────────────────────────────────────
    if (cameraPosition.current) {
      cameraPosition.current.getWorldPosition(cameraWorldPos.current);
      camera.position.lerp(cameraWorldPos.current, 0.15);
    }
    if (cameraTarget.current) {
      cameraTarget.current.getWorldPosition(cameraLookAtWP.current);
      cameraLookAt.current.lerp(cameraLookAtWP.current, 0.15);
      camera.lookAt(cameraLookAt.current);
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={container}>
        {/* Cámara: 5 unidades detrás, 3 arriba */}
        <group ref={cameraPosition} position={[0, 3, 5]} />
        {/* Punto de mira: altura de cabeza */}
        <group ref={cameraTarget} position={[0, 1.6, 0]} />

        <group ref={characterRef} scale={1.6} position-y={0}>
          <AvatarAnimated
            modelUrl={modelUrl}
            animState={animState}
            isFemale={isFemale}
          />
        </group>
      </group>
    </group>
  );
};

export default StressCharacterController;