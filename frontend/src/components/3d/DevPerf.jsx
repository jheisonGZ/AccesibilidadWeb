import { StatsGl } from "@react-three/drei";
import { useEffect } from "react";

export default function DevPerf() {
  useEffect(() => {
    if (document.head.querySelector("[data-perf-style]")) return;
    const style = document.createElement("style");
    style.setAttribute("data-perf-style", "true");
    style.textContent = `
      #r3f-perf {
        position: fixed !important;
        left: 0 !important;
        bottom: 0 !important;
        z-index: 999999 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return <StatsGl id="r3f-perf" />;
}
