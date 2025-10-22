import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Analyse from "./pages/Analyse";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

import Profil from "./pages/Profile";       // <-- existe maintenant
import Users from "./pages/Users";         // <-- existe maintenant

import { useAuthStore } from "./store/useAuthStore";

const queryClient = new QueryClient();

/* --- Garde d'authentification : protège les routes privées --- */
const RequireAuth = () => {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const location = useLocation();
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
};

/* --- Garde Admin : protège /utilisateurs --- */
const RequireAdmin = () => {
  const me = useAuthStore((s) => s.user);
  if (!me || me.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

/* --- Garde de /login : si déjà connecté -> Dashboard --- */
const LoginGuard = () => {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  return isAuthed ? <Navigate to="/" replace /> : <Login />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="score-fournisseur-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Route publique */}
            <Route path="/login" element={<LoginGuard />} />

            {/* Routes privées */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/analyse" element={<Layout><Analyse /></Layout>} />
              <Route path="/profil" element={<Layout><Profil /></Layout>} />

              {/* Admin only */}
              <Route element={<RequireAdmin />}>
                <Route path="/utilisateurs" element={<Layout><Users /></Layout>} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
