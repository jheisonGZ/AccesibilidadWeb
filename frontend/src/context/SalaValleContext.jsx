import { createContext, useContext, useState, useCallback } from "react";

/* ==========================================================
   CONTEXTO GLOBAL DE LA SALA VALLE

   Permite compartir el estado de la sala entre múltiples
   componentes sin necesidad de pasar props manualmente.

   Ejemplos de uso:
   - Objetos coleccionables.
   - Minijuegos.
   - Progreso de la sala.
   - Estado de finalización.
   ========================================================== */
const SalaValleContext = createContext(null);

/* ==========================================================
   HOOK PERSONALIZADO

   Facilita el acceso al contexto desde cualquier componente
   hijo de SalaValleProvider.

   Ejemplo:
   const { collected } = useSalaValle();
   ========================================================== */
export const useSalaValle = () => {
  const ctx = useContext(SalaValleContext);

  // Evita que el hook sea utilizado fuera del Provider
  if (!ctx) {
    throw new Error(
      "useSalaValle must be used inside SalaValleProvider"
    );
  }

  return ctx;
};

/* ==========================================================
   PROVIDER PRINCIPAL

   Encapsula toda la lógica y el estado compartido de la sala.
   Todos los componentes hijos tendrán acceso a estos datos.
   ========================================================== */
export const SalaValleProvider = ({ children }) => {

  /* --------------------------------------------------------
     Objetos recolectados por el jugador.

     Ejemplo:
     ["cristal1", "cristal2", "cristal3"]
     -------------------------------------------------------- */
  const [collected, setCollected] = useState([]);

  /* --------------------------------------------------------
     Identificador del objeto actualmente interactuado.

     Ejemplo:
     "cristal3"
     -------------------------------------------------------- */
  const [activeItem, setActiveItem] = useState(null);

  /* --------------------------------------------------------
     Controla la visibilidad del desafío o actividad.

     false → cerrado
     true  → abierto
     -------------------------------------------------------- */
  const [challengeOpen, setChallengeOpen] = useState(false);

  /* --------------------------------------------------------
     Indica si el usuario completó la sala.

     false → pendiente
     true  → completada
     -------------------------------------------------------- */
  const [roomComplete, setRoomComplete] = useState(false);

  /* ==========================================================
     REGISTRAR OBJETO RECOLECTADO

     - Evita duplicados.
     - Añade el nuevo objeto a la colección.
     - Marca la sala como completada al alcanzar 5 objetos.
     - Cierra automáticamente la actividad activa.
     ========================================================== */
  const collectItem = useCallback((id) => {
    setCollected((prev) => {

      // Evita agregar el mismo objeto varias veces
      if (prev.includes(id)) return prev;

      // Agrega el nuevo objeto
      const next = [...prev, id];

      // Completa la sala al alcanzar 5 elementos
      if (next.length >= 5) {
        setRoomComplete(true);
      }

      return next;
    });

    // Cierra la actividad actual
    setChallengeOpen(false);
    setActiveItem(null);

  }, []);

  /* ==========================================================
     ABRIR DESAFÍO

     Establece el objeto activo y muestra la actividad.
     ========================================================== */
  const openChallenge = useCallback((id) => {
    setActiveItem(id);
    setChallengeOpen(true);
  }, []);

  /* ==========================================================
     CERRAR DESAFÍO

     Oculta la actividad y limpia el objeto seleccionado.
     ========================================================== */
  const closeChallenge = useCallback(() => {
    setChallengeOpen(false);
    setActiveItem(null);
  }, []);

  /* ==========================================================
     REINICIAR SALA

     Restablece todo el progreso de la sala.
     Útil para volver a empezar una partida.
     ========================================================== */
  const resetRoom = useCallback(() => {
    setCollected([]);
    setActiveItem(null);
    setChallengeOpen(false);
    setRoomComplete(false);
  }, []);

  /* ==========================================================
     DATOS EXPUESTOS A LOS COMPONENTES HIJOS
     ========================================================== */
  return (
    <SalaValleContext.Provider
      value={{
        collected,
        activeItem,
        challengeOpen,
        roomComplete,

        collectItem,
        openChallenge,
        closeChallenge,
        resetRoom,
      }}
    >
      {children}
    </SalaValleContext.Provider>
  );
};