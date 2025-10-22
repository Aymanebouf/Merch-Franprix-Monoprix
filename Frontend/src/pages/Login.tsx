import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

// autoriser le retour vers ces pages après login
const ALLOWED_AFTER_LOGIN = new Set<string>(["/", "/analyse", "/profil"]);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const rawFrom = location.state?.from?.pathname as string | undefined;
  const from = rawFrom && ALLOWED_AFTER_LOGIN.has(rawFrom) ? rawFrom : "/";

  const isAuthed = useAuthStore((s) => s.isAuthed);
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthed) navigate(from, { replace: true });
  }, [isAuthed, from, navigate]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const ok = login(username, password);
      if (!ok) {
        setErr("Identifiants invalides. Essayez : admin / DISLOG2025");
        return;
      }
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh grid place-items-center overflow-hidden">
      {/* Fond futuriste */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950" />
        <div className="absolute -top-24 -left-24 h-[480px] w-[480px] rounded-full blur-3xl opacity-25 bg-gradient-to-br from-primary/60 to-cyan-500" />
        <div className="absolute -bottom-24 -right-24 h-[520px] w-[520px] rounded-full blur-3xl opacity-20 bg-gradient-to-tr from	fuchsia-500 to-sky-400" />
        <div className="absolute inset-0 bg-[radial-gradient(transparent_1px,rgba(255,255,255,0.03)_1px)] [background-size:18px_18px]" />
        <div className="absolute inset-0 animate-[pulse_9s_ease-in-out_infinite] bg-[conic-gradient(from_180deg_at_50%_50%,transparent_0deg,rgba(255,255,255,0.06)_120deg,transparent_240deg)]" />
      </div>

      {/* Carte de login — translucide plus “blonde” */}
      <Card className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-2xl shadow-xl shadow-black/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-2xl font-semibold text-white/90">
            Connexion
          </CardTitle>
          <p className="text-center text-sm text-white/70">
            Accédez à votre espace d’analyse
          </p>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80">Utilisateur</Label>
              <Input
                id="username"
                autoFocus
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-xl bg-white/70 text-slate-900 placeholder:text-slate-500 shadow-inner ring-1 ring-white/40 dark:bg-white/10 dark:text-white dark:placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="DISLOG2025"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 rounded-xl bg-white/70 text-slate-900 placeholder:text-slate-500 shadow-inner ring-1 ring-white/40 dark:bg-white/10 dark:text-white dark:placeholder:text-white/60"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-2 grid place-items-center px-2 text-slate-600 hover:text-slate-800 dark:text-white/70 dark:hover:text-white"
                  aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {err && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/15 px-3 py-2 text-sm text-red-200">
                {err}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl h-11 text-base font-medium shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? "Connexion..." : "Se connecter"}
            </Button>

            <p className="text-xs text-center text-white/70">
              Astuce : <span className="font-medium">admin / DISLOG2025</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
