import { useRef } from "react";
export const useMobileControls = () => {
  return useRef({ move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, jump: false });
};