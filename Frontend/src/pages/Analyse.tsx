import { useState, useMemo } from "react";
import { ArrowUpDown, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { useDataStore } from "@/store/useDataStore";
import type { DataRow } from "@/types/data";

/* ---- Formatters ---- */
const nf = new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMAD = (v: number) => `${nf.format(v)} MAD`;
const formatPct = (v: number) => `${nf.format(v)} %`;

const scoreOf = (r: DataRow) => (r.scoreFournisseur ?? (r.caPartDuSsf || 0) + (r.margeArriere ?? 0));

type SortKey = keyof DataRow | "scoreFournisseur";
type SortOrder = "asc" | "desc";
const ITEMS_PER_PAGE = 20;

const NUMERIC_KEYS: SortKey[] = [
  "caTotalSsFamille",
  "caFournisseurDansSsf",
  "caPartDuSsf",
  "margeArriere",
  "scoreFournisseur",
];

const Analyse = () => {
  const rowsFromStore = useDataStore((s) => s.rows);
  const baseData: DataRow[] = rowsFromStore;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("caFournisseurDansSsf");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  // Recherche + Tri
  const filteredAndSortedData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    const filtered = baseData.filter(
      (item) =>
        item.famille.toLowerCase().includes(searchLower) ||
        item.ssFamille.toLowerCase().includes(searchLower) ||
        item.fournisseur.toLowerCase().includes(searchLower)
    );

    const isNumeric = NUMERIC_KEYS.includes(sortKey);
    const sorted = filtered.sort((a, b) => {
      const aVal = sortKey === "scoreFournisseur" ? scoreOf(a) : (a as any)[sortKey];
      const bVal = sortKey === "scoreFournisseur" ? scoreOf(b) : (b as any)[sortKey];

      if (isNumeric) {
        const av = typeof aVal === "number" ? aVal : aVal == null ? -Infinity : Number(aVal);
        const bv = typeof bVal === "number" ? bVal : bVal == null ? -Infinity : Number(bVal);
        return sortOrder === "asc" ? av - bv : bv - av;
      }
      const aStr = String(aVal ?? "").toLowerCase();
      const bStr = String(bVal ?? "").toLowerCase();
      return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [baseData, searchTerm, sortKey, sortOrder]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE));

  // Drawer
  const handleRowClick = (row: DataRow) => {
    setSelectedRow(row);
    setIsDrawerOpen(true);
  };

  // Export CSV (séparateur ; + BOM, nombres FR sans groupage, max 4 décimales)
  const exportToCSV = () => {
    const SEP = ";";
    const fmt = (n: number | null | undefined) =>
      n == null ? "" : (Number(n) as number).toLocaleString("fr-FR", { useGrouping: false, maximumFractionDigits: 4 });
    const sanitize = (s: string) => (s ?? "").replace(/\r?\n/g, " ").trim();

    const headers = [
      "Famille",
      "SS-Famille",
      "Fournisseur",
      "CA Total SS-Famille",
      "CA Fournisseur dans SSF",
      "CA Part du SSF %",
      "Marge Arrière %",
      "Score Fournisseur %",
    ];

    const rows = filteredAndSortedData.map((item) => [
      sanitize(item.famille),
      sanitize(item.ssFamille),
      sanitize(item.fournisseur),
      fmt(item.caTotalSsFamille),
      fmt(item.caFournisseurDansSsf),
      fmt(item.caPartDuSsf),
      fmt(item.margeArriere),
      fmt(scoreOf(item)),
    ]);

    const csvContent = "\ufeff" + [headers.join(SEP), ...rows.map((r) => r.join(SEP))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "analyse_fournisseurs.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Graphe Drawer
  const drawerChartData = useMemo(() => {
    if (!selectedRow) return [];
    return baseData
      .filter((item) => item.ssFamille === selectedRow.ssFamille)
      .map((item) => ({ name: item.fournisseur, ca: item.caFournisseurDansSsf }))
      .sort((a, b) => b.ca - a.ca);
  }, [selectedRow, baseData]);

  const SortableHeader = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort(key)}>
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Input
          placeholder="Rechercher par famille, SS-famille ou fournisseur..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-md rounded-xl"
        />
        <Button onClick={exportToCSV} className="rounded-xl gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Table */}
      <Card className="rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle>Analyse Détaillée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <SortableHeader label="Famille" sortKey="famille" />
                  <SortableHeader label="SS-Famille" sortKey="ssFamille" />
                  <SortableHeader label="Fournisseur" sortKey="fournisseur" />
                  <SortableHeader label="CA Total SSF" sortKey="caTotalSsFamille" />
                  <SortableHeader label="CA Fournisseur" sortKey="caFournisseurDansSsf" />
                  <SortableHeader label="Part SSF %" sortKey="caPartDuSsf" />
                  <SortableHeader label="Marge %" sortKey="margeArriere" />
                  <SortableHeader label="Score Fournisseur %" sortKey="scoreFournisseur" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, i) => (
                  <TableRow
                    key={`${item.famille}|${item.ssFamille}|${item.fournisseur}|${i}`}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell className="font-medium">{item.famille}</TableCell>
                    <TableCell>{item.ssFamille}</TableCell>
                    <TableCell>{item.fournisseur}</TableCell>
                    <TableCell className="text-right">{formatMAD(item.caTotalSsFamille)}</TableCell>
                    <TableCell className="text-right">{formatMAD(item.caFournisseurDansSsf)}</TableCell>
                    <TableCell className="text-right">{formatPct(item.caPartDuSsf)}</TableCell>
                    <TableCell className="text-right">
                      {item.margeArriere == null ? "—" : formatPct(item.margeArriere)}
                    </TableCell>
                    <TableCell className="text-right">{formatPct(scoreOf(item))}</TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                      Aucun fichier importé — tout est à 0.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {Math.min(currentPage, totalPages)} sur {totalPages} ({filteredAndSortedData.length} résultats)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl"
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">Détails de la SS-Famille</SheetTitle>
            <SheetDescription>
              {selectedRow?.ssFamille} {selectedRow ? `- ${selectedRow.famille}` : ""}
            </SheetDescription>
          </SheetHeader>

          {selectedRow && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground mb-1">CA Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatMAD(selectedRow.caTotalSsFamille)}
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground mb-1">CA Fournisseur</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatMAD(selectedRow.caFournisseurDansSsf)}
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground mb-1">Part du SSF</p>
                  <p className="text-2xl font-bold text-accent">
                    {formatPct(selectedRow.caPartDuSsf)}
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground mb-1">Marge</p>
                  <p className="text-2xl font-bold text-foreground">
                    {selectedRow.margeArriere == null ? "—" : formatPct(selectedRow.margeArriere)}
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground mb-1">Score Fournisseur</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPct(scoreOf(selectedRow))}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <h3 className="font-semibold mb-4">CA par Fournisseur</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={drawerChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis
                      width={86}
                      tickFormatter={(value) => nf.format(value as number)}
                      label={{ value: "MAD", angle: -90, position: "insideLeft" }}
                      className="text-xs fill-muted-foreground"
                      domain={drawerChartData.length ? [0, "dataMax"] : [0, 1]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
                              <p className="font-medium text-sm">{(payload[0].payload as any).name}</p>
                              <p className="text-primary font-bold">
                                {formatMAD((payload[0].value as number) ?? 0)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="ca" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Analyse;
