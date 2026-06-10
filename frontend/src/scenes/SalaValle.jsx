import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

import { SalaValleProvider } from "../context/SalaValleContext";

import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";

import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";

function SalaValleInner() {
  const [avatarId, setAvatarId] = useState("male-1");
  const [isMobile, setIsMobile] = useState(false);

  const controls = useMobileControls();
  const { isPortrait } = useLandscapeLock();

  useEffect(() => {
    setIsMobile(
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const u = auth.currentUser;

        if (!u) return;

        const snap = await getDoc(
          doc(db, "users", u.uid)
        );

        if (snap.exists()) {
          const skin =
            snap.data().avatar ||
            snap.data().avatarSkin ||
            snap.data().avatar_skin;

          if (skin) {
            setAvatarId(skin);
          }
        }
      } catch (e) {
        console.log(e);
      }
    };

    load();
  }, []);

  if (isMobile && isPortrait) {
    return <RotatePrompt />;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#08142c",
      }}
    >
      {/* ESCENA 3D VA AQUÍ */}

      {isMobile && (
        <MobileControlsOverlay controls={controls} />
      )}
    </div>
  );
}

export default function SalaValleScene(props) {
  return (
    <SalaValleProvider>
      <SalaValleInner {...props} />
    </SalaValleProvider>
  );
}