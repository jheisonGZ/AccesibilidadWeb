import { useEffect, useRef, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { StressRoomProvider } from "../context/StressRoomContext";
import StressRoom3D          from "./stress/StressRoom";
import StressChallenge       from "./stress/StressChallenge";
import StressCompleteModal   from "./stress/StressCompleteModal";
import StressHUD             from "./stress/StressHUD";
import MobileControlsOverlay from "./stress/mobile/MobileControlsOverlay";
import RotatePrompt          from "./stress/mobile/RotatePrompt";
import { useMobileControls } from "./stress/mobile/useMobileControls";
import { useLandscapeLock }  from "./stress/mobile/useLandscapeLock";
import "../styles/StressRoom.css";

function StressRoomInner() {
  const [avatarId, setAvatarId] = useState("male-1");
  const [isMobile, setIsMobile] = useState(false);
  const controls = useMobileControls();
  const { isPortrait } = useLandscapeLock();

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const u = auth.currentUser;
        if (!u) return;
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const skin = snap.data().avatar || snap.data().avatarSkin || snap.data().avatar_skin;
           if (skin) setAvatarId(skin);

        }
      } catch { }
    };
    load();
  }, []);

  if (isMobile && isPortrait) return <RotatePrompt />;

  return (
    <div className="stress-room-root">
      <StressRoom3D avatarId={avatarId} mobileControls={controls} isMobile={isMobile} />
      <StressHUD isMobile={isMobile} />
      <StressChallenge />
      <StressCompleteModal />
      {isMobile && <MobileControlsOverlay controls={controls} />}
    </div>
  );
}

export default function StressRoomScene(props) {
  return (
    <StressRoomProvider>
      <StressRoomInner {...props} />
    </StressRoomProvider>
  );
}