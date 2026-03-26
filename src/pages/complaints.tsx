import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01, X, Settings01, DotsGrid, Check } from "@untitledui/icons";

interface Complaint {
  id: number; customer: string; type: string; query: string; received: string;
  assignedTo: string; status: number; statusLabel: string; followUp: string | null;
  created: string; lastActionTime: string | null; lastNote: string; state: string;
  resolution: string;
}
interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }
const COLS: ColDef[] = [
  { key:"customer",       label:"Customer",      defaultVisible:true, minWidth:150 },
  { key:"type",           label:"Type",          defaultVisible:true  },
  { key:"query",          label:"Query",         defaultVisible:true, minWidth:200 },
  { key:"received",       label:"Received",      defaultVisible:true  },
  { key:"assignedTo",     label:"Assigned To",   defaultVisible:true  },
  { key:"statusLabel",    label:"Status",        defaultVisible:true  },
  { key:"followUp",       label:"Follow Up",     defaultVisible:false },
  { key:"created",        label:"Created",       defaultVisible:false },
  { key:"lastActionTime", label:"Last Action",   defaultVisible:true  },
  { key:"resolution",     label:"Resolution",    defaultVisible:false, minWidth:200 },
  { key:"lastNote",       label:"Last Note",     defaultVisible:true,  minWidth:200 },
];
const STORE_KEY = "axis_complaints_cols_v1";
function loadCols(d: ColDef[]) { try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch {} return { order: d.map((c: ColDef) => c.key), visible: Object.fromEntries(d.map((c: ColDef) => [c.key, c.defaultVisible])) }; }
function saveCols(s: {order:string[]; visible:Record<string,boolean>}) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

const TYPE_MAP: Record<number,string> = { 1:"Service Complaint", 2:"Advice Complaint", 3:"Product Complaint", 4:"Other" };

const MOCK: Complaint[] = [
  { id:7,  customer:"Mr Test Client",         type:"Other",             query:"Not told policy has gone in force",         received:"20/01/2025", assignedTo:"Sonny L",   status:2, statusLabel:"Resolved",  followUp:null, created:"21/01/2025", lastActionTime:"27/02/2026", lastNote:"test / fake case", state:"SA", resolution:"" },
  { id:6,  customer:"Miss Starling Bird",     type:"Other",             query:"Did not receive call back",                 received:"11/11/2024", assignedTo:"—",         status:2, statusLabel:"Resolved",  followUp:null, created:"11/12/2024", lastActionTime:"27/02/2026", lastNote:"test / fake case", state:"NSW", resolution:"" },
  { id:5,  customer:"Ms Nicky Test",          type:"Other",             query:"Adviser implemented higher sum insured",    received:"28/11/2024", assignedTo:"Nicky G",   status:2, statusLabel:"Resolved",  followUp:null, created:"29/11/2024", lastActionTime:"04/12/2024", lastNote:"The client stated they did not wish to apply for $1M cover", state:"NSW", resolution:"Reduce the sum insured and refund the client the additional premium debited. Provide formal apology." },
  { id:4,  customer:"Mr Alan Moran",          type:"Service Complaint", query:"Commissions",                               received:"02/06/2023", assignedTo:"Tracey D",  status:2, statusLabel:"Resolved",  followUp:null, created:"06/03/2023", lastActionTime:"27/02/2026", lastNote:"", state:"QLD", resolution:"" },
  { id:3,  customer:"Mr Hosseinali Fard",     type:"Service Complaint", query:"Metlife refund of uncovered premiums",      received:"07/11/2022", assignedTo:"Nicole T",  status:2, statusLabel:"Resolved",  followUp:null, created:"23/11/2022", lastActionTime:"04/04/2023", lastNote:"Completed: Metlife Complaints response for refunds", state:"SA", resolution:"" },
  { id:2,  customer:"Mr Guiseppe Tassone",    type:"Advice Complaint",  query:"Incorrect declaration made",                received:"13/03/2022", assignedTo:"Tracey D",  status:2, statusLabel:"Resolved",  followUp:null, created:"13/03/2022", lastActionTime:"27/02/2026", lastNote:"Adviser noted that advice was provided under personal rather than general", state:"NSW", resolution:"" },
  { id:1,  customer:"Test 2",                 type:"Service Complaint", query:"Premium was more than i was told",          received:"13/03/2022", assignedTo:"Tracey D",  status:2, statusLabel:"Resolved",  followUp:null, created:"13/03/2022", lastActionTime:"27/02/2026", lastNote:"Test / fake case", state:"QLD", resolution:"" },
];

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

export function ComplaintsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active"|"closed">("active");
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [colState, setColStateRaw] = useState(()=>loadCols(COLS));
  function updateCols(n:typeof colState){setColStateRaw(n);saveCols(n);}
  const visibleCols: ColDef[] = [];
  for (const k of colState.order){const c=COLS.find((d:ColDef)=>d.key===k);if(c&&colState.visible[c.key])visibleCols.push(c);}

  const filtered = useMemo(()=>{
    let rows = MOCK.filter(r=>tab==="active"?r.status===0:r.status!==0);
    if(search){const q=search.toLowerCase();rows=rows.filter(r=>r.customer.toLowerCase().includes(q)||r.query.toLowerCase().includes(q)||String(r.id).includes(q));}
    return [...rows].sort((a,b)=>{const va=String((a as any)[sortKey]??"");const vb=String((b as any)[sortKey]??"");return sortDir==="asc"?va.localeCompare(vb,undefined,{numeric:true}):vb.localeCompare(va,undefined,{numeric:true});});
  },[tab,search,sortKey,sortDir]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const pageRows=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  function toggleSort(k:string){if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("asc");}setPage(1);}
  function toggleRow(id:number){setSelectedRows(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});}
  function toggleAll(){if(selectedRows.size===pageRows.length)setSelectedRows(new Set());else setSelectedRows(new Set(pageRows.map(r=>r.id)));}
  function downloadCSV(){const csv=[visibleCols.map((c:ColDef)=>c.label).join(","),...filtered.map(r=>visibleCols.map((c:ColDef)=>`"${String((r as any)[c.key]??"").replace(/"/g,'""')}"`).join(","))].join("\n");const a=document.createElement("a");a.href="data:text/csv,"+encodeURIComponent(csv);a.download=`complaints-${tab}.csv`;a.click();}

  function renderCell(row:Complaint,key:string){
    if(key==="customer")return <span className="font-medium hover:underline" style={{color:"#D34108"}}>{row.customer}</span>;
    if(key==="statusLabel")return <span className="inline-flex rounded-full bg-green-50 text-green-700 text-[11px] font-semibold px-2 py-0.5">{row.statusLabel}</span>;
    if(key==="type")return <span className="inline-flex rounded-full bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5">{row.type}</span>;
    if(key==="query"||key==="resolution"||key==="lastNote")return <span className="text-xs text-secondary truncate block max-w-[250px]" title={String((row as any)[key])}>{String((row as any)[key])||"—"}</span>;
    return <span className="text-xs text-secondary">{String((row as any)[key]??"—")}</span>;
  }

  const Th=({col}:{col:ColDef})=>(
    <th onClick={()=>toggleSort(col.key)} style={{minWidth:col.minWidth}} draggable onDragStart={e=>e.dataTransfer.setData("text/plain",col.key)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const from=e.dataTransfer.getData("text/plain");if(!from||from===col.key)return;const o=[...colState.order];const fi=o.indexOf(from);const ti=o.indexOf(col.key);if(fi<0||ti<0)return;o.splice(fi,1);o.splice(ti,0,from);updateCols({...colState,order:o});}}
      className="cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap group/th">
      <span className="inline-flex items-center gap-1.5"><DotsGrid className="size-3 opacity-0 group-hover/th:opacity-50 cursor-grab shrink-0"/>{col.label}<svg className={"size-3 "+(sortKey===col.key?"opacity-100":"opacity-20")} viewBox="0 0 10 12" fill="currentColor"><path d="M5 1l4 5H1z" opacity={sortDir==="asc"&&sortKey===col.key?"1":"0.4"}/><path d="M5 11l-4-5h8z" opacity={sortDir==="desc"&&sortKey===col.key?"1":"0.4"}/></svg></span>
    </th>
  );

  return (
    <div className="lg:flex min-h-screen" style={{background:"linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)"}}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems}/>
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"/>
      <main className="min-h-screen lg:flex-1 flex flex-col overflow-x-hidden">
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{fontFamily:"'Metrophobic', sans-serif"}}>Complaints</h1>
              <p className="text-sm text-tertiary mt-0.5">{filtered.length} records</p>
            </div>
          </div>
          <div className="flex gap-0 -mb-px">
            {([{key:"active",label:"Active Cases",count:MOCK.filter(r=>r.status===0).length},{key:"closed",label:"Closed Cases",count:MOCK.filter(r=>r.status!==0).length}] as const).map(({key,label,count})=>(
              <button key={key} onClick={()=>{setTab(key);setPage(1);setSelectedRows(new Set());}} className={"flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors "+(tab===key?"border-brand text-brand-secondary":"border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                {label}<span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold "+(tab===key?"bg-brand-secondary text-brand-secondary":"bg-secondary text-quaternary")}>{count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search complaints..." className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-8 py-2 text-sm text-primary outline-none focus:border-brand"/>
            {search&&<button onClick={()=>{setSearch("");setPage(1);}} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5"/></button>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={downloadCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary"><Download01 className="size-4 text-success-primary"/>Download CSV</button>
            <div className="relative">
              <button onClick={()=>setColPanelOpen(v=>!v)} className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors "+(colPanelOpen?"border-brand bg-brand-secondary text-brand-secondary":"border-secondary bg-primary text-secondary hover:bg-secondary")}>
                <Settings01 className="size-4"/>Columns <span className="rounded-full bg-brand-secondary text-brand-secondary text-[10px] font-semibold px-1.5 py-0.5">{visibleCols.length}/{COLS.length}</span>
              </button>
              {colPanelOpen&&<ColPanel defs={COLS} order={colState.order} visible={colState.visible} onToggle={k=>updateCols({...colState,visible:{...colState.visible,[k]:!colState.visible[k]}})} onReorder={o=>updateCols({...colState,order:o})} onClose={()=>setColPanelOpen(false)}/>}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-xl border border-secondary overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-tertiary border-b border-secondary"><tr>
                <th className="px-3 py-3 w-10"><input type="checkbox" checked={selectedRows.size===pageRows.length&&pageRows.length>0} onChange={toggleAll} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer"/></th>
                {visibleCols.map((col:ColDef)=><Th key={col.key} col={col}/>)}
              </tr></thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {pageRows.length===0?<tr><td colSpan={visibleCols.length+1} className="px-4 py-16 text-center text-sm text-quaternary">No complaints found</td></tr>
                  :pageRows.map(row=>(
                  <tr key={row.id} onClick={()=>navigate(`/complaint/${row.id}`)} className="hover:bg-secondary_alt cursor-pointer transition-colors">
                    <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedRows.has(row.id)} onChange={()=>toggleRow(row.id)} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer"/></td>
                    {visibleCols.map((col:ColDef)=><td key={col.key} className="px-3 py-2.5">{renderCell(row,col.key)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {colPanelOpen&&<div className="fixed inset-0 z-40" onClick={()=>setColPanelOpen(false)}/>}
    </div>
  );
}
