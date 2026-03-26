import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01, X, Settings01, Lock01, CheckCircle, AlertCircle, FileCheck02, File06 } from "@untitledui/icons";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InsuranceProduct {
  id: number;
  insurer: string;
  policyId: string;
  clientName: string;
  product: string;
  commenced: string;
  premiumAnnual: number;
  premiumInstalment: number;
  frequency: string;
  renewDate: string;
  adviser: string;
  adviserGroup: string;
  reconciled: boolean;
}

// ─── Column definitions ───────────────────────────────────────────────────────
interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }

const PRODUCT_COLS: ColDef[] = [
  { key: "insurer",          label: "Insurer",           defaultVisible: true,  minWidth: 80 },
  { key: "policyId",         label: "Policy ID",         defaultVisible: true,  minWidth: 110 },
  { key: "clientName",       label: "Client Name",       defaultVisible: true,  minWidth: 160 },
  { key: "product",          label: "Product",           defaultVisible: true,  minWidth: 120 },
  { key: "commenced",        label: "Commenced",         defaultVisible: true },
  { key: "premiumAnnual",    label: "Premium (ann.)",    defaultVisible: true },
  { key: "premiumInstalment",label: "Premium (instal.)", defaultVisible: true },
  { key: "frequency",        label: "Frequency",         defaultVisible: true },
  { key: "renewDate",        label: "Renew Date",        defaultVisible: true },
  { key: "adviser",          label: "Adviser",           defaultVisible: true },
  { key: "adviserGroup",     label: "Adviser Group",     defaultVisible: true, minWidth: 160 },
];

const STORE_KEY = "axis_insurance_cols_v1";
const LOCKED_COL = "insurer";

function loadColState(defs: ColDef[]) {
  try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch {}
  return { order: defs.map((c: ColDef) => c.key), visible: Object.fromEntries(defs.map((c: ColDef) => [c.key, c.defaultVisible])) };
}
function saveColState(s: { order: string[]; visible: Record<string, boolean> }) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

// ─── Mock data ────────────────────────────────────────────────────────────────
const INSURERS = ["Zurich", "TAL", "MetLife", "AIA", "OnePath", "NEOS", "MLC", "Asteron"];
const PRODUCTS = ["Life Insurance", "Income Protection", "Trauma", "TPD", "Other"];
const ADVISERS = ["Toni Smilevski", "Sonny Lowe", "Caitlin Gardiner", "Neil Ritter", "Stephen Hartley"];
const ADVISER_GROUPS = ["Tony Insurance", "LIP", "Averse To Risk", "Ritter Life Insurance Solutions", "Surety Insurance"];
const FREQUENCIES = ["Monthly", "Half-Yearly", "Yearly", "Quarterly"];

function randomDate(startYear: number, endYear: number) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function randomPick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const MOCK_PRODUCTS: InsuranceProduct[] = Array.from({ length: 614 }, (_, i) => {
  const insurer = randomPick(INSURERS);
  const premium = Math.floor(Math.random() * 30000) + 500;
  const instalment = Math.random() > 0.4 ? Math.floor(premium / 12 * (0.9 + Math.random() * 0.2)) : 0;
  return {
    id: 1000 + i,
    insurer,
    policyId: `#0${3100000 + Math.floor(Math.random() * 200000)}`,
    clientName: ["Lister Dyer", "Alastair Walker", "Thierry Georges Wetzel", "David Adams", "Neil Hartley", "Desley Hartley", "Tracey Hester", "Mark Hester", "Ricardo Curioso", "Paula Reeves"][Math.floor(Math.random() * 10)],
    product: randomPick(PRODUCTS),
    commenced: randomDate(1998, 2024),
    premiumAnnual: premium,
    premiumInstalment: instalment,
    frequency: randomPick(FREQUENCIES),
    renewDate: randomDate(2026, 2027),
    adviser: randomPick(ADVISERS),
    adviserGroup: randomPick(ADVISER_GROUPS),
    reconciled: Math.random() > 0.15,
  };
});

// ─── Column Panel ─────────────────────────────────────────────────────────────
function ColumnPanel({ defs, order, visible, onToggle, onReorder, onClose }: {
  defs: ColDef[]; order: string[]; visible: Record<string, boolean>;
  onToggle: (k: string) => void; onReorder: (o: string[]) => void; onClose: () => void;
}) {
  const dragIdx = useRef<number | null>(null);
  function handleDragStart(i: number) { dragIdx.current = i; }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const newOrder = [...order];
    const [removed] = newOrder.splice(dragIdx.current, 1);
    newOrder.splice(i, 0, removed);
    dragIdx.current = i;
    onReorder(newOrder);
  }
  return (
    <div className="absolute right-0 top-10 z-50 w-60 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary">
        <p className="text-xs font-semibold text-primary">Columns</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onReorder(defs.map(d => d.key))} className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose} className="text-quaternary hover:text-secondary"><X className="size-3.5" /></button>
        </div>
      </div>
      <ul className="max-h-64 overflow-y-auto divide-y divide-secondary text-xs">
        {order.map((key, i) => {
          const col = defs.find(d => d.key === key);
          if (!col) return null;
          const isLocked = key === LOCKED_COL;
          return (
            <li key={key} draggable={!isLocked} onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)}
              className={"flex items-center gap-2 px-3 py-2 hover:bg-secondary_alt cursor-grab " + (isLocked ? "opacity-50 cursor-not-allowed" : "")}>
              <input type="checkbox" checked={visible[key]} disabled={isLocked} onChange={() => onToggle(key)}
                className="rounded border-secondary accent-[#D34108] size-3.5 shrink-0" />
              <span className="flex-1 truncate text-secondary">{col.label}</span>
              {isLocked && <Lock01 className="size-3 text-quaternary" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Chart Colors ─────────────────────────────────────────────────────────────
const CHART_COLORS = ["#D34108", "#3B485B", "#F97316", "#6B7280", "#EA580C", "#9CA3AF", "#FB923C", "#4B5563"];

// ─── Main Component ───────────────────────────────────────────────────────────
export function InsuranceProductsPage() {
  const navigate = useNavigate();
  const PAGE_SIZE = 25;

  // Filters
  const [insurerFilter, setInsurerFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [adviserGroupFilter, setAdviserGroupFilter] = useState("All");
  const [reconciledFilter, setReconciledFilter] = useState<"all" | "reconciled" | "unreconciled">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Column state
  const [colState, setColState] = useState(() => loadColState(PRODUCT_COLS));
  const [colPanelOpen, setColPanelOpen] = useState(false);
  function updateCols(s: typeof colState) { setColState(s); saveColState(s); }
  function toggleCol(key: string) { if (key === LOCKED_COL) return; updateCols({ ...colState, visible: { ...colState.visible, [key]: !colState.visible[key] } }); }
  function reorderCols(order: string[]) { updateCols({ ...colState, order }); }

  // Sorting
  const [sortKey, setSortKey] = useState<string>("policyId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  // Filter & sort data
  const filtered = useMemo(() => {
    let rows = MOCK_PRODUCTS;
    if (insurerFilter !== "All") rows = rows.filter(r => r.insurer === insurerFilter);
    if (productFilter !== "All") rows = rows.filter(r => r.product === productFilter);
    if (adviserGroupFilter !== "All") rows = rows.filter(r => r.adviserGroup === adviserGroupFilter);
    if (reconciledFilter === "reconciled") rows = rows.filter(r => r.reconciled);
    if (reconciledFilter === "unreconciled") rows = rows.filter(r => !r.reconciled);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => r.clientName.toLowerCase().includes(s) || r.policyId.toLowerCase().includes(s) || r.adviser.toLowerCase().includes(s));
    }
    return [...rows].sort((a, b) => {
      const va = String((a as Record<string, unknown>)[sortKey] ?? "");
      const vb = String((b as Record<string, unknown>)[sortKey] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
    });
  }, [insurerFilter, productFilter, adviserGroupFilter, reconciledFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Visible columns
  const visibleCols = useMemo(() => colState.order.filter(k => colState.visible[k]).map(k => PRODUCT_COLS.find(c => c.key === k)!).filter(Boolean), [colState]);

  // Metrics
  const totalPolicies = filtered.length;
  const totalPremium = filtered.reduce((sum, r) => sum + r.premiumAnnual, 0);
  const reconciledCount = filtered.filter(r => r.reconciled).length;
  const unreconciledCount = filtered.filter(r => !r.reconciled).length;
  const reconciledPremium = filtered.filter(r => r.reconciled).reduce((sum, r) => sum + r.premiumAnnual, 0);
  const unreconciledPremium = filtered.filter(r => !r.reconciled).reduce((sum, r) => sum + r.premiumAnnual, 0);

  // Chart data - Insurer split
  const insurerData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.insurer] = (counts[r.insurer] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Chart data - Product split
  const productData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.product] = (counts[r.product] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const hasFilters = search || insurerFilter !== "All" || productFilter !== "All" || adviserGroupFilter !== "All" || reconciledFilter !== "all";

  // Unique values for filters
  const uniqueInsurers = [...new Set(MOCK_PRODUCTS.map(r => r.insurer))].sort();
  const uniqueProducts = [...new Set(MOCK_PRODUCTS.map(r => r.product))].sort();
  const uniqueAdviserGroups = [...new Set(MOCK_PRODUCTS.map(r => r.adviserGroup))].sort();

  // Table header component
  const Th = ({ col, isLocked }: { col: ColDef; isLocked?: boolean }) => (
    <th onClick={() => toggleSort(col.key)} style={{ minWidth: col.minWidth }}
      className={"cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap group/th" + (isLocked ? " sticky left-0 bg-tertiary z-10" : "")}>
      <span className="inline-flex items-center gap-1.5">
        {isLocked && <Lock01 className="size-3 text-fg-quaternary shrink-0" />}
        {col.label}
        <svg className={"size-3 " + (sortKey === col.key ? "opacity-100" : "opacity-20")} viewBox="0 0 10 12" fill="currentColor">
          <path d="M5 1l4 5H1z" opacity={sortDir === "asc" && sortKey === col.key ? "1" : "0.4"}/>
          <path d="M5 11l-4-5h8z" opacity={sortDir === "desc" && sortKey === col.key ? "1" : "0.4"}/>
        </svg>
      </span>
    </th>
  );

  // Cell renderer
  function renderCell(row: InsuranceProduct, key: string) {
    switch (key) {
      case "insurer": return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
            {row.insurer.slice(0, 2)}
          </div>
        </div>
      );
      case "policyId": return (
        <span className="text-brand-secondary font-medium text-sm hover:underline cursor-pointer">{row.policyId}</span>
      );
      case "clientName": return (
        <span className="text-brand-secondary font-medium text-sm hover:underline cursor-pointer">{row.clientName}</span>
      );
      case "product": return <span className="text-sm text-secondary">{row.product}</span>;
      case "commenced": return <span className="text-sm text-secondary">{row.commenced}</span>;
      case "premiumAnnual": return <span className="text-sm text-secondary font-medium">${row.premiumAnnual.toLocaleString()}</span>;
      case "premiumInstalment": return <span className="text-sm text-secondary">{row.premiumInstalment > 0 ? `$${row.premiumInstalment.toLocaleString()}` : "$0.00"}</span>;
      case "frequency": return <span className="text-sm text-secondary">{row.frequency}</span>;
      case "renewDate": return <span className="text-sm text-secondary">{row.renewDate}</span>;
      case "adviser": return <span className="text-sm text-secondary">{row.adviser}</span>;
      case "adviserGroup": return <span className="text-sm text-secondary truncate block max-w-[180px]">{row.adviserGroup}</span>;
      default: return <span className="text-sm text-secondary">—</span>;
    }
  }

  // Download CSV
  function downloadCSV() {
    const headers = visibleCols.map(c => c.label);
    const rows = filtered.map(r => visibleCols.map(c => String((r as Record<string, unknown>)[c.key] ?? "")));
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "insurance_products.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">
        {/* ── Header ── */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Insurance Products</h1>
              <p className="text-sm text-tertiary mt-0.5">{totalPolicies.toLocaleString()} policies · Total premium: <span className="font-medium text-primary">${totalPremium.toLocaleString()}</span></p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={insurerFilter} onChange={e => { setInsurerFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer min-w-[100px]">
                <option value="All">Insurer</option>
                {uniqueInsurers.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={productFilter} onChange={e => { setProductFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer min-w-[130px]">
                <option value="All">Product Type</option>
                {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={adviserGroupFilter} onChange={e => { setAdviserGroupFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer min-w-[150px]">
                <option value="All">Adviser Group</option>
                {uniqueAdviserGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* ── Metric Tiles ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* Reconciled */}
            <button onClick={() => { setReconciledFilter(reconciledFilter === "reconciled" ? "all" : "reconciled"); setPage(1); }}
              className={"rounded-xl border p-4 text-left transition-all " + (reconciledFilter === "reconciled" ? "border-green-500 bg-green-50 ring-2 ring-green-500/20" : "border-secondary bg-primary hover:border-green-300")}>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="size-4 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-700">Reconciled</span>
              </div>
              <p className="text-2xl font-bold text-primary">{reconciledCount.toLocaleString()}</p>
              <p className="text-xs text-tertiary mt-0.5">${reconciledPremium.toLocaleString()} premium</p>
            </button>

            {/* Unreconciled */}
            <button onClick={() => { setReconciledFilter(reconciledFilter === "unreconciled" ? "all" : "unreconciled"); setPage(1); }}
              className={"rounded-xl border p-4 text-left transition-all " + (reconciledFilter === "unreconciled" ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20" : "border-secondary bg-primary hover:border-amber-300")}>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="size-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-amber-700">Unreconciled</span>
              </div>
              <p className="text-2xl font-bold text-primary">{unreconciledCount.toLocaleString()}</p>
              <p className="text-xs text-tertiary mt-0.5">${unreconciledPremium.toLocaleString()} premium</p>
            </button>

            {/* Total Premium */}
            <div className="rounded-xl border border-secondary bg-primary p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-lg bg-brand-secondary flex items-center justify-center">
                  <File06 className="size-4 text-brand-primary" />
                </div>
                <span className="text-xs font-medium text-secondary">Total Premium</span>
              </div>
              <p className="text-2xl font-bold text-primary">${totalPremium.toLocaleString()}</p>
              <p className="text-xs text-tertiary mt-0.5">Annual value</p>
            </div>

            {/* Trail Commission */}
            <div className="rounded-xl border border-secondary bg-primary p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileCheck02 className="size-4 text-slate-600" />
                </div>
                <span className="text-xs font-medium text-secondary">Est. Trail (20%)</span>
              </div>
              <p className="text-2xl font-bold text-primary">${Math.round(totalPremium * 0.2).toLocaleString()}</p>
              <p className="text-xs text-tertiary mt-0.5">Commission P.A.</p>
            </div>
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Insurer Split */}
            <div className="rounded-xl border border-secondary bg-primary p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">Insurer Split</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={insurerData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {insurerData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value.toLocaleString(), "Policies"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Split */}
            <div className="rounded-xl border border-secondary bg-primary p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">Product Split</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData} layout="vertical" margin={{ left: 80, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(value: number) => [value.toLocaleString(), "Policies"]} />
                    <Bar dataKey="value" fill="#D34108" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search policies..."
              className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-8 py-2 text-sm text-primary outline-none focus:border-brand" />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {hasFilters && <button onClick={() => { setSearch(""); setInsurerFilter("All"); setProductFilter("All"); setAdviserGroupFilter("All"); setReconciledFilter("all"); setPage(1); }} className="text-sm text-brand-secondary hover:underline">Clear filters</button>}
            <button onClick={downloadCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary">
              <Download01 className="size-4" />Download CSV
            </button>
            <div className="relative">
              <button onClick={() => setColPanelOpen(v => !v)}
                className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " + (colPanelOpen ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-secondary")}>
                <Settings01 className="size-4" />Columns
                <span className="rounded-full bg-brand-solid text-white text-[10px] font-semibold px-1.5 py-0.5">{visibleCols.length}/{PRODUCT_COLS.length}</span>
              </button>
              {colPanelOpen && <ColumnPanel defs={PRODUCT_COLS} order={colState.order} visible={colState.visible} onToggle={toggleCol} onReorder={reorderCols} onClose={() => setColPanelOpen(false)} />}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-tertiary border-b border-secondary">
                <tr>
                  {visibleCols.map((col, idx) => <Th key={col.key} col={col} isLocked={idx === 0} />)}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {pageRows.length === 0
                  ? <tr><td colSpan={visibleCols.length} className="px-4 py-16 text-center text-sm text-quaternary">No products found</td></tr>
                  : pageRows.map(row => (
                    <tr key={row.id} className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                      {visibleCols.map((col, idx) => (
                        <td key={col.key} className={"px-3 py-2.5" + (idx === 0 ? " sticky left-0 bg-primary group-hover:bg-secondary_alt z-10" : "")}>{renderCell(row, col.key)}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-quaternary">Pages:</span>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">← Prev</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={"size-7 rounded text-xs font-medium " + (p === page ? "bg-brand-solid text-white" : "text-quaternary hover:bg-secondary")}>{p}</button>
              ))}
              {totalPages > 10 && <span className="text-xs text-quaternary">...</span>}
              {totalPages > 10 && <button onClick={() => setPage(totalPages)} className={"size-7 rounded text-xs font-medium " + (page === totalPages ? "bg-brand-solid text-white" : "text-quaternary hover:bg-secondary")}>{totalPages}</button>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">Next »</button>
            </div>
          )}
          <p className="text-xs text-quaternary mt-2 px-1">{filtered.length} records · {visibleCols.length} of {PRODUCT_COLS.length} columns</p>
        </div>
      </main>
      {colPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setColPanelOpen(false)} />}
    </div>
  );
}
