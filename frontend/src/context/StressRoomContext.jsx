import { createContext, useContext, useState, useCallback } from "react";

const StressRoomContext = createContext(null);

export const useStressRoom = () => {
  const ctx = useContext(StressRoomContext);
  if (!ctx) throw new Error("useStressRoom must be used inside StressRoomProvider");
  return ctx;
};

export const StressRoomProvider = ({ children }) => {
  const [collected,     setCollected]     = useState([]);
  const [activeItem,    setActiveItem]    = useState(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [roomComplete,  setRoomComplete]  = useState(false);

  const collectItem = useCallback((id) => {
    setCollected((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      if (next.length >= 5) setRoomComplete(true);
      return next;
    });
    setChallengeOpen(false);
    setActiveItem(null);
  }, []);

  const openChallenge  = useCallback((id) => { setActiveItem(id); setChallengeOpen(true);  }, []);
  const closeChallenge = useCallback(() =>   { setChallengeOpen(false); setActiveItem(null); }, []);
  const resetRoom      = useCallback(() => {
    setCollected([]); setActiveItem(null); setChallengeOpen(false); setRoomComplete(false);
  }, []);

  return (
    <StressRoomContext.Provider value={{ collected, activeItem, challengeOpen, roomComplete, collectItem, openChallenge, closeChallenge, resetRoom }}>
      {children}
    </StressRoomContext.Provider>
  );
};