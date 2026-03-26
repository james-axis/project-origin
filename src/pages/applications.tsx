import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01, X, Settings01, DotsGrid, Check, Lock01 } from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
type AppStatus = 0 | 1;

interface Application {
  id: number;
  customer: string;
  assignedTo: string;
  adviser: string;
  policyId: string;
  type: string;
  company: string;
  status: AppStatus;
  statusLabel: string;
  nextFollowUp: string | null;
  submitted: string | null;
  premium: number;
  commission: number;
  lastAction: string;
  lastActionTime: string | null;
}

// ─── Column definitions ───────────────────────────────────────────────────────
interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }

const APP_COLS: ColDef[] = [
  { key: "customer",      label: "Customer",        defaultVisible: true,  minWidth: 160 },
  { key: "assignedTo",    label: "Assigned To",     defaultVisible: true  },
  { key: "adviser",       label: "Adviser",         defaultVisible: false },
  { key: "policyId",      label: "Policy ID",       defaultVisible: true  },
  { key: "type",          label: "Type",            defaultVisible: true,  minWidth: 160 },
  { key: "company",       label: "Company",         defaultVisible: true  },
  { key: "status",        label: "Status",          defaultVisible: true,  minWidth: 200 },
  { key: "premium",       label: "Premium",         defaultVisible: false },
  { key: "commission",    label: "Commission",      defaultVisible: false },
  { key: "nextFollowUp",  label: "Next Follow Up",  defaultVisible: true  },
  { key: "submitted",     label: "Submitted",       defaultVisible: true  },
  { key: "lastActionTime",label: "Last Action",     defaultVisible: false },
];

const STORE_KEY = "axis_apps_cols_v1";

function loadColState(defs: ColDef[]) {
  try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch {}
  return { order: defs.map((c: ColDef) => c.key), visible: Object.fromEntries(defs.map((c: ColDef) => [c.key, c.defaultVisible])) };
}
function saveColState(s: { order: string[]; visible: Record<string, boolean> }) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

// ─── Mock data seeded from real DB ────────────────────────────────────────────
const MOCK_APPS: Application[] = [
  { id:18142, customer:"Mr Jawed Jamshedi",         assignedTo:"Kam R",        adviser:"Kam Rowshan",    policyId:"",                type:"Life, Trauma and TPD",     company:"Acenda",    status:0, statusLabel:"Add Policy/ Application Number, Complete...", nextFollowUp:"23/03/2026", submitted:"23/03/2026", premium:1542.84, commission:925.70, lastAction:"Email sent",                       lastActionTime:"23/03/2026 21:05" },
  { id:18141, customer:"Mr Hendrick Vermazen",      assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"",                type:"IP, Life and TPD",         company:"NEOS",      status:0, statusLabel:"Add Policy/ Application Number, Complete...", nextFollowUp:"23/03/2026", submitted:"23/03/2026", premium:2100.00, commission:1260.00,lastAction:"New Task: Upload Face to Face", lastActionTime:"23/03/2026 21:06" },
  { id:18140, customer:"Mr Nick Manesh",            assignedTo:"Sumeet W",     adviser:"Sumeet Wadhwa",  policyId:"#PN20000103336",  type:"Life, Trauma and TPD",     company:"MetLife",   status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"23/03/2026", submitted:"23/03/2026", premium:3200.00, commission:1920.00,lastAction:"Email sent",                       lastActionTime:"23/03/2026 21:06" },
  { id:18139, customer:"Mr Dittesh Tandon",         assignedTo:"Jas C",        adviser:"Jas Cheema",     policyId:"#85058492",       type:"Life and TPD",             company:"OnePath",   status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"23/03/2026", submitted:"23/03/2026", premium:1800.00, commission:1080.00,lastAction:"Completed: Send email to Client",  lastActionTime:"23/03/2026 19:56" },
  { id:18138, customer:"Mr Hannes Stevenson",       assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"",                type:"Life Insurance",           company:"TAL",       status:0, statusLabel:"Add Policy/ Application Number, Complete...", nextFollowUp:"23/03/2026", submitted:"23/03/2026", premium:980.00,  commission:588.00, lastAction:"New Task: Upload Face to Face", lastActionTime:"23/03/2026 18:05" },
  { id:18137, customer:"Mr TROY (Troy) ROOS",       assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"",                type:"IP, Life and TPD",         company:"Encompass", status:0, statusLabel:"Add Policy/ Application Number, Complete...", nextFollowUp:"21/03/2026", submitted:"21/03/2026", premium:4429.54, commission:2657.72,lastAction:"New Task: Upload Face to Face", lastActionTime:"22/03/2026 03:24" },
  { id:18136, customer:"Rajimol Lakshmanan",        assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"#15528347",       type:"IP, Life, Trauma and TPD", company:"NEOS",      status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"23/03/2026", submitted:"22/03/2026", premium:2340.00, commission:1404.00,lastAction:"Completed: Send email to Client",  lastActionTime:"23/03/2026 10:00" },
  { id:18135, customer:"Anne-marie Ryan",           assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"#115496280",      type:"IP, Life and TPD",         company:"NEOS",      status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"23/03/2026", submitted:"21/03/2026", premium:1760.00, commission:1056.00,lastAction:"Email sent",                       lastActionTime:"23/03/2026 08:30" },
  { id:18134, customer:"Tom Clout",                 assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"#62665",          type:"IP, Life, Trauma and TPD", company:"ClearView", status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"23/03/2026", submitted:"23/03/2026", premium:2890.00, commission:1734.00,lastAction:"Email sent",                       lastActionTime:"23/03/2026 07:15" },
  { id:18133, customer:"Miss Felicity Jeresano",    assignedTo:"Hope L",       adviser:"Hope L",         policyId:"",                type:"IP and Life",              company:"Zurich",    status:0, statusLabel:"Add Policy/ Application Number, Complete...", nextFollowUp:"20/03/2026", submitted:"20/03/2026", premium:1200.00, commission:720.00, lastAction:"New Task: Upload Face to Face", lastActionTime:"20/03/2026 14:00" },
  { id:18132, customer:"Ms Maddison Jane (Maddi) Gay",assignedTo:"SLG Support",adviser:"SLG Support",   policyId:"#1174841977",     type:"Life and Trauma",          company:"Zurich",    status:0, statusLabel:"CHECK ZURICH ADVISER CODE USED - CHANGE...",  nextFollowUp:"23/03/2026", submitted:"22/03/2026", premium:890.00,  commission:534.00, lastAction:"SMS sent",                        lastActionTime:"23/03/2026 09:45" },
  { id:18131, customer:"Mr Adrian Test",            assignedTo:"Adrian R",     adviser:"Adrian R",       policyId:"#12344444444",    type:"Life Insurance",           company:"AIA",       status:0, statusLabel:"Add Policy/ Application Number, Complete...", nextFollowUp:"23/03/2026", submitted:"23/03/2026", premium:650.00,  commission:390.00, lastAction:"Email sent",                       lastActionTime:"23/03/2026 11:00" },
  { id:18130, customer:"Mrs Pawanjeet Kaur",        assignedTo:"Jas C",        adviser:"Jas Cheema",     policyId:"#91301307",       type:"Life and TPD",             company:"Zurich",    status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"22/03/2026", submitted:"22/03/2026", premium:2100.00, commission:1260.00,lastAction:"Email sent",                       lastActionTime:"22/03/2026 16:30" },
  { id:18129, customer:"Dr Tarini Natalie Fernando",assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"#Q73188331",      type:"IP, Life, Child, Trauma",  company:"TAL",       status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"22/03/2026", submitted:"22/03/2026", premium:3400.00, commission:2040.00,lastAction:"Completed: Input Insurance Amounts",lastActionTime:"22/03/2026 15:00" },
  { id:18128, customer:"Mr Prasanna Jerome Ratnakanthan",assignedTo:"SLG Support",adviser:"SLG Support",policyId:"#Q73177331",      type:"Life, Trauma and TPD",     company:"TAL",       status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"22/03/2026", submitted:"22/03/2026", premium:1980.00, commission:1188.00,lastAction:"Email sent",                       lastActionTime:"22/03/2026 12:00" },
  { id:18127, customer:"Siliani (Julie) Mapusua",   assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"#115527495",      type:"IP, Life and TPD",         company:"NEOS",      status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"21/03/2026", submitted:"21/03/2026", premium:2450.00, commission:1470.00,lastAction:"Email sent",                       lastActionTime:"21/03/2026 10:00" },
  { id:18126, customer:"Mr Jake Smith",             assignedTo:"SLG Support",  adviser:"SLG Support",    policyId:"#RQ10000249665",  type:"IP, Life and TPD",         company:"MetLife",   status:0, statusLabel:"Complete application in CRM by Pressing...", nextFollowUp:"20/03/2026", submitted:"20/03/2026", premium:1670.00, commission:1002.00,lastAction:"Email sent",                       lastActionTime:"20/03/2026 16:00" },
  // Closed
  { id:17900, customer:"Mrs Kirsty Kitchener",      assignedTo:"Maysee Chang", adviser:"Maysee Chang",   policyId:"#AIA-2024-9912",  type:"Life and TPD",             company:"AIA",       status:1, statusLabel:"Inforce",                                    nextFollowUp:null,          submitted:"15/01/2026", premium:2200.00, commission:1320.00,lastAction:"Policy inforce confirmed",        lastActionTime:"20/01/2026 09:00" },
  { id:17850, customer:"Mr Welyton Santos",         assignedTo:"Justin Turtle",adviser:"Justin Turtle",  policyId:"#ZUR-2025-4421",  type:"Life, Trauma and TPD",     company:"Zurich",    status:1, statusLabel:"Inforce",                                    nextFollowUp:null,          submitted:"10/12/2025", premium:3669.48, commission:2201.69,lastAction:"Commission received",             lastActionTime:"15/01/2026 10:00" },
];

const USERS = ["Kam R","SLG Support","Sumeet W","Jas C","Hope L","Adrian R","Maysee Chang","Justin Turtle"];
const COMPANIES = ["Acenda","NEOS","MetLife","OnePath","TAL","Encompass","ClearView","Zurich","AIA"];
const APP_TYPES = ["Life Insurance","Life and TPD","Life, Trauma and TPD","IP, Life and TPD","IP, Life, Trauma and TPD","IP and Life","Life and Trauma","IP, Life, Child, Trauma"];

const STATUS_ACTIVE_COLOR = "#1C1C24";
const STATUS_CLOSED_COLOR = "#3B485B";

const PAGE_SIZE = 20;

// ─── Column panel ─────────────────────────────────────────────────────────────
function ColumnPanel({ defs, order, visible, onToggle, onReorder, onClose }: {
  defs: ColDef[]; order: string[]; visible: Record<string, boolean>;
  onToggle: (k: string) => void; onReorder: (o: string[]) => void; onClose: () => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const ordered: ColDef[] = [];
  for (const k of order) {
    const found = defs.find((d: ColDef): boolean => d.key === k);
    if (found) ordered.push(found);
  }

  function onDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...order]; const [m] = next.splice(dragIdx.current, 1); next.splice(i, 0, m);
    onReorder(next); dragIdx.current = null; setDragOver(null);
  }

  return (
    <div className="absolute right-0 top-10 z-50 w-60 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary">
        <p className="text-xs font-semibold text-primary">Columns</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onReorder(defs.map(d => d.key))} className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose} className="text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>
        </div>
      </div>
      <p className="text-[10px] text-quaternary px-3 pt-2 pb-1">Drag to reorder · toggle to show/hide</p>
      <ul className="max-h-72 overflow-y-auto py-1">
        {ordered.map((col, i) => (
          <li key={col.key} draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragEnter={() => setDragOver(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(i)}
            onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
            className={"flex items-center gap-2.5 px-3 py-2 cursor-grab select-none transition-colors " + (dragOver === i ? "bg-brand-secondary" : "hover:bg-secondary_alt")}>
            <DotsGrid className="size-3.5 text-quaternary shrink-0" />
            <button onClick={() => onToggle(col.key)}
              className={"flex size-4 shrink-0 items-center justify-center rounded transition-colors " + (visible[col.key] ? "bg-brand-solid" : "border border-secondary bg-primary")}>
              {visible[col.key] && <Check className="size-2.5 text-white" />}
            </button>
            <span className={"text-xs " + (visible[col.key] ? "text-primary font-medium" : "text-quaternary")}>{col.label}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-secondary px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] text-quaternary">{ordered.filter(c => visible[c.key]).length}/{ordered.length} visible</span>
        <button onClick={onClose} className="text-[10px] font-medium text-brand-secondary hover:underline">Done</button>
      </div>
    </div>
  );
}

// ─── ApplicationsPage ─────────────────────────────────────────────────────────
export function ApplicationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active"|"closed">("active");
  const [search, setSearch] = useState("");
  const [adviserFilter, setAdviserFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [colState, setColStateRaw] = useState(() => loadColState(APP_COLS));
  const LOCKED_COL = "customer"; // Always first, not draggable

  function updateCols(next: typeof colState) { setColStateRaw(next); saveColState(next); }
  function toggleCol(key: string) { if (key === LOCKED_COL) return; updateCols({ ...colState, visible: { ...colState.visible, [key]: !colState.visible[key] } }); }
  function reorderCols(order: string[]) { updateCols({ ...colState, order }); }

  // Build visibleCols with locked column always first
  const visibleCols: ColDef[] = [];
  const lockedCol = APP_COLS.find((c: ColDef) => c.key === LOCKED_COL);
  if (lockedCol) visibleCols.push(lockedCol);
  for (const k of colState.order) {
    if (k === LOCKED_COL) continue;
    const col = APP_COLS.find((c: ColDef) => c.key === k);
    if (col && colState.visible[col.key]) visibleCols.push(col);
  }

  const filtered = useMemo(() => {
    let rows = MOCK_APPS.filter(r => tab === "active" ? r.status === 0 : r.status === 1);
    if (search) { const q = search.toLowerCase(); rows = rows.filter(r => r.customer.toLowerCase().includes(q) || String(r.id).includes(q) || r.company.toLowerCase().includes(q) || r.policyId.toLowerCase().includes(q)); }
    if (adviserFilter !== "All") rows = rows.filter(r => r.assignedTo === adviserFilter);
    if (companyFilter !== "All") rows = rows.filter(r => r.company === companyFilter);
    if (typeFilter    !== "All") rows = rows.filter(r => r.type === typeFilter);
    return [...rows].sort((a, b) => {
      const va = String((a as any)[sortKey] ?? "");
      const vb = String((b as any)[sortKey] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
    });
  }, [tab, search, adviserFilter, companyFilter, typeFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function toggleSort(key: string) { if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } setPage(1); }
  function toggleRow(id: number) { setSelectedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { if (selectedRows.size === pageRows.length) setSelectedRows(new Set()); else setSelectedRows(new Set(pageRows.map(r => r.id))); }

  function downloadCSV() {
    const csv = [visibleCols.map((c: ColDef) => c.label).join(","), ...filtered.map(r => visibleCols.map((c: ColDef) => `"${String((r as any)[c.key] ?? "").replace(/"/g,'""')}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = `applications-${tab}-${Date.now()}.csv`; a.click();
  }

  const Th = ({ col, isLocked }: { col: ColDef; isLocked?: boolean }) => (
    <th onClick={() => toggleSort(col.key)} style={{ minWidth: col.minWidth }}
      draggable={!isLocked} onDragStart={e => { if (isLocked) { e.preventDefault(); return; } e.dataTransfer.setData("text/plain", col.key); }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault(); if (isLocked) return; const from = e.dataTransfer.getData("text/plain");
        if (!from || from === col.key || from === LOCKED_COL) return;
        const o = [...colState.order]; const fi = o.indexOf(from); const ti = o.indexOf(col.key);
        if (fi < 0 || ti < 0) return; o.splice(fi, 1); o.splice(ti, 0, from); reorderCols(o);
      }}
      className={"cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap group/th" + (isLocked ? " sticky left-10 bg-tertiary z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]" : "")}>
      <span className="inline-flex items-center gap-1.5">
        {isLocked ? <Lock01 className="size-3 text-fg-quaternary shrink-0" /> : <DotsGrid className="size-3 opacity-0 group-hover/th:opacity-50 transition-opacity cursor-grab shrink-0" />}
        {col.label}
        <svg className={"size-3 " + (sortKey === col.key ? "opacity-100" : "opacity-20")} viewBox="0 0 10 12" fill="currentColor">
          <path d="M5 1l4 5H1z" opacity={sortDir==="asc"&&sortKey===col.key?"1":"0.4"}/>
          <path d="M5 11l-4-5h8z" opacity={sortDir==="desc"&&sortKey===col.key?"1":"0.4"}/>
        </svg>
      </span>
    </th>
  );

  function renderCell(row: Application, key: string) {
    switch (key) {
      case "customer": return <span className="font-medium text-primary hover:underline">{row.customer}</span>;
      case "status":   return <span className="text-xs text-secondary">{row.statusLabel}</span>;
      case "premium":  return <span className="text-xs text-secondary">${row.premium.toLocaleString()}</span>;
      case "commission":return <span className="text-xs text-secondary">${row.commission.toLocaleString()}</span>;
      case "type":     return <span className="text-xs text-secondary">{row.type}</span>;
      case "company":  return <span className="text-xs text-secondary">{row.company}</span>;
      default: return <span className="text-xs text-secondary">{String((row as any)[key] ?? "—")}</span>;
    }
  }

  const totalValue = filtered.reduce((s, r) => s + r.premium, 0);
  const totalCommission = filtered.reduce((s, r) => s + r.commission, 0);
  const hasFilters = search || adviserFilter !== "All" || companyFilter !== "All" || typeFilter !== "All";

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">
        {/* ── Header ── */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{ fontFamily:"'Metrophobic', sans-serif" }}>Applications</h1>
              <p className="text-sm text-tertiary mt-0.5">{filtered.length} records · Total value: <span className="font-medium text-primary">${totalValue.toLocaleString()}</span> · Commission: <span className="font-medium text-primary">${totalCommission.toLocaleString()}</span></p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={adviserFilter} onChange={e => { setAdviserFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer min-w-[110px]">
                <option value="All">Adviser</option>{USERS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={adviserFilter} onChange={e => { setAdviserFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer min-w-[110px]">
                <option value="All">Admin</option>{USERS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={companyFilter} onChange={e => { setCompanyFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer min-w-[110px]">
                <option value="All">Company</option>{COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer min-w-[120px]">
                <option value="All">App Type</option>{APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer min-w-[100px]">
                <option value="All">Status</option>
                <option value="0">Active</option>
                <option value="1">Closed</option>
              </select>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-0 -mb-px">
            {([{ key:"active", label:"Active Applications", count: MOCK_APPS.filter(r=>r.status===0).length }, { key:"closed", label:"Closed Applications", count: MOCK_APPS.filter(r=>r.status===1).length }] as const).map(({ key, label, count }) => (
              <button key={key} onClick={() => { setTab(key); setPage(1); setSelectedRows(new Set()); }}
                className={"flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (tab===key ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                {label}
                <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (tab===key ? "bg-brand-solid text-white" : "bg-secondary text-quaternary")}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search applications..."
              className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-8 py-2 text-sm text-primary outline-none focus:border-brand" />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>}
          </div>
          {selectedRows.size > 0 && (
            <>
              <span className="text-sm text-secondary font-medium">{selectedRows.size} selected</span>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs font-medium text-secondary hover:bg-secondary">Assign To ▾</button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs font-medium text-secondary hover:bg-secondary">Set Status ▾</button>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            {hasFilters && <button onClick={() => { setSearch(""); setAdviserFilter("All"); setCompanyFilter("All"); setTypeFilter("All"); setStatusFilter("All"); setPage(1); }} className="text-sm text-brand-secondary hover:underline">Clear filters</button>}
            <button onClick={downloadCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary">
              <Download01 className="size-4 text-success-primary" />Download CSV
            </button>
            <div className="relative">
              <button onClick={() => setColPanelOpen(v => !v)}
                className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " + (colPanelOpen ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-secondary")}>
                <Settings01 className="size-4" />Columns
                <span className="rounded-full bg-brand-solid text-white text-[10px] font-semibold px-1.5 py-0.5">{visibleCols.length}/{APP_COLS.length}</span>
              </button>
              {colPanelOpen && <ColumnPanel defs={APP_COLS} order={colState.order} visible={colState.visible} onToggle={toggleCol} onReorder={reorderCols} onClose={() => setColPanelOpen(false)} />}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-tertiary border-b border-secondary">
                <tr>
                  <th className="px-3 py-3 w-10 sticky left-0 bg-tertiary z-10">
                    <input type="checkbox" checked={selectedRows.size===pageRows.length&&pageRows.length>0} onChange={toggleAll} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                  </th>
                  {visibleCols.map((col: ColDef, idx: number) => <Th key={col.key} col={col} isLocked={idx === 0} />)}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {pageRows.length === 0
                  ? <tr><td colSpan={visibleCols.length+1} className="px-4 py-16 text-center text-sm text-quaternary">No applications found</td></tr>
                  : pageRows.map(row => (
                    <tr key={row.id} onClick={() => navigate(`/application/${row.id}`)}
                      className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 sticky left-0 bg-primary group-hover:bg-secondary_alt z-10" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                      </td>
                      {visibleCols.map((col: ColDef, idx: number) => <td key={col.key} className={"px-3 py-2.5" + (idx === 0 ? " sticky left-10 bg-primary group-hover:bg-secondary_alt z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]" : "")}>{renderCell(row, col.key)}</td>)}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-quaternary">Pages:</span>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">← Prev</button>
              {Array.from({length:Math.min(totalPages,10)},(_,i)=>i+1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={"size-7 rounded text-xs font-medium " + (p===page?"bg-brand-solid text-white":"text-quaternary hover:bg-secondary")}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">Next »</button>
            </div>
          )}
          <p className="text-xs text-quaternary mt-2 px-1">{filtered.length} records · {visibleCols.length} of {APP_COLS.length} columns</p>
        </div>
      </main>
      {colPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setColPanelOpen(false)} />}
    </div>
  );
}
