import { SidebarSection } from "@/components/sidebar-section";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import type { FC } from "react";
import { ChevronDown, ChevronRight, Plus, X, Edit01, Check, File01, User01, Users01, Settings01, DotsGrid, Pin01, Pin02, MessageChatSquare, Send01, Calendar, Upload01, RefreshCw01 } from "@untitledui/icons";

interface NoteEntry { id: number; text: string; author: string; date: string; }
interface FieldDef  { key: string; label: string; defaultVisible: boolean; }
interface FieldState { order: string[]; visible: Record<string, boolean>; }

const DIS = {
  id: 1130, statusLabel: "New Case", statusColor: "#D34108",
  customer: { title:"Mr", firstName:"Andrew", lastName:"Mann", phone:"0404 063 739", email:"andrew_mann@hotmail.com", state:"QLD", address:"17 Lindeman Place", city:"Tingalpa", postcode:"4173" },
  info: {
    company:"TAL", policyId:"#7105098", amount:2210.01, type:"Initial Dishonour", reason:"N/a",
    dishonoured:"21/03/2026", expectedLapse:"28/05/2026", commission:1114.77,
    assignedTo:"Beau Portelli", createdOn:"24/03/2026", updatedOn:"31/07/2025 16:06",
    submittedOn:"01/03/2024", expectedCompletion:"2024-04-01", completedOn:"25/03/2024",
    pendingActions:"Initial follow up, SUPPORT ACTION - Call / Email",
    iExtendApplied:"", iExtendResponse:"",
  },
};
const FILE_LIBRARY = [{ date:"24/03/2026", name:"Policy - 7105098 MR ANDREW T MANN - Rollover Rejection Notification.eml" },{ date:"24/03/2026", name:"Overdue Notice_TAL_7105098_MANN, A...pdf" }];
const USERS_LIST = ["Beau Portelli","SLG Support","James Nicholls","Aldrine Regido","John Rojas","Rebel Servante"];

const SECTION_DEFS = [
  { id:"app_info",    label:"Application Information" },
  { id:"dis_info",    label:"Dishonour Information" },
  { id:"iextend",     label:"iExtend Information" },
  { id:"tasks",       label:"Tasks" },
  { id:"contact_info",label:"Contact Information" },
  { id:"activity_log",label:"Activity Log" },
];
const SECTIONS_KEY = "axis_dis_sections_v1";
function loadSO(): string[] { try { const r = localStorage.getItem(SECTIONS_KEY); if (r) return JSON.parse(r); } catch {} return SECTION_DEFS.map(s => s.id); }
function saveSO(o: string[]) { localStorage.setItem(SECTIONS_KEY, JSON.stringify(o)); }

const CUST_FIELDS: FieldDef[] = [
  { key:"phone",   label:"Phone",   defaultVisible:true  },
  { key:"email",   label:"Email",   defaultVisible:true  },
  { key:"address", label:"Address", defaultVisible:true  },
  { key:"city",    label:"City",    defaultVisible:false },
];
const FIELDS_KEY = "axis_dis_fields_v1";
function loadFS(): FieldState { try { const r = localStorage.getItem(FIELDS_KEY); if (r) return JSON.parse(r); } catch {} return { order: CUST_FIELDS.map((f:FieldDef)=>f.key), visible: Object.fromEntries(CUST_FIELDS.map((f:FieldDef)=>[f.key,f.defaultVisible])) }; }
function saveFS(s: FieldState) { localStorage.setItem(FIELDS_KEY, JSON.stringify(s)); }

function EditableSelect({ value, options }: { value: string; options: string[] }) {
  const [editing, setEditing] = useState(false); const [val, setVal] = useState(value);
  if (editing) return <span className="inline-flex items-center gap-1"><select value={val} onChange={e=>setVal(e.target.value)} autoFocus onBlur={()=>setEditing(false)} className="rounded border border-brand bg-primary px-1.5 py-0.5 text-xs text-primary outline-none">{options.map(o=><option key={o} value={o}>{o}</option>)}</select><button onClick={()=>setEditing(false)} className="flex size-5 items-center justify-center rounded bg-brand-solid text-white"><Check className="size-3"/></button></span>;
  return <button onClick={()=>setEditing(true)} className="flex items-center gap-1 group hover:text-brand-secondary text-sm text-primary font-medium">{val}<Edit01 className="size-3 text-quaternary opacity-0 group-hover:opacity-100"/></button>;
}

function DropdownButton({ label, icon: Icon, items }: { label:string;icon?:FC<{className?:string}>;items:{label:string;icon?:FC<{className?:string}>;danger?:boolean;onClick?:()=>void}[] }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[open]);
  return <div ref={ref} className="relative"><button onClick={()=>setOpen(o=>!o)} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary">{Icon&&<Icon className="size-3.5"/>}{label}</button>{open&&<div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden py-1">{items.map((item,i)=>{const ItemIcon=item.icon;return <button key={i} onClick={()=>{item.onClick?.();setOpen(false);}} className={"flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-secondary_alt "+(item.danger?"text-error-primary":"text-primary")}>{ItemIcon&&<ItemIcon className="size-3.5"/>}{item.label}</button>;})}</div>}</div>;
}

function StatusButton() {
  const [open,setOpen]=useState(false);const[current,setCurrent]=useState("New Case");const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[open]);
  const statuses=[{label:"In Progress",color:"#3B82F6"},{label:"On Hold",color:"#F59E0B"},{label:"Complete",color:"#22C55E"},{label:"Closed",color:"#6B7280"}];
  return <div ref={ref} className="relative"><button onClick={()=>setOpen(o=>!o)} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary">🔄 Set Status</button>{open&&<div className="absolute left-0 top-full mt-1 z-50 w-40 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden py-1">{statuses.map(s=><button key={s.label} onClick={()=>{setCurrent(s.label);setOpen(false);}} className={"flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-secondary_alt "+(current===s.label?"font-semibold":"text-primary")}><span className="size-2 rounded-full shrink-0" style={{background:s.color}}/>{s.label}{current===s.label&&<Check className="size-3 ml-auto text-brand-secondary"/>}</button>)}</div>}</div>;
}

function FieldPanel({ defs, state, onChange, onClose, anchorRef }: { defs:FieldDef[];state:FieldState;onChange:(s:FieldState)=>void;onClose:()=>void;anchorRef:React.RefObject<HTMLButtonElement|null>; }) {
  const dragIdx=useRef<number|null>(null);const[dragOver,setDragOver]=useState<number|null>(null);const[pos,setPos]=useState({top:0,right:0});
  const ordered:FieldDef[]=[];for(const k of state.order){const f=defs.find((d:FieldDef)=>d.key===k);if(f)ordered.push(f);}
  useEffect(()=>{if(!anchorRef.current)return;const r=anchorRef.current.getBoundingClientRect();const ph=Math.min(400,52+ordered.length*36);const top=window.innerHeight-r.bottom-8>=ph?r.bottom+4:Math.max(8,r.top-ph-4);setPos({top,right:Math.max(8,window.innerWidth-r.right)});});
  function onDrop(i:number){if(dragIdx.current===null||dragIdx.current===i)return;const n=[...state.order];const[m]=n.splice(dragIdx.current,1);n.splice(i,0,m);onChange({...state,order:n});dragIdx.current=null;setDragOver(null);}
  return createPortal(
    <div style={{position:"fixed",top:pos.top,right:pos.right,zIndex:9999,width:240}} className="rounded-xl border border-secondary bg-white shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary"><p className="text-xs font-semibold text-primary">Fields</p><div className="flex items-center gap-2"><button onClick={()=>onChange({order:defs.map((d:FieldDef)=>d.key),visible:Object.fromEntries(defs.map((d:FieldDef)=>[d.key,d.defaultVisible]))})} className="text-[10px] text-brand-secondary hover:underline">Reset</button><button onClick={onClose}><X className="size-3.5 text-quaternary"/></button></div></div>
      <ul className="overflow-y-auto py-1" style={{maxHeight:"min(320px,60vh)"}}>{ordered.map((f,i)=>(<li key={f.key} draggable onDragStart={()=>{dragIdx.current=i;}} onDragEnter={()=>setDragOver(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(i)} onDragEnd={()=>{dragIdx.current=null;setDragOver(null);}} className={"flex items-center gap-2.5 px-3 py-2 cursor-grab select-none "+(dragOver===i?"bg-brand-secondary":"hover:bg-secondary_alt")}><DotsGrid className="size-3.5 text-quaternary shrink-0"/><button onClick={()=>onChange({...state,visible:{...state.visible,[f.key]:!state.visible[f.key]}})} className={"flex size-4 shrink-0 items-center justify-center rounded "+(state.visible[f.key]?"bg-brand-solid":"border border-secondary bg-primary")}>{state.visible[f.key]&&<Check className="size-2.5 text-white"/>}</button><span className={"text-xs "+(state.visible[f.key]?"text-primary font-medium":"text-quaternary")}>{f.label}</span></li>))}</ul>
      <div className="border-t border-secondary px-3 py-2 flex items-center justify-between"><span className="text-[10px] text-quaternary">{ordered.filter(f=>state.visible[f.key]).length}/{ordered.length} visible</span><button onClick={onClose} className="text-[10px] font-medium text-brand-secondary hover:underline">Done</button></div>
    </div>, document.body
  );
}

function SectionCard({ id,title,children,action,actionLabel,defaultOpen=true,onDragStart,onDragOver,onDrop,onDragEnd,isDragOver,extraAction }:{id:string;title:string;children:React.ReactNode;action?:()=>void;actionLabel?:string;defaultOpen?:boolean;onDragStart?:(id:string)=>void;onDragOver?:(id:string)=>void;onDrop?:(id:string)=>void;onDragEnd?:()=>void;isDragOver?:boolean;extraAction?:React.ReactNode;}) {
  const [open,setOpen]=useState(defaultOpen);
  return <div draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";onDragStart?.(id);}} onDragOver={e=>{e.preventDefault();onDragOver?.(id);}} onDrop={()=>onDrop?.(id)} onDragEnd={()=>onDragEnd?.()} className={"rounded-xl border bg-primary overflow-hidden shadow-sm "+(isDragOver?"border-brand ring-2 ring-brand ring-opacity-30":"border-secondary")}><div className="flex w-full items-center justify-between px-3 py-3 hover:bg-secondary_alt"><div className="flex items-center gap-2 flex-1 min-w-0"><div className="cursor-grab text-quaternary p-0.5 shrink-0"><DotsGrid className="size-4"/></div><button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 flex-1 text-left"><div className="w-1 h-4 rounded-full bg-brand-solid shrink-0"/><span className="text-sm font-semibold text-primary truncate">{title}</span></button></div><div className="flex items-center gap-1.5 shrink-0">{extraAction}{action&&actionLabel&&<button onClick={e=>{e.stopPropagation();action();}} className="flex items-center gap-1 rounded-lg border border-secondary bg-primary px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary"><Plus className="size-3 text-success-primary"/>{actionLabel}</button>}<button onClick={()=>setOpen(o=>!o)}>{open?<ChevronDown className="size-4 text-quaternary"/>:<ChevronRight className="size-4 text-quaternary"/>}</button></div></div>{open&&<div className="border-t border-secondary">{children}</div>}</div>;
}

function IC({ label, value }: { label:string;value:React.ReactNode }) { return <div><p className="text-[11px] text-quaternary mb-0.5">{label}</p><div className="text-sm text-primary font-medium">{value||<span className="text-quaternary">—</span>}</div></div>; }

export function DishonourProfilePage() {
  const [noteText,setNoteText]=useState("");const[notes,setNotes]=useState<NoteEntry[]>([]);
  const [sidebarPinned,setSidebarPinned]=useState<boolean>(()=>{try{const v=localStorage.getItem("axis_dis_sidebar_v1");return v===null?true:v==="1";}catch{return true;}});
  const [mobileSidebarOpen,setMobileSidebarOpen]=useState(false);
  const [fieldState,setFieldState]=useState<FieldState>(loadFS);const[fieldPanelOpen,setFieldPanelOpen]=useState(false);const gearRef=useRef<HTMLButtonElement|null>(null);
  const [sectionOrder,setSectionOrder]=useState<string[]>(loadSO);const[dragId,setDragId]=useState<string|null>(null);const[dragOverId,setDragOverId]=useState<string|null>(null);
  function updateFS(s:FieldState){setFieldState(s);saveFS(s);}
  function handleDrop(toId:string){if(!dragId||dragId===toId)return;const n=[...sectionOrder];const fi=n.indexOf(dragId);const ti=n.indexOf(toId);n.splice(fi,1);n.splice(ti,0,dragId);setSectionOrder(n);saveSO(n);setDragId(null);setDragOverId(null);}
  function addNote(){if(!noteText.trim())return;setNotes(p=>[{id:Date.now(),text:noteText,author:"James Nicholls",date:new Date().toLocaleDateString("en-AU")},...p]);setNoteText("");}

  const dp=(id:string)=>({onDragStart:(sid:string)=>setDragId(sid),onDragOver:(sid:string)=>setDragOverId(sid),onDrop:handleDrop,onDragEnd:()=>{setDragId(null);setDragOverId(null);},isDragOver:dragOverId===id});

  function renderSection(id:string){
    switch(id){
      case "app_info": return (
        <SectionCard key={id} id={id} title="Application Information" {...dp(id)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <IC label="Assigned To" value={<EditableSelect value={DIS.info.assignedTo} options={USERS_LIST}/>}/>
            <IC label="Company" value={DIS.info.company}/>
            <IC label="Commission" value={`$${DIS.info.commission.toLocaleString()}`}/>
            <IC label="Policy ID" value={DIS.info.policyId}/>
            <IC label="Submitted On" value={DIS.info.submittedOn}/>
            <IC label="Updated On" value={DIS.info.updatedOn}/>
            <IC label="Expected Completion" value={DIS.info.expectedCompletion}/>
            <IC label="Completed On" value={DIS.info.completedOn}/>
          </div>
        </SectionCard>
      );
      case "dis_info": return (
        <SectionCard key={id} id={id} title="Dishonour Information" {...dp(id)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <IC label="Dishonour Date" value={DIS.info.dishonoured}/>
            <IC label="Amount" value={`$${DIS.info.amount.toLocaleString()}`}/>
            <IC label="Type" value={DIS.info.type}/>
            <IC label="Reason" value={DIS.info.reason}/>
            <IC label="Expected Lapse" value={DIS.info.expectedLapse}/>
            <IC label="Status" value={<span className="inline-flex rounded-full text-[11px] font-semibold px-2 py-0.5" style={{background:"#FFF4F0",color:"#D34108"}}>{DIS.statusLabel}</span>}/>
            <IC label="Created On" value={DIS.info.createdOn}/>
          </div>
        </SectionCard>
      );
      case "iextend": return (
        <SectionCard key={id} id={id} title="iExtend Information" defaultOpen={false} {...dp(id)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <IC label="iExtend Applied" value={DIS.info.iExtendApplied||"—"}/>
            <IC label="iExtend Response" value={DIS.info.iExtendResponse||"—"}/>
          </div>
        </SectionCard>
      );
      case "tasks": return (
        <SectionCard key={id} id={id} title="Tasks" actionLabel="New Task" action={()=>{}} {...dp(id)}>
          <div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead className="bg-tertiary border-b border-secondary"><tr>{["Task","Assigned To","Scheduled","Requested","Completed"].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-quaternary whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-secondary">
              <tr className="hover:bg-secondary_alt"><td className="px-4 py-2.5 text-xs text-primary">SUPPORT ACTION - Call / Email</td><td className="px-4 py-2.5 text-xs text-secondary">SLG Support</td><td className="px-4 py-2.5 text-xs text-tertiary">24/03/2026</td><td className="px-4 py-2.5 text-xs text-tertiary">24/03/2026 10:39 (today)</td><td className="px-4 py-2.5 text-xs text-tertiary">—</td></tr>
              <tr className="hover:bg-secondary_alt"><td className="px-4 py-2.5 text-xs text-primary">Initial follow up</td><td className="px-4 py-2.5 text-xs text-secondary">SLG Support</td><td className="px-4 py-2.5 text-xs text-tertiary">25/03/2026</td><td className="px-4 py-2.5 text-xs text-tertiary">24/03/2026 10:39 (today)</td><td className="px-4 py-2.5 text-xs text-tertiary">—</td></tr>
            </tbody>
          </table></div>
        </SectionCard>
      );
      case "contact_info": return (
        <SectionCard key={id} id={id} title="Contact Information" defaultOpen={false}
          extraAction={<div className="relative"><button ref={gearRef} onClick={e=>{e.stopPropagation();setFieldPanelOpen(v=>!v);}} className={"flex size-7 items-center justify-center rounded-lg border transition-colors "+(fieldPanelOpen?"border-brand bg-brand-secondary text-brand-secondary":"border-secondary hover:bg-secondary text-quaternary")}><Settings01 className="size-3.5"/></button>{fieldPanelOpen&&<FieldPanel defs={CUST_FIELDS} state={fieldState} onChange={updateFS} onClose={()=>setFieldPanelOpen(false)} anchorRef={gearRef}/>}</div>}
          {...dp(id)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <IC label="Phone" value={<span className="text-brand-secondary">{DIS.customer.phone}</span>}/>
            <IC label="Email" value={<span className="text-brand-secondary">{DIS.customer.email}</span>}/>
            <IC label="Address" value={DIS.customer.address}/>
            <IC label="City" value={`${DIS.customer.city} ${DIS.customer.postcode}`}/>
          </div>
        </SectionCard>
      );
      case "activity_log": return (
        <SectionCard key={id} id={id} title="Activity Log" defaultOpen={false} {...dp(id)}>
          <div className="px-4 py-4 text-sm text-quaternary text-center">No activity recorded</div>
        </SectionCard>
      );
      default: return null;
    }
  }

  const sidebarContent=(
    <div className="flex-1 min-w-0 overflow-y-auto px-3 pb-4 pt-2 space-y-2">
      <SidebarSection title="Client">
        <div className="rounded-lg px-3 py-2.5 flex items-center justify-between text-sm font-semibold text-white" style={{background:"#D34108"}}><span className="flex items-center gap-2 truncate"><User01 className="size-3.5 shrink-0"/>{DIS.customer.title} {DIS.customer.firstName} {DIS.customer.lastName}</span><span className="rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-[10px] shrink-0 ml-2">Dishonour</span></div>
      </SidebarSection>
      <SidebarSection title="Notes">
        <div className="flex gap-2 mb-2"><input value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Add a note..." onKeyDown={e=>e.key==="Enter"&&addNote()} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs outline-none focus:border-brand"/><button onClick={addNote} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-secondary hover:bg-secondary"><Plus className="size-4 text-secondary"/></button></div>
        {notes.length===0?<div className="flex flex-col items-center gap-2 py-4">
                  <svg className="size-8 text-quaternary" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 12h10M11 16h10M11 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-xs text-quaternary">No notes yet</p>
                </div>:<div className="space-y-2">{notes.map(n=><div key={n.id} className="rounded-lg border border-secondary bg-secondary_alt px-3 py-2"><p className="text-xs text-primary">{n.text}</p><p className="text-[10px] text-quaternary mt-1">{n.author} · {n.date}</p></div>)}</div>}
      </SidebarSection>
      <SidebarSection title="Scheduled Actions" action={{label:"New action",onClick:()=>{}}}>
        <p className="text-center text-xs text-quaternary py-3">No actions scheduled</p>
      </SidebarSection>
      <SidebarSection title="Attachments" defaultOpen={false}>
        <input placeholder="Search..." className="w-full rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs outline-none focus:border-brand mb-2"/>
        <div className="space-y-1">{FILE_LIBRARY.map((f,i)=><button key={i} className="flex items-start gap-2 w-full text-left hover:bg-secondary_alt rounded-lg p-1.5 transition-colors"><File01 className="size-3.5 text-quaternary shrink-0 mt-0.5"/><div className="min-w-0"><p className="text-[10px] text-quaternary">{f.date}</p><p className="text-xs text-brand-secondary hover:underline truncate">{f.name}</p></div></button>)}</div>
      </SidebarSection>
    </div>
  );

  return (
    <div className="lg:flex min-h-screen" style={{background:"linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)"}}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems}/><div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"/>
      <main className="flex-1 min-h-screen flex flex-col overflow-hidden">
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-primary" style={{fontFamily:"'Metrophobic', sans-serif"}}>{DIS.customer.title} {DIS.customer.firstName} {DIS.customer.lastName}</h1>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-secondary">
                <span>{DIS.statusLabel}</span>
                <span className="text-quaternary">|</span>
                <span>{DIS.info.company}</span>
                <span className="text-quaternary">|</span>
                <span>Created {DIS.info.createdOn}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              <StatusButton/>
              <DropdownButton label="Actions" icon={RefreshCw01} items={[
                {label:"SMS",      icon:MessageChatSquare},
                {label:"Email",    icon:Send01},
                {label:"Schedule", icon:Calendar},
                {label:"Upload Files",icon:Upload01},
                {label:"PDF",      icon:File01},
              ]}/>
              <button onClick={()=>setMobileSidebarOpen(true)} className="xl:hidden inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary"><Users01 className="size-3.5"/> More Info</button>
              <button title="Edit" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-secondary hover:bg-secondary hover:border-brand text-quaternary hover:text-brand-secondary"><Edit01 className="size-4"/></button>
            </div>
          </div>
        </div>
        <div className="flex flex-1 min-h-0 overflow-y-auto">
          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            <p className="text-[10px] text-quaternary px-1 flex items-center gap-1"><DotsGrid className="size-3"/> Drag sections to reorder</p>
            {sectionOrder.map(id=>renderSection(id))}
          </div>
          <div className={"shrink-0 border-l border-secondary bg-primary hidden xl:flex flex-col transition-all duration-200 "+(sidebarPinned?"w-80":"w-10")}>
            <div className={"flex items-center px-2 pt-2 pb-1 "+(sidebarPinned?"justify-end":"justify-center")}><button onClick={()=>setSidebarPinned(p=>{const n=!p;try{localStorage.setItem("axis_dis_sidebar_v1",n?"1":"0");}catch{}return n;})} className={"flex size-7 items-center justify-center rounded-lg transition-colors "+(sidebarPinned?"text-brand-secondary bg-brand-secondary":"text-quaternary hover:bg-secondary hover:text-secondary")}>{sidebarPinned?<Pin01 className="size-3.5"/>:<Pin02 className="size-3.5"/>}</button></div>
            {sidebarPinned&&sidebarContent}
          </div>
        </div>
      </main>
      {mobileSidebarOpen&&(<><div className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={()=>setMobileSidebarOpen(false)}/><div className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-primary border-l border-secondary flex flex-col xl:hidden shadow-2xl"><div className="flex items-center justify-end px-4 py-2 border-b border-secondary shrink-0"><button onClick={()=>setMobileSidebarOpen(false)} className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary"><X className="size-4"/></button></div>{sidebarContent}</div></>)}
      {fieldPanelOpen&&<div className="fixed inset-0 z-40" onClick={()=>setFieldPanelOpen(false)}/>}
    </div>
  );
}
