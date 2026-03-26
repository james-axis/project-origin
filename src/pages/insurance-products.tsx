import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { X, Lock01, SearchMd, Upload01, DotsVertical } from "@untitledui/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
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
  premiumInstalment: number;
  frequency: string;
  renewDate: string;
  adviser: string;
  adviserGroup: string;
  reconciled: boolean;
  progress: number;
  status: "Active" | "Pending" | "Lapsed";
  avatarUrl?: string;
}

// ─── Column definitions ───────────────────────────────────────────────────────
interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }

const PRODUCT_COLS: ColDef[] = [
  { key: "customer",         label: "Customer",          defaultVisible: true,  minWidth: 200 },
  { key: "status",           label: "Status",            defaultVisible: true },
  { key: "enrolled",         label: "Enrolled",          defaultVisible: true },
  { key: "progress",         label: "Progress",          defaultVisible: true, minWidth: 150 },
  { key: "insurer",          label: "Insurer",           defaultVisible: true },
  { key: "product",          label: "Product",           defaultVisible: true },
  { key: "premiumAnnual",    label: "Premium (ann.)",    defaultVisible: true },
  { key: "adviser",          label: "Adviser",           defaultVisible: true },
];

const STORE_KEY = "axis_insurance_cols_v2";
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

const MOCK_PRODUCTS: InsuranceProduct[] = Array.from({ length: 240 }, (_, i) => {
  const insurer = randomPick(INSURERS);
  const client = randomPick(CLIENTS);
  const premium = Math.floor(Math.random() * 30000) + 500;
  const instalment = Math.random() > 0.4 ? Math.floor(premium / 12 * (0.9 + Math.random() * 0.2)) : 0;
  const reconciled = Math.random() > 0.15;
  const statuses: InsuranceProduct["status"][] = ["Active", "Pending", "Lapsed"];
  return {
    id: 1000 + i,
    insurer,
    policyId: `#0${3100000 + Math.floor(Math.random() * 200000)}`,
    clientName: client.name,
    clientEmail: client.email,
    product: randomPick(PRODUCTS),
    commenced: randomDate(2020, 2024),
    premiumAnnual: premium,
    premiumInstalment: instalment,
    frequency: randomPick(FREQUENCIES),
    renewDate: randomDate(2026, 2027),
    adviser: randomPick(ADVISERS),
    adviserGroup: randomPick(ADVISER_GROUPS),
    reconciled,
    progress: Math.floor(Math.random() * 100),
    status: reconciled ? "Active" : randomPick(statuses),
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

// ─── Main Component ───────────────────────────────────────────────────────────
export function InsuranceProductsPage() {
  const navigate = useNavigate();
  const PAGE_SIZE = 15;

  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "monitored" | "unmonitored">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Column state
  const [colState, setColState] = useState(() => loadColState(PRODUCT_COLS));
  const [colPanelOpen, setColPanelOpen] = useState(false);
  function updateCols(s: typeof colState) { setColState(s); saveColState(s); }
  function toggleCol(key: string) { if (key === LOCKED_COL) return; updateCols({ ...colState, visible: { ...colState.visible, [key]: !colState.visible[key] } }); }
  function reorderCols(order: string[]) { updateCols({ ...colState, order }); }

  // Sorting
  const [sortKey, setSortKey] = useState<string>("clientName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  // Filter & sort data
  const filtered = useMemo(() => {
    let rows = MOCK_PRODUCTS;
    if (activeTab === "monitored") rows = rows.filter(r => r.reconciled);
    if (activeTab === "unmonitored") rows = rows.filter(r => !r.reconciled);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => r.clientName.toLowerCase().includes(s) || r.clientEmail.toLowerCase().includes(s) || r.adviser.toLowerCase().includes(s));
    }
    return [...rows].sort((a, b) => {
      const va = String((a as unknown as Record<string, unknown>)[sortKey] ?? "");
      const vb = String((b as unknown as Record<string, unknown>)[sortKey] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
    });
  }, [activeTab, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Visible columns
  const visibleCols = useMemo(() => colState.order.filter((k: string) => colState.visible[k]).map((k: string) => PRODUCT_COLS.find((c: ColDef) => c.key === k)!).filter(Boolean), [colState]);

  // Metrics
  const totalPolicies = MOCK_PRODUCTS.length;
  const monitoredCount = MOCK_PRODUCTS.filter(r => r.reconciled).length;
  const unmonitoredCount = MOCK_PRODUCTS.filter(r => !r.reconciled).length;
  const monitoredPercentage = Math.round((monitoredCount / totalPolicies) * 100);

  // Chart data - Monthly breakdown (stacked bar)
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map(month => ({
      month,
      active: Math.floor(Math.random() * 40) + 20,
      pending: Math.floor(Math.random() * 30) + 10,
      lapsed: Math.floor(Math.random() * 20) + 5,
    }));
  }, []);

  const hasFilters = search || activeTab !== "all";

  // Status badge color mapping - using brand-approved colors only
  const getStatusBadgeColor = (status: InsuranceProduct["status"]): "brand" | "warning" | "gray" => {
    switch (status) {
      case "Active": return "brand";
      case "Pending": return "warning";
      case "Lapsed": return "gray";
      default: return "gray";
    }
  };

  // Table header component
  const Th = ({ col, isLocked }: { col: ColDef; isLocked?: boolean }) => (
    <th onClick={() => toggleSort(col.key)} style={{ minWidth: col.minWidth }}
      className={"cursor-pointer select-none px-4 py-3 text-left text-xs font-medium text-tertiary hover:text-secondary whitespace-nowrap" + (isLocked ? " sticky left-0 bg-tertiary z-10" : "")}>
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
          src={row.avatarUrl}
          initials={row.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          title={<span className="text-sm font-medium text-primary">{row.clientName}</span>}
          subtitle={<span className="text-sm text-tertiary">{row.clientEmail}</span>}
        />
      );
      case "status": return (
        <BadgeWithDot type="pill-color" color={getStatusBadgeColor(row.status)} size="sm">
          {row.status}
        </BadgeWithDot>
      );
      case "enrolled": return <span className="text-sm text-secondary">{row.commenced}</span>;
      case "progress": return (
        <ProgressBar 
          value={row.progress} 
          labelPosition="right" 
          className="min-w-[100px]"
          progressClassName="bg-[#1C1C24]"
        />
      );
      case "insurer": return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
            {row.insurer.slice(0, 2)}
          </div>
          <span className="text-sm text-secondary">{row.insurer}</span>
        </div>
      );
      case "product": return <span className="text-sm text-secondary">{row.product}</span>;
      case "premiumAnnual": return <span className="text-sm text-secondary font-medium">${row.premiumAnnual.toLocaleString()}</span>;
      case "adviser": return <span className="text-sm text-secondary">{row.adviser}</span>;
      default: return <span className="text-sm text-secondary">—</span>;
    }
  }

  // Download CSV
  function downloadCSV() {
    const headers = visibleCols.map((c: ColDef) => c.label);
    const rows = filtered.map((r: InsuranceProduct) => visibleCols.map((c: ColDef) => String((r as unknown as Record<string, unknown>)[c.key] ?? "")));
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
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
        {/* ── Dashboard Cards ── */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Policies Monitored - Half Circle Gauge */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Policies monitored</h3>
                  <p className="text-sm text-tertiary mt-0.5">You're using {monitoredPercentage}% of available spots.</p>
                </div>
                <button className="text-quaternary hover:text-secondary p-1">
                  <DotsVertical className="size-5" />
                </button>
              </div>
              
              <div className="flex flex-col items-center py-4">
                <div className="relative">
                  <ProgressBarHalfCircle
                    value={monitoredPercentage}
                    size="md"
                    label="Total monitored"
                    valueFormatter={() => monitoredCount.toString()}
                  />
                  {/* +X annotation like in inspiration */}
                  <span className="absolute top-1/2 right-0 translate-x-2 -translate-y-6 text-sm font-semibold text-brand-primary">
                    +{Math.floor(Math.random() * 5) + 1}
                  </span>
                </div>
                {monitoredPercentage > 75 && (
                  <p className="mt-4 text-sm font-medium text-primary">You've almost reached your limit</p>
                )}
                <p className="text-sm text-tertiary mt-1">
                  <a href="#" className="text-brand-secondary underline hover:no-underline">Upgrade plan</a> to monitor more policies.
                </p>
              </div>
            </div>

            {/* Customer Breakdown - Stacked Bar Chart */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-primary">Customer breakdown</h3>
                <p className="text-sm text-tertiary mt-0.5">Keep track of customers and their ratings.</p>
              </div>
              
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ left: 0, right: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="active" stackId="a" fill="#D34108" name="Active" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pending" stackId="a" fill="#3B485B" name="Pending" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="lapsed" stackId="a" fill="#E5E7EB" name="Lapsed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Customer Movements Section ── */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6">
          <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-secondary">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-primary">Customer movements</h2>
                  <span className="px-2.5 py-0.5 text-xs font-medium text-secondary bg-secondary rounded-full">
                    {monitoredCount} monitored
                  </span>
                </div>
                <button 
                  onClick={downloadCSV}
                  className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary shadow-xs hover:bg-secondary transition-colors"
                >
                  <Upload01 className="size-4" />
                  Import
                </button>
              </div>
            </div>

            {/* Tabs and Search */}
            <div className="px-6 py-4 border-b border-secondary flex items-center justify-between flex-wrap gap-4">
              <ButtonGroup 
                size="sm"
                selectedKeys={[activeTab]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as typeof activeTab;
                  if (selected) {
                    setActiveTab(selected);
                    setPage(1);
                  }
                }}
              >
                <ButtonGroupItem id="all">View all</ButtonGroupItem>
                <ButtonGroupItem id="monitored">Monitored</ButtonGroupItem>
                <ButtonGroupItem id="unmonitored">Unmonitored</ButtonGroupItem>
              </ButtonGroup>

              <div className="relative min-w-[240px]">
                <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search"
                  className="w-full rounded-lg border border-secondary bg-primary pl-10 pr-4 py-2 text-sm text-primary placeholder:text-quaternary outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-tertiary border-b border-secondary">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                    </th>
                    {visibleCols.map((col: ColDef, idx: number) => <Th key={col.key} col={col} isLocked={idx === 0} />)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary bg-primary">
                  {pageRows.length === 0
                    ? <tr><td colSpan={visibleCols.length + 1} className="px-4 py-16 text-center text-sm text-quaternary">No customers found</td></tr>
                    : pageRows.map((row: InsuranceProduct) => (
                      <tr key={row.id} className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                        </td>
                        {visibleCols.map((col: ColDef, idx: number) => (
                          <td key={col.key} className={"px-4 py-3" + (idx === 0 ? " sticky left-0 bg-primary group-hover:bg-secondary_alt z-10" : "")}>
                            {renderCell(row, col.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-secondary flex items-center justify-between">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-secondary border border-secondary rounded-lg hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent transition-colors shadow-xs"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                    <button 
                      key={p} 
                      onClick={() => setPage(p)} 
                      className={"size-9 rounded-lg text-sm font-medium transition-colors " + (p === page ? "bg-secondary text-primary" : "text-tertiary hover:bg-secondary_alt")}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 10 && <span className="px-2 text-tertiary">...</span>}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-secondary border border-secondary rounded-lg hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent transition-colors shadow-xs"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      {colPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setColPanelOpen(false)} />}
    </div>
  );
}
