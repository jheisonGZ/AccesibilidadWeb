import { Outlet } from "react-router-dom";
import TopBar from "../components/TopBar";
import ChatBotUI from "../components/ChatBotUI";

export default function Home() {
  return (
    // position relative para que el TopBar absolute se posicione aquí
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <TopBar />
      <Outlet />
      <ChatBotUI />
    </div>
  );
}