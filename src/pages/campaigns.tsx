import { useState, useMemo, useRef } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01, X, Settings01, DotsGrid, Check, Plus } from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Campaign {
  id: number; name: string; code: string; group: string;
  settable: boolean; price: number; campaigns: number;
  leads: number; leadPrice: number; quotesSent: number; quoteValue: number;
  pendingApps: number; pendingValue: number;
  submittedApps: number; submittedValue: number; revenue: number;
}

interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }
const COLS: ColDef[] = [
  { key:"name",          label:"Name",            defaultVisible:true,  minWidth:180 },
  { key:"code",          label:"Code",            defaultVisible:true  },
  { key:"group",         label:"Group",           defaultVisible:true  },
  { key:"settable",      label:"Settable",        defaultVisible:true  },
  { key:"price",         label:"Price",           defaultVisible:false },
  { key:"campaigns",     label:"Campaigns",       defaultVisible:true  },
  { key:"leads",         label:"Leads",           defaultVisible:true  },
  { key:"leadPrice",     label:"Lead Price",      defaultVisible:false },
  { key:"quotesSent",    label:"Quotes Sent",     defaultVisible:true  },
  { key:"quoteValue",    label:"Quote Value",     defaultVisible:true  },
  { key:"pendingApps",   label:"Pending Apps",    defaultVisible:true  },
  { key:"pendingValue",  label:"Pending Value",   defaultVisible:true  },
  { key:"submittedApps", label:"Submitted Apps",  defaultVisible:true  },
  { key:"submittedValue",label:"Submitted Value", defaultVisible:true  },
  { key:"revenue",       label:"Revenue",         defaultVisible:true  },
];
const STORE_KEY = "axis_campaigns_cols_v1";
function loadCols(d: ColDef[]) { try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch {} return { order: d.map((c: ColDef) => c.key), visible: Object.fromEntries(d.map((c: ColDef) => [c.key, c.defaultVisible])) }; }
function saveCols(s: { order: string[]; visible: Record<string, boolean> }) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

// ─── Seeded from real DB (leads_leadsource with joined stats) ─────────────────
const MOCK: Campaign[] = [
  { id:0,   name:"Organic Traffic",              code:"",           group:"—",                      settable:false, price:0, campaigns:6,  leads:17009, leadPrice:0, quotesSent:5705, quoteValue:17959918, pendingApps:642, pendingValue:1356786, submittedApps:9183, submittedValue:6224257, revenue:5318267 },
  { id:82,  name:"Shielded Insurance Brokers",   code:"shielded",   group:"Shielded Insurance",     settable:true,  price:0, campaigns:1,  leads:2061,  leadPrice:0, quotesSent:520,  quoteValue:4200000,  pendingApps:48,  pendingValue:192000,  submittedApps:238,  submittedValue:890000,  revenue:534000  },
  { id:379, name:"Securitas existing clients",   code:"",           group:"—",                      settable:false, price:0, campaigns:1,  leads:1357,  leadPrice:0, quotesSent:890,  quoteValue:8100000,  pendingApps:120, pendingValue:480000,  submittedApps:1456, submittedValue:5200000, revenue:3120000 },
  { id:63,  name:"Insurance Plus SA Old Leads",  code:"",           group:"LIP",                    settable:true,  price:0, campaigns:1,  leads:1341,  leadPrice:0, quotesSent:410,  quoteValue:3100000,  pendingApps:65,  pendingValue:260000,  submittedApps:501,  submittedValue:1900000, revenue:1140000 },
  { id:84,  name:"Hunter Galloway",              code:"",           group:"LIP",                    settable:true,  price:0, campaigns:1,  leads:1089,  leadPrice:0, quotesSent:340,  quoteValue:2800000,  pendingApps:30,  pendingValue:120000,  submittedApps:159,  submittedValue:620000,  revenue:372000  },
  { id:115, name:"Connect U Pty Ltd",            code:"connectu",   group:"Connect U",              settable:true,  price:0, campaigns:1,  leads:1070,  leadPrice:0, quotesSent:180,  quoteValue:1400000,  pendingApps:5,   pendingValue:20000,   submittedApps:26,   submittedValue:95000,   revenue:57000   },
  { id:328, name:"3Point Insurance",             code:"",           group:"3Point Insurance",        settable:false, price:0, campaigns:1,  leads:1047,  leadPrice:0, quotesSent:580,  quoteValue:4700000,  pendingApps:95,  pendingValue:380000,  submittedApps:1152, submittedValue:4300000, revenue:2580000 },
  { id:29,  name:"Shaf Clients",                 code:"",           group:"Tony Insurance",         settable:false, price:0, campaigns:1,  leads:658,   leadPrice:0, quotesSent:12,   quoteValue:89000,    pendingApps:0,   pendingValue:0,       submittedApps:1,    submittedValue:4200,    revenue:2500    },
  { id:12,  name:"Halcyon Insurance",            code:"",           group:"Halcyon Insurance Partners", settable:true, price:0, campaigns:1, leads:570, leadPrice:0, quotesSent:180, quoteValue:1500000,  pendingApps:28,  pendingValue:112000,  submittedApps:139,  submittedValue:530000,  revenue:318000  },
  { id:77,  name:"Nectar",                       code:"nectar",     group:"Shield Life Insurance",  settable:true,  price:0, campaigns:1,  leads:445,   leadPrice:0, quotesSent:160,  quoteValue:1350000,  pendingApps:42,  pendingValue:168000,  submittedApps:227,  submittedValue:870000,  revenue:522000  },
  { id:17,  name:"JVFP2 Existing Clients",       code:"jvfp2-existing", group:"LIP (Ltd)",         settable:true,  price:0, campaigns:1,  leads:394,   leadPrice:0, quotesSent:145,  quoteValue:1200000,  pendingApps:18,  pendingValue:72000,   submittedApps:83,   submittedValue:320000,  revenue:192000  },
  { id:209, name:"Lockmor Life Referrals",       code:"",           group:"Lockmor Life",           settable:true,  price:0, campaigns:1,  leads:386,   leadPrice:0, quotesSent:110,  quoteValue:920000,   pendingApps:12,  pendingValue:48000,   submittedApps:59,   submittedValue:225000,  revenue:135000  },
  { id:97,  name:"Tony Insurance",               code:"tonyinsurance","group":"Tony Insurance",     settable:true,  price:0, campaigns:2,  leads:272,   leadPrice:0, quotesSent:98,   quoteValue:820000,   pendingApps:32,  pendingValue:128000,  submittedApps:191,  submittedValue:730000,  revenue:438000  },
  { id:68,  name:"Apex Financial Planning",      code:"apex",       group:"LIP",                    settable:true,  price:0, campaigns:1,  leads:234,   leadPrice:0, quotesSent:89,   quoteValue:740000,   pendingApps:5,   pendingValue:20000,   submittedApps:30,   submittedValue:115000,  revenue:69000   },
  { id:344, name:"Lifed - Meta",                 code:"lifed",      group:"Lifed",                  settable:true,  price:0, campaigns:1,  leads:249,   leadPrice:0, quotesSent:65,   quoteValue:510000,   pendingApps:2,   pendingValue:8000,    submittedApps:10,   submittedValue:38000,   revenue:22800   },
  { id:369, name:"Surety Insurance",             code:"Surety Insurance","group":"Surety",          settable:true,  price:0, campaigns:1,  leads:285,   leadPrice:0, quotesSent:45,   quoteValue:370000,   pendingApps:2,   pendingValue:8000,    submittedApps:10,   submittedValue:38000,   revenue:22800   },
];

const GROUPS = [...new Set(MOCK.map(m => m.group))].filter(g => g !== "—").sort();
const PAGE_SIZE = 20;

// ─── Column panel ─────────────────────────────────────────────────────────────
function ColPanel({ defs, order, visible, onToggle, onReorder, onClose }: {
  defs:ColDef[]; order:string[]; visible:Record<string,boolean>;
  onToggle:(k:string)=>void; onReorder:(o:string[])=>void; onClose:()=>void;
}) {
  const dragIdx = useRef<number|null>(null);
  const [dragOver, setDragOver] = useState<number|null>(null);
  const ordered: ColDef[] = [];
  for (const k of order) { const f = defs.find((d:ColDef) => d.key===k); if (f) ordered.push(f); }
  function drop(i:number) { if (dragIdx.current===null||dragIdx.current===i) return; const n=[...order]; const [m]=n.splice(dragIdx.current,1); n.splice(i,0,m); onReorder(n); dragIdx.current=null; setDragOver(null); }
  return (
    <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary">
        <p className="text-xs font-semibold text-primary">Columns</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onReorder(defs.map((d:ColDef) => d.key))} className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose}><X className="size-3.5 text-quaternary"/></button>
        </div>
      </div>
      <ul className="max-h-80 overflow-y-auto py-1">
        {ordered.map((col,i) => (
          <li key={col.key} draggable
            onDragStart={() => { dragIdx.current=i; }}
            onDragEnter={() => setDragOver(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => drop(i)}
            onDragEnd={() => { dragIdx.current=null; setDragOver(null); }}
            className={"flex items-center gap-2.5 px-3 py-2 cursor-grab select-none " + (dragOver===i ? "bg-brand-secondary" : "hover:bg-secondary_alt")}>
            <DotsGrid className="size-3.5 text-quaternary shrink-0"/>
            <button onClick={() => onToggle(col.key)} className={"flex size-4 shrink-0 items-center justify-center rounded " + (visible[col.key] ? "bg-brand-solid" : "border border-secondary bg-primary")}>
              {visible[col.key] && <Check className="size-2.5 text-white"/>}
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

// ─── CampaignsPage ────────────────────────────────────────────────────────────
export function CampaignsPage() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");
  const [settableFilter, setSettableFilter] = useState("All");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState("leads");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [colState, setColStateRaw] = useState(() => loadCols(COLS));
  function updateCols(n: typeof colState) { setColStateRaw(n); saveCols(n); }

  const visibleCols: ColDef[] = [];
  for (const k of colState.order) {
    const c = COLS.find((d: ColDef) => d.key === k);
    if (c && colState.visible[c.key]) visibleCols.push(c);
  }

  const filtered = useMemo(() => {
    let rows = [...MOCK];
    if (search) { const q = search.toLowerCase(); rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.group.toLowerCase().includes(q)); }
    if (groupFilter !== "All") rows = rows.filter(r => r.group === groupFilter);
    if (settableFilter === "Yes") rows = rows.filter(r => r.settable);
    if (settableFilter === "No") rows = rows.filter(r => !r.settable);
    return [...rows].sort((a, b) => {
      const va = String((a as any)[sortKey] ?? "");
      const vb = String((b as any)[sortKey] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
    });
  }, [search, groupFilter, settableFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function toggleSort(k: string) { if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(k); setSortDir("desc"); } setPage(1); }
  function toggleRow(id: number) { setSelectedRows(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { if (selectedRows.size === pageRows.length) setSelectedRows(new Set()); else setSelectedRows(new Set(pageRows.map(r => r.id))); }
  function downloadCSV() {
    const csv = [visibleCols.map((c: ColDef) => c.label).join(","), ...filtered.map(r => visibleCols.map((c: ColDef) => `"${String((r as any)[c.key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "campaigns.csv"; a.click();
  }

  const totalLeads = filtered.reduce((s, r) => s + r.leads, 0);
  const totalSubmitted = filtered.reduce((s, r) => s + r.submittedApps, 0);
  const totalRevenue = filtered.reduce((s, r) => s + r.revenue, 0);

  function renderCell(row: Campaign, key: string) {
    if (key === "name") return <span className="font-medium text-brand-secondary hover:underline cursor-pointer">{row.name}</span>;
    if (key === "settable") return (
      <span className={"inline-flex rounded-full text-[11px] font-medium px-2 py-0.5 " + (row.settable ? "bg-green-50 text-green-700" : "bg-secondary text-quaternary")}>
        {row.settable ? "Yes" : "No"}
      </span>
    );
    if (key === "group") return <span className="inline-flex rounded-full bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5">{row.group}</span>;
    if (key === "quoteValue" || key === "pendingValue" || key === "submittedValue" || key === "revenue") {
      const val = (row as any)[key] as number;
      return <span className="text-xs font-medium text-primary">{val > 0 ? `$${val.toLocaleString()}` : "—"}</span>;
    }
    if (key === "leads" || key === "submittedApps" || key === "pendingApps" || key === "quotesSent" || key === "campaigns") {
      const val = (row as any)[key] as number;
      return <span className={"text-xs font-semibold " + (val > 0 ? "text-primary" : "text-quaternary")}>{val > 0 ? val.toLocaleString() : "—"}</span>;
    }
    return <span className="text-xs text-secondary">{String((row as any)[key] ?? "—") || "—"}</span>;
  }

  const Th = ({ col }: { col: ColDef }) => (
    <th onClick={() => toggleSort(col.key)} style={{ minWidth: col.minWidth }}
      draggable
      onDragStart={e => e.dataTransfer.setData("text/plain", col.key)}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const from = e.dataTransfer.getData("text/plain");
        if (!from || from === col.key) return;
        const o = [...colState.order]; const fi = o.indexOf(from); const ti = o.indexOf(col.key);
        if (fi < 0 || ti < 0) return; o.splice(fi, 1); o.splice(ti, 0, from);
        updateCols({ ...colState, order: o });
      }}
      className="cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap group/th">
      <span className="inline-flex items-center gap-1.5">
        <DotsGrid className="size-3 opacity-0 group-hover/th:opacity-50 cursor-grab shrink-0"/>
        {col.label}
        <svg className={"size-3 " + (sortKey === col.key ? "opacity-100" : "opacity-20")} viewBox="0 0 10 12" fill="currentColor">
          <path d="M5 1l4 5H1z" opacity={sortDir==="asc"&&sortKey===col.key?"1":"0.4"}/>
          <path d="M5 11l-4-5h8z" opacity={sortDir==="desc"&&sortKey===col.key?"1":"0.4"}/>
        </svg>
      </span>
    </th>
  );

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems}/>
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"/>
      <main className="min-h-screen lg:flex-1 flex flex-col overflow-x-hidden">

        {/* Header */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Campaign Groups</h1>
              <p className="text-sm text-tertiary mt-0.5">
                {filtered.length} campaigns · <span className="font-medium text-primary">{totalLeads.toLocaleString()}</span> leads ·
                <span className="font-medium text-primary"> {totalSubmitted.toLocaleString()}</span> submitted ·
                Revenue: <span className="font-medium text-primary">${totalRevenue.toLocaleString()}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={groupFilter} onChange={e => { setGroupFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer">
                <option value="All">User Group</option>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={settableFilter} onChange={e => { setSettableFilter(e.target.value); setPage(1); }} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer">
                <option value="All">Settable</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search campaigns..."
              className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-8 py-2 text-sm text-primary outline-none focus:border-brand"/>
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5"/></button>}
          </div>

          {selectedRows.size > 0 && (
            <>
              <span className="text-sm text-secondary font-medium">{selectedRows.size} selected</span>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs font-medium text-secondary hover:bg-secondary">Assign to Group ▾</button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-error-primary bg-primary px-3 py-2 text-xs font-medium text-error-primary hover:bg-[#FEF2F2]">Delete</button>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary">
              <Plus className="size-4 text-success-primary"/> Add New
            </button>
            <button onClick={downloadCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary">
              <Download01 className="size-4 text-success-primary"/> Download CSV
            </button>
            <div className="relative">
              <button onClick={() => setColPanelOpen(v => !v)}
                className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " + (colPanelOpen ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-secondary")}>
                <Settings01 className="size-4"/>Columns
                <span className="rounded-full bg-brand-secondary text-brand-secondary text-[10px] font-semibold px-1.5 py-0.5">{visibleCols.length}/{COLS.length}</span>
              </button>
              {colPanelOpen && <ColPanel defs={COLS} order={colState.order} visible={colState.visible}
                onToggle={k => updateCols({ ...colState, visible: { ...colState.visible, [k]: !colState.visible[k] } })}
                onReorder={o => updateCols({ ...colState, order: o })}
                onClose={() => setColPanelOpen(false)}/>}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-xl border border-secondary overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-tertiary border-b border-secondary">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" checked={selectedRows.size === pageRows.length && pageRows.length > 0} onChange={toggleAll} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer"/>
                  </th>
                  {visibleCols.map((col: ColDef) => <Th key={col.key} col={col}/>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {pageRows.length === 0
                  ? <tr><td colSpan={visibleCols.length + 1} className="px-4 py-16 text-center text-sm text-quaternary">No campaigns found</td></tr>
                  : pageRows.map(row => (
                    <tr key={row.id} className="hover:bg-secondary_alt cursor-pointer transition-colors">
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer"/>
                      </td>
                      {visibleCols.map((col: ColDef) => <td key={col.key} className="px-3 py-2.5">{renderCell(row, col.key)}</td>)}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Totals row */}
          {filtered.length > 0 && (
            <div className="mt-2 rounded-xl border border-secondary bg-secondary_alt px-4 py-2.5 flex flex-wrap gap-6 text-xs">
              <span className="text-quaternary">Totals:</span>
              <span><span className="text-quaternary">Leads </span><span className="font-semibold text-primary">{totalLeads.toLocaleString()}</span></span>
              <span><span className="text-quaternary">Submitted </span><span className="font-semibold text-primary">{totalSubmitted.toLocaleString()}</span></span>
              <span><span className="text-quaternary">Submitted Value </span><span className="font-semibold text-primary">${filtered.reduce((s,r) => s+r.submittedValue, 0).toLocaleString()}</span></span>
              <span><span className="text-quaternary">Revenue </span><span className="font-semibold text-primary">${totalRevenue.toLocaleString()}</span></span>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-quaternary">Pages:</span>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">← Prev</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={"size-7 rounded text-xs font-medium " + (p === page ? "bg-brand-solid text-white" : "text-quaternary hover:bg-secondary")}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">Next »</button>
            </div>
          )}
          <p className="text-xs text-quaternary mt-2 px-1">{filtered.length} records · {visibleCols.length} of {COLS.length} columns</p>
        </div>
      </main>
      {colPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setColPanelOpen(false)}/>}
    </div>
  );
}
