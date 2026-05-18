import { useState, useEffect, useRef } from "react";
import { useStressRoom } from "../../context/StressRoomContext";
import STRESS_ITEMS from "./StressItemsData";

const StressChallenge = () => {
  const { activeItem, challengeOpen, closeChallenge, collectItem } = useStressRoom();
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [stepDone,    setStepDone]    = useState(false);
  const [allDone,     setAllDone]     = useState(false);
  const intervalRef = useRef(null);
  const item = STRESS_ITEMS.find((i) => i.id === activeItem);

  useEffect(() => {
    if (!challengeOpen || !item) return;
    setCurrentStep(0); setAllDone(false); setStepDone(false);
    setTimeLeft(item.steps[0].duration);
  }, [challengeOpen, activeItem]);

  useEffect(() => {
    if (!challengeOpen || allDone) return;
    clearInterval(intervalRef.current);
    setStepDone(false);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current); setStepDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [currentStep, challengeOpen, allDone]);

  if (!challengeOpen || !item) return null;

  const steps = item.steps;
  const step  = steps[currentStep];
  const progress = ((currentStep + (stepDone ? 1 : 0)) / steps.length) * 100;
  const timerPct = stepDone ? 0 : (timeLeft / step.duration) * 100;

  const handleNext = () => {
    if (!stepDone) return;
    if (currentStep < steps.length - 1) {
      const n = currentStep + 1;
      setCurrentStep(n); setTimeLeft(steps[n].duration); setStepDone(false);
    } else {
      setAllDone(true);
    }
  };

  return (
    <div className="stress-challenge-overlay">
      <div className="stress-challenge-panel" style={{ "--item-color": item.color, "--item-glow": item.glowColor }}>
        <div className="sc-header">
          <span className="sc-emoji">{item.emoji}</span>
          <div className="sc-title-block">
            <h3 className="sc-title">{item.title}</h3>
            <p className="sc-desc">{item.description}</p>
          </div>
          <button className="sc-close" onClick={closeChallenge}>✕</button>
        </div>

        <div className="sc-progress-bar-track">
          <div className="sc-progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="sc-progress-label">Paso {Math.min(currentStep + (stepDone ? 1 : 0), steps.length)} de {steps.length}</div>

        {!allDone ? (
          <>
            <div className="sc-step-box">
              <p className="sc-step-text">{step.text}</p>
              <div className="sc-timer-wrapper">
                <svg viewBox="0 0 60 60" className="sc-timer-svg">
                  <circle cx="30" cy="30" r="26" className="sc-timer-track" />
                  <circle cx="30" cy="30" r="26" className="sc-timer-arc"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 26}px`,
                      strokeDashoffset: `${(1 - timerPct / 100) * 2 * Math.PI * 26}px`,
                      stroke: item.color,
                    }}
                  />
                </svg>
                <span className="sc-timer-num">{stepDone ? "✓" : timeLeft}</span>
              </div>
            </div>
            <button className={`sc-btn ${stepDone ? "sc-btn-active" : "sc-btn-disabled"}`} onClick={handleNext} disabled={!stepDone}>
              {currentStep < steps.length - 1 ? "Siguiente paso →" : "Completar ejercicio ✓"}
            </button>
          </>
        ) : (
          <div className="sc-complete">
            <div className="sc-complete-icon">🌟</div>
            <h4>¡Ejercicio completado!</h4>
            <p>Has practicado <strong>{item.title}</strong>. ¡Sigue así!</p>
            <button className="sc-btn sc-btn-active sc-btn-collect" onClick={() => collectItem(item.id)}>
              Recoger objeto ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StressChallenge;