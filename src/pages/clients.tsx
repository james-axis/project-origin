import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01, X, Settings01, Plus, Check, FilterLines, ChevronDown } from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
type ClientStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Client {
  id: number;
  customer: string;
  status: ClientStatus;
  state: string;
  group: string;
  user: string;
  referrer: string;
  lastActionTime: string | null;
  lastNote: string;
  created: string;
  tags: string[];
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<ClientStatus, { label: string; color: string; tab: string }> = {
  0: { label: "Prospect",              color: "#D34108", tab: "prospects"    },
  1: { label: "In Progress",           color: "#7C3AED", tab: "inprogress"  },
  2: { label: "Scheduled Appointment", color: "#0284C7", tab: "scheduled"   },
  3: { label: "Quote Sent",            color: "#059669", tab: "quotesent"   },
  4: { label: "Application Pending",   color: "#D97706", tab: "apppending"  },
  5: { label: "Client",                color: "#16A34A", tab: "clients"     },
  6: { label: "On Hold",               color: "#64748B", tab: "onhold"      },
  7: { label: "Archive",               color: "#9CA3AF", tab: "archive"     },
};

type TabKey = "active" | "prospects" | "inprogress" | "scheduled" | "quotesent" | "apppending" | "clients" | "onhold" | "archive";

const TABS: { key: TabKey; label: string; statuses: ClientStatus[] | null }[] = [
  { key: "active",     label: "Active",                statuses: [0,1,2,3,4,5,6] },
  { key: "prospects",  label: "Prospects",             statuses: [0]  },
  { key: "inprogress", label: "In Progress",           statuses: [1]  },
  { key: "scheduled",  label: "Scheduled Appointment", statuses: [2]  },
  { key: "quotesent",  label: "Quote Sent",            statuses: [3]  },
  { key: "apppending", label: "Application Pending",   statuses: [4]  },
  { key: "clients",    label: "Clients",               statuses: [5]  },
  { key: "onhold",     label: "On Hold",               statuses: [6]  },
  { key: "archive",    label: "Archive",               statuses: [7]  },
];

// ─── Column definitions ───────────────────────────────────────────────────────
interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }

const CLIENT_COLS: ColDef[] = [
  { key: "id",             label: "ID",               defaultVisible: true,  minWidth: 70 },
  { key: "customer",       label: "Customer",         defaultVisible: true,  minWidth: 180 },
  { key: "status",         label: "Status",           defaultVisible: true  },
  { key: "state",          label: "State",            defaultVisible: true  },
  { key: "group",          label: "Group",            defaultVisible: true,  minWidth: 160 },
  { key: "user",           label: "User",             defaultVisible: true  },
  { key: "referrer",       label: "Referrer",         defaultVisible: true  },
  { key: "lastActionTime", label: "Last Action Time", defaultVisible: true  },
  { key: "lastNote",       label: "Last Note",        defaultVisible: true, minWidth: 200 },
  { key: "created",        label: "Created",          defaultVisible: false },
  { key: "tags",           label: "Tags",             defaultVisible: false },
];

const STORE_KEY = "axis_clients_cols_v1";

function loadColState(defs: ColDef[]) {
  try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch {}
  return { order: defs.map(c => c.key), visible: Object.fromEntries(defs.map(c => [c.key, c.defaultVisible])) };
}
function saveColState(s: { order: string[]; visible: Record<string, boolean> }) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

// ─── Mock data — real IDs/names/statuses from DB ─────────────────────────────
const AU_STATES = ["NSW","VIC","QLD","WA","SA","ACT","TAS","NT"];
const GROUPS = [
  "Surety Insurance Pty Ltd","UFinancial Protect","Surehaven Advisory Pty Ltd",
  "Lockmor Life Insurance","Covered Life","Personal Insurance Options",
  "Realm Life Consulting","Umbrella Insurance Advice Pty Ltd",
  "Hunter Galloway","Armor Insurance Solutions","CH Life",
];
const USERS = [
  "Advice Team","Isaac Dickman","Maysee Chang","John Rojas","Dean Hines",
  "Matthew Wakefield","Justin Turtle","Natasha Carlson","Ami Heyman",
  "Adam Cowburn","Lucas Kenyon","James N",
];
const REFERRERS = ["Mars Hana","Mitchell Wood","Xavier Howard","","","","",""];

function randomPick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(d: number) { return new Date(Date.now() - d * 86400000).toISOString(); }
function hoursAgo(h: number) { return new Date(Date.now() - h * 3600000).toISOString(); }

const MOCK_CLIENTS: Client[] = [
  { id:38658, customer:"Alois Mpisa",            status:0, state:"WA",  group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(1),  tags:[] },
  { id:38657, customer:"Paula Reeves",            status:0, state:"QLD", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(1),  tags:[] },
  { id:38656, customer:"Cirila Borbon",           status:0, state:"QLD", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(1),  tags:[] },
  { id:38654, customer:"Tim Horne",               status:0, state:"QLD", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(1),  tags:[] },
  { id:38652, customer:"Caz Sandringham",         status:0, state:"VIC", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(2),  tags:[] },
  { id:38651, customer:"Tanya Zuv",               status:0, state:"QLD", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(2),  tags:[] },
  { id:38650, customer:"Benito Custodio Jr",      status:0, state:"VIC", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(2),  tags:[] },
  { id:38649, customer:"Luke Milojkovic",         status:0, state:"NSW", group:"UFinancial Protect",             user:"Advice Team",     referrer:"Mars Hana",    lastActionTime:null,               lastNote:"",                                               created:daysAgo(2),  tags:[] },
  { id:38648, customer:"Wendy Nagle",             status:0, state:"NSW", group:"Lockmor Life Insurance",         user:"Matthew Wakefield",referrer:"Mitchell Wood",lastActionTime:null,              lastNote:"",                                               created:daysAgo(2),  tags:[] },
  { id:38647, customer:"Joshua Fuller",           status:0, state:"QLD", group:"UFinancial Protect",             user:"Advice Team",     referrer:"Mars Hana",    lastActionTime:null,               lastNote:"",                                               created:daysAgo(2),  tags:[] },
  { id:38646, customer:"Jake Ash",                status:0, state:"VIC", group:"UFinancial Protect",             user:"Advice Team",     referrer:"Xavier Howard",lastActionTime:null,               lastNote:"",                                               created:daysAgo(2),  tags:[] },
  { id:38644, customer:"Srilekha Thiruvakadu",    status:0, state:"VIC", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(3),  tags:[] },
  { id:38643, customer:"Lisa Battishall",         status:0, state:"NSW", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(3),  tags:[] },
  { id:38642, customer:"Davinder Singh",          status:0, state:"VIC", group:"Surety Insurance Pty Ltd",       user:"Advice Team",     referrer:"",             lastActionTime:null,               lastNote:"",                                               created:daysAgo(3),  tags:[] },
  { id:38641, customer:"Ms Rosa Rindrasari",      status:0, state:"VIC", group:"Surehaven Advisory Pty Ltd",     user:"Isaac Dickman",   referrer:"",             lastActionTime:hoursAgo(48),       lastNote:"",                                               created:daysAgo(3),  tags:[] },
  { id:38640, customer:"Julie Chappell",          status:0, state:"NSW", group:"Surehaven Advisory Pty Ltd",     user:"Isaac Dickman",   referrer:"",             lastActionTime:hoursAgo(49),       lastNote:"",                                               created:daysAgo(3),  tags:[] },
  { id:38639, customer:"Mrs AMANDA RECTOR",       status:0, state:"VIC", group:"Surehaven Advisory Pty Ltd",     user:"Isaac Dickman",   referrer:"",             lastActionTime:hoursAgo(51),       lastNote:"",                                               created:daysAgo(3),  tags:[] },
  { id:38637, customer:"Mr Sam Moaror",           status:0, state:"NSW", group:"Surehaven Advisory Pty Ltd",     user:"Isaac Dickman",   referrer:"",             lastActionTime:hoursAgo(72),       lastNote:"",                                               created:daysAgo(3),  tags:[] },
  { id:38635, customer:"Leanne Vourgaslis",       status:0, state:"VIC", group:"UFinancial Protect",             user:"Advice Team",     referrer:"Xavier Howard",lastActionTime:null,               lastNote:"",                                               created:daysAgo(3),  tags:[] },
  { id:38655, customer:"Mr Ricardo Curioso",      status:3, state:"WA",  group:"Personal Insurance Options",     user:"Ami Heyman",      referrer:"",             lastActionTime:hoursAgo(2),        lastNote:"Life Insurance ($2,000,000) Quote sent ($4277.64)",created:daysAgo(1), tags:["insurance"] },
  { id:38653, customer:"Etienne Gouws",           status:3, state:"WA",  group:"Umbrella Insurance Advice Pty Ltd",user:"Justin Turtle", referrer:"",             lastActionTime:hoursAgo(18),       lastNote:"22/03/2026 First meeting held online. Uploaded to share drive.",created:daysAgo(1), tags:[] },
  { id:38645, customer:"Mr TROY ROOS",            status:3, state:"NSW", group:"Realm Life Consulting",          user:"SLG Support",     referrer:"",             lastActionTime:hoursAgo(44),       lastNote:"Life Insurance ($900,000), TPD Extension ($900,000) and IP ($7,583) Quote sent ($4429.54)",created:daysAgo(2), tags:[] },
  { id:38638, customer:"Mr Ty Woods",             status:2, state:"",    group:"Covered Life",                   user:"Natasha Carlson", referrer:"",             lastActionTime:hoursAgo(36),       lastNote:"New Appointment: Life Insurance Discussion (Ty)",created:daysAgo(3), tags:["scheduled"] },
  { id:38636, customer:"Welyton Santos",          status:3, state:"NSW", group:"Umbrella Insurance Advice Pty Ltd",user:"Justin Turtle", referrer:"",             lastActionTime:hoursAgo(50),       lastNote:"Life Insurance ($2,000,000), TPD ($1,500,000) Quote sent ($3669.48)",created:daysAgo(3), tags:[] },
  { id:38400, customer:"Mrs Kirsty Kitchener",    status:4, state:"VIC", group:"Surety Insurance Pty Ltd",       user:"Maysee Chang",    referrer:"",             lastActionTime:hoursAgo(12),       lastNote:"Application lodged with AIA — awaiting underwriting decision",created:daysAgo(4), tags:["application"] },
  { id:38350, customer:"Sophie Hartley",          status:4, state:"NSW", group:"UFinancial Protect",             user:"James N",         referrer:"Mars Hana",    lastActionTime:hoursAgo(6),        lastNote:"Application submitted — Zurich, awaiting decision",created:daysAgo(5), tags:["application"] },
  { id:38200, customer:"Ryan Castellano",         status:4, state:"QLD", group:"Hunter Galloway",                user:"John Rojas",      referrer:"",             lastActionTime:hoursAgo(24),       lastNote:"Application submitted — TAL income protection",created:daysAgo(6), tags:[] },
  { id:38100, customer:"James Schiwy",            status:1, state:"NSW", group:"UFinancial Protect",             user:"John Rojas",      referrer:"",             lastActionTime:hoursAgo(3),        lastNote:"Initial fact find complete — preparing quote",created:daysAgo(4), tags:[] },
  { id:38050, customer:"Priya Mehta",             status:1, state:"VIC", group:"CH Life",                        user:"Maysee Chang",    referrer:"Xavier Howard",lastActionTime:hoursAgo(8),        lastNote:"Life needs analysis complete — awaiting salary details",created:daysAgo(5), tags:[] },
  { id:37900, customer:"Natalie Brooks",          status:5, state:"NSW", group:"Hunter Galloway",                user:"Maysee Chang",    referrer:"",             lastActionTime:hoursAgo(72),       lastNote:"Policy confirmed inforce by TAL — all documents issued",created:daysAgo(14), tags:["inforce"] },
  { id:37800, customer:"Aisha Patel",             status:5, state:"VIC", group:"UFinancial Protect",             user:"John Rojas",      referrer:"Mars Hana",    lastActionTime:hoursAgo(96),       lastNote:"Application approved — Life + TPD + IP now inforce",created:daysAgo(21), tags:["inforce"] },
  { id:37700, customer:"Marcus Chen",             status:5, state:"QLD", group:"Armor Insurance Solutions",      user:"Lucas Kenyon",    referrer:"",             lastActionTime:daysAgo(7),         lastNote:"All policies issued and confirmed inforce",created:daysAgo(30), tags:["inforce"] },
  { id:37500, customer:"Daniel Okafor",           status:6, state:"NSW", group:"Covered Life",                   user:"Advice Team",     referrer:"",             lastActionTime:daysAgo(14),        lastNote:"Client requested hold — reviewing personal circumstances",created:daysAgo(45), tags:["hold"] },
];

// ─── Column selector panel (same pattern as Tasks) ────────────────────────────
function ColumnPanel({ defs, order, visible, onToggle, onReorder, onClose }: {
  defs: ColDef[]; order: string[]; visible: Record<string, boolean>;
  onToggle: (k: string) => void; onReorder: (o: string[]) => void; onClose: () => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const ordered = order.map(k => defs.find(d => d.key === k)).filter(Boolean) as ColDef[];

  function onDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...order]; const [m] = next.splice(dragIdx.current, 1); next.splice(i, 0, m);
    onReorder(next); dragIdx.current = null; setDragOver(null);
  }

  return (
    <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary">
        <p className="text-sm font-semibold text-primary">Columns</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onReorder(defs.map(d => d.key))} className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose} className="text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>
        </div>
      </div>
      <p className="text-[10px] text-quaternary px-4 pt-2 pb-1">Drag to reorder · toggle to show/hide</p>
      <ul className="max-h-80 overflow-y-auto py-1">
        {ordered.map((col, i) => (
          <li key={col.key} draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragEnter={() => setDragOver(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(i)}
            onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
            className={"flex items-center gap-3 px-4 py-2.5 cursor-grab transition-colors " + (dragOver === i ? "bg-brand-secondary" : "hover:bg-secondary_alt")}>
            <svg className="size-3.5 text-fg-quaternary shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="4" width="10" height="1.5" rx="0.75"/><rect x="3" y="7.25" width="10" height="1.5" rx="0.75"/><rect x="3" y="10.5" width="10" height="1.5" rx="0.75"/>
            </svg>
            <button onClick={() => onToggle(col.key)}
              className={"flex size-4 shrink-0 items-center justify-center rounded transition-colors " + (visible[col.key] ? "bg-brand-solid" : "border border-secondary bg-primary")}>
              {visible[col.key] && <svg className="size-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <span className={"text-xs " + (visible[col.key] ? "text-primary font-medium" : "text-quaternary")}>{col.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatActionTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const dateStr = d.toLocaleDateString("en-AU", { day:"2-digit", month:"2-digit", year:"numeric" }) + " " +
    d.toLocaleTimeString("en-AU", { hour:"2-digit", minute:"2-digit", hour12:false });
  if (diffDays === 0) return `${dateStr} (today)`;
  if (diffDays === 1) return `${dateStr} (1 day)`;
  return `${dateStr} (${diffDays} days)`;
}

const PAGE_SIZE = 20;

// ─── ClientsPage ──────────────────────────────────────────────────────────────
export function ClientsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [search, setSearch] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const [colState, setColStateRaw] = useState(() => loadColState(CLIENT_COLS));

  function updateCols(next: typeof colState) { setColStateRaw(next); saveColState(next); }
  function toggleCol(key: string) { updateCols({ ...colState, visible: { ...colState.visible, [key]: !colState.visible[key] } }); }
  function reorderCols(order: string[]) { updateCols({ ...colState, order }); }

  const visibleCols: ColDef[] = [];
  for (const k of colState.order) {
    const col = CLIENT_COLS.find((c: ColDef) => c.key === k);
    if (col && colState.visible[col.key]) visibleCols.push(col);
  }

  // Tab filtering
  const tabStatuses = TABS.find(t => t.key === activeTab)?.statuses ?? null;

  const filtered = useMemo(() => {
    let rows = MOCK_CLIENTS;
    if (tabStatuses) rows = rows.filter(r => tabStatuses.includes(r.status));
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.customer.toLowerCase().includes(q) || String(r.id).includes(q) || r.group.toLowerCase().includes(q));
    }
    if (assignedFilter !== "All") rows = rows.filter(r => r.user === assignedFilter);
    if (statusFilter   !== "All") rows = rows.filter(r => String(r.status) === statusFilter);
    if (stateFilter    !== "All") rows = rows.filter(r => r.state === stateFilter);
    if (groupFilter    !== "All") rows = rows.filter(r => r.group === groupFilter);
    return [...rows].sort((a, b) => {
      const va = String((a as any)[sortKey] ?? "");
      const vb = String((b as any)[sortKey] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
    });
  }, [activeTab, search, assignedFilter, statusFilter, stateFilter, groupFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }
  function toggleRow(id: number) { setSelectedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() {
    if (selectedRows.size === pageRows.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(pageRows.map(r => r.id)));
  }

  function downloadCSV() {
    const csv = [
      visibleCols.map((c: ColDef) => c.label).join(","),
      ...filtered.map(r => visibleCols.map((c: ColDef) => `"${String((r as any)[c.key] ?? "").replace(/"/g,'""')}"`).join(","))
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = `clients-${activeTab}-${Date.now()}.csv`;
    a.click();
  }

  function tabCount(key: TabKey) {
    const s = TABS.find(t => t.key === key)?.statuses;
    if (!s) return MOCK_CLIENTS.length;
    return MOCK_CLIENTS.filter(c => s.includes(c.status)).length;
  }

  // Column header with sort + drag-to-reorder
  const Th = ({ col }: { col: ColDef }) => (
    <th onClick={() => toggleSort(col.key)}
      style={{ minWidth: col.minWidth }}
      draggable
      onDragStart={e => e.dataTransfer.setData("text/plain", col.key)}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const from = e.dataTransfer.getData("text/plain");
        if (!from || from === col.key) return;
        const o = [...colState.order]; const fi = o.indexOf(from); const ti = o.indexOf(col.key);
        if (fi < 0 || ti < 0) return;
        o.splice(fi, 1); o.splice(ti, 0, from); reorderCols(o);
      }}
      className="cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap group/th">
      <span className="inline-flex items-center gap-1.5">
        <svg className="size-3 text-fg-quaternary opacity-0 group-hover/th:opacity-50 transition-opacity cursor-grab shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="4" width="10" height="1.5" rx="0.75"/><rect x="3" y="7.25" width="10" height="1.5" rx="0.75"/><rect x="3" y="10.5" width="10" height="1.5" rx="0.75"/>
        </svg>
        {col.label}
        <svg className={"size-3 " + (sortKey === col.key ? "opacity-100" : "opacity-20")} viewBox="0 0 10 12" fill="currentColor">
          <path d="M5 1l4 5H1z" opacity={sortDir === "asc" && sortKey === col.key ? "1" : "0.4"}/>
          <path d="M5 11l-4-5h8z" opacity={sortDir === "desc" && sortKey === col.key ? "1" : "0.4"}/>
        </svg>
      </span>
    </th>
  );

  function renderCell(row: Client, key: string) {
    switch (key) {
      case "id": return (
        <button onClick={() => navigate(`/client/${row.id}`)}
          className="text-quaternary text-xs font-mono hover:text-brand-secondary hover:underline">
          {row.id}
        </button>
      );
      case "customer": return (
        <span className="font-medium hover:underline" style={{ color: STATUS_MAP[row.status].color }}>
          {row.customer}
        </span>
      );
      case "status": return (
        <span className="text-xs font-semibold" style={{ color: STATUS_MAP[row.status].color }}>
          {STATUS_MAP[row.status].label}
        </span>
      );
      case "state": return <span className="text-sm text-secondary">{row.state || "—"}</span>;
      case "group": return <span className="text-sm text-secondary truncate block max-w-[180px]">{row.group}</span>;
      case "user":  return <span className="text-sm text-secondary">{row.user}</span>;
      case "referrer": return <span className="text-sm text-secondary">{row.referrer || ""}</span>;
      case "lastActionTime": return <span className="text-xs text-tertiary whitespace-nowrap">{formatActionTime(row.lastActionTime)}</span>;
      case "lastNote": return <p className="text-xs text-tertiary truncate max-w-[240px]">{row.lastNote || ""}</p>;
      case "created": return <span className="text-xs text-tertiary">{new Date(row.created).toLocaleDateString("en-AU")}</span>;
      case "tags": return row.tags.length ? (
        <div className="flex gap-1 flex-wrap">
          {row.tags.map(t => <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary">{t}</span>)}
        </div>
      ) : null;
      default: return <span className="text-sm text-secondary">{String((row as any)[key] ?? "")}</span>;
    }
  }

  const hasFilters = search || assignedFilter !== "All" || statusFilter !== "All" || stateFilter !== "All" || groupFilter !== "All";
  const uniqueGroups = [...new Set(MOCK_CLIENTS.map(c => c.group))].sort();

  // Pagination helper
  function PaginationBtn({ p, current }: { p: number; current: number }) {
    return (
      <button onClick={() => setPage(p)}
        className={"size-7 rounded text-xs font-medium transition-colors " + (p === current ? "bg-brand-solid text-white" : "text-quaternary hover:bg-secondary")}>
        {p}
      </button>
    );
  }

  const pageNums: number[] = [];
  if (totalPages <= 9) { for (let i = 1; i <= totalPages; i++) pageNums.push(i); }
  else {
    pageNums.push(1);
    if (page > 3) pageNums.push(-1); // ellipsis
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNums.push(i);
    if (page < totalPages - 2) pageNums.push(-2); // ellipsis
    pageNums.push(totalPages);
  }

  const activeFilterCount = [assignedFilter !== "All", statusFilter !== "All", stateFilter !== "All", groupFilter !== "All", dateFilter !== "all"].filter(Boolean).length;

  return (
    <div className="flex min-h-screen bg-primary">
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} activeUrl="/clients" />

      <main className="flex-1 flex flex-col overflow-hidden lg:pl-[68px]">

        {/* ── Header ── */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-0">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-primary" style={{ fontFamily:"'Metrophobic', sans-serif" }}>
                {TABS.find(t => t.key === activeTab)?.label === "Active" ? "Active Clients" : TABS.find(t => t.key === activeTab)?.label}
              </h1>
              <p className="text-sm text-tertiary mt-0.5">{filtered.length} records</p>
            </div>
            
            {/* Mobile filter button */}
            <button 
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary">
              <FilterLines className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="size-5 rounded-full bg-brand-solid text-white text-[10px] font-semibold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Desktop filters */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer">
                <option value="all">Select Dates...</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
              <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[130px]">
                <option value="All">Assigned To</option>
                {USERS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[110px]">
                <option value="All">Status</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[130px]">
                <option value="All">Campaign Group</option>
                {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer">
                <option value="All">State</option>
                {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Mobile filters panel */}
          {mobileFiltersOpen && (
            <div className="lg:hidden border-t border-secondary py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand">
                  <option value="all">Select Dates...</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                </select>
                <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand">
                  <option value="All">Assigned To</option>
                  {USERS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand">
                  <option value="All">Status</option>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand">
                  <option value="All">Campaign Group</option>
                  {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand col-span-2 sm:col-span-1">
                  <option value="All">State</option>
                  {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={() => { setSearch(""); setAssignedFilter("All"); setStatusFilter("All"); setStateFilter("All"); setGroupFilter("All"); setDateFilter("all"); setPage(1); }}
                  className="text-sm text-brand-secondary hover:underline">Clear all filters</button>
              )}
            </div>
          )}

          {/* Tab bar */}
          <div className="flex items-center overflow-x-auto gap-0 -mb-px scrollbar-hide">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => { setActiveTab(key); setPage(1); setSelectedRows(new Set()); }}
                className={"flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors " +
                  (activeTab === key ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(" ")[0]}</span>
                <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (activeTab === key ? "bg-brand-secondary text-brand-secondary" : "bg-secondary text-quaternary")}>
                  {tabCount(key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..."
              className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-8 py-2 text-sm text-primary outline-none focus:border-brand" />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>}
          </div>

          {/* Bulk actions — desktop only */}
          {selectedRows.size > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-secondary font-medium">{selectedRows.size} selected</span>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Assign To ▾</button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Set Status ▾</button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#EF4444] bg-[#FEF2F2] px-3 py-2 text-sm font-medium text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors">
                <X className="size-3.5" />Clear
              </button>
            </div>
          )}

          {/* Mobile selected count */}
          {selectedRows.size > 0 && (
            <span className="sm:hidden text-xs text-secondary font-medium">{selectedRows.size} selected</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {hasFilters && (
              <button onClick={() => { setSearch(""); setAssignedFilter("All"); setStatusFilter("All"); setStateFilter("All"); setGroupFilter("All"); setPage(1); }}
                className="hidden sm:block text-sm text-brand-secondary hover:underline">Clear filters</button>
            )}
            <button onClick={downloadCSV}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
              <Download01 className="size-4" />
              <span className="hidden md:inline">Download</span>
            </button>
            {/* Column selector - desktop only */}
            <div className="relative hidden lg:block">
              <button onClick={() => setColPanelOpen(v => !v)}
                className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
                  (colPanelOpen ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-secondary")}>
                <Settings01 className="size-4" />
                Columns
                <span className="rounded-full bg-brand-secondary text-brand-secondary text-[10px] font-semibold px-1.5 py-0.5">
                  {visibleCols.length}/{CLIENT_COLS.length}
                </span>
              </button>
              {colPanelOpen && (
                <ColumnPanel defs={CLIENT_COLS} order={colState.order} visible={colState.visible}
                  onToggle={toggleCol} onReorder={reorderCols} onClose={() => setColPanelOpen(false)} />
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-auto p-4 sm:px-6 lg:px-8">
          
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {pageRows.length === 0 ? (
              <div className="text-center py-16 text-sm text-quaternary">No clients found</div>
            ) : pageRows.map(row => (
              <div key={row.id}
                onClick={() => navigate(`/client/${row.id}`)}
                className="border border-secondary rounded-xl p-4 bg-primary active:bg-secondary_alt transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" 
                      checked={selectedRows.has(row.id)} 
                      onChange={(e) => { e.stopPropagation(); toggleRow(row.id); }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer shrink-0" />
                    <div>
                      <p className="font-semibold" style={{ color: STATUS_MAP[row.status].color }}>{row.customer}</p>
                      <p className="text-xs text-quaternary font-mono">#{row.id}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: STATUS_MAP[row.status].color + "15", color: STATUS_MAP[row.status].color }}>
                    {STATUS_MAP[row.status].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                  <div>
                    <span className="text-quaternary">Assigned: </span>
                    <span className="text-secondary">{row.user}</span>
                  </div>
                  <div>
                    <span className="text-quaternary">State: </span>
                    <span className="text-secondary">{row.state || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-quaternary">Group: </span>
                    <span className="text-secondary">{row.group}</span>
                  </div>
                  {row.lastNote && (
                    <p className="col-span-2 text-tertiary line-clamp-2 mt-1">{row.lastNote}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-xl border border-secondary overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-secondary_alt border-b border-secondary">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox"
                      checked={selectedRows.size === pageRows.length && pageRows.length > 0}
                      onChange={toggleAll}
                      className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                  </th>
                  {visibleCols.map((col: ColDef) => <Th key={col.key} col={col} />)}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {pageRows.length === 0 ? (
                  <tr><td colSpan={visibleCols.length + 1} className="px-4 py-16 text-center text-sm text-quaternary">No clients found</td></tr>
                ) : pageRows.map(row => (
                  <tr key={row.id}
                    onClick={() => navigate(`/client/${row.id}`)}
                    className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)}
                        className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                    </td>
                    {visibleCols.map((col: ColDef) => (
                      <td key={col.key} className="px-3 py-2.5">{renderCell(row, col.key)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between sm:justify-start gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm text-secondary border border-secondary rounded-lg hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                ← Prev
              </button>
              <span className="text-sm text-tertiary">
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm text-secondary border border-secondary rounded-lg hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                Next →
              </button>
            </div>
          )}

          <p className="text-xs text-quaternary mt-3">
            {filtered.length} records · showing {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, filtered.length)}
          </p>
        </div>
      </main>

      {colPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setColPanelOpen(false)} />}
    </div>
  );
}
