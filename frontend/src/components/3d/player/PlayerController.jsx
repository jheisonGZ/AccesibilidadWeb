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

  const runAnimation = useGLTF(
    "/models/animations/correr.glb"
  );

  const jumpAnimation = useGLTF(
    "/models/animations/saltar.glb"
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

  const run = useAnimations(
    runAnimation.animations,
    group
  );

  const jump = useAnimations(
    jumpAnimation.animations,
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

    const runAction =
      Object.values(run.actions || {})[0];

    const jumpAction =
      Object.values(jump.actions || {})[0];

    const isRunning = keys.current["shift"];

    // W
    if (keys.current["w"]) {
      group.current.position.z -= isRunning ? speed * 2 : speed;
      group.current.rotation.y = 0;
      moving = true;
    }

    // S
    if (keys.current["s"]) {
      group.current.position.z += isRunning ? speed * 2 : speed;
      group.current.rotation.y = Math.PI;
      moving = true;
    }

    // A
    if (keys.current["a"]) {
      group.current.position.x -= isRunning ? speed * 2 : speed;
      group.current.rotation.y = Math.PI / 2;
      moving = true;
    }

    // D
    if (keys.current["d"]) {
      group.current.position.x += isRunning ? speed * 2 : speed;
      group.current.rotation.y = -Math.PI / 2;
      moving = true;
    }

    // LÍMITES DEL MAPA
    const limit = 4.5;
    group.current.position.x = Math.max(
      -limit,
      Math.min(limit, group.current.position.x)
    );
    group.current.position.z = Math.max(
      -limit,
      Math.min(limit, group.current.position.z)
    );

    // SALTAR
    if (keys.current[" "]) {

      keys.current[" "] = false;

      if (currentAnimation.current !== "jump") {

        currentAnimation.current = "jump";

        idleAction?.fadeOut(0.1);
        walkAction?.fadeOut(0.1);
        runAction?.fadeOut(0.1);

        jumpAction
          ?.reset()
          .setEffectiveTimeScale(1.8)
          .fadeIn(0.1)
          .play();

        jumpAction.clampWhenFinished = true;

        jumpAction._mixer.addEventListener(
          "finished",
          function onFinished() {
            currentAnimation.current = "idle";
            jumpAction?.fadeOut(0.1);
            idleAction?.reset().fadeIn(0.1).play();
            jumpAction._mixer.removeEventListener("finished", onFinished);
          }
        );
      }
    }

    // CAMBIO DE ESTADO
    else if (
      moving !== movingRef.current ||
      (moving && isRunning !== (currentAnimation.current === "run"))
    ) {

      movingRef.current = moving;

      // CORRER
      if (moving && isRunning && currentAnimation.current !== "run") {

        currentAnimation.current = "run";

        idleAction?.fadeOut(0.15);
        walkAction?.fadeOut(0.15);

        if (!runAction?.isRunning()) {
          runAction
            ?.reset()
            .fadeIn(0.15)
            .play();
        } else {
          runAction?.fadeIn(0.15);
        }
      }

      // CAMINAR
      else if (moving && !isRunning && currentAnimation.current !== "walk") {

        currentAnimation.current = "walk";

        idleAction?.fadeOut(0.15);
        runAction?.fadeOut(0.15);

        if (!walkAction?.isRunning()) {
          walkAction
            ?.reset()
            .fadeIn(0.15)
            .play();
        } else {
          walkAction?.fadeIn(0.15);
        }
      }

      // IDLE
      else if (
        !moving &&
        currentAnimation.current !== "idle"
      ) {

        currentAnimation.current = "idle";

        walkAction?.fadeOut(0.2);
        runAction?.fadeOut(0.2);
        jumpAction?.fadeOut(0.2);

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