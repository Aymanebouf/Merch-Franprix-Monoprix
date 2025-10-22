import { ReactNode, useMemo } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, BarChart3, Moon, Sun, Search, User, LogOut, Users } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const navItems = useMemo(
    () => [
      { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/analyse", label: "Analyse", icon: BarChart3 },
      ...(user?.role === "admin" ? [{ to: "/utilisateurs", label: "Utilisateurs", icon: Users }] : []),
    ],
    [user]
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 min-w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Score Fournisseur
          </h1>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                ].join(" ")
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border/60"></div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="border-0 bg-secondary/80 hover:bg-secondary focus-visible:ring-1 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3">
            {user?.username && (
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                Connecté : <span className="font-medium text-foreground">{user.username}</span>
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
              aria-label="Basculer le thème"
              title="Basculer le thème"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-xl gap-2"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>

            <Link to="/profil" title="Profil" className="rounded-full outline-none focus:ring-2 focus:ring-primary/40">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
