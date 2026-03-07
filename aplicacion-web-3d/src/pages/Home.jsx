// ─────────────────────────────────────────────────────────────────────────────
// Home.jsx — layout principal
// El LoadingScreen vive aquí como capa encima de todo.
// Se activa/desactiva desde NavigationContext.
// ─────────────────────────────────────────────────────────────────────────────

import { Outlet } from "react-router-dom";
import TopBar from "../components/TopBar";
import ChatBotUI from "../components/ChatBotUI";
import LoadingScreen from "../components/LoadingScreen";
import { NavigationProvider, useLoadingState } from "../providers/NavigationContext";

function HomeContent() {
  const { isLoading, message } = useLoadingState();

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <TopBar />
      <Outlet />
      <ChatBotUI />

      {/* Loading encima de todo — se apaga cuando la página destino llama usePageReady() */}
      {isLoading && <LoadingScreen message={message} />}
    </div>
  );
}

export default function Home() {
  return (
    <NavigationProvider>
      <HomeContent />
    </NavigationProvider>
  );
}