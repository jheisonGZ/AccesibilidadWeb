import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../providers/AuthProvider";
import {
  Heart, AlertTriangle, AlertCircle, Activity,
  TrendingUp, Calendar, Award, BarChart3, ChevronDown
} from "lucide-react";
import { Chart, registerables } from "chart.js";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { OrbitControls } from "three-stdlib";
import { DRACOLoader } from "three-stdlib";
import "../styles/progress.css";

Chart.register(...registerables);

const AVATARS = [
  { id: "male-1",   name: "Alejandro", color: "#93c5fd", model: "/models/hombre2.glb",    staticAnim: "/models/animations/estatico.glb" },
  { id: "female-1", name: "Valentina", color: "#f9a8d4", model: "/models/mujer2.glb",     staticAnim: "/models/animations/estatica.glb" },
  { id: "male-2",   name: "Sebastian", color: "#6ee7b7", model: "/models/hombre.glb",     staticAnim: "/models/animations/estatico.glb" },
  { id: "female-2", name: "Katerin",   color: "#fcd34d", model: "/models/mujer.glb",      staticAnim: "/models/animations/estatica.glb" },
  { id: "male-3",   name: "Mateo",     color: "#86efac", model: "/models/hombre3.glb",    staticAnim: "/models/animations/estatico.glb" },
  { id: "female-3", name: "Isabela",   color: "#f0abfc", model: "/models/mujer3.glb",     staticAnim: "/models/animations/estatica.glb" },
  { id: "nb-1",     name: "Camilo",    color: "#fbbf24", model: "/models/no_binaria.glb", staticAnim: "/models/animations/estatica.glb" },
];

const CLASSIFY = {
  neutro:   { label: "Bienestar estable", Icon: Heart,         color: "#7ecfff" },
  leve:     { label: "Leve malestar",     Icon: Activity,      color: "#34d399" },
  estres:   { label: "Estrés moderado",   Icon: AlertTriangle, color: "#fbbf24" },
  ansiedad: { label: "Ansiedad elevada",  Icon: AlertCircle,   color: "#f87171" },
};

function scoreToClassKey(s) {
  if (s <= 4)  return "neutro";
  if (s <= 9)  return "leve";
  if (s <= 14) return "estres";
  return "ansiedad";
}

const fmt = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
};

const sharedDracoLoader = new DRACOLoader();
sharedDracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

const idleClipCache = {};
function loadIdleClip(url) {
  if (idleClipCache[url]) return idleClipCache[url];
  const p = new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(sharedDracoLoader);
    loader.load(url, (gltf) => {
      if (gltf.animations?.length > 0)
        resolve(THREE.AnimationClip.parse(THREE.AnimationClip.toJSON(gltf.animations[0])));
      else resolve(null);
    }, undefined, () => resolve(null));
  });
  idleClipCache[url] = p;
  return p;
}

// ── Avatar panel ─────────────────────────────────────────────────────────────
function AvatarPanel({ avatarId, latestRecord, total }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const [loaded, setLoaded] = useState(false);
  const av = AVATARS.find((a) => a.id === avatarId);
  const cl = CLASSIFY[latestRecord?.classification] ?? CLASSIFY.neutro;
  const score = latestRecord?.score ?? 0;

  useEffect(() => {
    if (!av || !mountRef.current) return;
    const el = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 1.1, 2.8);
    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(2,5,3); scene.add(dir);
    const front = new THREE.DirectionalLight(0xffffff, 0.6); front.position.set(0,1,4); scene.add(front);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 0.5));
    const rim = new THREE.PointLight(new THREE.Color(av.color), 0.9, 8); rim.position.set(-1.5,2,-2); scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = controls.enablePan = controls.enableRotate = false;
    controls.enableDamping = true; controls.dampingFactor = 0.05;
    controls.target.set(0, 0.9, 0); controls.update();

    const clock = new THREE.Clock(); let rafId; let cancelled = false;
    const animate = () => { rafId = requestAnimationFrame(animate); sceneRef.current.mixer?.update(clock.getDelta()); controls.update(); renderer.render(scene, camera); };
    animate();

    const modelLoader = new GLTFLoader();
    modelLoader.setDRACOLoader(sharedDracoLoader);
    Promise.all([
      new Promise((res,rej) => modelLoader.load(av.model, res, undefined, rej)),
      av.staticAnim ? loadIdleClip(av.staticAnim) : Promise.resolve(null),
    ]).then(([gltf, idleClip]) => {
      if (cancelled) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 1.75 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      model.position.y += 0.05;
      model.traverse((c) => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
      scene.add(model);
      const mixer = new THREE.AnimationMixer(model);
      sceneRef.current.mixer = mixer;
      if (idleClip) mixer.clipAction(idleClip).setLoop(THREE.LoopRepeat, Infinity).reset().play();
      setLoaded(true);
    }).catch(console.error);

    const ro = new ResizeObserver(() => {
      if (!el) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      cancelled = true; cancelAnimationFrame(rafId); ro.disconnect();
      controls.dispose(); sceneRef.current.mixer?.stopAllAction();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [av?.model, av?.staticAnim, av?.color]);

  if (!av) return null;

  return (
    <div className="pr-avatar-panel" style={{ "--av-color": av.color }}>
      {/* zona 3D */}
      <div className="pr-avatar-3d-zone">
        <div className="pr-avatar-glow" style={{ background: av.color }} />
        <div ref={mountRef} className="pr-avatar-canvas" />
        {!loaded && (
          <div className="pr-avatar-placeholder">
            <Activity size={22} className="pr-spin" style={{ color: av.color }} />
          </div>
        )}
      </div>
      {/* info del personaje */}
      <div className="pr-avatar-info">
        <div className="pr-avatar-meta">
          <p className="pr-avatar-sublabel">Personaje</p>
          <p className="pr-avatar-name">{av.name}</p>
        </div>
        <div className="pr-avatar-estado" style={{ background: cl.color + "18", borderColor: cl.color + "44" }}>
          <p className="pr-avatar-sublabel">Estado actual</p>
          <p className="pr-avatar-estado-val" style={{ color: cl.color }}>{cl.label}</p>
        </div>
        <div className="pr-avatar-score-wrap">
          <div className="pr-avatar-score-row">
            <span className="pr-avatar-sublabel">Puntaje</span>
            <span className="pr-avatar-score-num">{score}/21</span>
          </div>
          <div className="pr-avatar-bar-track">
            <div className="pr-avatar-bar-fill" style={{ width: `${(score/21)*100}%`, background: cl.color }} />
          </div>
        </div>
        <div className="pr-avatar-sessions">
          <span className="pr-avatar-sublabel">Sesiones</span>
          <span className="pr-avatar-sessions-num">{total}</span>
        </div>
      </div>
    </div>
  );
}

// ── Gráficas ──────────────────────────────────────────────────────────────────
function ChartsSection({ records }) {
  const donutRef = useRef(null);
  const radarRef = useRef(null);
  const lineRef  = useRef(null);
  const donutInst = useRef(null);
  const radarInst = useRef(null);
  const lineInst  = useRef(null);

  useEffect(() => {
    if (!records.length) return;
    const tooltipBg = "#0f1f2e";
    const gridC     = "rgba(255,255,255,0.07)";
    const labelC    = "rgba(255,255,255,0.4)";

    // Distribución dona
    const counts = records.reduce((acc,r) => { acc[r.classification]=(acc[r.classification]||0)+1; return acc; }, {});
    const donutData   = ["neutro","leve","estres","ansiedad"].map(k=>counts[k]||0);
    const donutColors = ["#7ecfff","#34d399","#fbbf24","#f87171"];
    donutInst.current?.destroy();
    const dCtx = donutRef.current?.getContext("2d");
    if (dCtx) {
      donutInst.current = new Chart(dCtx, {
        type: "doughnut",
        data: { labels:["Bienestar","Leve","Estrés","Ansiedad"], datasets:[{ data:donutData, backgroundColor:donutColors, borderColor:"#0a1520", borderWidth:2, hoverOffset:6 }] },
        options: { responsive:true, maintainAspectRatio:false, cutout:"65%", plugins:{ legend:{display:false}, tooltip:{ backgroundColor:tooltipBg, padding:8, callbacks:{ label:(ctx)=>{ const t=ctx.dataset.data.reduce((a,b)=>a+b,0); const pct=t?Math.round((ctx.parsed/t)*100):0; return ` ${ctx.parsed} · ${pct}%`; } } } } },
      });
    }

    // Radar dimensiones
    const last5 = [...records].slice(0,5);
    const avgAnsiedad = last5.length ? Math.round(last5.reduce((a,r)=>a+(r.puntaje_ansiedad??0),0)/last5.length) : 0;
    const avgEstres   = last5.length ? Math.round(last5.reduce((a,r)=>a+(r.puntaje_estres??0),0)/last5.length) : 0;
    const maxAnsiedad = 12, maxEstres = 9;
    const pctAnsiedad = Math.round((avgAnsiedad/maxAnsiedad)*100);
    const pctEstres   = Math.round((avgEstres/maxEstres)*100);
    const pctBienestar = Math.max(0, 100 - Math.round(((avgAnsiedad+avgEstres)/(maxAnsiedad+maxEstres))*100));
    const lastScore = records[0]?.score ?? 0;
    const pctConc = Math.max(0, 100 - Math.round((lastScore/21)*80));
    const pctEnergia = Math.max(0, 100 - Math.round((lastScore/21)*70));
    const accentColor = CLASSIFY[records[0]?.classification]?.color ?? "#fbbf24";

    radarInst.current?.destroy();
    const rCtx = radarRef.current?.getContext("2d");
    if (rCtx) {
      radarInst.current = new Chart(rCtx, {
        type: "radar",
        data: {
          labels: ["Ansiedad","Estrés","Bienestar","Concentración","Energía"],
          datasets:[{
            label:"Promedio últimas 5",
            data:[pctAnsiedad, pctEstres, pctBienestar, pctConc, pctEnergia],
            backgroundColor: accentColor+"22",
            borderColor: accentColor,
            borderWidth:1.5,
            pointBackgroundColor: accentColor,
            pointRadius:3,
          }]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ backgroundColor:tooltipBg, padding:8 } },
          scales:{ r:{
            min:0, max:100,
            ticks:{ display:false },
            grid:{ color:"rgba(255,255,255,0.08)" },
            pointLabels:{ color:labelC, font:{size:9} },
            angleLines:{ color:"rgba(255,255,255,0.06)" }
          }}
        }
      });
    }

    // Tendencia línea
    const data = [...records].reverse().slice(-20);
    const labels = data.map(r=>fmt(r.createdAt));
    const scores = data.map(r=>r.score??0);
    const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
    const ptColors = scores.map(s=>CLASSIFY[scoreToClassKey(s)].color);

    lineInst.current?.destroy();
    const lCtx = lineRef.current?.getContext("2d");
    if (lCtx && data.length >= 2) {
      lineInst.current = new Chart(lCtx, {
        type:"line",
        data:{
          labels,
          datasets:[
            { label:"Puntaje", data:scores, borderColor:"#fbbf24", backgroundColor:(()=>{ const g=lCtx.createLinearGradient(0,0,0,120); g.addColorStop(0,"rgba(251,191,36,0.22)"); g.addColorStop(1,"rgba(251,191,36,0)"); return g; })(), borderWidth:2, fill:true, tension:0.35, pointRadius:4, pointHoverRadius:7, pointBackgroundColor:ptColors, pointBorderColor:"#0a1520", pointBorderWidth:1.5 },
            { label:"Promedio", data:scores.map(()=>avg), borderColor:"rgba(251,191,36,0.3)", borderWidth:1.5, borderDash:[5,4], pointRadius:0, fill:false },
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ backgroundColor:tooltipBg, padding:8, callbacks:{ label:(ctx)=>{ if(ctx.datasetIndex===1) return ` Promedio: ${ctx.parsed.y}`; const k=scoreToClassKey(ctx.parsed.y); return [` Puntaje: ${ctx.parsed.y}/21`,` ${CLASSIFY[k].label}`]; } } } },
          scales:{
            x:{ ticks:{color:labelC,font:{size:9},maxRotation:35,autoSkip:true,maxTicksLimit:8}, grid:{color:gridC}, border:{display:false} },
            y:{ min:0,max:21, ticks:{color:labelC,font:{size:9},stepSize:7,callback:(v)=>v===0?"0":v===7?"7":v===14?"14":v===21?"21":v}, grid:{color:gridC}, border:{display:false} }
          }
        }
      });
    }

    return () => { donutInst.current?.destroy(); radarInst.current?.destroy(); lineInst.current?.destroy(); };
  }, [records]);

  const counts = records.reduce((acc,r)=>{ acc[r.classification]=(acc[r.classification]||0)+1; return acc; },{});
  const total  = records.length;

  return (
    <>
      {/* Fila dona + radar */}
      <div className="pr-charts-pair">
        <div className="pr-chart-card">
          <p className="pr-section-title">Distribución</p>
          <div className="pr-donut-body">
            <div className="pr-donut-canvas-wrap">
              <canvas ref={donutRef} />
            </div>
            <div className="pr-donut-legend">
              {Object.entries(CLASSIFY).map(([key,{label,color}]) => {
                const count=counts[key]||0;
                const pct=total?Math.round((count/total)*100):0;
                return (
                  <div className="pr-donut-legend-row" key={key}>
                    <span className="pr-donut-dot" style={{background:color}}/>
                    <span className="pr-donut-label">{label}</span>
                    <span className="pr-donut-pct" style={{color}}>{pct}%</span>
                    <span className="pr-donut-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pr-chart-card">
          <p className="pr-section-title">Dimensiones</p>
          <div className="pr-radar-wrap">
            <canvas ref={radarRef} />
          </div>
        </div>
      </div>

      {/* Tendencia */}
      <div className="pr-chart-card pr-chart-line">
        <div className="pr-chart-header">
          <p className="pr-section-title" style={{margin:0}}>Tendencia de puntajes</p>
          <div className="pr-chart-legend">
            <span><span className="pr-legend-dot" style={{background:"#fbbf24"}}/> Puntaje</span>
            <span><span className="pr-legend-dot" style={{background:"#7ecfff"}}/> Estable</span>
            <span><span className="pr-legend-dot" style={{background:"#f87171"}}/> Ansiedad</span>
          </div>
        </div>
        <div className="pr-line-wrap"><canvas ref={lineRef}/></div>
      </div>
    </>
  );
}

// ── Acordeón historial ────────────────────────────────────────────────────────
function HistorialAccordion({ records }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pr-accordion-card">
      <button className={`pr-accordion-toggle ${open?"open":""}`} onClick={()=>setOpen(v=>!v)}>
        <div className="pr-section-title-row">
          <span className="pr-section-dot"/>
          <span className="pr-section-title" style={{margin:0}}>Historial detallado</span>
        </div>
        <ChevronDown size={14} className="pr-chevron"/>
      </button>
      <div className={`pr-accordion-body ${open?"open":""}`}>
        <div className="pr-timeline">
          {records.map((r,i) => {
            const cl=CLASSIFY[r.classification]??CLASSIFY.neutro;
            return (
              <div className="pr-timeline-item" key={r.id} style={{animationDelay:`${i*0.04}s`}}>
                <div className="pr-tl-icon" style={{color:cl.color,borderColor:cl.color}}><cl.Icon size={13}/></div>
                <div className="pr-tl-body">
                  <div className="pr-tl-top">
                    <span className="pr-tl-state" style={{color:cl.color}}>{cl.label}</span>
                    <span className="pr-tl-date">{fmt(r.createdAt)}</span>
                  </div>
                  <div className="pr-tl-score">
                    <div className="pr-tl-bar-track"><div className="pr-tl-bar-fill" style={{width:`${((r.score??0)/21)*100}%`,background:cl.color}}/></div>
                    <span className="pr-tl-pts">{r.score??0}/21</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Progress() {
  const navigate        = useNavigate();
  const { user, alias } = useAuth();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [avatarId, setAvatarId] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db,"users",user.uid,"assessments"), orderBy("createdAt","desc")));
        setRecords(snap.docs.map(d=>({id:d.id,...d.data()})));
        const cached = localStorage.getItem("avatar");
        if (cached) { setAvatarId(cached); }
        else {
          const userDoc = await getDoc(doc(db,"users",user.uid));
          if (userDoc.exists()) setAvatarId(userDoc.data()?.avatar??null);
        }
      } catch(e){ console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user, navigate]);

  const total    = records.length;
  const avgScore = total ? Math.round(records.reduce((a,r)=>a+(r.score??0),0)/total) : 0;
  const latest   = records[0];
  const best     = records.reduce((a,r)=>(r.score??99)<(a?.score??99)?r:a, null);
  const counts   = records.reduce((acc,r)=>{ acc[r.classification]=(acc[r.classification]||0)+1; return acc; },{});

  useEffect(() => {
    if (!total) return;
    localStorage.setItem("taison_progress_context", JSON.stringify({
      totalEvaluaciones:total, promedio:avgScore,
      ultimoEstado:latest?.classification||"neutro",
      mejorResultado:best?.score||0,
      distribucion:{neutro:counts.neutro||0,leve:counts.leve||0,estres:counts.estres||0,ansiedad:counts.ansiedad||0},
    }));
  }, [total, avgScore, latest, best, counts]);

  return (
    <div className="pr-page">
      <div className="pr-container">

        <div className="pr-header">
  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
    <div className="pr-avatar-mini">
      {user?.photoURL ? <img src={user.photoURL} alt="avatar"/> : <span>{alias?.charAt(0).toUpperCase()}</span>}
    </div>
    <div>
      <h1 className="pr-title">Tu progreso emocional</h1>
      <p className="pr-subtitle">Historial de <b>{alias}</b></p>
    </div>
  </div>
</div>

        {loading ? (
          <div className="pr-loading"><Activity size={28} className="pr-spin"/><p>Cargando historial...</p></div>
        ) : total === 0 ? (
          <div className="pr-empty">
            <BarChart3 size={44} opacity={0.28}/>
            <p>Aún no tienes evaluaciones registradas.</p>
            <button className="pr-btn-start" onClick={()=>navigate("/home/questionnaire")}>Hacer mi primera evaluación</button>
          </div>
        ) : (
          <div className="pr-main-layout">

{/* FICHA PERSONAJE */}
{avatarId && (
  <div className="pr-right-col">
    <AvatarPanel avatarId={avatarId} latestRecord={latest} total={total}/>
    <button className="pr-btn-new pr-btn-desktop" onClick={()=>navigate("/home/questionnaire")}>
      <Activity size={15}/> Nueva evaluación
    </button>
  </div>
)}

            {/* COLUMNA IZQUIERDA */}
            <div className="pr-left-col">

              {/* Stats 4 tarjetas */}
              <div className="pr-stats">
                <div className="pr-stat-card">
                  <Calendar size={17} style={{color:"#7ecfff",flexShrink:0}}/>
                  <div><span className="pr-stat-label">Evaluaciones</span><span className="pr-stat-value">{total}</span></div>
                </div>
                <div className="pr-stat-card">
                  <TrendingUp size={17} style={{color:"#34d399",flexShrink:0}}/>
                  <div><span className="pr-stat-label">Promedio</span><span className="pr-stat-value">{avgScore}<small>/21</small></span></div>
                </div>
                <div className="pr-stat-card">
                  <Award size={17} style={{color:"#fbbf24",flexShrink:0}}/>
                  <div><span className="pr-stat-label">Mejor</span><span className="pr-stat-value" style={{color:"#fbbf24"}}>{best?`${best.score}pts`:"—"}</span></div>
                </div>
                {latest && (()=>{
                  const cl=CLASSIFY[latest.classification]??CLASSIFY.neutro;
                  return (
                    <div className="pr-stat-card">
                      <cl.Icon size={17} style={{color:cl.color,flexShrink:0}}/>
                      <div><span className="pr-stat-label">Último estado</span><span className="pr-stat-value" style={{color:cl.color,fontSize:"0.78rem"}}>{cl.label}</span></div>
                    </div>
                  );
                })()}
              </div>

              {/* Gráficas */}
              <ChartsSection records={records}/>

              {/* Historial acordeón */}
              <HistorialAccordion records={records}/>

              {/* Botón nueva evaluación */}
              <button className="pr-btn-new pr-btn-mobile" onClick={()=>navigate("/home/questionnaire")}>
               <Activity size={15}/> Nueva evaluación
               </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}