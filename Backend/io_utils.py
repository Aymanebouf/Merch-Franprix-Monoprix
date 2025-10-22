from __future__ import annotations
from pathlib import Path
from typing import Optional, Tuple, List

def _project_root() -> Path:
    # ...\Calculer le score fournisseur par sous famille\
    return Path(__file__).resolve().parents[1]

def _list_excels(dirpath: Path) -> List[Path]:
    """Liste les fichiers Excel en ignorant les fichiers temporaires Excel (~$...)."""
    if not dirpath.exists():
        return []
    patterns = ["*.xlsx", "*.XLSX", "*.xls", "*.XLS", "*.xlsm", "*.XLSM"]
    files: List[Path] = []
    for pat in patterns:
        files.extend(dirpath.glob(pat))
    # ignore temporaire Excel
    files = [p for p in files if not p.name.startswith("~$")]
    return sorted(files)

def _first_excel_multi_search() -> Path:
    """
    Cherche un 1er Excel dans différents emplacements possibles :
      - <racine>/Input
      - <ce dossier>/Input   (au cas où quelqu'un ait mis Input à l'intérieur de Backend)
    """
    root = _project_root()
    backend_dir = Path(__file__).resolve().parent

    candidates: List[Path] = []
    for d in [root / "Input", backend_dir / "Input"]:
        candidates.extend(_list_excels(d))

    if not candidates:
        searched = [str(root / "Input"), str(backend_dir / "Input")]
        raise FileNotFoundError(
            "Aucun fichier Excel trouvé dans ces dossiers :\n  - "
            + "\n  - ".join(searched)
            + "\nPlace ton fichier dans 'Input/' (ex: Input/ASSOR MERCH.xlsx) ou passe --input."
        )
    return candidates[0]

def make_paths(
    input_path: Optional[str] = None,
    output_path: Optional[str] = None
) -> Tuple[Path, Path]:
    """
    Résout les chemins d'entrée/sortie par défaut :
    - input  = 1er Excel trouvé (voir _first_excel_multi_search)
    - output = ./Output/resultat_CA_Marge.xlsx
    """
    root = _project_root()
    output_dir = root / "Output"
    output_dir.mkdir(parents=True, exist_ok=True)

    if input_path:
        src = Path(input_path).expanduser().resolve()
        if not src.exists():
            raise FileNotFoundError(f"Fichier d'entrée introuvable: {src}")
    else:
        src = _first_excel_multi_search()

    if output_path:
        out = Path(output_path).expanduser().resolve()
    else:
        out = output_dir / "resultat_CA_Marge.xlsx"

    out.parent.mkdir(parents=True, exist_ok=True)
    return src, out
