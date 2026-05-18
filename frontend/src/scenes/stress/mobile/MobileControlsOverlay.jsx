import VirtualJoystick from "./VirtualJoystick";
const MobileControlsOverlay = ({ controls }) => (
  <div className="mobile-overlay">
    <VirtualJoystick side="left"  onMove={(v) => { controls.current.move = v; }} />
    <VirtualJoystick side="right" onMove={(v) => { controls.current.look = v; }} />
  </div>
);
export default MobileControlsOverlay;