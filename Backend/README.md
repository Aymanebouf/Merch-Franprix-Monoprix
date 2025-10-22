# Calculer le score fournisseur par Sous Famille

## Objectif
- Lire **Input/ASSOR MERCH.xlsx**
- Feuille **Biscuiterie** : calculer, pour chaque **(SSFamille, Fournisseur)** :
  - `CA_fournisseur_dans_SSF` = somme des CA du fournisseur dans la SSFamille
  - `Nb_SKUs_SSFamille` = nombre total de lignes (produits) dans cette SSFamille
  - `CA_divise_par_nb_SKUs_SSF` = **métrique demandée** (ex: (8.511+16.739)/4)
  - `CA_part_du_SSF_%` = part du fournisseur dans la SSFamille (en %)
- Feuille **MARGE ARRIERE** : récupérer la **MARGE ARRIERE** (colonne **R**) de la bande **MINIMIM NECESSAIRE**, jointe sur **(Famille, Fournisseur)**.
- Écrire le résultat dans **Output/resultat_CA_Marge.xlsx**.

## Installation
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate
pip install -r Backend/requirements.txt


uvicorn server:app --reload --port 8000
