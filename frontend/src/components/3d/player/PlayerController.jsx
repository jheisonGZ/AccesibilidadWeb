import { useRef, useEffect } from "react";

import {
  useFrame,
  useThree
} from "@react-three/fiber";

import {
  useGLTF,
  useAnimations
} from "@react-three/drei";

export default function PlayerController({
  controls
}) {

  const group = useRef();

  const { camera } = useThree();

  // MODELO
  const model = useGLTF("/models/hombre.glb");

  // ANIMACIONES
  const idleAnimation = useGLTF(
    "/models/animations/estatico.glb"
  );

  const walkAnimation = useGLTF(
    "/models/animations/caminar.glb"
  );

  // ACTIONS
  const idle = useAnimations(
    idleAnimation.animations,
    group
  );

  const walk = useAnimations(
    walkAnimation.animations,
    group
  );

  // TECLADO
  const keys = useRef({});

  // ESTADO MOVIMIENTO
  const movingRef = useRef(false);
  const currentAnimation = useRef("idle");

  useEffect(() => {

    const down = (e) => {
      keys.current[e.key.toLowerCase()] = true;
    };

    const up = (e) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };

  }, []);

  // PLAY IDLE INICIAL
  useEffect(() => {

    const idleAction =
      Object.values(idle.actions || {})[0];

    if (idleAction) {
      idleAction.play();
    }

  }, [idle]);

  // GAME LOOP
  useFrame(() => {

    if (!group.current) return;

    const speed = 0.05;

    let moving = false;
    
    // JOYSTICK MOBILE
    const move = controls?.current?.move;

    // ACTIONS
    const idleAction =
      Object.values(idle.actions || {})[0];

    const walkAction =
      Object.values(walk.actions || {})[0];

    // W
    if (keys.current["w"]) {

      group.current.position.z -= speed;

      group.current.rotation.y = 0;

      moving = true;
    }

    // S
    if (keys.current["s"]) {

      group.current.position.z += speed;

      group.current.rotation.y = Math.PI;

      moving = true;
    }

    // A
    if (keys.current["a"]) {

      group.current.position.x -= speed;

      group.current.rotation.y = Math.PI / 2;

      moving = true;
    }

    // D
    if (keys.current["d"]) {

      group.current.position.x += speed;

      group.current.rotation.y = -Math.PI / 2;

      moving = true;
    }

    // MOBILE JOYSTICK
// MOBILE JOYSTICK
if (
  move &&
  (
    Math.abs(move.x) > 0.1 ||
    Math.abs(move.y) > 0.1
  )
) {

  group.current.position.x +=
    move.x * speed;

  group.current.position.z +=
    move.y * speed;

  moving = true;

  // ROTACIÓN
  if (Math.abs(move.x) > Math.abs(move.y)) {

    if (move.x > 0) {
      group.current.rotation.y =
        -Math.PI / 2;
    } else {
      group.current.rotation.y =
        Math.PI / 2;
    }

  } else {

    if (move.y > 0) {
      group.current.rotation.y =
        Math.PI;
    } else {
      group.current.rotation.y = 0;
    }
  }
}
    
    // CAMBIO DE ESTADO
if (moving !== movingRef.current) {

  movingRef.current = moving;

  // CAMINAR
  if (moving && currentAnimation.current !== "walk") {

    currentAnimation.current = "walk";

    idleAction?.fadeOut(0.2);

    walkAction
      ?.reset()
      .fadeIn(0.2)
      .play();
  }

  // IDLE
  else if (
    !moving &&
    currentAnimation.current !== "idle"
  ) {

    currentAnimation.current = "idle";

    walkAction?.fadeOut(0.2);

    idleAction
      ?.reset()
      .fadeIn(0.2)
      .play();
  }
}

    // FOLLOW CAMERA
    camera.position.x += (
      group.current.position.x
      - camera.position.x
    ) * 0.08;

    camera.position.y += (
      group.current.position.y + 2
      - camera.position.y
    ) * 0.08;

    camera.position.z += (
      group.current.position.z - 4
      - camera.position.z
    ) * 0.08;

    camera.lookAt(group.current.position);

  });

  return (
    <primitive
      ref={group}
      object={model.scene}
      scale={0.5}
      position={[0, 0.3, 0]}
    />
  );
}