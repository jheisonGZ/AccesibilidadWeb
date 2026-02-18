import { Outlet } from "react-router-dom";
import TopBar from "../components/TopBar";
import ChatBotUI from "../components/ChatBotUI";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar />
      <div style={{ padding: 16 }}>
        <Outlet />
      </div>
      <ChatBotUI />
    </div>
  );
}
