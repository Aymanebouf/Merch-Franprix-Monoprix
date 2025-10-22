import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Upload,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDataStore } from "@/store/useDataStore";
import { analyzeFileOnServer, analyzeOnClient } from "@/lib/api";
import type { DataRow } from "@/types/data";

// shadcn combobox
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandGroup,
  CommandList,
} from "@/components/ui/command";

/* ---------- Formatters MAD & % : 2 décimales ---------- */
const nf = new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMAD = (v: number) => `${nf.format(v)} MAD`;
const formatPct = (v: number) => `${nf.format(v)} %`;

/* ---------- Combobox (select avec recherche) ---------- */
type SearchableSelectProps = {
  value: string;
  onChange: (val: string) => void;
  items: string[];
  placeholder: string;
  widthClass?: string;
  clearLabel?: string;
};
const SearchableSelect = ({
  value,
  onChange,
  items,
  placeholder,
  widthClass = "w-[220px]",
  clearLabel = "Tous",
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const label = value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`justify-between rounded-xl shadow-sm hover:shadow-md transition-shadow ${widthClass}`}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher..." />
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <CommandItem
                value="__CLEAR__"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${value === "" ? "opacity-100" : "opacity-0"}`} />
                {clearLabel}
              </CommandItem>
              {items.map((item) => (
                <CommandItem
                  key={item}
                  value={item}
                  onSelect={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === item ? "opacity-100" : "opacity-0"}`} />
                  <span className="truncate">{item}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/* ---------- Mini KPI card ---------- */
type MiniCardProps = {
  title: string;
  value: string | number;
  Icon: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "accent" | "success";
};
const MiniCard = ({ title, value, Icon, accent = "primary" }: MiniCardProps) => {
  const accentClasses =
    accent === "success"
      ? "from-emerald-500 to-emerald-400"
      : accent === "accent"
      ? "from-sky-500 to-cyan-400"
      : "from-primary/95 to-primary/80";
  return (
    <Card className="rounded-2xl ring-1 ring-border bg-card/80 backdrop-blur-sm shadow-xl shadow-black/5 hover:shadow-2xl hover:-translate-y-0.5 transition-all overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs md:text-sm text-muted-foreground">{title}</div>
            <div className="mt-1 text-lg md:text-xl font-semibold tracking-tight leading-tight">
              {value}
            </div>
          </div>
          <div
            className={`h-10 w-10 md:h-12 md:w-12 rounded-xl grid place-items-center text-white shadow-lg bg-gradient-to-br ${accentClasses}`}
          >
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  // store global
  const rows = useDataStore((s) => s.rows);
  const setRows = useDataStore((s) => s.setRows);
  const filters = useDataStore((s) => s.filters);
  const setFilter = useDataStore((s) => s.setFilter);
  const clearFilters = useDataStore((s) => s.clearFilters);

  // dataset : si rien n'est importé, dataset = []
  const dataset: DataRow[] = rows;

  // file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onPickFile = () => fileInputRef.current?.click();

  // listes pour filtres
  const familles = useMemo(
    () => Array.from(new Set(dataset.map((d) => d.famille))).sort(),
    [dataset]
  );
  const ssFamilles = useMemo(
    () => Array.from(new Set(dataset.map((d) => d.ssFamille))).sort(),
    [dataset]
  );
  const fournisseurs = useMemo(
    () => Array.from(new Set(dataset.map((d) => d.fournisseur))).sort(),
    [dataset]
  );

  // filtres
  const filteredData = useMemo(() => {
    return dataset.filter((item) => {
      if (filters.famille && item.famille !== filters.famille) return false;
      if (filters.ssFamille && item.ssFamille !== filters.ssFamille) return false;
      if (filters.fournisseur && item.fournisseur !== filters.fournisseur) return false;
      return true;
    });
  }, [dataset, filters]);

  // KPI (retourne 0 si vide)
  const kpiData = useMemo(() => {
    const uniqueSsFamilles = new Set(filteredData.map((i) => i.ssFamille)).size;
    const uniqueFournisseurs = new Set(filteredData.map((i) => i.fournisseur)).size;
    const totalCA = filteredData.reduce((s, i) => s + (i.caFournisseurDansSsf || 0), 0);
    const avgMarge =
      filteredData.length === 0
        ? 0
        : filteredData.reduce((s, i) => s + (i.margeArriere ?? 0), 0) / filteredData.length;
    return {
      ssFamilles: uniqueSsFamilles,
      fournisseurs: uniqueFournisseurs,
      ca: totalCA,
      marge: avgMarge,
    };
  }, [filteredData]);

  // Chart
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((i) =>
      map.set(i.ssFamille, (map.get(i.ssFamille) || 0) + (i.caFournisseurDansSsf || 0))
    );
    return [...map.entries()]
      .map(([name, ca]) => ({ name, ca }))
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 10);
  }, [filteredData]);

  // Import CSV/Excel -> backend puis fallback client
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let newRows: DataRow[] = [];
      try {
        newRows = await analyzeFileOnServer(file);
      } catch {
        newRows = await analyzeOnClient(file);
      }
      if (!newRows.length) {
        setRows([]);  // 0 partout
        clearFilters();
        return;
      }
      setRows(newRows);
      clearFilters();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Import impossible.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.xlsm"
          className="hidden"
          onChange={onFileChange}
        />
        <Button
          className="rounded-xl shadow-md shadow-primary/20 border border-primary/20 bg-primary/90 hover:bg-primary text-primary-foreground"
          onClick={onPickFile}
        >
          <Upload className="mr-2 h-4 w-4" />
          Importer CSV/Excel
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Filtres avec recherche */}
        <SearchableSelect
          value={filters.famille}
          onChange={(v) => setFilter("famille", v)}
          items={familles}
          placeholder="Toutes les familles"
          widthClass="w-[220px]"
          clearLabel="Toutes les familles"
        />
        <SearchableSelect
          value={filters.ssFamille}
          onChange={(v) => setFilter("ssFamille", v)}
          items={ssFamilles}
          placeholder="Toutes les SS-familles"
          widthClass="w-[240px]"
          clearLabel="Toutes les SS-familles"
        />
        <SearchableSelect
          value={filters.fournisseur}
          onChange={(v) => setFilter("fournisseur", v)}
          items={fournisseurs}
          placeholder="Tous les fournisseurs"
          widthClass="w-[240px]"
          clearLabel="Tous les fournisseurs"
        />

        {(filters.famille || filters.ssFamille || filters.fournisseur) && (
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniCard title="SS-Familles" value={kpiData.ssFamilles} Icon={Package} accent="primary" />
        <MiniCard title="Fournisseurs" value={kpiData.fournisseurs} Icon={Users} accent="accent" />
        <MiniCard title="CA Total" value={formatMAD(kpiData.ca)} Icon={DollarSign} accent="success" />
        <MiniCard
          title="Marge Arrière Moyenne"
          value={formatPct(kpiData.marge || 0)}
          Icon={TrendingUp}
          accent="primary"
        />
      </div>

      {/* Chart */}
      <Card className="rounded-2xl ring-1 ring-border bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/10 hover:shadow-2xl transition-all">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Top 10 SS-Familles par CA
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                className="text-xs fill-muted-foreground"
              />
              <YAxis
                width={92}
                tickFormatter={(v) => nf.format(v as number)}
                label={{ value: "MAD", angle: -90, position: "insideLeft" }}
                className="text-xs fill-muted-foreground"
                domain={chartData.length ? [0, "dataMax"] : [0, 1]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card/95 border border-border rounded-xl p-3 shadow-lg">
                        <p className="font-medium text-sm">
                          {(payload[0].payload as any).name}
                        </p>
                        <p className="text-primary font-bold">
                          {formatMAD((payload[0].value as number) ?? 0)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="ca" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
