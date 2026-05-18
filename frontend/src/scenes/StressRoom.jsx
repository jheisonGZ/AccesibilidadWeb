// =============================================================================
// src/pages/AvatarSelect.jsx
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { ArrowRight, Check } from "lucide-react";

import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { OrbitControls } from "three-stdlib";
import { DRACOLoader } from "three-stdlib";
import "../styles/avatar.css";
import { useAppNavigate, usePageReady } from "../providers/NavigationContext";
import { useFeedback } from "../hooks/useFeedback";

// =============================================================================
// HÁPTICA — Vibration API (Android) + fallback silencioso en iOS
// =============================================================================

// Tap suave al seleccionar carta
const vibrateSelect = () => {
  try { navigator.vibrate?.(18); } catch (e) {}
};

// Pulso doble al confirmar avatar
const vibrateConfirm = () => {
  try { navigator.vibrate?.([30, 60, 60]); } catch (e) {}
};

// =============================================================================
// SONIDOS
// =============================================================================

// "Pop" suave — disparado una sola vez desde el useEffect de isSelected
const playSelectSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {}
};

// Acorde cálido Do-Mi-Sol — disparado en didOpen del Swal
const playConfirmSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch (e) {}
};

// =============================================================================
// AVATARS
// =============================================================================
const AVATARS = [
  {
    id: "male-1",
    name: "Alejandro",
    gender: "Masculino",
    desc: "Estudiante activo y curioso.",
    color: "#93c5fd",
    model: "/models/hombre2.glb",
    staticAnim: "/models/animations/estatico.glb",
  },
  {
    id: "female-1",
    name: "Valentina",
    gender: "Femenino",
    desc: "Creativa, empatica y decidida.",
    color: "#f9a8d4",
    model: "/models/mujer2.glb",
    staticAnim: "/models/animations/estatica.glb",
  },
  {
    id: "male-2",
    name: "Sebastian",
    gender: "Masculino",
    desc: "Apasionado por la tecnologia.",
    color: "#6ee7b7",
    model: "/models/hombre.glb",
    staticAnim: "/models/animations/estatico.glb",
  },
  {
    id: "female-2",
    name: "Katerin",
    gender: "Femenino",
    desc: "Reflexiva y lista para aprender.",
    color: "#fcd34d",
    model: "/models/mujer.glb",
    staticAnim: "/models/animations/estatica.glb",
  },
];

// =============================================================================
// DRACO
// =============================================================================
const sharedDracoLoader = new DRACOLoader();
sharedDracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
);

// =============================================================================
// Cache de clips idle
// =============================================================================
const idleClipCache = {};

function loadIdleClip(url) {
  if (idleClipCache[url]) return idleClipCache[url];

  const promise = new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(sharedDracoLoader);
    loader.load(
      url,
      (gltf) => {
        if (gltf.animations && gltf.animations.length > 0) {
          const clip = THREE.AnimationClip.parse(
            THREE.AnimationClip.toJSON(gltf.animations[0])
          );
          resolve(clip);
        } else {
          console.warn("loadIdleClip: no animations in", url);
          resolve(null);
        }
      },
      undefined,
      () => {
        console.warn("loadIdleClip: failed to load", url);
        resolve(null);
      }
    );
  });

  idleClipCache[url] = promise;
  return promise;
}

// =============================================================================
// AvatarCanvas
// =============================================================================
function AvatarCanvas({ modelUrl, accentColor, isSelected, staticModelUrl }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const greetingPlayedRef = useRef(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    sceneRef.current = {};

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // ── Scene + Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38, el.clientWidth / el.clientHeight, 0.1, 100
    );
    camera.position.set(0, 1.1, 2.8);

    // ── Lights ────────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 2.5);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 5, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(512, 512);
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(0, 1, 4);
    const fillLight = new THREE.HemisphereLight(0xffffff, 0x444466, 0.5);
    const rimLight = new THREE.PointLight(new THREE.Color(accentColor), 0.6, 8);
    rimLight.position.set(-1.5, 2, -2);
    scene.add(ambient, dirLight, frontLight, fillLight, rimLight);

    // ── Controls ──────────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.target.set(0, 0.9, 0);
    controls.update();

    sceneRef.current.renderer = renderer;
    sceneRef.current.controls = controls;

    // ── Render loop ───────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (sceneRef.current.mixer) sceneRef.current.mixer.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ── Load model + idle en paralelo ─────────────────────────────────────────
    let cancelled = false;
    const modelLoader = new GLTFLoader();
    modelLoader.setDRACOLoader(sharedDracoLoader);

    Promise.all([
      new Promise((resolve, reject) => {
        modelLoader.load(modelUrl, resolve, undefined, reject);
      }),
      staticModelUrl ? loadIdleClip(staticModelUrl) : Promise.resolve(null),
    ])
      .then(([gltf, idleClip]) => {
        if (cancelled) return;

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 1.75 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.05;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        sceneRef.current.model = model;
        sceneRef.current.mixer = mixer;

        if (gltf.animations && gltf.animations.length > 0) {
          const greetingAction = mixer.clipAction(gltf.animations[0]);
          greetingAction.setLoop(THREE.LoopOnce, 1);
          greetingAction.clampWhenFinished = true;
          greetingAction.play();
          greetingAction.paused = true;
          greetingAction.time = 0;
          sceneRef.current.greetingAction = greetingAction;
        }

        if (idleClip) {
          const idleAction = mixer.clipAction(idleClip);
          idleAction.setLoop(THREE.LoopRepeat, Infinity);
          idleAction.reset();
          idleAction.play();
          idleAction.paused = false;
          sceneRef.current.idleAction = idleAction;
        } else {
          console.warn("No idle clip for", modelUrl);
        }

        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load avatar:", err);
        setError(true);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      controls.dispose();
      if (sceneRef.current.mixer) sceneRef.current.mixer.stopAllAction();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [modelUrl, accentColor, staticModelUrl]);

  // ── React to selection ────────────────────────────────────────────────────
  useEffect(() => {
    const { renderer } = sceneRef.current;
    if (!renderer) return;

    renderer.domElement.style.transition = "filter 0.3s ease";
    renderer.domElement.style.filter = isSelected
      ? `drop-shadow(0 0 14px ${accentColor}) drop-shadow(0 0 6px ${accentColor}88)`
      : "none";

    if (!isSelected) {
      greetingPlayedRef.current = false;
      const idle = sceneRef.current.idleAction;
      if (idle && idle.paused) {
        idle.reset();
        idle.play();
        idle.paused = false;
      }
      return;
    }

    // Sonido + vibración al quedar seleccionada (una sola vez)
    playSelectSound();
    vibrateSelect();

    if (greetingPlayedRef.current) return;

    const { greetingAction, mixer } = sceneRef.current;
    if (!greetingAction || !mixer) return;

    greetingPlayedRef.current = true;

    const idle = sceneRef.current.idleAction;
    if (idle) {
      idle.stop();
      idle.reset();
    }

    greetingAction.stop();
    greetingAction.reset();
    greetingAction.time = 0;
    greetingAction.paused = false;
    greetingAction.play();

    const onFinished = (e) => {
      if (e.action !== greetingAction) return;
      mixer.removeEventListener("finished", onFinished);
      greetingAction.paused = true;
    };

    mixer.addEventListener("finished", onFinished);
  }, [isSelected, accentColor, modelUrl]);

  return (
    <div className="av-canvas-wrap">
      <div ref={mountRef} className="av-canvas" />
      {(!loaded || error) && (
        <div className="av-canvas-placeholder" style={{ borderColor: accentColor }}>
          <ChibiSVG color={accentColor} />
          {!error && <span className="av-loading-dot" />}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ChibiSVG
// =============================================================================
function ChibiSVG({ color = "#7ecfff" }) {
  const light = color + "44";
  return (
    <svg viewBox="0 0 80 110" width="80" height="110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="85" rx="22" ry="25" fill={light} stroke={color} strokeWidth="1.5"/>
      <circle cx="40" cy="38" r="26" fill={light} stroke={color} strokeWidth="1.5"/>
      <path d="M14 32 Q18 10 40 12 Q62 10 66 32" fill={color} stroke={color} strokeWidth="1"/>
      <ellipse cx="32" cy="38" rx="4" ry="5" fill={color}/>
      <ellipse cx="48" cy="38" rx="4" ry="5" fill={color}/>
      <circle cx="33.5" cy="36.5" r="1.5" fill="white"/>
      <circle cx="49.5" cy="36.5" r="1.5" fill="white"/>
      <path d="M34 48 Q40 53 46 48" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="27" cy="44" r="4" fill={color} opacity="0.18"/>
      <circle cx="53" cy="44" r="4" fill={color} opacity="0.18"/>
      <ellipse cx="18" cy="78" rx="5" ry="14" fill={light} stroke={color} strokeWidth="1.2" transform="rotate(-10 18 78)"/>
      <ellipse cx="62" cy="78" rx="5" ry="14" fill={light} stroke={color} strokeWidth="1.2" transform="rotate(10 62 78)"/>
      <ellipse cx="32" cy="105" rx="7" ry="9" fill={light} stroke={color} strokeWidth="1.2"/>
      <ellipse cx="48" cy="105" rx="7" ry="9" fill={light} stroke={color} strokeWidth="1.2"/>
    </svg>
  );
}

// =============================================================================
// AvatarSelect
// =============================================================================
export default function AvatarSelect() {
  const rawNavigate = useNavigate();
  const navigate = useAppNavigate();
  const fb = useFeedback();
  usePageReady();

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("Todos");

  const filtered =
    filter === "Todos" ? AVATARS : AVATARS.filter((a) => a.gender === filter);

  // Sin sonido aquí — lo maneja el useEffect de AvatarCanvas
  const handleSelect = (id) => {
    setSelected(id);
  };

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    vibrateConfirm();
    fb.avatarConfirm();
    try {
      const user = auth.currentUser;
      if (!user) { rawNavigate("/"); return; }
      await setDoc(doc(db, "users", user.uid), { avatar: selected }, { merge: true });
      localStorage.setItem("avatar", selected);
      const av = AVATARS.find((a) => a.id === selected);
      await Swal.fire({
        icon: "success",
        title: `${av.name} seleccionado`,
        text: "Tu avatar esta listo. Entrando al escenario 3D...",
        confirmButtonText: "Vamos",
        confirmButtonColor: "#2c5364",
        background: "#0f2027",
        color: "#fff",
        iconColor: av.color,
        timer: 2500,
        timerProgressBar: true,
        // Sonido del acorde justo cuando aparece el popup
        didOpen: () => playConfirmSound(),
      });
      navigate("/home/scene", "Cargando escenario 3D");
    } catch (e) {
      console.error(e);
      setLoading(false);
      fb.error();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el avatar.",
        confirmButtonColor: "#2c5364",
      });
    }
  };

  return (
    <div className="av-page">
      <div className="av-container">
        <div className="av-header">
          <h1 className="av-title">Elige tu avatar</h1>
          <p className="av-subtitle">
            Selecciona el personaje que te representara en el escenario 3D de bienestar.
          </p>
        </div>

        <div className="av-filters">
          {["Todos", "Masculino", "Femenino"].map((f) => (
            <button
              key={f}
              className={`av-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => { setFilter(f); fb.cardClick(); }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="av-grid">
          {filtered.map((av) => (
            <div
              key={av.id}
              className={`av-card ${selected === av.id ? "selected" : ""}`}
              onClick={() => handleSelect(av.id)}
              style={{ "--av-accent": av.color }}
            >
              {selected === av.id && (
                <div className="av-check">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              <AvatarCanvas
                modelUrl={av.model}
                staticModelUrl={av.staticAnim}
                accentColor={av.color}
                isSelected={selected === av.id}
                avatarName={av.name}
              />
              <div className="av-info">
                <span className="av-gender-tag">{av.gender}</span>
                <h3 className="av-name">{av.name}</h3>
                <p className="av-desc">{av.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          className="av-btn"
          onClick={handleContinue}
          disabled={!selected || loading}
        >
          {loading ? (
            "Guardando..."
          ) : selected ? (
            <><span>Entrar al escenario 3D</span><ArrowRight size={18} /></>
          ) : (
            "Selecciona un avatar para continuar"
          )}
        </button>
      </div>
    </div>
  );
}