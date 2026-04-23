import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../lib/axios";
import { clearOfflineData } from "../lib/offlineStorage";
import { isOnline } from "../lib/syncService";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      // Don't try to verify user if offline
      if (isOnline()) {
        fetchUser();
      } else {
        // If offline, assume token is still valid
        setLoading(false);
        // Try to get cached user data
        const cachedUser = localStorage.getItem("cachedUser");
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      // Cache user data for offline use
      localStorage.setItem("cachedUser", JSON.stringify(res.data));
    } catch (error) {
      console.error("Failed to fetch user:", error);
      // Only logout if it's not an offline error
      if (!error.isOffline && isOnline()) {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        localStorage.removeItem("cachedUser");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("cachedUser", JSON.stringify(res.data));
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      setUser(res.data);
      
      // Clear any previous user's offline data when new user logs in
      await clearOfflineData();
      
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("cachedUser", JSON.stringify(res.data));
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      setUser(res.data);
      
      // Clear any existing offline data for new user
      await clearOfflineData();
      
      return res.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear all offline data first (important for security)
      await clearOfflineData();
      
      // Then clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("cachedUser");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear auth data even if offline clear fails
      localStorage.removeItem("token");
      localStorage.removeItem("cachedUser");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};