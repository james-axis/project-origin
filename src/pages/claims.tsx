import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01, X, Settings01, DotsGrid, Check, Lock01 } from "@untitledui/icons";

interface Claim {
  id: number; customer: string; company: string; policyId: string;
  amount: number; value: number | null; status: number; statusLabel: string;
  assignedTo: string; created: string; lastActionTime: string | null;
  lastNote: string; followUp: string | null; pendingActions: string;
  state: string;
}

interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }

const COLS: ColDef[] = [
  { key:"customer",       label:"Customer",         defaultVisible:true,  minWidth:150 },
  { key:"company",        label:"Company",          defaultVisible:true  },
  { key:"policyId",       label:"Policy ID",        defaultVisible:true  },
  { key:"amount",         label:"Amount",           defaultVisible:true  },
  { key:"value",          label:"Value",            defaultVisible:false },
  { key:"statusLabel",    label:"Status",           defaultVisible:true  },
  { key:"followUp",       label:"Follow Up",        defaultVisible:false },
  { key:"created",        label:"Created",          defaultVisible:true  },
  { key:"lastActionTime", label:"Last Action",      defaultVisible:true  },
  { key:"assignedTo",     label:"Assigned To",      defaultVisible:true  },
  { key:"lastNote",       label:"Last Note",        defaultVisible:true,  minWidth:200 },
];
const STORE_KEY = "axis_claims_cols_v1";
function loadCols(d: ColDef[]) { try { const r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch {} return { order: d.map((c: ColDef) => c.key), visible: Object.fromEntries(d.map((c: ColDef) => [c.key, c.defaultVisible])) }; }
function saveCols(s: {order:string[]; visible:Record<string,boolean>}) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

const MOCK: Claim[] = [
  { id:126, customer:"Mr Mark Taylor",          company:"Acenda",          policyId:"#93243707",                   amount:11351,    value:null,    status:0, statusLabel:"New Case", assignedTo:"Nicole T",  created:"13/03 15:40 (11d)", lastActionTime:"17/03 06:47 (7d)",  lastNote:"SMS sent",                       followUp:null,         pendingActions:"FOLLOW UP ACENDA INITIAL CLAIM DOCS, Initial Claims Form", state:"QLD" },
  { id:125, customer:"Ms Meghan Dowdell",        company:"NEOS",            policyId:"#115054143, #115121612",      amount:4500,     value:1853.62, status:0, statusLabel:"New Case", assignedTo:"Caitlin G", created:"10/03 16:07 (14d)", lastActionTime:"24/03 10:20 (today)", lastNote:"New Task: Initial Claims Form",  followUp:null,         pendingActions:"Initial Claims Form", state:"QLD" },
  { id:124, customer:"Ms Audrey Yoke Leng Chiew",company:"OnePath",         policyId:"#77367442, #77415217",        amount:4745.18,  value:null,    status:0, statusLabel:"New Case", assignedTo:"Nicole T",  created:"02/03 15:20 (22d)", lastActionTime:"02/03 15:21 (22d)",  lastNote:"IP claim paid 27/02 - $4747.18", followUp:null,         pendingActions:"Initial Claims Form", state:"NSW" },
  { id:121, customer:"Mr Darren Reidy",          company:"ClearView",       policyId:"#550720571",                  amount:6000,     value:4073,    status:0, statusLabel:"New Case", assignedTo:"John R",    created:"04/02 08:11 (48d)", lastActionTime:"10/03 04:45 (14d)",  lastNote:"Task updated: Initial Claims Form", followUp:null,       pendingActions:"Initial Claims Form", state:"" },
  { id:120, customer:"Mr Cong Khanh (Khanh) Dao",company:"OnePath",         policyId:"#77373360",                   amount:11222,    value:2317,    status:0, statusLabel:"New Case", assignedTo:"Maysee C",  created:"04/02 03:15 (48d)", lastActionTime:"09/03 00:01 (15d)",  lastNote:"File uploaded: RE_ Income protection claim.msg", followUp:"20/03 10:59", pendingActions:"", state:"NSW" },
  { id:119, customer:"Mr Nathan Laidler",        company:"BT",              policyId:"#102328588MERCER",             amount:181095,   value:null,    status:0, statusLabel:"New Case", assignedTo:"Katie H",   created:"22/01 23:34 (61d)", lastActionTime:"10/02 05:57 (42d)",  lastNote:"Task updated: Initial Claims Form", followUp:null,       pendingActions:"Initial Claims Form", state:"QLD" },
  { id:118, customer:"Mr Simon Benedict",        company:"TAL",             policyId:"#CL602786",                   amount:3955.31,  value:2192.51, status:0, statusLabel:"New Case", assignedTo:"Toni S",    created:"21/01 04:59 (62d)", lastActionTime:"23/03 02:46 (1d)",   lastNote:"CLM-19143 - any paperwork rcvd by client...", followUp:null,    pendingActions:"Initial Claims Form", state:"VIC" },
  { id:117, customer:"Mathew Hall",              company:"NEOS",            policyId:"#111290036, #111442493",      amount:4000,     value:null,    status:0, statusLabel:"New Case", assignedTo:"Sonny L",   created:"19/01 00:15 (64d)", lastActionTime:"20/03 02:37 (4d)",   lastNote:"Neos have spoken with the client on the 9th March", followUp:null, pendingActions:"Initial Claims Form", state:"QLD" },
  { id:123, customer:"Mrs Nicky Tester Gardner", company:"NEOS",            policyId:"",                            amount:1000000,  value:null,    status:2, statusLabel:"Declined", assignedTo:"Joanne R",  created:"13/02 09:42",       lastActionTime:"13/02 10:15",        lastNote:"Cancelled: Initial Claims Form", followUp:null,          pendingActions:"", state:"QLD" },
  { id:122, customer:"Mr Test Client",           company:"Resolution Life", policyId:"#123456",                     amount:5000,     value:null,    status:2, statusLabel:"Completed",assignedTo:"Nicky G",   created:"05/02 03:55",       lastActionTime:"13/02 10:15",        lastNote:"Completed: Initial Claims Form", followUp:null,          pendingActions:"", state:"SA" },
];

const COMPANIES = ["Acenda","NEOS","OnePath","ClearView","TAL","BT","Resolution Life","Zurich","AIA","MetLife"];
const PAGE_SIZE = 20;

function ColPanel({ defs, order, visible, onToggle, onReorder, onClose }: {
  defs:ColDef[]; order:string[]; visible:Record<string,boolean>;
  onToggle:(k:string)=>void; onReorder:(o:string[])=>void; onClose:()=>void;
}) {
  const dragIdx = useRef<number|null>(null);
  const [dragOver, setDragOver] = useState<number|null>(null);
  const ordered: ColDef[] = [];
  for (const k of order) { const f = defs.find((d:ColDef)=>d.key===k); if (f) ordered.push(f); }
  function drop(i:number) { if (dragIdx.current===null||dragIdx.current===i) return; const n=[...order]; const [m]=n.splice(dragIdx.current,1); n.splice(i,0,m); onReorder(n); dragIdx.current=null; setDragOver(null); }
  return (
    <div className="absolute right-0 top-10 z-50 w-60 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary">
        <p className="text-xs font-semibold text-primary">Columns</p>
        <div className="flex items-center gap-2">
          <button onClick={()=>onReorder(defs.map((d:ColDef)=>d.key))} className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose}><X className="size-3.5 text-quaternary" /></button>
        </div>
      </div>
      <ul className="max-h-72 overflow-y-auto py-1">
        {ordered.map((col,i)=>(
          <li key={col.key} draggable onDragStart={()=>{dragIdx.current=i;}} onDragEnter={()=>setDragOver(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(i)} onDragEnd={()=>{dragIdx.current=null;setDragOver(null);}}
            className={"flex items-center gap-2.5 px-3 py-2 cursor-grab select-none "+(dragOver===i?"bg-brand-secondary":"hover:bg-secondary_alt")}>
            <DotsGrid className="size-3.5 text-quaternary shrink-0" />
            <button onClick={()=>onToggle(col.key)} className={"flex size-4 shrink-0 items-center justify-center rounded "+(visible[col.key]?"bg-brand-solid":"border border-secondary bg-primary")}>
              {visible[col.key]&&<Check className="size-2.5 text-white"/>}
            </button>
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

export function ClaimsPage() {
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
  // Build visibleCols with locked column first
  const visibleCols: ColDef[] = [];
  const lockedCol = COLS.find((c:ColDef)=>c.key===LOCKED_COL);
  if(lockedCol) visibleCols.push(lockedCol);
  for (const k of colState.order) { if(k===LOCKED_COL) continue; const c=COLS.find((d:ColDef)=>d.key===k); if(c&&colState.visible[c.key]) visibleCols.push(c); }

  const filtered = useMemo(()=>{
    let rows = MOCK.filter(r=>tab==="active"?r.status===0:r.status!==0);
    if (search){const q=search.toLowerCase();rows=rows.filter(r=>r.customer.toLowerCase().includes(q)||r.company.toLowerCase().includes(q)||r.policyId.toLowerCase().includes(q)||String(r.id).includes(q));}
    if (companyFilter!=="All") rows=rows.filter(r=>r.company===companyFilter);
    return [...rows].sort((a,b)=>{const va=String((a as any)[sortKey]??"");const vb=String((b as any)[sortKey]??"");return sortDir==="asc"?va.localeCompare(vb,undefined,{numeric:true}):vb.localeCompare(va,undefined,{numeric:true});});
  },[tab,search,companyFilter,sortKey,sortDir]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const pageRows=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  function toggleSort(k:string){if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("asc");}setPage(1);}
  function toggleRow(id:number){setSelectedRows(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});}
  function toggleAll(){if(selectedRows.size===pageRows.length)setSelectedRows(new Set());else setSelectedRows(new Set(pageRows.map(r=>r.id)));}
  function downloadCSV(){const csv=[visibleCols.map((c:ColDef)=>c.label).join(","),...filtered.map(r=>visibleCols.map((c:ColDef)=>`"${String((r as any)[c.key]??"").replace(/"/g,'""')}"`).join(","))].join("\n");const a=document.createElement("a");a.href="data:text/csv,"+encodeURIComponent(csv);a.download=`claims-${tab}.csv`;a.click();}

  function renderCell(row:Claim,key:string){
    if(key==="customer")return <span className="font-medium text-primary hover:underline">{row.customer}</span>;
    if(key==="statusLabel")return <span className="text-xs text-secondary">{row.statusLabel}</span>;
    if(key==="amount")return <span className="text-xs text-secondary">${(row.amount).toLocaleString()}</span>;
    if(key==="value")return <span className="text-xs text-secondary">{row.value?`$${row.value.toLocaleString()}`:"—"}</span>;
    if(key==="company")return <span className="text-xs text-secondary">{row.company}</span>;
    if(key==="lastNote")return <span className="text-xs text-secondary truncate block max-w-[250px]" title={row.lastNote}>{row.lastNote}</span>;
    return <span className="text-xs text-secondary">{String((row as any)[key]??"—")}</span>;
  }

  const Th=({col,isLocked}:{col:ColDef;isLocked?:boolean})=>(
    <th onClick={()=>toggleSort(col.key)} style={{minWidth:col.minWidth}} draggable={!isLocked} onDragStart={e=>{if(isLocked){e.preventDefault();return;}e.dataTransfer.setData("text/plain",col.key);}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(isLocked)return;const from=e.dataTransfer.getData("text/plain");if(!from||from===col.key||from===LOCKED_COL)return;const o=[...colState.order];const fi=o.indexOf(from);const ti=o.indexOf(col.key);if(fi<0||ti<0)return;o.splice(fi,1);o.splice(ti,0,from);updateCols({...colState,order:o});}}
      className={"cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap group/th"+(isLocked?" sticky left-10 bg-tertiary z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]":"")}>
      <span className="inline-flex items-center gap-1.5">{isLocked?<Lock01 className="size-3 text-fg-quaternary shrink-0"/>:<DotsGrid className="size-3 opacity-0 group-hover/th:opacity-50 cursor-grab shrink-0"/>}{col.label}
        <svg className={"size-3 "+(sortKey===col.key?"opacity-100":"opacity-20")} viewBox="0 0 10 12" fill="currentColor"><path d="M5 1l4 5H1z" opacity={sortDir==="asc"&&sortKey===col.key?"1":"0.4"}/><path d="M5 11l-4-5h8z" opacity={sortDir==="desc"&&sortKey===col.key?"1":"0.4"}/></svg>
      </span>
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
              <h1 className="text-xl font-semibold text-primary" style={{fontFamily:"'Metrophobic', sans-serif"}}>Claims</h1>
              <p className="text-sm text-tertiary mt-0.5">{filtered.length} records · Total amount: <span className="font-medium text-primary">${totalAmount.toLocaleString()}</span></p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={companyFilter} onChange={e=>{setCompanyFilter(e.target.value);setPage(1);}} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none appearance-none cursor-pointer">
                <option value="All">Company</option>{COMPANIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-0 -mb-px">
            {([{key:"active",label:"Active Cases",count:MOCK.filter(r=>r.status===0).length},{key:"closed",label:"Closed Cases",count:MOCK.filter(r=>r.status!==0).length}] as const).map(({key,label,count})=>(
              <button key={key} onClick={()=>{setTab(key);setPage(1);setSelectedRows(new Set());}}
                className={"flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors "+(tab===key?"border-brand text-brand-secondary":"border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                {label}<span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold "+(tab===key?"bg-brand-secondary text-brand-secondary":"bg-secondary text-quaternary")}>{count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search claims..." className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-8 py-2 text-sm text-primary outline-none focus:border-brand"/>
            {search&&<button onClick={()=>{setSearch("");setPage(1);}} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5"/></button>}
          </div>
          {selectedRows.size>0&&<><span className="text-sm text-secondary font-medium">{selectedRows.size} selected</span><button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs font-medium text-secondary hover:bg-secondary">Assign To ▾</button></>}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={downloadCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary"><Download01 className="size-4 text-success-primary"/>Download CSV</button>
            <div className="relative">
              <button onClick={()=>setColPanelOpen(v=>!v)} className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors "+(colPanelOpen?"border-brand bg-brand-secondary text-brand-secondary":"border-secondary bg-primary text-secondary hover:bg-secondary")}>
                <Settings01 className="size-4"/>Columns <span className="rounded-full bg-brand-secondary text-brand-secondary text-[10px] font-semibold px-1.5 py-0.5">{visibleCols.length}/{COLS.length}</span>
              </button>
              {colPanelOpen&&<ColPanel defs={COLS} order={colState.order} visible={colState.visible} onToggle={toggleCol} onReorder={o=>updateCols({...colState,order:o})} onClose={()=>setColPanelOpen(false)}/>}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-tertiary border-b border-secondary">
                <tr>
                  <th className="px-3 py-3 w-10 sticky left-0 bg-tertiary z-10"><input type="checkbox" checked={selectedRows.size===pageRows.length&&pageRows.length>0} onChange={toggleAll} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer"/></th>
                  {visibleCols.map((col:ColDef,idx:number)=><Th key={col.key} col={col} isLocked={idx===0}/>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {pageRows.length===0?<tr><td colSpan={visibleCols.length+1} className="px-4 py-16 text-center text-sm text-quaternary">No claims found</td></tr>
                  :pageRows.map(row=>(
                  <tr key={row.id} onClick={()=>navigate(`/claim/${row.id}`)} className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                    <td className="px-3 py-2.5 sticky left-0 bg-primary group-hover:bg-secondary_alt z-10" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedRows.has(row.id)} onChange={()=>toggleRow(row.id)} className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer"/></td>
                    {visibleCols.map((col:ColDef,idx:number)=><td key={col.key} className={"px-3 py-2.5"+(idx===0?" sticky left-10 bg-primary group-hover:bg-secondary_alt z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]":"")}>{renderCell(row,col.key)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages>1&&(
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-quaternary">Pages:</span>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">← Prev</button>
              {Array.from({length:Math.min(totalPages,10)},(_,i)=>i+1).map(p=><button key={p} onClick={()=>setPage(p)} className={"size-7 rounded text-xs font-medium "+(p===page?"bg-brand-solid text-white":"text-quaternary hover:bg-secondary")}>{p}</button>)}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="text-xs text-secondary hover:text-primary disabled:opacity-30 px-1">Next »</button>
            </div>
          )}
        </div>
      </main>
      {colPanelOpen&&<div className="fixed inset-0 z-40" onClick={()=>setColPanelOpen(false)}/>}
    </div>
  );
}
