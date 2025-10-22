from __future__ import annotations
import argparse
import sys
from pathlib import Path

# Rendre les imports robustes quelle que soit la commande:
THIS_DIR = Path(__file__).resolve().parent
ROOT_DIR = THIS_DIR.parents[1]
for p in (str(THIS_DIR), str(ROOT_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

# 1er essai: import style "package" (python -m Backend.run depuis la racine)
try:
    from Backend.io_utils import make_paths           # type: ignore
    from Backend.analysis import (                     # type: ignore
        load_biscuiterie, load_marge_min_necessaire,
        aggregate_biscuiterie, build_final_table, export_excel
    )
except Exception:
    # 2e essai: import local (python run.py depuis Backend/)
    from io_utils import make_paths
    from analysis import (
        load_biscuiterie, load_marge_min_necessaire,
        aggregate_biscuiterie, build_final_table, export_excel
    )

def main():
    ap = argparse.ArgumentParser(
        description="Calcul CA & % par SSFamille/Fournisseur + marge arrière (colonne R, MINIMIM NECESSAIRE)"
    )
    ap.add_argument("--input", help="Chemin Excel source (défaut: 1er .xlsx dans ./Input)")
    ap.add_argument("--output", help="Chemin Excel sortie (défaut: ./Output/resultat_CA_Marge.xlsx)")
    ap.add_argument("--sheet2", default="Biscuiterie", help="Nom de la 2e feuille (CA)")
    ap.add_argument("--sheet3", default="MARGE ARRIERE", help="Nom de la 3e feuille (marges)")
    args = ap.parse_args()

    src, out = make_paths(args.input, args.output)

    bisc = load_biscuiterie(src, sheet_name=args.sheet2)
    agg  = aggregate_biscuiterie(bisc)

    marge = load_marge_min_necessaire(src, sheet_name=args.sheet3)   # <-- colonne R
    final = build_final_table(agg, marge)

    export_excel(final, out)
    print(f"OK: Résultat écrit dans '{out}'")

if __name__ == "__main__":
    main()
