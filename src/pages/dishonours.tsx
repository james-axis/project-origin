import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01, X, Settings01, DotsGrid, Check, Lock01 } from "@untitledui/icons";

interface Dishonour {
  id: number; customer: string; company: string; policyId: string;
  type: string; amount: number; reason: string; dishonoured: string;
  expectedLapse: string; status: number; statusLabel: string;
  assignedTo: string; created: string; lastActionTime: string | null;
  lastNote: string; pendingActions: string; commission: number | null; state: string;
}

interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }
const COLS: ColDef[] = [
  { key:"customer",       label:"Customer",         defaultVisible:true,  minWidth:150 },
  { key:"company",        label:"Company",          defaultVisible:true  },
  { key:"policyId",       label:"Policy ID",        defaultVisible:true  },
  { key:"type",           label:"Type",             defaultVisible:true  },
  { key:"amount",         label:"Amount",           defaultVisible:true  },
  { key:"reason",         label:"Reason",           defaultVisible:false },
  { key:"dishonoured",    label:"Dishonoured",      defaultVisible:true  },
  { key:"expectedLapse",  label:"Expected Lapse",   defaultVisible:true  },
  { key:"statusLabel",    label:"Status",           defaultVisible:true  },
  { key:"assignedTo",     label:"Assigned To",      defaultVisible:true  },
  { key:"created",        label:"Created",          defaultVisible:false },
  { key:"lastActionTime", label:"Last Action",      defaultVisible:true  },
  { key:"lastNote",       label:"Last Note",        defaultVisible:true,  minWidth:200 },
];
const STORE_KEY = "axis_dishonours_cols_v1";
function loadCols(d: ColDef[]) { try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch {} return { order: d.map((c: ColDef) => c.key), visible: Object.fromEntries(d.map((c: ColDef) => [c.key, c.defaultVisible])) }; }
function saveCols(s: {order:string[]; visible:Record<string,boolean>}) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

const TYPE_MAP: Record<number,string> = { 0:"Initial Dishonour", 1:"Second Dishonour", 2:"Lapse Warning", 3:"Lapse", 4:"Other" };
const REASON_MAP: Record<number,string> = { 0:"N/a", 1:"Insufficient Funds", 2:"Account Closed", 3:"Card Expired", 4:"Other" };

const MOCK: Dishonour[] = [
  { id:1130, customer:"Mr Andrew Thomas Mann", company:"TAL",      policyId:"#7105098",               type:"Initial Dishonour", amount:2210.01, reason:"N/a",               dishonoured:"21/03/2026", expectedLapse:"28/05/2026", status:0, statusLabel:"New Case", assignedTo:"Beau Portelli",  created:"24/03", lastActionTime:"24/03 23:52", lastNote:"Email received from TAL Rollover payment got rejected", pendingActions:"Initial follow up, SUPPORT ACTION - Call / Email", commission:1114.77, state:"QLD" },
  { id:1129, customer:"Susan Laris",            company:"NEOS",     policyId:"#113718080, #113852354", type:"Initial Dishonour", amount:1565.89, reason:"N/a",               dishonoured:"22/03/2026", expectedLapse:"21/05/2026", status:0, statusLabel:"New Case", assignedTo:"John Rojas",     created:"24/03", lastActionTime:"24/03 23:27", lastNote:"Called, left voicemail & email", pendingActions:"Initial follow up", commission:992, state:"NSW" },
  { id:1128, customer:"Katrina Aveling",        company:"AIA",      policyId:"#15695979, #16753501",   type:"Initial Dishonour", amount:65.32,   reason:"N/a",               dishonoured:"21/03/2026", expectedLapse:"20/05/2026", status:0, statusLabel:"New Case", assignedTo:"Aldrine Regido", created:"24/03", lastActionTime:"24/03 23:27", lastNote:"File uploaded: Overdue Notice_AIA_16753501", pendingActions:"Initial follow up, SUPPORT ACTION - Call / Email", commission:0, state:"QLD" },
  { id:1127, customer:"Mr Beau Jackson",        company:"AIA",      policyId:"#01818740",              type:"Initial Dishonour", amount:802.26,  reason:"N/a",               dishonoured:"19/03/2026", expectedLapse:"09/05/2026", status:0, statusLabel:"New Case", assignedTo:"—",              created:"24/03", lastActionTime:"24/03 01:19", lastNote:"Website has been checked. Policy 01818740 is now overdue.", pendingActions:"Initial follow up, SUPPORT ACTION - Call / Email", commission:0, state:"QLD" },
  { id:1126, customer:"Mr Amit Bhardwaj",       company:"ClearView",policyId:"#550306705",             type:"Initial Dishonour", amount:1989.22, reason:"N/a",               dishonoured:"13/03/2026", expectedLapse:"17/05/2026", status:0, statusLabel:"New Case", assignedTo:"Sally Gilbert",  created:"24/03", lastActionTime:"24/03 00:46", lastNote:"Website has been checked. Policy 550306705 is now overdue.", pendingActions:"Initial follow up, SUPPORT ACTION - Call / Email", commission:2764.89, state:"NSW" },
  { id:1125, customer:"Ms Katie Craig",         company:"ClearView",policyId:"#550932410, #550932422", type:"Initial Dishonour", amount:40.78,   reason:"N/a",               dishonoured:"13/03/2026", expectedLapse:"15/05/2026", status:0, statusLabel:"New Case", assignedTo:"John Rojas",     created:"24/03", lastActionTime:"24/03 23:25", lastNote:"File uploaded: Overdue Notice_CLEARVIEW_550932422", pendingActions:"Initial follow up, SUPPORT ACTION - Call / Email", commission:860, state:"VIC" },
  { id:1124, customer:"Ben Taylor",             company:"Zurich",   policyId:"#3520659",               type:"Initial Dishonour", amount:558.93,  reason:"N/a",               dishonoured:"20/03/2026", expectedLapse:"13/05/2026", status:0, statusLabel:"New Case", assignedTo:"SLG Support",    created:"24/03", lastActionTime:"24/03 00:31", lastNote:"Website checked. Sched. payment re-try: 07/04/2026.", pendingActions:"Initial follow up, SUPPORT ACTION - Call / Email", commission:null, state:"NSW" },
  { id:1123, customer:"Mr Maxwell Phelps",      company:"Zurich",   policyId:"#91251119",              type:"Initial Dishonour", amount:4633.71, reason:"N/a",               dishonoured:"13/03/2026", expectedLapse:"06/05/2026", status:0, statusLabel:"New Case", assignedTo:"Rebel Servante",  created:"24/03", lastActionTime:"24/03 00:27", lastNote:"Website has been checked. Policy 91251119 is now overdue.", pendingActions:"Initial follow up, SUPPORT ACTION - Call / Email", commission:2537.21, state:"NSW" },
];

const COMPANIES = ["TAL","NEOS","AIA","ClearView","Zurich","OnePath","MetLife","Acenda"];
const PAGE_SIZE = 20;

function ColPanel({ defs, order, visible, onToggle, onReorder, onClose }: { defs:ColDef[];order:string[];visible:Record<string,boolean>;onToggle:(k:string)=>void;onReorder:(o:string[])=>void;onClose:()=>void; }) {
  const dragIdx = useRef<number|null>(null);
  const [dragOver, setDragOver] = useState<number|null>(null);
  const ordered: ColDef[] = [];
  for (const k of order) { const f = defs.find((d:ColDef)=>d.key===k); if (f) ordered.push(f); }
  function drop(i:number){if(dragIdx.current===null||dragIdx.current===i)return;const n=[...order];const [m]=n.splice(dragIdx.current,1);n.splice(i,0,m);onReorder(n);dragIdx.current=null;setDragOver(null);}
  return (
    <div className="absolute right-0 top-10 z-50 w-60 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary">
        <p className="text-xs font-semibold text-primary">Columns</p>
        <div className="flex items-center gap-2"><button onClick={()=>onReorder(defs.map((d:ColDef)=>d.key))} className="text-[10px] text-brand-secondary hover:underline">Reset</button><button onClick={onClose}><X className="size-3.5 text-quaternary"/></button></div>
      </div>
      <ul className="max-h-72 overflow-y-auto py-1">
        {ordered.map((col,i)=>(
          <li key={col.key} draggable onDragStart={()=>{dragIdx.current=i;}} onDragEnter={()=>setDragOver(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(i)} onDragEnd={()=>{dragIdx.current=null;setDragOver(null);}}
            className={"flex items-center gap-2.5 px-3 py-2 cursor-grab select-none "+(dragOver===i?"bg-brand-secondary":"hover:bg-secondary_alt")}>
            <DotsGrid className="size-3.5 text-quaternary shrink-0"/>
            <button onClick={()=>onToggle(col.key)} className={"flex size-4 shrink-0 items-center justify-center rounded "+(visible[col.key]?"bg-brand-solid":"border border-secondary bg-primary")}>{visible[col.key]&&<Check className="size-2.5 text-white"/>}</button>
            <span className={"text-xs "+(visible[col.key]?"text-primary font-medium":"text-quaternary")}>{col.label}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-secondary px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] text-quaternary">{ordered.filter(c=>visible[c.key]).length}/{ordered.length} visible</span>
        <button onClick={onClose} className="text-[10px] font-medium text-brand-secondary hover:underline">Done</button>
      </div>
    </div>
  );
}

export function DishonoursPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active"|"closed">("active");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [colState, setColStateRaw] = useState(()=>loadCols(COLS));
  const LOCKED_COL = "customer";
  function updateCols(n:typeof colState){setColStateRaw(n);saveCols(n);}
  function toggleCol(key:string){if(key===LOCKED_COL)return;updateCols({...colState,visible:{...colState.visible,[key]:!colState.visible[key]}});}
  const visibleCols: ColDef[] = [];
  const lockedCol = COLS.find((c:ColDef)=>c.key===LOCKED_COL);
  if(lockedCol) visibleCols.push(lockedCol);
  for (const k of colState.order){if(k===LOCKED_COL)continue;const c=COLS.find((d:ColDef)=>d.key===k);if(c&&colState.visible[c.key])visibleCols.push(c);}

  const filtered = useMemo(()=>{
    let rows = MOCK.filter(r=>tab==="active"?r.status===0:r.status!==0);
    if(search){const q=search.toLowerCase();rows=rows.filter(r=>r.customer.toLowerCase().includes(q)||r.company.toLowerCase().includes(q)||r.policyId.toLowerCase().includes(q)||String(r.id).includes(q));}
    if(companyFilter!=="All")rows=rows.filter(r=>r.company===companyFilter);
    return [...rows].sort((a,b)=>{const va=String((a as any)[sortKey]??"");const vb=String((b as any)[sortKey]??"");return sortDir==="asc"?va.localeCompare(vb,undefined,{numeric:true}):vb.localeCompare(va,undefined,{numeric:true});});
  },[tab,search,companyFilter,sortKey,sortDir]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const pageRows=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  function toggleSort(k:string){if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("asc");}setPage(1);}
  function toggleRow(id:number){setSelectedRows(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});}
  function toggleAll(){if(selectedRows.size===pageRows.length)setSelectedRows(new Set());else setSelectedRows(new Set(pageRows.map(r=>r.id)));}
  function downloadCSV(){const csv=[visibleCols.map((c:ColDef)=>c.label).join(","),...filtered.map(r=>visibleCols.map((c:ColDef)=>`"${String((r as any)[c.key]??"").replace(/"/g,'""')}"`).join(","))].join("\n");const a=document.createElement("a");a.href="data:text/csv,"+encodeURIComponent(csv);a.download=`dishonours-${tab}.csv`;a.click();}

  function renderCell(row:Dishonour,key:string){
    if(key==="customer")return <span className="font-medium text-primary hover:underline">{row.customer}</span>;
    if(key==="statusLabel")return <span className="text-xs text-secondary">{row.statusLabel}</span>;
    if(key==="amount")return <span className="text-xs text-secondary">${row.amount.toLocaleString()}</span>;
    if(key==="company")return <span className="text-xs text-secondary">{row.company}</span>;
    if(key==="type")return <span className="text-xs text-secondary">{row.type}</span>;
    if(key==="lastNote")return <span className="text-xs text-secondary truncate block max-w-[250px]" title={row.lastNote}>{row.lastNote}</span>;
    return <span className="text-xs text-secondary">{String((row as any)[key]??"—")}</span>;
  }

  const Th=({col,isLocked}:{col:ColDef;isLocked?:boolean})=>(
    <th onClick={()=>toggleSort(col.key)} style={{minWidth:col.minWidth}} draggable={!isLocked} onDragStart={e=>{if(isLocked){e.preventDefault();return;}e.dataTransfer.setData("text/plain",col.key);}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(isLocked)return;const from=e.dataTransfer.getData("text/plain");if(!from||from===col.key||from===LOCKED_COL)return;const o=[...colState.order];const fi=o.indexOf(from);const ti=o.indexOf(col.key);if(fi<0||ti<0)return;o.splice(fi,1);o.splice(ti,0,from);updateCols({...colState,order:o});}}
      className={"cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap group/th"+(isLocked?" sticky left-10 bg-tertiary z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]":"")}>
      <span className="inline-flex items-center gap-1.5">{isLocked?<Lock01 className="size-3 text-fg-quaternary shrink-0"/>:<DotsGrid className="size-3 opacity-0 group-hover/th:opacity-50 cursor-grab shrink-0"/>}{col.label}<svg className={"size-3 "+(sortKey===col.key?"opacity-100":"opacity-20")} viewBox="0 0 10 12" fill="currentColor"><path d="M5 1l4 5H1z" opacity={sortDir==="asc"&&sortKey===col.key?"1":"0.4"}/><path d="M5 11l-4-5h8z" opacity={sortDir==="desc"&&sortKey===col.key?"1":"0.4"}/></svg></span>
    </th>
  );

  const totalAmount=filtered.reduce((s,r)=>s+r.amount,0);
  return (
    <div className="lg:flex min-h-screen" style={{background:"linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)"}}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems}/>
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"/>
      <main className="min-h-screen lg:flex-1 flex flex-col overflow-x-hidden">
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{fontFamily:"'Metrophobic', sans-serif"}}>Dishonours</h1>
              <p className="text-sm text-tertiary mt-0.5">{filtered.length} records · Total amount: <span className="font-medium text-primary">${totalAmount.toLocaleString()}</span></p>
            </div>
            <select value={companyFilter} onChange={e=>{setCompanyFilter(e.target.value);setPage(1);}} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer">
              <option value="All">Company</option>{COMPANIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-0 -mb-px">
            {([{key:"active",label:"Active Cases",count:MOCK.filter(r=>r.status===0).length},{key:"closed",label:"Closed Cases",count:MOCK.filter(r=>r.status!==0).length}] as const).map(({key,label,count})=>(
              <button key={key} onClick={()=>{setTab(key);setPage(1);setSelectedRows(new Set());}} className={"flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors "+(tab===key?"border-brand text-brand-secondary":"border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                {label}<span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold "+(tab===key?"bg-brand-solid text-white":"bg-secondary text-quaternary")}>{count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search dishonours..." className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-8 py-2 text-sm text-primary outline-none focus:border-brand"/>
            {search&&<button onClick={()=>{setSearch("");setPage(1);}} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5"/></button>}
          </div>
          {selectedRows.size>0&&<><span className="text-sm text-secondary font-medium">{selectedRows.size} selected</span><button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs font-medium text-secondary hover:bg-secondary">Assign To ▾</button></>}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={downloadCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary"><Download01 className="size-4"/>Download CSV</button>
            <div className="relative">
              <button onClick={()=>setColPanelOpen(v=>!v)} className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors "+(colPanelOpen?"border-brand bg-brand-secondary text-brand-secondary":"border-secondary bg-primary text-secondary hover:bg-secondary")}>
                <Settings01 className="size-4"/>Columns <span className="rounded-full bg-brand-solid text-white text-[10px] font-semibold px-1.5 py-0.5">{visibleCols.length}/{COLS.length}</span>
              </button>
              {colPanelOpen&&<ColPanel defs={COLS} order={colState.order} visible={colState.visible} onToggle={toggleCol} onReorder={o=>updateCols({...colState,order:o})} onClose={()=>setColPanelOpen(false)}/>}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-tertiary border-b border-secondary"><tr>
                <th className="px-3 py-3 w-10 sticky left-0 bg-tertiary z-10"><input type="checkbox" checked={selectedRows.size===pageRows.length&&pageRows.length>0} onChange={toggleAll} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer"/></th>
                {visibleCols.map((col:ColDef,idx:number)=><Th key={col.key} col={col} isLocked={idx===0}/>)}
              </tr></thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {pageRows.length===0?<tr><td colSpan={visibleCols.length+1} className="px-4 py-16 text-center text-sm text-quaternary">No dishonours found</td></tr>
                  :pageRows.map(row=>(
                  <tr key={row.id} onClick={()=>navigate(`/dishonour/${row.id}`)} className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                    <td className="px-3 py-2.5 sticky left-0 bg-primary group-hover:bg-secondary_alt z-10" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedRows.has(row.id)} onChange={()=>toggleRow(row.id)} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer"/></td>
                    {visibleCols.map((col:ColDef,idx:number)=><td key={col.key} className={"px-3 py-2.5"+(idx===0?" sticky left-10 bg-primary group-hover:bg-secondary_alt z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]":"")}>{renderCell(row,col.key)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages>1&&<div className="flex items-center gap-2 mt-4 flex-wrap"><span className="text-xs text-quaternary">Pages:</span><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">← Prev</button>{Array.from({length:Math.min(totalPages,10)},(_,i)=>i+1).map(p=><button key={p} onClick={()=>setPage(p)} className={"size-7 rounded text-xs font-medium "+(p===page?"bg-brand-solid text-white":"text-quaternary hover:bg-secondary")}>{p}</button>)}<button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">Next »</button></div>}
        </div>
      </main>
      {colPanelOpen&&<div className="fixed inset-0 z-40" onClick={()=>setColPanelOpen(false)}/>}
    </div>
  );
}
