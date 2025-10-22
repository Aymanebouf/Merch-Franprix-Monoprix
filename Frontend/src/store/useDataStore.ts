import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DataRow } from "@/types/data";

type Filters = { famille: string; ssFamille: string; fournisseur: string };

type DataState = {
  rows: DataRow[];
  setRows: (rows: DataRow[]) => void;
  clearRows: () => void;

  filters: Filters;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  clearFilters: () => void;
};

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      rows: [],
      setRows: (rows) => set({ rows }),
      clearRows: () => set({ rows: [] }),

      filters: { famille: "", ssFamille: "", fournisseur: "" },
      setFilter: (k, v) => set((s) => ({ filters: { ...s.filters, [k]: v } })),
      clearFilters: () => set({ filters: { famille: "", ssFamille: "", fournisseur: "" } }),
    }),
    {
      // bump pour vider l'ancien schéma
      name: "sf-data-v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
