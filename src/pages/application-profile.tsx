import { useState, useRef, useEffect, createPortal } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import {
  ChevronDown, ChevronRight, Plus, X, Edit01, Phone01, Mail01, Check,
  File01, User01, Users01, Tag01, Settings01, DotsGrid, Pin01, Pin02,
} from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NoteEntry     { id: number; text: string; author: string; date: string; }
interface TaskRow       { name: string; assignedTo: string; requested: string; }
interface PolicyIdRow   { cover: string; exclusions: string; status: string; date: string; }
interface ActivityEntry { date: string; user: string; action: string; }

// ─── Application data (seeded from DB #18142) ─────────────────────────────────
const APP = {
  id: 18142,
  title: "Life, Trauma and TPD Insurance Application",
  customer: { title:"Mr", firstName:"Jawed", lastName:"Jamshedi", preferredName:"Jawed",
    dob:"07/11/1989", age:36, gender:"Male", smoker:false,
    employment:"Self-Employed", occupation:"Self-Employed",
    salary:50000, height:165, weight:73, bmi:"26.81",
    maritalStatus:"Married", children:2, childrenAges:"3, 1",
    state:"VIC", city:"Narre Warren", postcode:"3805", address:"8 St James Ct",
    phone:"0402 499 390", phone2:"", email:"jawedjamshedi@yahoo.com", email2:"",
    contactTime:"",
  },
  info: {
    insurer: "Acenda", assignedTo: "Kam Rowshan", adviser: "Kam.Rowshan",
    inSuper: "In Super", appType: "New Application",
    insuranceType: "Life, Trauma, TPD", premium: 1542.84, premiumType: "Annually",
    commission: 925.70, ongoingCommission: 0,
    createdOn: "23/03/2026", updatedOn: "23/03/2026 20:26",
    submittedOn: "23/03/2026", expectedCompletion: "",
    policyId: "",
  },
  status: 0, statusLabel: "New App",
  statusColor: "#D34108",
  tags: [] as string[],
};

const TASKS: TaskRow[] = [
  { name:"Upload Face to Face Documents (If Applicable)", assignedTo:"Kam R", requested:"23/03/2026 20:26 (1 days)" },
  { name:"Send 'application submitted' email to Client",  assignedTo:"Kam R", requested:"23/03/2026 20:26 (1 days)" },
  { name:"Input Life Insurance Amounts & Premiums",       assignedTo:"Kam R", requested:"23/03/2026 20:26 (1 days)" },
  { name:"Generate Client Cancellation Letter",           assignedTo:"Kam R", requested:"23/03/2026 20:26 (1 days)" },
  { name:"Complete application in CRM",                   assignedTo:"Kam R", requested:"23/03/2026 20:26 (1 days)" },
  { name:"Add Policy/ Application Number",                assignedTo:"Kam R", requested:"23/03/2026 20:26 (1 days)" },
];

const POLICY_IDS: PolicyIdRow[] = [
  { cover:"TPD Cover",     exclusions:"No", status:"Pending", date:"23/03/2026 20:26" },
  { cover:"Trauma Cover",  exclusions:"No", status:"Pending", date:"23/03/2026 20:26" },
];

const ACTIVITY: ActivityEntry[] = [
  { date:"23/03/2026 20:26", user:"Kam Rowshan", action:"Application assigned to Kam R" },
  { date:"23/03/2026 20:26", user:"Kam Rowshan", action:"Life Insurance, Trauma Cover and TPD Insurance application with Acenda submitted" },
];

const FILE_LIBRARY = [
  { date:"15/10/2025", name:"SLS_Limited APL_Scripting_Oct 2025.pdf" },
  { date:"15/10/2025", name:"SLS_Full APL_Scripting_Oct 2025.pdf" },
  { date:"27/09/2025", name:"Acenda | PDS - Acenda Pds.pdf" },
];

const PRE_ASSESSMENTS = [
  { date:"23/03/2026 20:26", company:"Acenda", note:"NA" },
];

const USERS_LIST = ["Kam Rowshan","SLG Support","Maysee Chang","James Nicholls","John Rojas","Dean Hines","Lucas Kenyon","Adam Cowburn","Advice Team","Audits Team"];
const INSURERS   = ["Acenda","NEOS","MetLife","OnePath","TAL","Encompass","ClearView","Zurich","AIA","Asteron"];

// ─── Section defs ─────────────────────────────────────────────────────────────
const SECTION_DEFS = [
  { id:"customer_info",  label:"Customer Information" },
  { id:"app_info",       label:"Application Information" },
  { id:"insurance_products", label:"Insurance Products" },
  { id:"tasks",          label:"Tasks" },
  { id:"policy_ids",     label:"Policy IDs" },
  { id:"contact_info",   label:"Contact Information" },
  { id:"activity_log",   label:"Activity Log" },
];
const SECTIONS_KEY = "axis_app_profile_sections_v1";
function loadSectionOrder(): string[] { try { const r = localStorage.getItem(SECTIONS_KEY); if (r) return JSON.parse(r); } catch {} return SECTION_DEFS.map(s => s.id); }
function saveSectionOrder(o: string[]) { localStorage.setItem(SECTIONS_KEY, JSON.stringify(o)); }

// ─── Field defs for Customer Information ──────────────────────────────────────
interface FieldDef { key: string; label: string; defaultVisible: boolean; }
const CUST_FIELD_DEFS: FieldDef[] = [
  { key:"name",        label:"First/Middle Name",        defaultVisible:true  },
  { key:"lastName",    label:"Last Name",                defaultVisible:true  },
  { key:"employment",  label:"Employment / Occupation",  defaultVisible:true  },
  { key:"dob",         label:"DOB (Age)",                defaultVisible:true  },
  { key:"gender",      label:"Gender",                   defaultVisible:true  },
  { key:"state",       label:"State",                    defaultVisible:true  },
  { key:"contacts",    label:"Contacts Made",            defaultVisible:true  },
  { key:"salary",      label:"Salary",                   defaultVisible:true  },
  { key:"salary70",    label:"70% of Salary",            defaultVisible:true  },
  { key:"marital",     label:"Marital Status",           defaultVisible:true  },
  { key:"children",    label:"Children",                 defaultVisible:true  },
  { key:"height",      label:"Height",                   defaultVisible:false },
  { key:"weight",      label:"Weight",                   defaultVisible:false },
  { key:"bmi",         label:"BMI",                      defaultVisible:true  },
  { key:"smoker",      label:"Smoker Status",            defaultVisible:true  },
  { key:"phone",       label:"Phone",                    defaultVisible:false },
  { key:"email",       label:"Email",                    defaultVisible:false },
  { key:"address",     label:"Address",                  defaultVisible:false },
];
interface FieldState { order: string[]; visible: Record<string, boolean>; }
const FIELDS_KEY = "axis_app_fields_v1";
function loadFieldState(): FieldState { try { const r = localStorage.getItem(FIELDS_KEY); if (r) return JSON.parse(r); } catch {} return { order: CUST_FIELD_DEFS.map(f => f.key), visible: Object.fromEntries(CUST_FIELD_DEFS.map(f => [f.key, f.defaultVisible])) }; }
function saveFieldState(s: FieldState) { localStorage.setItem(FIELDS_KEY, JSON.stringify(s)); }

// ─── Reusable components ──────────────────────────────────────────────────────
function EditableSelect({ value, options }: { value: string; options: string[] }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (editing) return (
    <span className="inline-flex items-center gap-1">
      <select value={val} onChange={e => setVal(e.target.value)} autoFocus onBlur={() => setEditing(false)}
        className="rounded border border-brand bg-primary px-1.5 py-0.5 text-xs text-primary outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <button onClick={() => setEditing(false)} className="flex size-5 items-center justify-center rounded bg-brand-solid text-white"><Check className="size-3" /></button>
    </span>
  );
  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1 group hover:text-brand-secondary transition-colors text-sm text-primary font-medium">
      {val}<Edit01 className="size-3 text-quaternary opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function EditableField({ label, value, options }: { label: string; value: string; options?: string[] }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLSelectElement>(null);
  useEffect(() => { if (editing) (ref.current as HTMLElement | null)?.focus(); }, [editing]);
  return (
    <div className="flex items-center justify-between py-2 border-b border-secondary last:border-0">
      {label && <div className="flex items-center gap-2 text-xs text-tertiary shrink-0"><User01 className="size-3.5 text-quaternary" />{label}:</div>}
      {editing ? (
        <div className="flex items-center gap-1">
          {options ? <select ref={ref as React.RefObject<HTMLSelectElement>} value={val} onChange={e => setVal(e.target.value)} onBlur={() => setEditing(false)} className="rounded border border-brand bg-primary px-2 py-0.5 text-xs text-primary outline-none">{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
            : <input ref={ref as React.RefObject<HTMLInputElement>} value={val} onChange={e => setVal(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={e => e.key==="Enter"&&setEditing(false)} className="rounded border border-brand bg-primary px-2 py-0.5 text-xs text-primary outline-none w-32" />}
          <button onClick={() => setEditing(false)} className="flex size-5 items-center justify-center rounded bg-brand-solid text-white"><Check className="size-3" /></button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 group">
          <span className="text-xs font-medium text-primary group-hover:text-brand-secondary transition-colors">{val}</span>
          <Edit01 className="size-3 text-quaternary opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
}

function DropdownButton({ label, icon, items }: { label: string; icon?: string; items: { label: string; icon?: string; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary transition-colors">
        {icon && <span>{icon}</span>}{label}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden py-1">
          {items.map((item, i) => (
            <button key={i} onClick={() => setOpen(false)} className={"flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-secondary_alt transition-colors " + (item.danger?"text-error-primary":"text-primary")}>
              {item.icon && <span>{item.icon}</span>}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Field panel ──────────────────────────────────────────────────────────────
function FieldPanel({ defs, state, onChange, onClose, anchorRef }: {
  defs: FieldDef[]; state: FieldState; onChange: (s: FieldState) => void; onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const ordered = state.order.map(k => defs.find(d => d.key === k)).filter((d): d is FieldDef => !!d);

  useEffect(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const panelH = Math.min(400, 52 + ordered.length * 36);
    const top = window.innerHeight - r.bottom - 8 >= panelH ? r.bottom + 4 : Math.max(8, r.top - panelH - 4);
    setPos({ top, right: Math.max(8, window.innerWidth - r.right) });
  });

  function onDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...state.order]; const [m] = next.splice(dragIdx.current, 1); next.splice(i, 0, m);
    onChange({ ...state, order: next }); dragIdx.current = null; setDragOver(null);
  }

  return createPortal(
    <div style={{ position:"fixed", top:pos.top, right:pos.right, zIndex:9999, width:240 }}
      className="rounded-xl border border-secondary bg-white shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary">
        <p className="text-xs font-semibold text-primary">Fields</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onChange({ order: defs.map(d => d.key), visible: Object.fromEntries(defs.map(d => [d.key, d.defaultVisible])) })} className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose} className="text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>
        </div>
      </div>
      <p className="text-[10px] text-quaternary px-3 pt-2 pb-1">Drag to reorder · toggle to show/hide</p>
      <ul className="overflow-y-auto py-1" style={{ maxHeight:"min(320px,60vh)" }}>
        {ordered.map((f, i) => (
          <li key={f.key} draggable
            onDragStart={() => { dragIdx.current = i; }} onDragEnter={() => setDragOver(i)}
            onDragOver={e => e.preventDefault()} onDrop={() => onDrop(i)}
            onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
            className={"flex items-center gap-2.5 px-3 py-2 cursor-grab select-none transition-colors " + (dragOver===i?"bg-brand-secondary":"hover:bg-secondary_alt")}>
            <DotsGrid className="size-3.5 text-quaternary shrink-0" />
            <button onClick={() => { onChange({ ...state, visible: { ...state.visible, [f.key]: !state.visible[f.key] } }); }}
              className={"flex size-4 shrink-0 items-center justify-center rounded transition-colors " + (state.visible[f.key]?"bg-brand-solid":"border border-secondary bg-primary")}>
              {state.visible[f.key] && <Check className="size-2.5 text-white" />}
            </button>
            <span className={"text-xs " + (state.visible[f.key]?"text-primary font-medium":"text-quaternary")}>{f.label}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-secondary px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] text-quaternary">{ordered.filter(f => state.visible[f.key]).length}/{ordered.length} visible</span>
        <button onClick={onClose} className="text-[10px] font-medium text-brand-secondary hover:underline">Done</button>
      </div>
    </div>,
    document.body
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ id, title, children, action, actionLabel, defaultOpen=true,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragOver, extraAction }: {
  id: string; title: string; children: React.ReactNode;
  action?: () => void; actionLabel?: string; defaultOpen?: boolean;
  onDragStart?: (id: string) => void; onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void; onDragEnd?: () => void; isDragOver?: boolean;
  extraAction?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div draggable onDragStart={e => { e.dataTransfer.effectAllowed="move"; onDragStart?.(id); }}
      onDragOver={e => { e.preventDefault(); onDragOver?.(id); }} onDrop={() => onDrop?.(id)} onDragEnd={() => onDragEnd?.()}
      className={"rounded-xl border bg-primary overflow-hidden transition-all shadow-sm " + (isDragOver?"border-brand ring-2 ring-brand ring-opacity-30":"border-secondary")}>
      <div className="flex w-full items-center justify-between px-3 py-3 hover:bg-secondary_alt transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="cursor-grab text-quaternary p-0.5 shrink-0"><DotsGrid className="size-4" /></div>
          <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 text-left">
            <div className="w-1 h-4 rounded-full bg-brand-solid shrink-0" />
            <span className="text-sm font-semibold text-primary truncate">{title}</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {extraAction}
          {action && actionLabel && (
            <button onClick={e => { e.stopPropagation(); action(); }}
              className="flex items-center gap-1 rounded-lg border border-secondary bg-primary px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary">
              <Plus className="size-3 text-success-primary" />{actionLabel}
            </button>
          )}
          <button onClick={() => setOpen(o => !o)}>
            {open ? <ChevronDown className="size-4 text-quaternary" /> : <ChevronRight className="size-4 text-quaternary" />}
          </button>
        </div>
      </div>
      {open && <div className="border-t border-secondary">{children}</div>}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="text-[11px] text-quaternary mb-0.5">{label}</p><div className="text-sm text-primary font-medium">{value || <span className="text-quaternary">—</span>}</div></div>;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ApplicationProfilePage() {
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => {
    try { const v = localStorage.getItem("axis_app_sidebar_v1"); return v === null ? true : v === "1"; } catch { return true; }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [clientsExpanded, setClientsExpanded] = useState(true);
  const [fieldState, setFieldState] = useState<FieldState>(loadFieldState);
  const [fieldPanelOpen, setFieldPanelOpen] = useState(false);
  const gearBtnRef = useRef<HTMLButtonElement | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>(loadSectionOrder);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  function updateFieldState(s: FieldState) { setFieldState(s); saveFieldState(s); }
  function handleSectionDrop(toId: string) {
    if (!dragSectionId || dragSectionId === toId) return;
    const next = [...sectionOrder]; const fi = next.indexOf(dragSectionId); const ti = next.indexOf(toId);
    next.splice(fi, 1); next.splice(ti, 0, dragSectionId);
    setSectionOrder(next); saveSectionOrder(next); setDragSectionId(null); setDragOverSectionId(null);
  }

  function addNote() {
    if (!noteText.trim()) return;
    setNotes(prev => [{ id:Date.now(), text:noteText, author:"James Nicholls", date:new Date().toLocaleDateString("en-AU") }, ...prev]);
    setNoteText("");
  }

  // Customer info grid
  const visibleFields: FieldDef[] = [];
  for (const k of fieldState.order) {
    const f = CUST_FIELD_DEFS.find(d => d.key === k);
    if (f && fieldState.visible[f.key]) visibleFields.push(f);
  }
  function renderFieldValue(key: string): React.ReactNode {
    const c = APP.customer;
    switch (key) {
      case "name":       return `${c.title} ${c.firstName}`;
      case "lastName":   return c.lastName;
      case "employment": return `${c.employment} / ${c.occupation}`;
      case "dob":        return `${c.dob} (${c.age} years old)`;
      case "gender":     return c.gender;
      case "state":      return `${c.state} (08:00)`;
      case "contacts":   return (<span className="flex items-center gap-2"><span className="flex items-center gap-1 text-quaternary"><Phone01 className="size-3" />0</span><span className="flex items-center gap-1 text-quaternary"><Mail01 className="size-3" />0</span></span>);
      case "salary":     return `$${c.salary.toLocaleString()}.00`;
      case "salary70":   return `$${Math.round(c.salary*0.7/12).toLocaleString()}.67`;
      case "marital":    return c.maritalStatus;
      case "children":   return `${c.children} children (aged ${c.childrenAges})`;
      case "height":     return `${c.height} cm`;
      case "weight":     return `${c.weight} kg`;
      case "bmi":        return c.bmi;
      case "smoker":     return c.smoker ? "Smoker" : "Non-smoker";
      case "phone":      return <span className="text-brand-secondary">{c.phone}</span>;
      case "email":      return <span className="text-brand-secondary">{c.email}</span>;
      case "address":    return `${c.address}, ${c.city} ${c.state} ${c.postcode}`;
      default:           return "—";
    }
  }

  const dragProps = (id: string) => ({
    onDragStart: (sid: string) => setDragSectionId(sid),
    onDragOver:  (sid: string) => setDragOverSectionId(sid),
    onDrop:      handleSectionDrop,
    onDragEnd:   () => { setDragSectionId(null); setDragOverSectionId(null); },
    isDragOver:  dragOverSectionId === id,
  });

  function renderSection(id: string) {
    switch (id) {
      case "customer_info": return (
        <SectionCard key={id} id={id} title="Customer Information" {...dragProps(id)}
          extraAction={
            <div className="relative">
              <button ref={gearBtnRef} onClick={e => { e.stopPropagation(); setFieldPanelOpen(v => !v); }}
                title="Show/hide fields"
                className={"flex size-7 items-center justify-center rounded-lg border transition-colors " + (fieldPanelOpen?"border-brand bg-brand-secondary text-brand-secondary":"border-secondary hover:bg-secondary text-quaternary")}>
                <Settings01 className="size-3.5" />
              </button>
              {fieldPanelOpen && <FieldPanel defs={CUST_FIELD_DEFS} state={fieldState} onChange={updateFieldState} onClose={() => setFieldPanelOpen(false)} anchorRef={gearBtnRef} />}
            </div>
          }>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            {visibleFields.map(f => <InfoCell key={f.key} label={f.label} value={renderFieldValue(f.key)} />)}
          </div>
          {APP.tags.length > 0 && (
            <div className="flex items-center gap-2 px-4 pb-3">
              <Tag01 className="size-3.5 text-quaternary" />
              <span className="text-xs text-quaternary">Tags:</span>
              {APP.tags.map(t => <span key={t} className="text-xs font-semibold text-brand-secondary hover:underline cursor-pointer">{t}</span>)}
            </div>
          )}
        </SectionCard>
      );
      case "app_info": return (
        <SectionCard key={id} id={id} title="Application Information" {...dragProps(id)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <InfoCell label="Insurer" value={<EditableSelect value={APP.info.insurer} options={INSURERS} />} />
            <InfoCell label="Assigned To" value={<EditableSelect value={APP.info.assignedTo} options={USERS_LIST} />} />
            <InfoCell label="Adviser" value={APP.info.adviser} />
            <InfoCell label="In Super" value={APP.info.inSuper} />
            <InfoCell label="Application Type" value={APP.info.appType} />
            <InfoCell label="Insurance Type" value={APP.info.insuranceType} />
            <InfoCell label="Insurance Premium" value={`$${APP.info.premium.toFixed(2)}`} />
            <InfoCell label="Premium Type" value={APP.info.premiumType} />
            <InfoCell label="Commission" value={`$${APP.info.commission.toFixed(2)}`} />
            <InfoCell label="Ongoing Commission" value={APP.info.ongoingCommission ? `$${APP.info.ongoingCommission.toFixed(2)}` : "—"} />
            <InfoCell label="Created On" value={APP.info.createdOn} />
            <InfoCell label="Updated On" value={APP.info.updatedOn} />
            <InfoCell label="Submitted On" value={APP.info.submittedOn} />
            <InfoCell label="Expected Completion" value={APP.info.expectedCompletion || "—"} />
          </div>
        </SectionCard>
      );
      case "insurance_products": return (
        <SectionCard key={id} id={id} title="Insurance Products" defaultOpen={false} {...dragProps(id)}>
          {POLICY_IDS.length === 0 ? (
            <div className="px-4 py-4 text-sm text-quaternary text-center">No insurance products added</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-secondary_alt border-b border-secondary">
                  <tr>{["Cover","Exclusions","Status","Date",""].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-quaternary whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-secondary">
                  {POLICY_IDS.map((row, i) => (
                    <tr key={i} className="hover:bg-secondary_alt">
                      <td className="px-4 py-2.5 text-xs text-primary font-medium">{row.cover}</td>
                      <td className="px-4 py-2.5 text-xs text-secondary">{row.exclusions}</td>
                      <td className="px-4 py-2.5"><span className="rounded-full bg-secondary text-secondary text-[10px] px-2 py-0.5 font-medium">{row.status}</span></td>
                      <td className="px-4 py-2.5 text-xs text-tertiary">{row.date}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button className="rounded border border-secondary px-2 py-0.5 text-[10px] text-secondary hover:bg-secondary">Edit</button>
                          <button className="rounded border border-error-primary px-2 py-0.5 text-[10px] text-error-primary hover:bg-[#FEF2F2]">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      );
      case "tasks": return (
        <SectionCard key={id} id={id} title="Tasks" actionLabel="New Task" action={() => {}} {...dragProps(id)}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-secondary_alt border-b border-secondary">
                <tr>{["Task","Assigned To","Scheduled","Requested","Completed"].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-quaternary whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {TASKS.map((t, i) => (
                  <tr key={i} className="hover:bg-secondary_alt cursor-pointer">
                    <td className="px-4 py-2.5 text-xs text-primary">{t.name}</td>
                    <td className="px-4 py-2.5 text-xs text-secondary">{t.assignedTo}</td>
                    <td className="px-4 py-2.5 text-xs text-tertiary">—</td>
                    <td className="px-4 py-2.5 text-xs text-tertiary">{t.requested}</td>
                    <td className="px-4 py-2.5 text-xs text-tertiary">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      );
      case "policy_ids": return (
        <SectionCard key={id} id={id} title="Policy IDs" defaultOpen={false} actionLabel="Add Policy ID" action={() => {}} {...dragProps(id)}>
          <div className="px-4 py-4 text-sm text-quaternary text-center">No policy IDs added</div>
        </SectionCard>
      );
      case "contact_info": return (
        <SectionCard key={id} id={id} title="Contact Information" defaultOpen={false} {...dragProps(id)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <InfoCell label="Phone" value={<span className="text-brand-secondary">{APP.customer.phone}</span>} />
            <InfoCell label="Additional Phone(s)" value={APP.customer.phone2 || "—"} />
            <InfoCell label="Preferred Contact Time" value={APP.customer.contactTime || "—"} />
            <div className="col-span-2"><InfoCell label="Email" value={<span className="text-brand-secondary">{APP.customer.email}</span>} /></div>
            <InfoCell label="Address" value={APP.customer.address} />
            <InfoCell label="City" value={APP.customer.city} />
            <InfoCell label="Postcode" value={APP.customer.postcode} />
          </div>
        </SectionCard>
      );
      case "activity_log": return (
        <SectionCard key={id} id={id} title="Activity Log" defaultOpen={false} {...dragProps(id)}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-secondary_alt border-b border-secondary">
                <tr>{["Date","User","Action"].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-quaternary whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {ACTIVITY.map((row, i) => (
                  <tr key={i} className="hover:bg-secondary_alt">
                    <td className="px-4 py-2.5 text-xs text-tertiary whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-2.5 text-xs text-primary font-medium">{row.user}</td>
                    <td className="px-4 py-2.5 text-xs text-secondary">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      );
      default: return null;
    }
  }

  const sidebarContent = (
    <div className="flex-1 min-w-0 overflow-y-auto px-3 pb-4 space-y-4">
      {/* Clients & Applications */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-primary">Clients & Applications</p>
          <div className="flex items-center gap-1">
            <button className="flex size-7 items-center justify-center rounded-lg border border-secondary hover:bg-secondary"><User01 className="size-3.5 text-quaternary" /></button>
            <button className="flex size-7 items-center justify-center rounded-lg border border-secondary hover:bg-secondary"><Users01 className="size-3.5 text-quaternary" /></button>
            <button onClick={() => setClientsExpanded(e => !e)} className="flex size-7 items-center justify-center rounded-lg border border-secondary hover:bg-secondary">
              {clientsExpanded ? <ChevronDown className="size-3.5 text-quaternary" /> : <ChevronRight className="size-3.5 text-quaternary" />}
            </button>
          </div>
        </div>
        {clientsExpanded && (
          <div className="space-y-1.5">
            <div className="rounded-lg px-3 py-2 flex items-center justify-between text-xs font-medium text-primary border border-secondary hover:bg-secondary_alt cursor-pointer">
              <span className="flex items-center gap-2"><User01 className="size-3.5 text-quaternary" />{APP.customer.title} {APP.customer.firstName} {APP.customer.lastName}</span>
              <span className="rounded-full border border-secondary text-quaternary bg-secondary px-2 py-0.5 text-[10px]">Client</span>
            </div>
            <div className="rounded-lg px-3 py-2 flex items-center justify-between text-xs font-semibold text-white" style={{ background:"#D34108" }}>
              <span className="flex items-center gap-2 truncate">⬤ 23/03/2026, Acenda</span>
              <span className="rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-[10px] shrink-0 ml-2">New App</span>
            </div>
          </div>
        )}
      </div>

      {/* Pre-Assessments */}
      <div>
        <p className="text-sm font-semibold text-primary mb-2">Pre-Assessments</p>
        {PRE_ASSESSMENTS.map((pa, i) => (
          <div key={i} className="border-b border-secondary pb-2 last:border-0">
            <p className="text-[11px] text-tertiary">{pa.date}, <span className="font-medium">{pa.company}</span></p>
            <p className="text-xs text-secondary mt-0.5">{pa.note}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-primary">Notes</p>
        </div>
        <div className="flex gap-2 mb-2">
          <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..."
            onKeyDown={e => e.key==="Enter"&&addNote()}
            className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs outline-none focus:border-brand" />
          <button onClick={addNote} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-secondary hover:bg-secondary">
            <Plus className="size-4 text-secondary" />
          </button>
        </div>
        {/* Activity / note items from server */}
        <div className="space-y-1.5">
          {[
            { date:"23/03/2026 21:05", text:"Email sent: Acenda - Jawed Jamshedi", type:"email" },
            { date:"23/03/2026 21:05", text:"File uploaded: Acenda_-_Jawed_Jamshedi.eml", type:"file" },
            { date:"23/03/2026 20:26", text:"New Task: Upload Face to Face Documents (If Applicable)", type:"task" },
            { date:"23/03/2026 20:26", text:"New Task: Send 'application submitted' email to Client", type:"task" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-secondary last:border-0">
              <span className="text-[10px] mt-0.5">{item.type==="email"?"✉️":item.type==="file"?"📎":"→"}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-quaternary">{item.date}</p>
                <p className="text-xs text-secondary">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
        {notes.length > 0 && (
          <div className="space-y-2 mt-2">
            {notes.map(n => (
              <div key={n.id} className="rounded-lg border border-secondary bg-secondary_alt px-3 py-2">
                <p className="text-xs text-primary">{n.text}</p>
                <p className="text-[10px] text-quaternary mt-1">{n.author} · {n.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Actions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-primary">Scheduled Actions</p>
          <button className="text-xs font-medium text-brand-secondary hover:underline">New action</button>
        </div>
        <p className="text-center text-xs text-quaternary py-3">No actions scheduled</p>
      </div>

      {/* File Library */}
      <div>
        <p className="text-sm font-semibold text-primary mb-2">File Library</p>
        <input placeholder="Search..." className="w-full rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs outline-none focus:border-brand mb-2" />
        <div className="space-y-1.5">
          {FILE_LIBRARY.map((f, i) => (
            <button key={i} className="flex items-start gap-2 w-full text-left hover:bg-secondary_alt rounded-lg p-1.5">
              <File01 className="size-3.5 text-quaternary shrink-0 mt-0.5" />
              <div className="min-w-0"><p className="text-[10px] text-quaternary">{f.date}</p><p className="text-xs text-brand-secondary hover:underline truncate">{f.name}</p></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:flex min-h-screen bg-primary">
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="flex-1 min-h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-5 pb-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full text-white text-base font-bold" style={{ background:APP.statusColor }}>
              {APP.customer.firstName[0]}{APP.customer.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-primary" style={{ fontFamily:"'Metrophobic', sans-serif" }}>
                  {APP.title} #{APP.id}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor:APP.statusColor, color:APP.statusColor, background:"#FFF4F0" }}>
                  {APP.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-brand-secondary font-medium hover:underline cursor-pointer">{APP.customer.title} {APP.customer.firstName} {APP.customer.lastName}</span>
                <span className="text-xs text-quaternary">—</span>
                <EditableSelect value={APP.info.insurer} options={INSURERS} />
              </div>
            </div>
            <button title="Edit application" className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg border border-secondary hover:bg-secondary hover:border-brand transition-colors text-quaternary hover:text-brand-secondary">
              <Edit01 className="size-4" />
            </button>
          </div>
          {/* Toolbar */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button onClick={() => setMobileSidebarOpen(true)} className="xl:hidden inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary">
              <Users01 className="size-3.5" /> More Info
            </button>
            <DropdownButton label="New" icon="✚" items={[
              { label:"Pre-Assessment", icon:"🩺" },
              { label:"Claim",          icon:"🛡️" },
              { label:"Dishonour",      icon:"⚠️" },
              { label:"Policy ID",      icon:"🔑" },
            ]} />
            <DropdownButton label="Actions" icon="⚡" items={[
              { label:"SMS",          icon:"💬" },
              { label:"Email",        icon:"✉️" },
              { label:"Form",         icon:"📋" },
              { label:"Schedule",     icon:"📅" },
              { label:"Upload Files", icon:"📎" },
              { label:"Set Status",   icon:"🔄" },
              { label:"Complete",     icon:"✅" },
              { label:"Change Dates", icon:"📆" },
            ]} />
            <DropdownButton label="Other" icon="⋯" items={[
              { label:"PDF",            icon:"📄" },
              { label:"Pre-Assessment", icon:"🩺" },
              { label:"Marketing List", icon:"📊" },
              { label:"Close", icon:"✕", danger:true },
            ]} />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-y-auto">
          {/* Main */}
          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            <p className="text-[10px] text-quaternary px-1 flex items-center gap-1"><DotsGrid className="size-3" /> Drag sections to reorder</p>
            {sectionOrder.map(id => renderSection(id))}
          </div>

          {/* Desktop sidebar */}
          <div className={"shrink-0 border-l border-secondary bg-primary hidden xl:flex flex-col transition-all duration-200 " + (sidebarPinned?"w-80":"w-10")}>
            <div className={"flex items-center px-2 pt-2 pb-1 " + (sidebarPinned?"justify-end":"justify-center")}>
              <button onClick={() => setSidebarPinned(p => { const next=!p; try { localStorage.setItem("axis_app_sidebar_v1",next?"1":"0"); } catch {} return next; })}
                title={sidebarPinned?"Unpin sidebar":"Pin sidebar"}
                className={"flex size-7 items-center justify-center rounded-lg transition-colors " + (sidebarPinned?"text-brand-secondary bg-brand-secondary hover:bg-brand-secondary":"text-quaternary hover:bg-secondary hover:text-secondary")}>
                {sidebarPinned ? <Pin01 className="size-3.5" /> : <Pin02 className="size-3.5" />}
              </button>
            </div>
            {sidebarPinned && sidebarContent}
          </div>
        </div>
      </main>

      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={() => setMobileSidebarOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-primary border-l border-secondary flex flex-col xl:hidden shadow-2xl">
            <div className="flex items-center justify-end px-4 py-2 border-b border-secondary shrink-0">
              <button onClick={() => setMobileSidebarOpen(false)} className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary">
                <X className="size-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </>
      )}

      {fieldPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setFieldPanelOpen(false)} />}
    </div>
  );
}
