import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ResetPassword from "../pages/ResetPassword";

import Questionnaire from "../pages/Questionnaire";
import AvatarSelect from "../pages/AvatarSelect";
import Scene from "../pages/Scene";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  // Públicas
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // Protegidas
  {
    path: "/questionnaire",
    element: (
      <ProtectedRoute>
        <Questionnaire />
      </ProtectedRoute>
    ),
  },
  {
    path: "/avatar",
    element: (
      <ProtectedRoute>
        <AvatarSelect />
      </ProtectedRoute>
    ),
  },
  {
    path: "/scene",
    element: (
      <ProtectedRoute>
        <Scene />
      </ProtectedRoute>
    ),
  },

  { path: "*", element: <NotFound /> },
]);
