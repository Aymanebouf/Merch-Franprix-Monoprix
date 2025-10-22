from __future__ import annotations
import pandas as pd
from pathlib import Path
import unicodedata
import re

# -------------------- helpers --------------------
def _clean_cols(df: pd.DataFrame) -> pd.DataFrame:
    def _norm(s):
        s = "" if s is None else str(s)
        s = s.replace("\xa0", " ")
        s = " ".join(s.split())
        return s.strip()
    out = df.copy()
    out.columns = [_norm(c) for c in out.columns]
    return out

def _parse_number(val: object) -> float | None:
    """
    Conversion robuste des nombres Excel:
    - '10.500'        -> 10500
    - '1 099 635,56'  -> 1099635.56
    - '157.090,79'    -> 157090.79
    - '12,5%'         -> 12.5
    """
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, (int, float)):
        return float(val)

    s = str(val).replace("\u00a0", " ").strip()
    if s == "":
        return None
    s = re.sub(r"[^0-9,.\-\s%]", "", s)                           # garder chiffres/séparateurs/%/espaces
    s = re.sub(r"(?<=\d)[\s.,](?=\d{3}(\D|$))", "", s)            # enlever séparateurs milliers
    s = s.replace(" ", "").replace("%", "")
    last_dot, last_comma = s.rfind("."), s.rfind(",")
    if last_dot != -1 and last_comma != -1:
        if last_dot > last_comma:
            s = s.replace(",", "")
        else:
            s = s.replace(".", "").replace(",", ".")
    elif "," in s and "." not in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except Exception:
        return None

def _to_numeric(s: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(s):
        return pd.to_numeric(s, errors="coerce")
    return s.map(_parse_number).astype(float)

def _key(s: object) -> str:
    """Majuscules, accents retirés, tout sauf [A-Z0-9] → clé robuste pour jointures."""
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return ""
    t = str(s).upper().strip()
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode("ascii")
    t = re.sub(r"[^A-Z0-9]+", "", t)
    return t

# ---------- lecture feuilles ----------
def load_biscuiterie(xlsx_path: Path, sheet_name: str = "Biscuiterie") -> pd.DataFrame:
    df = pd.read_excel(xlsx_path, sheet_name=sheet_name)
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

def load_marge_min_necessaire(xlsx_path: Path, sheet_name: str = "MARGE ARRIERE") -> pd.DataFrame:
    """
    Lecture marge arrière (colonne R = 'MARGE ARRIERE'), entêtes sur la 1re ligne.
    Retourne (Famille, Fournisseur, Marge_arriere_%) POUR RAYON 'Biscuiterie' UNIQUEMENT.
    """
    raw = pd.read_excel(xlsx_path, sheet_name=sheet_name)
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

    # filtrage Rayon
    rayon_key = _key("Biscuiterie")
    df = df[df["RAYON"].map(_key) == rayon_key]

    df["FOURNISSEUR"] = df["FOURNISSEUR"].astype(str).str.strip()
    df["FAMILLE"] = df["FAMILLE"].astype(str).str.strip()
    df = df.dropna(subset=["FOURNISSEUR"])
    df = df[df["FOURNISSEUR"].str.lower() != "nan"]

    m = _to_numeric(df["MARGE ARRIERE"])
    df["Marge_arriere_%"] = m  # valeur brute; *100 plus tard

    marge = df[["FAMILLE", "FOURNISSEUR", "Marge_arriere_%"]].rename(
        columns={"FAMILLE": "Famille", "FOURNISSEUR": "Fournisseur"}
    ).sort_values(["Famille", "Fournisseur"]).drop_duplicates(
        subset=["Famille", "Fournisseur"], keep="first"
    ).reset_index(drop=True)
    return marge

# ---------- agrégats ----------
def aggregate_biscuiterie(bisc_df: pd.DataFrame) -> pd.DataFrame:
    # Total CA par SSFamille (dénominateur du %)
    ssf_totals = bisc_df.groupby("SSFamille")["CA Prévisionnel"].sum().rename("CA_total_SSFamille")

    # CA fournisseur dans SSF
    agg = (
        bisc_df
        .groupby(["SSFamille", "Famille", "Fournisseur"], as_index=False)["CA Prévisionnel"]
        .sum()
        .rename(columns={"CA Prévisionnel": "CA_fournisseur_dans_SSF"})
    )

    # joindre total SSF & % part SSF
    agg = agg.merge(ssf_totals, on="SSFamille", how="left")
    agg["CA_part_du_SSF_%"] = (agg["CA_fournisseur_dans_SSF"] / agg["CA_total_SSFamille"] * 100)

    return agg.sort_values(["Famille", "SSFamille", "Fournisseur"]).reset_index(drop=True)

def build_final_table(bisc_agg: pd.DataFrame, marge_df: pd.DataFrame) -> pd.DataFrame:
    """
    Jointure robuste (Famille, Fournisseur) via clés normalisées.
    Ajoute Score_fournisseur_% = CA_part_du_SSF_% + Marge_arriere_%.
    Sortie limitée aux colonnes demandées.
    """
    b = bisc_agg.copy()
    m = marge_df.copy()

    b["k_fam"] = b["Famille"].map(_key)
    b["k_four"] = b["Fournisseur"].map(_key)
    m["k_fam"] = m["Famille"].map(_key)
    m["k_four"] = m["Fournisseur"].map(_key)

    m_small = m[["k_fam", "k_four", "Marge_arriere_%"]].drop_duplicates()
    final = b.merge(m_small, how="left", on=["k_fam", "k_four"])

    # convertir la marge en % (de 0..1 vers points % si nécessaire)
    final["Marge_arriere_%"] = final["Marge_arriere_%"] * 100.0

    # Score = Part SSF % + Marge %
    final["Score_fournisseur_%"] = final["CA_part_du_SSF_%"] + final["Marge_arriere_%"].fillna(0)

    # colonnes finales
    final = final[[
        "Famille",
        "SSFamille",
        "Fournisseur",
        "CA_total_SSFamille",
        "CA_fournisseur_dans_SSF",
        "CA_part_du_SSF_%",
        "Marge_arriere_%",
        "Score_fournisseur_%",
    ]].copy()

    # arrondi propre pour export/affichage
    num_cols = [
        "CA_total_SSFamille",
        "CA_fournisseur_dans_SSF",
        "CA_part_du_SSF_%",
        "Marge_arriere_%",
        "Score_fournisseur_%",
    ]
    for c in num_cols:
        final[c] = pd.to_numeric(final[c], errors="coerce").round(4)

    return final

def export_excel(final_df: pd.DataFrame, out_path: Path) -> None:
    """
    Export lisible:
      - pas de séparateur de milliers
      - max 4 décimales sur TOUTES les colonnes numériques
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(out_path, engine="xlsxwriter") as writer:
        final_df.to_excel(writer, index=False, sheet_name="Resultat")
        wb = writer.book
        ws = writer.sheets["Resultat"]

        fmt_text = wb.add_format({})
        fmt_num  = wb.add_format({"num_format": "0.####"})

        # largeur + format colonne
        for idx, col in enumerate(final_df.columns):
            is_num = pd.api.types.is_numeric_dtype(final_df[col])
            ws.set_column(idx, idx, 18 if is_num else 22, fmt_num if is_num else fmt_text)
