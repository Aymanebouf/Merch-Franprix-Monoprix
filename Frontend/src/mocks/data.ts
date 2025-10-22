export interface SupplierData {
  id: number;
  famille: string;
  ssFamille: string;
  fournisseur: string;
  nbSkusSsFamille: number;
  caTotalSsFamille: number;
  caFournisseurDansSsf: number;
  caDiviseParNbSkusSsf: number;
  caPartDuSsf: number;
  margeArriere: number;
}

export const mockData: SupplierData[] = [
  {
    id: 1,
    famille: "Épicerie",
    ssFamille: "Pâtes et Riz",
    fournisseur: "Barilla France",
    nbSkusSsFamille: 45,
    caTotalSsFamille: 2450000,
    caFournisseurDansSsf: 980000,
    caDiviseParNbSkusSsf: 54444,
    caPartDuSsf: 40.0,
    margeArriere: 12.5,
  },
  {
    id: 2,
    famille: "Épicerie",
    ssFamille: "Pâtes et Riz",
    fournisseur: "Panzani",
    nbSkusSsFamille: 45,
    caTotalSsFamille: 2450000,
    caFournisseurDansSsf: 735000,
    caDiviseParNbSkusSsf: 54444,
    caPartDuSsf: 30.0,
    margeArriere: 10.2,
  },
  {
    id: 3,
    famille: "Épicerie",
    ssFamille: "Conserves",
    fournisseur: "Bonduelle",
    nbSkusSsFamille: 62,
    caTotalSsFamille: 1890000,
    caFournisseurDansSsf: 945000,
    caDiviseParNbSkusSsf: 30484,
    caPartDuSsf: 50.0,
    margeArriere: 15.8,
  },
  {
    id: 4,
    famille: "Frais",
    ssFamille: "Produits Laitiers",
    fournisseur: "Danone",
    nbSkusSsFamille: 78,
    caTotalSsFamille: 4560000,
    caFournisseurDansSsf: 2280000,
    caDiviseParNbSkusSsf: 58462,
    caPartDuSsf: 50.0,
    margeArriere: 8.5,
  },
  {
    id: 5,
    famille: "Frais",
    ssFamille: "Produits Laitiers",
    fournisseur: "Lactalis",
    nbSkusSsFamille: 78,
    caTotalSsFamille: 4560000,
    caFournisseurDansSsf: 1368000,
    caDiviseParNbSkusSsf: 58462,
    caPartDuSsf: 30.0,
    margeArriere: 7.2,
  },
  {
    id: 6,
    famille: "Boissons",
    ssFamille: "Eaux",
    fournisseur: "Nestlé Waters",
    nbSkusSsFamille: 35,
    caTotalSsFamille: 3200000,
    caFournisseurDansSsf: 1600000,
    caDiviseParNbSkusSsf: 91429,
    caPartDuSsf: 50.0,
    margeArriere: 6.5,
  },
  {
    id: 7,
    famille: "Boissons",
    ssFamille: "Sodas",
    fournisseur: "Coca-Cola",
    nbSkusSsFamille: 42,
    caTotalSsFamille: 5670000,
    caFournisseurDansSsf: 3402000,
    caDiviseParNbSkusSsf: 135000,
    caPartDuSsf: 60.0,
    margeArriere: 11.3,
  },
  {
    id: 8,
    famille: "Hygiène",
    ssFamille: "Soins Corps",
    fournisseur: "L'Oréal",
    nbSkusSsFamille: 95,
    caTotalSsFamille: 2890000,
    caFournisseurDansSsf: 1156000,
    caDiviseParNbSkusSsf: 30421,
    caPartDuSsf: 40.0,
    margeArriere: 18.5,
  },
  {
    id: 9,
    famille: "Hygiène",
    ssFamille: "Soins Corps",
    fournisseur: "Unilever",
    nbSkusSsFamille: 95,
    caTotalSsFamille: 2890000,
    caFournisseurDansSsf: 867000,
    caDiviseParNbSkusSsf: 30421,
    caPartDuSsf: 30.0,
    margeArriere: 16.2,
  },
  {
    id: 10,
    famille: "Épicerie",
    ssFamille: "Biscuits Sucrés",
    fournisseur: "Mondelez",
    nbSkusSsFamille: 88,
    caTotalSsFamille: 3450000,
    caFournisseurDansSsf: 1725000,
    caDiviseParNbSkusSsf: 39205,
    caPartDuSsf: 50.0,
    margeArriere: 14.8,
  },
  {
    id: 11,
    famille: "Épicerie",
    ssFamille: "Chocolat",
    fournisseur: "Ferrero",
    nbSkusSsFamille: 52,
    caTotalSsFamille: 4120000,
    caFournisseurDansSsf: 2060000,
    caDiviseParNbSkusSsf: 79231,
    caPartDuSsf: 50.0,
    margeArriere: 13.5,
  },
  {
    id: 12,
    famille: "Surgelés",
    ssFamille: "Plats Cuisinés",
    fournisseur: "Findus",
    nbSkusSsFamille: 67,
    caTotalSsFamille: 1980000,
    caFournisseurDansSsf: 990000,
    caDiviseParNbSkusSsf: 29552,
    caPartDuSsf: 50.0,
    margeArriere: 9.8,
  },
  {
    id: 13,
    famille: "Surgelés",
    ssFamille: "Légumes",
    fournisseur: "Picard",
    nbSkusSsFamille: 72,
    caTotalSsFamille: 1650000,
    caFournisseurDansSsf: 825000,
    caDiviseParNbSkusSsf: 22917,
    caPartDuSsf: 50.0,
    margeArriere: 11.2,
  },
  {
    id: 14,
    famille: "Boucherie",
    ssFamille: "Viande Bovine",
    fournisseur: "Charal",
    nbSkusSsFamille: 38,
    caTotalSsFamille: 3890000,
    caFournisseurDansSsf: 1945000,
    caDiviseParNbSkusSsf: 102368,
    caPartDuSsf: 50.0,
    margeArriere: 5.5,
  },
  {
    id: 15,
    famille: "Boucherie",
    ssFamille: "Volaille",
    fournisseur: "LDC",
    nbSkusSsFamille: 44,
    caTotalSsFamille: 2780000,
    caFournisseurDansSsf: 1390000,
    caDiviseParNbSkusSsf: 63182,
    caPartDuSsf: 50.0,
    margeArriere: 6.8,
  },
  {
    id: 16,
    famille: "Frais",
    ssFamille: "Charcuterie",
    fournisseur: "Fleury Michon",
    nbSkusSsFamille: 58,
    caTotalSsFamille: 3120000,
    caFournisseurDansSsf: 1560000,
    caDiviseParNbSkusSsf: 53793,
    caPartDuSsf: 50.0,
    margeArriere: 10.5,
  },
  {
    id: 17,
    famille: "Épicerie",
    ssFamille: "Café",
    fournisseur: "Lavazza",
    nbSkusSsFamille: 28,
    caTotalSsFamille: 1890000,
    caFournisseurDansSsf: 945000,
    caDiviseParNbSkusSsf: 67500,
    caPartDuSsf: 50.0,
    margeArriere: 17.5,
  },
  {
    id: 18,
    famille: "Épicerie",
    ssFamille: "Petit Déjeuner",
    fournisseur: "Kellogg's",
    nbSkusSsFamille: 64,
    caTotalSsFamille: 2340000,
    caFournisseurDansSsf: 1170000,
    caDiviseParNbSkusSsf: 36563,
    caPartDuSsf: 50.0,
    margeArriere: 15.2,
  },
  {
    id: 19,
    famille: "Hygiène",
    ssFamille: "Produits Ménagers",
    fournisseur: "Procter & Gamble",
    nbSkusSsFamille: 82,
    caTotalSsFamille: 2560000,
    caFournisseurDansSsf: 1280000,
    caDiviseParNbSkusSsf: 31220,
    caPartDuSsf: 50.0,
    margeArriere: 12.8,
  },
  {
    id: 20,
    famille: "Boissons",
    ssFamille: "Jus de Fruits",
    fournisseur: "Orangina Schweppes",
    nbSkusSsFamille: 48,
    caTotalSsFamille: 1780000,
    caFournisseurDansSsf: 890000,
    caDiviseParNbSkusSsf: 37083,
    caPartDuSsf: 50.0,
    margeArriere: 9.5,
  },
  {
    id: 21,
    famille: "Épicerie",
    ssFamille: "Huiles et Condiments",
    fournisseur: "Lesieur",
    nbSkusSsFamille: 56,
    caTotalSsFamille: 1450000,
    caFournisseurDansSsf: 725000,
    caDiviseParNbSkusSsf: 25893,
    caPartDuSsf: 50.0,
    margeArriere: 11.8,
  },
  {
    id: 22,
    famille: "Frais",
    ssFamille: "Fromages",
    fournisseur: "Bel",
    nbSkusSsFamille: 71,
    caTotalSsFamille: 3670000,
    caFournisseurDansSsf: 1835000,
    caDiviseParNbSkusSsf: 51690,
    caPartDuSsf: 50.0,
    margeArriere: 9.2,
  },
  {
    id: 23,
    famille: "Boulangerie",
    ssFamille: "Pain Frais",
    fournisseur: "Harry's",
    nbSkusSsFamille: 34,
    caTotalSsFamille: 2120000,
    caFournisseurDansSsf: 1060000,
    caDiviseParNbSkusSsf: 62353,
    caPartDuSsf: 50.0,
    margeArriere: 7.8,
  },
  {
    id: 24,
    famille: "Boulangerie",
    ssFamille: "Viennoiserie",
    fournisseur: "Pasquier",
    nbSkusSsFamille: 42,
    caTotalSsFamille: 1560000,
    caFournisseurDansSsf: 780000,
    caDiviseParNbSkusSsf: 37143,
    caPartDuSsf: 50.0,
    margeArriere: 8.5,
  },
  {
    id: 25,
    famille: "Frais",
    ssFamille: "Desserts Frais",
    fournisseur: "Yoplait",
    nbSkusSsFamille: 85,
    caTotalSsFamille: 2890000,
    caFournisseurDansSsf: 1445000,
    caDiviseParNbSkusSsf: 34000,
    caPartDuSsf: 50.0,
    margeArriere: 10.5,
  },
  {
    id: 26,
    famille: "Épicerie",
    ssFamille: "Confiserie",
    fournisseur: "Haribo",
    nbSkusSsFamille: 76,
    caTotalSsFamille: 1980000,
    caFournisseurDansSsf: 990000,
    caDiviseParNbSkusSsf: 26053,
    caPartDuSsf: 50.0,
    margeArriere: 16.5,
  },
  {
    id: 27,
    famille: "Épicerie",
    ssFamille: "Snacking Salé",
    fournisseur: "PepsiCo",
    nbSkusSsFamille: 68,
    caTotalSsFamille: 2450000,
    caFournisseurDansSsf: 1225000,
    caDiviseParNbSkusSsf: 36029,
    caPartDuSsf: 50.0,
    margeArriere: 13.2,
  },
  {
    id: 28,
    famille: "Hygiène",
    ssFamille: "Papier Toilette",
    fournisseur: "Essity",
    nbSkusSsFamille: 24,
    caTotalSsFamille: 1340000,
    caFournisseurDansSsf: 670000,
    caDiviseParNbSkusSsf: 55833,
    caPartDuSsf: 50.0,
    margeArriere: 8.8,
  },
  {
    id: 29,
    famille: "Boissons",
    ssFamille: "Vin",
    fournisseur: "Castel Frères",
    nbSkusSsFamille: 92,
    caTotalSsFamille: 4780000,
    caFournisseurDansSsf: 2390000,
    caDiviseParNbSkusSsf: 51957,
    caPartDuSsf: 50.0,
    margeArriere: 14.5,
  },
  {
    id: 30,
    famille: "Boucherie",
    ssFamille: "Porc",
    fournisseur: "Cooperl",
    nbSkusSsFamille: 36,
    caTotalSsFamille: 2650000,
    caFournisseurDansSsf: 1325000,
    caDiviseParNbSkusSsf: 73611,
    caPartDuSsf: 50.0,
    margeArriere: 6.2,
  },
];

// Helper functions for calculations
export const getUniqueFamilles = (): string[] => {
  return Array.from(new Set(mockData.map((item) => item.famille)));
};

export const getUniqueSsFamilles = (): string[] => {
  return Array.from(new Set(mockData.map((item) => item.ssFamille)));
};

export const getUniqueFournisseurs = (): string[] => {
  return Array.from(new Set(mockData.map((item) => item.fournisseur)));
};

export const getTotalSsFamilles = (): number => {
  return getUniqueSsFamilles().length;
};

export const getTotalFournisseurs = (): number => {
  return getUniqueFournisseurs().length;
};

export const getTotalCA = (): number => {
  return mockData.reduce((sum, item) => sum + item.caFournisseurDansSsf, 0);
};

export const getAverageMargeArriere = (): number => {
  const total = mockData.reduce((sum, item) => sum + item.margeArriere, 0);
  return total / mockData.length;
};

export const getTop10SsFamillesByCA = () => {
  const ssFamilleMap = new Map<string, number>();
  
  mockData.forEach((item) => {
    const current = ssFamilleMap.get(item.ssFamille) || 0;
    ssFamilleMap.set(item.ssFamille, current + item.caFournisseurDansSsf);
  });

  return Array.from(ssFamilleMap.entries())
    .map(([name, ca]) => ({ name, ca }))
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 10);
};

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M €`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K €`;
  }
  return `${value.toFixed(0)} €`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
