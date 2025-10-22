export type DataRow = {
  famille: string;
  ssFamille: string;
  fournisseur: string;
  caTotalSsFamille: number;
  caFournisseurDansSsf: number;
  caPartDuSsf: number;          // points %
  margeArriere: number | null;  // points %
  scoreFournisseur: number;     // points % (backend)
};
