import { Navigate } from "react-router-dom";
import useAuthStore from "../context/authStore";
import { homePathFor } from "./Navbar";

export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />;

  return children;
}
