import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Rôles supportés */
export type Role = "admin" | "user";

/** Ce que le reste de l’app lit pour l’utilisateur courant (sans mot de passe) */
export type User = {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role: Role;
  joinedAt: string; // ISO
};

/** En interne on stocke les utilisateurs avec mot de passe (POC, non prod) */
type UserRecord = User & {
  password: string; // ⚠️ stocké en clair pour la démo (localStorage)
};

type AuthState = {
  isAuthed: boolean;
  user: User | null;
  users: UserRecord[];

  // Auth
  login: (identifier: string, password: string) => boolean; // email OU username
  logout: () => void;

  // CRUD utilisateurs (admin)
  createUser: (input: {
    email: string;
    username?: string;
    fullName?: string;
    password: string;
    role: Role;
  }) => { ok: true } | { ok: false; error: string };

  updateUser: (
    id: string,
    patch: Partial<Omit<UserRecord, "id" | "joinedAt">>
  ) => { ok: true } | { ok: false; error: string };

  deleteUser: (id: string) => { ok: true } | { ok: false; error: string };
};

const nowIso = () => new Date().toISOString();

// Admin par défaut
const DEFAULT_ADMIN: UserRecord = {
  id: "admin-id",
  username: "admin",
  email: "admin@local",
  fullName: "Administrateur",
  role: "admin",
  password: "DISLOG2025",
  joinedAt: nowIso(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthed: false,
      user: null,
      users: [DEFAULT_ADMIN],

      login: (identifier, password) => {
        const id = (identifier || "").trim().toLowerCase();
        const users = get().users;
        const found = users.find(
          (u) => u.password === password && (u.email.toLowerCase() === id || u.username.toLowerCase() === id)
        );
        if (!found) return false;
        const { password: _p, ...safe } = found;
        set({ isAuthed: true, user: safe });
        return true;
      },

      logout: () => set({ isAuthed: false, user: null }),

      createUser: ({ email, username, fullName, password, role }) => {
        const em = (email || "").trim().toLowerCase();
        const un = (username || "").trim();
        if (!em || !password) return { ok: false, error: "Email et mot de passe sont requis." };

        const users = get().users;
        if (users.some((u) => u.email.toLowerCase() === em)) {
          return { ok: false, error: "Cet email existe déjà." };
        }
        if (un && users.some((u) => u.username.toLowerCase() === un.toLowerCase())) {
          return { ok: false, error: "Ce nom d'utilisateur existe déjà." };
        }

        const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
        const rec: UserRecord = {
          id,
          email: em,
          username: un || em.split("@")[0],
          fullName: fullName?.trim() || undefined,
          password,
          role: role || "user",
          joinedAt: nowIso(),
        };
        set({ users: [...users, rec] });
        return { ok: true };
      },

      updateUser: (id, patch) => {
        const users = get().users;
        const idx = users.findIndex((u) => u.id === id);
        if (idx === -1) return { ok: false, error: "Utilisateur introuvable." };

        // Unicité email/username si modifiés
        if (patch.email) {
          const em = patch.email.trim().toLowerCase();
          if (users.some((u, i) => i !== idx && u.email.toLowerCase() === em)) {
            return { ok: false, error: "Cet email est déjà utilisé." };
          }
        }
        if (patch.username) {
          const un = patch.username.trim();
          if (users.some((u, i) => i !== idx && u.username.toLowerCase() === un.toLowerCase())) {
            return { ok: false, error: "Ce nom d'utilisateur est déjà utilisé." };
          }
        }

        // Protection : ne pas retirer le dernier admin
        if (users[idx].role === "admin" && patch.role === "user") {
          const otherAdmins = users.filter((u, i) => i !== idx && u.role === "admin").length;
          if (otherAdmins === 0) return { ok: false, error: "Impossible de rétrograder le dernier admin." };
        }

        const next = [...users];
        next[idx] = { ...next[idx], ...patch, email: patch.email?.toLowerCase() ?? next[idx].email };
        set({ users: next });

        // Si on edite l'utilisateur courant → garder user à jour
        const me = get().user;
        if (me && me.id === id) {
          const { password: _p, ...safe } = next[idx];
          set({ user: safe });
        }
        return { ok: true };
      },

      deleteUser: (id) => {
        const users = get().users;
        const victim = users.find((u) => u.id === id);
        if (!victim) return { ok: false, error: "Utilisateur introuvable." };

        if (victim.role === "admin") {
          const otherAdmins = users.filter((u) => u.id !== id && u.role === "admin").length;
          if (otherAdmins === 0) return { ok: false, error: "Impossible de supprimer le dernier admin." };
        }

        const next = users.filter((u) => u.id !== id);
        set({ users: next });

        // Si on supprime l'utilisateur courant → logout
        const me = get().user;
        if (me && me.id === id) set({ isAuthed: false, user: null });

        return { ok: true };
      },
    }),
    {
      name: "sf-auth-v2", // bump pour nouveau schéma multi-utilisateurs
      storage: createJSONStorage(() => localStorage),
    }
  )
);
