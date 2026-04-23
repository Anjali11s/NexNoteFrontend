import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { WifiOffIcon } from "lucide-react";
import { isOnline } from "../lib/syncService";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const isOffline = !isOnline();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          {isOffline && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-1 text-xs text-stone-400">
              <WifiOffIcon className="size-3" />
              <span>Offline mode</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;