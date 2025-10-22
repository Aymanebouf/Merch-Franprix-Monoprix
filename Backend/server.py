# Backend/server.py
from __future__ import annotations
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import pandas as pd
import numpy as np

# --- Imports robustes: package OU local ---
try:
    from .analysis import (
        _clean_cols, _to_numeric,
        aggregate_biscuiterie, build_final_table,
    )
except Exception:
    from analysis import (
        _clean_cols, _to_numeric,
        aggregate_biscuiterie, build_final_table,
    )

app = FastAPI(title="Score Fournisseur API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Lecture 2e feuille (en mémoire) ----------
def load_biscuiterie_from_excel(xls: pd.ExcelFile, sheet_name: str) -> pd.DataFrame:
    df = pd.read_excel(xls, sheet_name=sheet_name)
    df = _clean_cols(df)

    needed = ["Rayon", "Famille", "Sous Famille", "SSFamille", "Fournisseur", "CA Prévisionnel"]
    for c in needed:
        if c not in df.columns:
            raise ValueError(f"Colonne manquante dans '{sheet_name}': '{c}'. Colonnes: {list(df.columns)}")

    out = df[needed].copy()
    out["CA Prévisionnel"] = _to_numeric(out["CA Prévisionnel"])
    out["SSFamille"] = out["SSFamille"].astype(str).str.strip()
    out["Famille"] = out["Famille"].astype(str).str.strip()
    out["Fournisseur"] = out["Fournisseur"].astype(str).str.strip()
    out = out.dropna(subset=["SSFamille", "Fournisseur", "CA Prévisionnel"])
    return out

# ---------- Lecture 3e feuille (colonne R = MARGE ARRIERE) ----------
def load_marge_min_from_excel(xls: pd.ExcelFile, sheet_name: str) -> pd.DataFrame:
    raw = pd.read_excel(xls, sheet_name=sheet_name)
    headers = list(raw.iloc[0])
    df = raw.drop(index=0).reset_index(drop=True)
    df.columns = headers
    df = _clean_cols(df)

    needed = ["RAYON", "FAMILLE", "FOURNISSEUR", "MARGE ARRIERE"]
    for c in needed:
        if c not in df.columns:
            raise ValueError(f"Colonne '{c}' absente dans '{sheet_name}'. Colonnes: {list(df.columns)}")

    df["RAYON"] = df["RAYON"].ffill()
    df["FAMILLE"] = df["FAMILLE"].ffill()

    # petit _key local pour filtrer "Biscuiterie"
    import unicodedata, re
    def _key(s: object) -> str:
        if s is None or (isinstance(s, float) and pd.isna(s)):
            return ""
        t = str(s).upper().strip()
        t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode("ascii")
        return re.sub(r"[^A-Z0-9]+", "", t)

    rayon_key = _key("Biscuiterie")
    df = df[df["RAYON"].map(_key) == rayon_key]

    df["FOURNISSEUR"] = df["FOURNISSEUR"].astype(str).str.strip()
    df["FAMILLE"] = df["FAMILLE"].astype(str).str.strip()
    df = df.dropna(subset=["FOURNISSEUR"])
    df = df[df["FOURNISSEUR"].str.lower() != "nan"]

    m = _to_numeric(df["MARGE ARRIERE"])
    df["Marge_arriere_%"] = m
    marge = df[["FAMILLE", "FOURNISSEUR", "Marge_arriere_%"]].rename(
        columns={"FAMILLE": "Famille", "FOURNISSEUR": "Fournisseur"}
    ).sort_values(["Famille", "Fournisseur"]).drop_duplicates(
        subset=["Famille", "Fournisseur"], keep="first"
    ).reset_index(drop=True)
    return marge

# ---------- Conversion DataFrame final -> JSON ----------
def df_to_rows(final_df: pd.DataFrame) -> list[dict]:
    final = final_df.copy()
    cols = [
        "Famille", "SSFamille", "Fournisseur",
        "CA_total_SSFamille", "CA_fournisseur_dans_SSF",
        "CA_part_du_SSF_%", "Marge_arriere_%", "Score_fournisseur_%"
    ]
    for c in cols:
        if c not in final.columns:
            final[c] = np.nan

    rows: list[dict] = []
    for _, r in final[cols].iterrows():
        # arrondi propre côté API (4 décimales max) sur scalaires
        def _num(v):
            try:
                return round(float(v), 4)
            except Exception:
                return 0.0

        rows.append({
            "famille":       (r["Famille"] if pd.notna(r["Famille"]) else "") or "",
            "ssFamille":     (r["SSFamille"] if pd.notna(r["SSFamille"]) else "") or "",
            "fournisseur":   (r["Fournisseur"] if pd.notna(r["Fournisseur"]) else "") or "",
            "caTotalSsFamille":       _num(r["CA_total_SSFamille"]),
            "caFournisseurDansSsf":   _num(r["CA_fournisseur_dans_SSF"]),
            "caPartDuSsf":            _num(r["CA_part_du_SSF_%"]),
            "margeArriere": None if pd.isna(r["Marge_arriere_%"]) else _num(r["Marge_arriere_%"]),
            "scoreFournisseur":       _num(r["Score_fournisseur_%"]),
        })
    return rows

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    sheet2: str = Form("Biscuiterie"),
    sheet3: str = Form("MARGE ARRIERE"),
):
    content = await file.read()
    ext = (file.filename or "").split(".")[-1].lower()

    # ---- CSV (fallback sans marge) ----
    if ext == "csv":
        import io
        df = pd.read_csv(io.BytesIO(content))
        df = _clean_cols(df)
        rename = {}
        if "ca previsionnel" in df.columns: rename["ca previsionnel"] = "CA Prévisionnel"
        if "ca_previsionnel" in df.columns: rename["ca_previsionnel"] = "CA Prévisionnel"
        if "ssfamille" in df.columns: rename["ssfamille"] = "SSFamille"
        if "ss_famille" in df.columns: rename["ss_famille"] = "SSFamille"
        if rename:
            df = df.rename(columns=rename)

        needed = ["Famille", "SSFamille", "Fournisseur", "CA Prévisionnel"]
        for c in needed:
            if c not in df.columns:
                return {"rows": []}
        df["CA Prévisionnel"] = _to_numeric(df["CA Prévisionnel"])
        df["Famille"] = df["Famille"].astype(str).str.strip()
        df["SSFamille"] = df["SSFamille"].astype(str).str.strip()  # <- FIX ici
        df["Fournisseur"] = df["Fournisseur"].astype(str).str.strip()
        df = df.dropna(subset=["SSFamille", "Fournisseur", "CA Prévisionnel"])

        agg   = aggregate_biscuiterie(df)
        marge = pd.DataFrame(columns=["Famille", "Fournisseur", "Marge_arriere_%"])
        final = build_final_table(agg, marge)
        return {"rows": df_to_rows(final)}

    # ---- Excel complet (avec marge) ----
    xls   = pd.ExcelFile(BytesIO(content))
    bisc  = load_biscuiterie_from_excel(xls, sheet2)
    agg   = aggregate_biscuiterie(bisc)
    marge = load_marge_min_from_excel(xls, sheet3)  # colonne R
    final = build_final_table(agg, marge)
    return {"rows": df_to_rows(final)}
