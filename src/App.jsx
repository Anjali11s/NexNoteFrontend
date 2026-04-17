// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PWAPrompt from "./components/PWAPrompt";
import HomePage from "./pages/HomePage";
import CreatePage from "./pages/CreatePage";
import NoteDetailPage from "./pages/NoteDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

const App = () => {
  return (
    <AuthProvider>
        <div data-theme="pastel" className="min-h-screen">
          <PWAPrompt />
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <CreatePage />
              </ProtectedRoute>
            } />
            <Route path="/note/:id" element={
              <ProtectedRoute>
                <NoteDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/note/:id/edit" element={
              <ProtectedRoute>
                <NoteDetailPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
    </AuthProvider>
  );
};

export default App;