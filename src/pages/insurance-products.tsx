import { useState, useMemo, useRef } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { X, Lock01, SearchMd, Download01, Settings04, CheckCircle, AlertCircle, Calendar } from "@untitledui/icons";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { BadgeWithDot } from "@/components/base/badges/badges";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InsuranceProduct {
  id: number;
  insurer: string;
  policyId: string;
  clientName: string;
  clientEmail: string;
  product: string;
  commenced: string;
  premiumAnnual: number;
  frequency: string;
  renewDate: string;
  adviser: string;
  adviserGroup: string;
  reconciled: boolean;
}

// ─── Column definitions ───────────────────────────────────────────────────────
interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }

const PRODUCT_COLS: ColDef[] = [
  { key: "customer",      label: "Customer",        defaultVisible: true,  minWidth: 200 },
  { key: "policyId",      label: "Policy ID",       defaultVisible: true },
  { key: "insurer",       label: "Insurer",         defaultVisible: true },
  { key: "product",       label: "Product",         defaultVisible: true },
  { key: "commenced",     label: "Commenced",       defaultVisible: true },
  { key: "premiumAnnual", label: "Premium (ann.)",  defaultVisible: true },
  { key: "frequency",     label: "Frequency",       defaultVisible: true },
  { key: "renewDate",     label: "Renew Date",      defaultVisible: true },
  { key: "adviser",       label: "Adviser",         defaultVisible: true },
  { key: "adviserGroup",  label: "Adviser Group",   defaultVisible: true, minWidth: 160 },
];

const STORE_KEY = "axis_insurance_cols_v3";
const LOCKED_COL = "customer";

function loadColState(defs: ColDef[]) {
  try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch {}
  return { order: defs.map((c: ColDef) => c.key), visible: Object.fromEntries(defs.map((c: ColDef) => [c.key, c.defaultVisible])) };
}
function saveColState(s: { order: string[]; visible: Record<string, boolean> }) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

// ─── Mock data ────────────────────────────────────────────────────────────────
const INSURERS = ["Zurich", "TAL", "MetLife", "AIA", "OnePath", "NEOS", "MLC", "Asteron"];
const PRODUCTS = ["Life Insurance", "Income Protection", "Trauma", "TPD", "Other"];
const ADVISERS = ["Toni Smilevski", "Sonny Lowe", "Caitlin Gardiner", "Neil Ritter", "Stephen Hartley"];
const ADVISER_GROUPS = ["Tony Insurance", "LIP", "Averse To Risk", "Ritter Life Solutions", "Surety Insurance"];
const FREQUENCIES = ["Monthly", "Half-Yearly", "Yearly", "Quarterly"];
const CLIENTS = [
  { name: "Mikey Lawrence", email: "heymikey@gmail.com" },
  { name: "Ashwin Santiago", email: "ashwin@asantiago.com" },
  { name: "Lister Dyer", email: "lister.dyer@email.com" },
  { name: "Alastair Walker", email: "a.walker@company.au" },
  { name: "Thierry Wetzel", email: "thierry.w@mail.com" },
  { name: "David Adams", email: "david.adams@gmail.com" },
  { name: "Neil Hartley", email: "neil.hartley@outlook.com" },
  { name: "Paula Reeves", email: "p.reeves@business.com.au" },
  { name: "Ricardo Curioso", email: "ricardo@curioso.net" },
  { name: "Tracey Hester", email: "tracey.hester@work.com" },
];

function randomDate(startYear: number, endYear: number) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function randomPick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const MOCK_PRODUCTS: InsuranceProduct[] = Array.from({ length: 614 }, (_, i) => {
  const client = randomPick(CLIENTS);
  const premium = Math.floor(Math.random() * 30000) + 500;
  return {
    id: 1000 + i,
    insurer: randomPick(INSURERS),
    policyId: `POL-${String(3100000 + Math.floor(Math.random() * 200000))}`,
    clientName: client.name,
    clientEmail: client.email,
    product: randomPick(PRODUCTS),
    commenced: randomDate(2018, 2024),
    premiumAnnual: premium,
    frequency: randomPick(FREQUENCIES),
    renewDate: randomDate(2025, 2027),
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
  const PAGE_SIZE = 25;

  // Filters
  const [insurerFilter, setInsurerFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [adviserGroupFilter, setAdviserGroupFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
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
    // Date filter
    if (dateFilter !== "All") {
      const now = new Date();
      rows = rows.filter(r => {
        const commenced = new Date(r.commenced);
        switch (dateFilter) {
          case "last30": return now.getTime() - commenced.getTime() <= 30 * 24 * 60 * 60 * 1000;
          case "last90": return now.getTime() - commenced.getTime() <= 90 * 24 * 60 * 60 * 1000;
          case "thisYear": return commenced.getFullYear() === now.getFullYear();
          case "lastYear": return commenced.getFullYear() === now.getFullYear() - 1;
          default: return true;
        }
      });
    }
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => r.clientName.toLowerCase().includes(s) || r.policyId.toLowerCase().includes(s) || r.adviser.toLowerCase().includes(s));
    }
    return [...rows].sort((a, b) => {
      const va = String((a as unknown as Record<string, unknown>)[sortKey] ?? "");
      const vb = String((b as unknown as Record<string, unknown>)[sortKey] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
    });
  }, [insurerFilter, productFilter, adviserGroupFilter, dateFilter, reconciledFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Visible columns
  const visibleCols = useMemo(() => colState.order.filter((k: string) => colState.visible[k]).map((k: string) => PRODUCT_COLS.find((c: ColDef) => c.key === k)!).filter(Boolean), [colState]);

  // Metrics (from full dataset, not filtered)
  const totalPremium = MOCK_PRODUCTS.reduce((sum, r) => sum + r.premiumAnnual, 0);
  const reconciledCount = MOCK_PRODUCTS.filter(r => r.reconciled).length;
  const unreconciledCount = MOCK_PRODUCTS.filter(r => !r.reconciled).length;
  const reconciledPremium = MOCK_PRODUCTS.filter(r => r.reconciled).reduce((sum, r) => sum + r.premiumAnnual, 0);
  const unreconciledPremium = MOCK_PRODUCTS.filter(r => !r.reconciled).reduce((sum, r) => sum + r.premiumAnnual, 0);

  // Chart data - Insurer split
  const insurerData = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_PRODUCTS.forEach(r => { counts[r.insurer] = (counts[r.insurer] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, []);

  // Chart data - Product split
  const productData = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_PRODUCTS.forEach(r => { counts[r.product] = (counts[r.product] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, []);

  const hasFilters = search || insurerFilter !== "All" || productFilter !== "All" || adviserGroupFilter !== "All" || dateFilter !== "All" || reconciledFilter !== "all";

  // Unique values for filters
  const uniqueInsurers = [...new Set(MOCK_PRODUCTS.map(r => r.insurer))].sort();
  const uniqueProducts = [...new Set(MOCK_PRODUCTS.map(r => r.product))].sort();
  const uniqueAdviserGroups = [...new Set(MOCK_PRODUCTS.map(r => r.adviserGroup))].sort();

  // Table header component
  const Th = ({ col, isLocked }: { col: ColDef; isLocked?: boolean }) => (
    <th onClick={() => toggleSort(col.key)} style={{ minWidth: col.minWidth }}
      className={"cursor-pointer select-none px-4 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap" + (isLocked ? " sticky left-0 bg-tertiary z-10" : "")}>
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
      case "customer": return (
        <AvatarLabelGroup
          size="md"
          initials={row.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          title={<span className="text-sm font-medium text-primary">{row.clientName}</span>}
          subtitle={<span className="text-sm text-tertiary">{row.clientEmail}</span>}
        />
      );
      case "policyId": return <span className="text-sm text-brand-secondary font-medium">{row.policyId}</span>;
      case "insurer": return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
            {row.insurer.slice(0, 2)}
          </div>
          <span className="text-sm text-secondary">{row.insurer}</span>
        </div>
      );
      case "product": return (
        <BadgeWithDot type="pill-color" color="gray" size="sm">
          {row.product}
        </BadgeWithDot>
      );
      case "commenced": return <span className="text-sm text-secondary">{row.commenced}</span>;
      case "premiumAnnual": return <span className="text-sm text-secondary font-medium">${row.premiumAnnual.toLocaleString()}</span>;
      case "frequency": return <span className="text-sm text-secondary">{row.frequency}</span>;
      case "renewDate": return <span className="text-sm text-secondary">{row.renewDate}</span>;
      case "adviser": return <span className="text-sm text-secondary">{row.adviser}</span>;
      case "adviserGroup": return <span className="text-sm text-secondary truncate block max-w-[180px]">{row.adviserGroup}</span>;
      default: return <span className="text-sm text-secondary">—</span>;
    }
  }

  // Download CSV
  function downloadCSV() {
    const headers = visibleCols.map((c: ColDef) => c.label);
    const rows = filtered.map((r: InsuranceProduct) => visibleCols.map((c: ColDef) => String((r as unknown as Record<string, unknown>)[c.key] ?? "")));
    const csv = [headers.join(","), ...rows.map((row: string[]) => row.join(","))].join("\n");
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
        {/* ── Header with Filters ── */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-5">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>Insurance Products</h1>
              <p className="text-sm text-tertiary mt-1">{MOCK_PRODUCTS.length.toLocaleString()} policies · ${totalPremium.toLocaleString()} total premium</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={insurerFilter} onChange={e => { setInsurerFilter(e.target.value); setPage(1); }} 
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand-primary cursor-pointer">
                <option value="All">All Insurers</option>
                {uniqueInsurers.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={productFilter} onChange={e => { setProductFilter(e.target.value); setPage(1); }} 
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand-primary cursor-pointer">
                <option value="All">All Products</option>
                {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={adviserGroupFilter} onChange={e => { setAdviserGroupFilter(e.target.value); setPage(1); }} 
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand-primary cursor-pointer">
                <option value="All">All Adviser Groups</option>
                {uniqueAdviserGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} 
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand-primary cursor-pointer">
                <option value="All">All Dates</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="thisYear">This year</option>
                <option value="lastYear">Last year</option>
              </select>
            </div>
          </div>

          {/* ── Metric Tiles ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Reconciled - Clickable */}
            <button onClick={() => { setReconciledFilter(reconciledFilter === "reconciled" ? "all" : "reconciled"); setPage(1); }}
              className={"rounded-xl border p-5 text-left transition-all " + (reconciledFilter === "reconciled" ? "border-[#059669] bg-emerald-50 ring-2 ring-emerald-500/20" : "border-secondary bg-primary hover:border-emerald-300 hover:bg-emerald-50/50")}>
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="size-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-700">Reconciled</span>
              </div>
              <p className="text-3xl font-bold text-primary">{reconciledCount.toLocaleString()}</p>
              <p className="text-sm text-tertiary mt-1">${reconciledPremium.toLocaleString()} premium</p>
            </button>

            {/* Unreconciled - Clickable */}
            <button onClick={() => { setReconciledFilter(reconciledFilter === "unreconciled" ? "all" : "unreconciled"); setPage(1); }}
              className={"rounded-xl border p-5 text-left transition-all " + (reconciledFilter === "unreconciled" ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20" : "border-secondary bg-primary hover:border-amber-300 hover:bg-amber-50/50")}>
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="size-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-amber-700">Unreconciled</span>
              </div>
              <p className="text-3xl font-bold text-primary">{unreconciledCount.toLocaleString()}</p>
              <p className="text-sm text-tertiary mt-1">${unreconciledPremium.toLocaleString()} premium</p>
            </button>

            {/* Total Premium */}
            <div className="rounded-xl border border-secondary bg-primary p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-[#D34108]/10 flex items-center justify-center">
                  <svg className="size-5 text-[#D34108]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-secondary">Total Premium</span>
              </div>
              <p className="text-3xl font-bold text-primary">${totalPremium.toLocaleString()}</p>
              <p className="text-sm text-tertiary mt-1">Annual value</p>
            </div>

            {/* Est. Trail Commission */}
            <div className="rounded-xl border border-secondary bg-primary p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="size-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-secondary">Est. Trail (20%)</span>
              </div>
              <p className="text-3xl font-bold text-primary">${Math.round(totalPremium * 0.2).toLocaleString()}</p>
              <p className="text-sm text-tertiary mt-1">Commission P.A.</p>
            </div>
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insurer Split - Donut Chart */}
            <div className="rounded-xl border border-secondary bg-primary p-5">
              <h3 className="text-sm font-semibold text-primary mb-2">Insurer Split</h3>
              <p className="text-xs text-tertiary mb-4">Distribution of policies by insurer</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={insurerData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="45%" 
                      outerRadius={70} 
                      innerRadius={45}
                      paddingAngle={2}
                    >
                      {insurerData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [Number(value).toLocaleString() + " policies", ""]} 
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
                      formatter={(value) => <span style={{ color: '#374151' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Split - Bar Chart */}
            <div className="rounded-xl border border-secondary bg-primary p-5">
              <h3 className="text-sm font-semibold text-primary mb-2">Product Split</h3>
              <p className="text-xs text-tertiary mb-4">Policies by product type</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={110} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value) => [Number(value).toLocaleString() + " policies", ""]} 
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: 'rgba(211, 65, 8, 0.05)' }}
                    />
                    <Bar dataKey="value" fill="#D34108" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search & Actions Bar ── */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-quaternary pointer-events-none" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder="Search by name, policy ID, or adviser..."
              className="w-full rounded-lg border border-secondary bg-primary pl-9 pr-8 py-2 text-sm text-primary placeholder:text-quaternary outline-none focus:border-brand-primary" 
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-quaternary hover:text-secondary">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {hasFilters && (
              <button 
                onClick={() => { setSearch(""); setInsurerFilter("All"); setProductFilter("All"); setAdviserGroupFilter("All"); setDateFilter("All"); setReconciledFilter("all"); setPage(1); }} 
                className="text-sm text-brand-secondary hover:underline"
              >
                Clear filters
              </button>
            )}
            <button onClick={downloadCSV} className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt transition-colors">
              <Download01 className="size-4" />
              Export CSV
            </button>
            <div className="relative">
              <button onClick={() => setColPanelOpen(v => !v)}
                className={"inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " + (colPanelOpen ? "border-brand-primary bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-secondary_alt")}>
                <Settings04 className="size-4" />
                Columns
                <span className="rounded-full bg-brand-solid text-white text-[10px] font-semibold px-1.5 py-0.5">{visibleCols.length}</span>
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
                  {visibleCols.map((col: ColDef, idx: number) => <Th key={col.key} col={col} isLocked={idx === 0} />)}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {pageRows.length === 0
                  ? <tr><td colSpan={visibleCols.length} className="px-4 py-16 text-center text-sm text-quaternary">No products found</td></tr>
                  : pageRows.map(row => (
                    <tr key={row.id} className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                      {visibleCols.map((col: ColDef, idx: number) => (
                        <td key={col.key} className={"px-4 py-3" + (idx === 0 ? " sticky left-0 bg-primary group-hover:bg-secondary_alt z-10" : "")}>{renderCell(row, col.key)}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-tertiary">
                Showing <span className="font-medium text-secondary">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-secondary">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-medium text-secondary">{filtered.length}</span> results
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} 
                  className="px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary_alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} 
                    className={"size-8 rounded-lg text-sm font-medium transition-colors " + (p === page ? "bg-brand-solid text-white" : "text-secondary hover:bg-secondary_alt")}>
                    {p}
                  </button>
                ))}
                {totalPages > 7 && <span className="px-2 text-tertiary">...</span>}
                {totalPages > 7 && (
                  <button onClick={() => setPage(totalPages)} 
                    className={"size-8 rounded-lg text-sm font-medium transition-colors " + (page === totalPages ? "bg-brand-solid text-white" : "text-secondary hover:bg-secondary_alt")}>
                    {totalPages}
                  </button>
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} 
                  className="px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary_alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      {colPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setColPanelOpen(false)} />}
    </div>
  );
}
