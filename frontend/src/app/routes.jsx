import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import FlowGuard from "../components/FlowGuard";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ResetPassword from "../pages/ResetPassword";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import Questionnaire from "../pages/Questionnaire";
import AvatarSelect from "../pages/AvatarSelect";
import Scene from "../pages/Scene";
import Progress from "../pages/Progress";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  // 🔓 Public Routes
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // 🔁 Redirect legacy /dashboard → /home
  { path: "/dashboard", element: <Navigate to="/home" replace /> },

  // 🔐 Protected Routes
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "questionnaire", element: <Questionnaire /> },
      {
        path: "avatar",
        element: (
          <FlowGuard requireEmotion>
            <AvatarSelect />
          </FlowGuard>
        ),
      },
      {
        path: "scene",
        element: (
          <FlowGuard requireEmotion requireAvatar>
            <Scene />
          </FlowGuard>
        ),
      },
      { path: "progress", element: <Progress /> },
    ],
  },

  // ❌ Fallback
  { path: "*", element: <NotFound /> },
]);