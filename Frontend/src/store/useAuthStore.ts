import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  apiLogin,
  apiMe,
  apiListUsers,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  type AuthUser,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/lib/api";

// Re-export utiles pour d'autres fichiers
export type { Role, UserCreateInput, UserUpdateInput } from "@/lib/api";

type Result = { ok: true } | { ok: false; error: string };

type AuthState = {
  isAuthed: boolean;
  token: string | null;
  user: AuthUser | null;

  // liste utilisateurs (admin)
  users: AuthUser[];

  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshMe: () => Promise<void>;

  // actions admin
  loadUsers: () => Promise<void>;
  createUser: (input: UserCreateInput) => Promise<Result>;
  updateUser: (id: number, patch: UserUpdateInput) => Promise<Result>;
  deleteUser: (id: number) => Promise<Result>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthed: false,
      token: null,
      user: null,

      users: [],

      login: async (identifier, password) => {
        try {
          const res = await apiLogin(identifier, password);
          set({ isAuthed: true, token: res.access_token, user: res.user });
          return true;
        } catch {
          set({ isAuthed: false, token: null, user: null, users: [] });
          return false;
        }
      },

      logout: () => set({ isAuthed: false, token: null, user: null, users: [] }),

      refreshMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const me = await apiMe(token);
          set({ user: me, isAuthed: true });
        } catch {
          set({ isAuthed: false, token: null, user: null, users: [] });
        }
      },

      // ===== Admin: Users =====
      loadUsers: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const list = await apiListUsers(token);
          set({ users: list });
        } catch (e) {
          console.error("loadUsers failed:", e);
          set({ users: [] });
        }
      },

      createUser: async (input) => {
        const { token } = get();
        if (!token) return { ok: false, error: "Non authentifié." };
        try {
          const created = await apiCreateUser(token, input);
          set((s) => ({ users: [...s.users, created] }));
          return { ok: true };
        } catch (e: any) {
          const msg = e?.message || "Erreur lors de la création.";
          return { ok: false, error: msg };
        }
      },

      updateUser: async (id, patch) => {
        const { token } = get();
        if (!token) return { ok: false, error: "Non authentifié." };
        try {
          const updated = await apiUpdateUser(token, id, patch);
          set((s) => ({
            users: s.users.map((u) => (u.id === id ? updated : u)),
            user: s.user && s.user.id === id ? updated : s.user, // si on modifie soi-même
          }));
          return { ok: true };
        } catch (e: any) {
          const msg = e?.message || "Erreur lors de la modification.";
          return { ok: false, error: msg };
        }
      },

      deleteUser: async (id) => {
        const { token } = get();
        if (!token) return { ok: false, error: "Non authentifié." };
        try {
          await apiDeleteUser(token, id);
          set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
          return { ok: true };
        } catch (e: any) {
          const msg = e?.message || "Erreur lors de la suppression.";
          return { ok: false, error: msg };
        }
      },
    }),
    {
      name: "sf-auth-jwt-v1",
      storage: createJSONStorage(() => localStorage),
      // On peut éventuellement ne pas persister la liste des users pour éviter du stale:
      // partialize: (s) => ({ isAuthed: s.isAuthed, token: s.token, user: s.user }),
    }
  )
);
