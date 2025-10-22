import type { DataRow } from "@/types/data";

/* ================= Core ================= */
const API_URL = import.meta.env.VITE_API_URL as string | undefined;
if (!API_URL) {
  console.warn("VITE_API_URL manquant dans .env");
}

/* -------- utils -------- */
const withTimeout = async <T>(p: Promise<T>, ms = 60_000, msg = "Timeout API"): Promise<T> => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(msg), ms);
  try {
    return await p;
  } finally {
    clearTimeout(id);
  }
};

const jsonFetch = async <T>(
  path: string,
  opts: RequestInit = {},
  token?: string
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as any),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const ctrl = new AbortController();
  const res = await withTimeout(
    fetch(`${API_URL}${path}`, { ...opts, headers, signal: ctrl.signal }),
    60_000
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
};

/* -------- numbers -------- */
const num = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/\u00a0/g, " ").replace(/[€\s]/g, "").replace(/%/g, "").replace(/,/g, ".");
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
};
const maybeNum = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : num(v));
const normHeader = (s: string) =>
  s.toLowerCase().replace(/\u00a0/g, " ").replace(/[%]/g, "pct").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

/* ================== ANALYZE ================== */
const coerceServerRows = (rows: any[]): DataRow[] =>
  (rows ?? []).map((r) => {
    const famille = String(r.famille ?? "").trim();
    const ssFamille = String(r.ssFamille ?? "").trim();
    const fournisseur = String(r.fournisseur ?? "").trim();
    const caTotalSsFamille = num(r.caTotalSsFamille);
    const caFournisseurDansSsf = num(r.caFournisseurDansSsf);
    const caPartDuSsf = num(r.caPartDuSsf);
    const margeArriere = maybeNum(r.margeArriere);
    const scoreFournisseur =
      r.scoreFournisseur !== undefined && r.scoreFournisseur !== null
        ? num(r.scoreFournisseur)
        : caPartDuSsf + (margeArriere ?? 0);

    return {
      famille,
      ssFamille,
      fournisseur,
      caTotalSsFamille,
      caFournisseurDansSsf,
      caPartDuSsf,
      margeArriere,
      scoreFournisseur,
    };
  });

export async function analyzeFileOnServer(file: File, sheet2 = "Biscuiterie", sheet3 = "MARGE ARRIERE"): Promise<DataRow[]> {
  if (!API_URL) throw new Error("VITE_API_URL manquant");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("sheet2", sheet2);
  fd.append("sheet3", sheet3);

  const res = await withTimeout(fetch(`${API_URL}/analyze`, { method: "POST", body: fd }), 120_000);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Erreur API (${res.status}): ${t || res.statusText}`);
  }
  const json = await res.json().catch(() => ({}));
  const rows = (json?.rows ?? json) as any[];
  return coerceServerRows(rows);
}

/* --- fallback client (CSV/Excel) --- */
function mapRecord(rec: Record<string, string>): DataRow {
  const get = (...ks: string[]) => ks.map((k) => rec[k]).find((v) => v !== undefined) ?? "";

  const famille = String(get("famille") || "").trim();
  const ssFamille = String(get("ssfamille", "ss_famille", "sous_sous_famille") || "").trim();
  const fournisseur = String(get("fournisseur") || "").trim();

  const caTotalSsFamille = num(get("ca_total_ssfamille", "ca_total_ss_famille"));
  const caFournisseurDansSsf = num(get("ca_fournisseur_dans_ssf"));
  const caPartDuSsf = num(get("ca_part_du_ssf_pct", "ca_part_du_ssf"));
  const margeArriereRaw = get("marge_arriere_pct", "marge_arriere");
  const margeArriere = margeArriereRaw === "" ? null : num(margeArriereRaw);
  const scoreRaw = get("score_fournisseur_pct", "score_fournisseur");
  const scoreFournisseur = scoreRaw === "" ? caPartDuSsf + (margeArriere ?? 0) : num(scoreRaw);

  return {
    famille,
    ssFamille,
    fournisseur,
    caTotalSsFamille,
    caFournisseurDansSsf,
    caPartDuSsf,
    margeArriere,
    scoreFournisseur,
  };
}

export async function analyzeOnClient(file: File): Promise<DataRow[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) return [];
    const split = (line: string) => {
      const r: string[] = [];
      let cur = "", q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { if (q && line[i + 1] == '"') { cur += '"'; i++; } else q = !q; }
        else if (c === "," && !q) { r.push(cur); cur = ""; }
        else cur += c;
      }
      r.push(cur);
      return r.map((s) => s.trim());
    };
    const header = split(lines[0]).map(normHeader);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = split(lines[i]);
      const rec: Record<string, string> = {};
      header.forEach((h, j) => (rec[h] = cols[j] ?? ""));
      rows.push(rec);
    }
    return rows.map(mapRecord).filter((r) => r.famille && r.ssFamille && r.fournisseur);
  }

  if (ext === "xlsx" || ext === "xls" || ext === "xlsm") {
    let XLSX: any;
    try { XLSX = await import("xlsx"); } catch { XLSX = await import("xlsx/xlsx.mjs"); }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, any>[];
    const normalized = json.map((row) => {
      const rec: Record<string, string> = {};
      Object.keys(row).forEach((k) => (rec[normHeader(k)] = String(row[k])));
      return rec;
    });
    return normalized.map(mapRecord).filter((r) => r.famille && r.ssFamille && r.fournisseur);
  }

  throw new Error("Format non supporté. Choisis un .csv, .xlsx, .xls");
}

export async function analyzeSmart(file: File, opts?: { sheet2?: string; sheet3?: string }): Promise<DataRow[]> {
  const s2 = opts?.sheet2 ?? "Biscuiterie";
  const s3 = opts?.sheet3 ?? "MARGE ARRIERE";
  if (API_URL) {
    try {
      const rows = await analyzeFileOnServer(file, s2, s3);
      if (rows?.length) return rows;
    } catch (e) {
      console.warn("API indisponible, fallback client:", e);
    }
  }
  return analyzeOnClient(file);
}

/* ================== AUTH & USERS ================== */
export type Role = "admin" | "user";
export type AuthUser = {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  role: Role;
  joinedAt: string;
};

export async function apiLogin(identifier: string, password: string) {
  return jsonFetch<{ access_token: string; token_type: string; user: AuthUser }>(
    `/auth/login`,
    { method: "POST", body: JSON.stringify({ identifier, password }) }
  );
}
export async function apiMe(token: string) {
  return jsonFetch<AuthUser>(`/auth/me`, { method: "GET" }, token);
}

/* ---- Users (admin) ---- */
export type UserCreateInput = {
  email: string;
  username?: string;
  fullName?: string;
  password: string;
  role: Role;
};
export type UserUpdateInput = Partial<Omit<UserCreateInput, "password">> & { password?: string };

export async function apiListUsers(token: string) {
  return jsonFetch<AuthUser[]>(`/users`, { method: "GET" }, token);
}
export async function apiCreateUser(token: string, input: UserCreateInput) {
  return jsonFetch<AuthUser>(`/users`, { method: "POST", body: JSON.stringify(input) }, token);
}
export async function apiUpdateUser(token: string, id: number, patch: UserUpdateInput) {
  return jsonFetch<AuthUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(patch) }, token);
}
export async function apiDeleteUser(token: string, id: number) {
  return jsonFetch<{ ok: true }>(`/users/${id}`, { method: "DELETE" }, token);
}
