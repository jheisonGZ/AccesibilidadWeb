import { useEffect, useState } from "react";
export const useLandscapeLock = () => {
  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight > window.innerWidth);
  useEffect(() => {
    screen.orientation?.lock?.("landscape").catch(() => {});
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      screen.orientation?.unlock?.();
    };
  }, []);
  return { isPortrait };
};