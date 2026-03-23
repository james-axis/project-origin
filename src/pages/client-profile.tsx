import { useState, useRef, useEffect } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import {
  ChevronDown, ChevronRight, Plus, X, Edit01, Phone01, Mail01, Check,
  File01, User01, Users01, Tag01, Settings01, DotsGrid,
} from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityEntry { date: string; user: string; action: string; note?: string; }
interface CallEntry     { date: string; phone: string; status: string; duration: string; }
interface FileEntry     { date: string; name: string; }
interface NoteEntry     { id: number; text: string; author: string; date: string; }

// ─── Mock client data ─────────────────────────────────────────────────────────
const CLIENT = {
  id: 38456, title: "Mr", firstName: "Jon", middleName: "(Jon)", lastName: "Doe",
  preferredName: "Jon", status: 0, statusLabel: "Prospect",
  dob: "15/06/1985", age: 40, gender: "Male", smoker: false,
  state: "NSW", city: "Sydney", postcode: "2000", address: "42 Martin Place",
  phone: "0412 345 678", phone2: "(02) 9876 5432",
  email: "jon.doe@testmail.com.au", email2: "jdoe.work@testmail.com.au",
  contactTime: "Afternoon", employment: "Employed full-time", occupation: "Software Engineer",
  salary: 95000, height: 178, weight: 82, bmi: "25.88",
  family: "Married", children: 2, childrenAges: "8, 5", maritalStatus: "Married",
  taxRate: "30.00%", group: "Three Dogs Insurance", referrer: "", affiliateCompany: "",
  tags: ["TEST CLIENT"],
  assignedTo: "SLG Test Training", consultant: "James Nicholls", admin: "SLG Test Training",
  createdOn: "16/03/2026 09:13", assignedOn: "17/03/2026 06:28", updatedOn: "17/03/2026 06:29",
  campaignGroup: "Organic", campaign: "No Campaign", refer: "", keywords: "", website: "", path: "",
  nextContact: null as string | null,
  callsMade: 0, emailsSent: 0, smsSent: 0,
  seventyPctSalary: "$66,500", marginaltaxRate: "30.00%",
};

const CALLS: CallEntry[] = [
  { date: "18/12/2024 09:55 AM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
  { date: "01/11/2024 01:08 PM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
  { date: "31/10/2024 02:47 PM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
  { date: "31/10/2024 11:34 AM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
  { date: "25/10/2024 01:29 PM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
];
const ACTIVITY: ActivityEntry[] = [
  { date: "17/03/2026 06:28", user: "James Nicholls", action: "Lead reassigned", note: "Lead reassigned to SLG Test T (Admin)" },
  { date: "16/03/2026 09:13", user: "James Nicholls", action: "Lead assigned",   note: "Lead assigned to James N" },
  { date: "16/03/2026 09:13", user: "James Nicholls", action: "Lead created",    note: "Lead created" },
];
const FILE_LIBRARY: FileEntry[] = [
  { date: "15/10/2025", name: "SLS_Limited APL_Scripting_Oct 2025.pdf" },
  { date: "15/10/2025", name: "SLS_Full APL_Scripting_Oct 2025.pdf" },
  { date: "15/10/2025", name: "nexa Life Scripting_October 2025.pdf" },
  { date: "15/05/2025", name: "SLS - FSG_Part_1 - April 2025.pdf" },
  { date: "01/05/2025", name: "nexa_PrivacyPolicy.pdf" },
  { date: "01/05/2025", name: "Guide_to_Personal_Insurances.pdf" },
];

// ─── Section definitions (drag-to-reorder) ───────────────────────────────────
const SECTION_DEFS = [
  { id: "customer_info",  label: "Customer Information" },
  { id: "tasks",          label: "Tasks" },
  { id: "dependants",     label: "Dependants" },
  { id: "superfunds",     label: "Client's Existing Superfunds" },
  { id: "contact_info",   label: "Contact Information" },
  { id: "customer_profile", label: "Customer Profile" },
  { id: "lead_progress",  label: "Lead Progress" },
  { id: "lead_info",      label: "Lead Information" },
  { id: "activity_log",   label: "Activity Log" },
];
const SECTIONS_KEY = "axis_profile_sections_v1";

function loadSectionOrder(): string[] {
  try { const r = localStorage.getItem(SECTIONS_KEY); if (r) return JSON.parse(r); } catch {}
  return SECTION_DEFS.map(s => s.id);
}
function saveSectionOrder(order: string[]) { localStorage.setItem(SECTIONS_KEY, JSON.stringify(order)); }

// ─── Customer Info field definitions ─────────────────────────────────────────
interface FieldDef { key: string; label: string; defaultVisible: boolean; }
const CUSTOMER_FIELD_DEFS: FieldDef[] = [
  { key: "name",       label: "First/Middle Name",       defaultVisible: true  },
  { key: "preferred",  label: "Preferred Name",          defaultVisible: true  },
  { key: "lastName",   label: "Last Name",               defaultVisible: true  },
  { key: "employment", label: "Employment / Occupation", defaultVisible: true  },
  { key: "dob",        label: "DOB (Age)",               defaultVisible: true  },
  { key: "gender",     label: "Gender",                  defaultVisible: true  },
  { key: "state",      label: "State",                   defaultVisible: true  },
  { key: "nextContact",label: "Next Contact",            defaultVisible: false },
  { key: "contacts",   label: "Contacts Made",           defaultVisible: true  },
  { key: "salary",     label: "Salary",                  defaultVisible: true  },
  { key: "salary70",   label: "70% of Salary",           defaultVisible: true  },
  { key: "affiliate",  label: "Affiliate Company",       defaultVisible: false },
  { key: "referrer",   label: "Referrer Name",           defaultVisible: true  },
  { key: "taxRate",    label: "Marginal Tax Rate",       defaultVisible: true  },
  { key: "group",      label: "Group",                   defaultVisible: true  },
];
const FIELDS_KEY = "axis_profile_fields_v1";
interface FieldState { order: string[]; visible: Record<string, boolean>; }
function loadFieldState(): FieldState {
  try { const r = localStorage.getItem(FIELDS_KEY); if (r) return JSON.parse(r); } catch {}
  return {
    order: CUSTOMER_FIELD_DEFS.map(f => f.key),
    visible: Object.fromEntries(CUSTOMER_FIELD_DEFS.map(f => [f.key, f.defaultVisible])),
  };
}
function saveFieldState(s: FieldState) { localStorage.setItem(FIELDS_KEY, JSON.stringify(s)); }

const USERS_LIST = ["James Nicholls","SLG Test Training","Maysee Chang","John Rojas","Dean Hines","Lucas Kenyon","Adam Cowburn","Advice Team","Audits Team","Natasha Carlson"];
const GROUPS_LIST = ["Three Dogs Insurance","UFinancial","Surety","Vital","Hunter Galloway","Covered Life","CH Life","Armor Insurance Solutions"];

// ─── Editable field ───────────────────────────────────────────────────────────
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
          {options
            ? <select ref={ref as React.RefObject<HTMLSelectElement>} value={val} onChange={e => setVal(e.target.value)} onBlur={() => setEditing(false)} className="rounded border border-brand bg-primary px-2 py-0.5 text-xs text-primary outline-none">{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
            : <input ref={ref as React.RefObject<HTMLInputElement>} value={val} onChange={e => setVal(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={e => e.key === "Enter" && setEditing(false)} className="rounded border border-brand bg-primary px-2 py-0.5 text-xs text-primary outline-none w-32" />}
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

// ─── Editable group (in header / Customer Info grid) ─────────────────────────
function EditableGroupField({ value, compact = false }: { value: string; compact?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (editing) return (
    <span className="inline-flex items-center gap-1">
      <select value={val} onChange={e => setVal(e.target.value)} autoFocus onBlur={() => setEditing(false)}
        className="rounded border border-brand bg-primary px-1.5 py-0.5 text-xs text-primary outline-none">
        {GROUPS_LIST.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
      <button onClick={() => setEditing(false)} className="flex size-5 items-center justify-center rounded bg-brand-solid text-white"><Check className="size-3" /></button>
    </span>
  );
  return (
    <button onClick={() => setEditing(true)} className={"flex items-center gap-1 group hover:text-brand-secondary transition-colors " + (compact ? "text-xs text-tertiary" : "text-sm text-primary font-medium")}>
      {val}<Edit01 className="size-3 text-quaternary opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ─── Dropdown button ──────────────────────────────────────────────────────────
function DropdownButton({ label, icon, items, variant = "default" }: {
  label: string; icon?: string; variant?: "default"|"brand";
  items: { label: string; icon?: string; danger?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={"inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors " + (variant === "brand" ? "border-brand-solid bg-brand-solid text-white hover:bg-brand-solid_hover" : "border-secondary bg-primary text-secondary hover:bg-secondary")}>
        {icon && <span>{icon}</span>}{label}<ChevronDown className="size-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden py-1">
          {items.map((item, i) => (
            <button key={i} onClick={() => setOpen(false)} className={"flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-secondary_alt transition-colors " + (item.danger ? "text-error-primary" : "text-primary")}>
              {item.icon && <span>{item.icon}</span>}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Field selector panel ─────────────────────────────────────────────────────
function FieldPanel({ defs, state, onChange, onClose }: {
  defs: FieldDef[]; state: FieldState;
  onChange: (s: FieldState) => void; onClose: () => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const ordered = state.order.map(k => defs.find(d => d.key === k)).filter((d): d is FieldDef => !!d);

  function onDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...state.order];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    onChange({ ...state, order: next });
    dragIdx.current = null; setDragOver(null);
  }

  return (
    <div className="absolute right-0 top-8 z-50 w-60 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary">
        <p className="text-xs font-semibold text-primary">Fields</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onChange({ order: defs.map(d => d.key), visible: Object.fromEntries(defs.map(d => [d.key, d.defaultVisible])) })} className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose} className="text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>
        </div>
      </div>
      <p className="text-[10px] text-quaternary px-3 pt-2 pb-1">Drag to reorder · toggle to show/hide</p>
      <ul className="max-h-72 overflow-y-auto py-1">
        {ordered.map((f, i) => (
          <li key={f.key} draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragEnter={() => setDragOver(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(i)}
            onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
            className={"flex items-center gap-2.5 px-3 py-2 cursor-grab transition-colors select-none " + (dragOver === i ? "bg-brand-secondary" : "hover:bg-secondary_alt")}>
            <DotsGrid className="size-3.5 text-quaternary shrink-0" />
            <button onClick={() => { const vis = { ...state.visible, [f.key]: !state.visible[f.key] }; onChange({ ...state, visible: vis }); }}
              className={"flex size-4 shrink-0 items-center justify-center rounded transition-colors " + (state.visible[f.key] ? "bg-brand-solid" : "border border-secondary bg-primary")}>
              {state.visible[f.key] && <Check className="size-2.5 text-white" />}
            </button>
            <span className={"text-xs " + (state.visible[f.key] ? "text-primary font-medium" : "text-quaternary")}>{f.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Draggable Section Card ───────────────────────────────────────────────────
function SectionCard({
  id, title, children, action, actionLabel, defaultOpen = true,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragOver,
  extraAction,
}: {
  id: string; title: string; children: React.ReactNode;
  action?: () => void; actionLabel?: string; defaultOpen?: boolean;
  onDragStart?: (id: string) => void; onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void; onDragEnd?: () => void; isDragOver?: boolean;
  extraAction?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(id); }}
      onDragOver={e => { e.preventDefault(); onDragOver?.(id); }}
      onDrop={() => onDrop?.(id)}
      onDragEnd={() => onDragEnd?.()}
      className={"rounded-xl border bg-primary overflow-hidden transition-all " + (isDragOver ? "border-brand shadow-lg ring-2 ring-brand ring-opacity-30" : "border-secondary shadow-sm")}>
      <div className="flex w-full items-center justify-between px-3 py-3 hover:bg-secondary_alt transition-colors">
        {/* Drag handle */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="cursor-grab text-quaternary hover:text-secondary transition-colors p-0.5 shrink-0">
            <DotsGrid className="size-4" />
          </div>
          <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <div className="w-1 h-4 rounded-full bg-brand-solid shrink-0" />
            <span className="text-sm font-semibold text-primary truncate">{title}</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {extraAction}
          {action && actionLabel && (
            <button onClick={e => { e.stopPropagation(); action(); }}
              className="flex items-center gap-1 rounded-lg border border-secondary bg-primary px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary transition-colors">
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

// ─── Customer Info grid (field-aware) ─────────────────────────────────────────
function CustomerInfoGrid({ fieldState }: { fieldState: FieldState }) {
  const visibleFields: FieldDef[] = [];
  for (const k of fieldState.order) {
    const f = CUSTOMER_FIELD_DEFS.find(d => d.key === k);
    if (f && fieldState.visible[f.key]) visibleFields.push(f);
  }

  function renderValue(key: string): React.ReactNode {
    switch (key) {
      case "name":       return `${CLIENT.title} ${CLIENT.firstName} ${CLIENT.middleName}`;
      case "preferred":  return CLIENT.preferredName;
      case "lastName":   return CLIENT.lastName;
      case "employment": return `${CLIENT.employment} / ${CLIENT.occupation}`;
      case "dob":        return `${CLIENT.dob} (${CLIENT.age} years old)`;
      case "gender":     return CLIENT.gender;
      case "state":      return `${CLIENT.state} (17:57)`;
      case "nextContact":return CLIENT.nextContact ?? "—";
      case "contacts":   return (
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-quaternary"><Phone01 className="size-3" />{CLIENT.callsMade}</span>
          <span className="flex items-center gap-1 text-quaternary"><Mail01 className="size-3" />{CLIENT.emailsSent}</span>
          <span className="flex items-center gap-1 text-quaternary">💬{CLIENT.smsSent}</span>
        </span>
      );
      case "salary":     return `$${CLIENT.salary.toLocaleString()}`;
      case "salary70":   return CLIENT.seventyPctSalary;
      case "affiliate":  return CLIENT.affiliateCompany || "—";
      case "referrer":   return CLIENT.referrer || "—";
      case "taxRate":    return CLIENT.marginaltaxRate;
      case "group":      return <EditableGroupField value={CLIENT.group} />;
      default:           return "—";
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
      {visibleFields.map(f => (
        <div key={f.key}>
          <p className="text-[11px] text-quaternary mb-0.5">{f.label}</p>
          <div className="text-sm text-primary font-medium">{renderValue(f.key)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ClientProfilePage() {
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [clientsExpanded, setClientsExpanded] = useState(true);
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => {
    try { const v = localStorage.getItem("axis_profile_sidebar_v1"); return v === null ? true : v === "1"; } catch { return true; }
  });

  // Section order
  const [sectionOrder, setSectionOrder] = useState<string[]>(loadSectionOrder);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  function handleSectionDrop(toId: string) {
    if (!dragSectionId || dragSectionId === toId) return;
    const next = [...sectionOrder];
    const fi = next.indexOf(dragSectionId);
    const ti = next.indexOf(toId);
    next.splice(fi, 1); next.splice(ti, 0, dragSectionId);
    setSectionOrder(next);
    saveSectionOrder(next);
    setDragSectionId(null); setDragOverSectionId(null);
  }

  // Field state for Customer Information
  const [fieldState, setFieldState] = useState<FieldState>(loadFieldState);
  const [fieldPanelOpen, setFieldPanelOpen] = useState(false);
  function updateFieldState(s: FieldState) { setFieldState(s); saveFieldState(s); }

  const statusColor = "#D34108";

  function addNote() {
    if (!noteText.trim()) return;
    setNotes(prev => [{ id: Date.now(), text: noteText, author: "James Nicholls", date: new Date().toLocaleDateString("en-AU") }, ...prev]);
    setNoteText("");
  }

  // Render a section by id
  function renderSection(id: string) {
    const dragProps = {
      onDragStart: (sid: string) => setDragSectionId(sid),
      onDragOver:  (sid: string) => setDragOverSectionId(sid),
      onDrop:      handleSectionDrop,
      onDragEnd:   () => { setDragSectionId(null); setDragOverSectionId(null); },
      isDragOver:  dragOverSectionId === id,
    };

    switch (id) {
      case "customer_info": return (
        <SectionCard key={id} id={id} title="Customer Information" {...dragProps}
          extraAction={
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setFieldPanelOpen(v => !v); }}
                title="Show/hide fields"
                className={"flex size-7 items-center justify-center rounded-lg border transition-colors " + (fieldPanelOpen ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary hover:bg-secondary text-quaternary")}>
                <Settings01 className="size-3.5" />
              </button>
              {fieldPanelOpen && (
                <FieldPanel defs={CUSTOMER_FIELD_DEFS} state={fieldState} onChange={updateFieldState} onClose={() => setFieldPanelOpen(false)} />
              )}
            </div>
          }>
          <CustomerInfoGrid fieldState={fieldState} />
          {CLIENT.tags.length > 0 && (
            <div className="flex items-center gap-2 px-4 pb-3">
              <Tag01 className="size-3.5 text-quaternary" />
              <span className="text-xs text-quaternary">Tags:</span>
              {CLIENT.tags.map(t => <span key={t} className="text-xs font-semibold text-brand-secondary hover:underline cursor-pointer">{t}</span>)}
            </div>
          )}
        </SectionCard>
      );
      case "tasks": return (
        <SectionCard key={id} id={id} title="Tasks" actionLabel="New Task" action={() => {}} {...dragProps}>
          <div className="px-4 py-4 text-sm text-quaternary text-center">No tasks yet</div>
        </SectionCard>
      );
      case "dependants": return (
        <SectionCard key={id} id={id} title="Dependants" defaultOpen={false} actionLabel="Add Dependant" action={() => {}} {...dragProps}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <div><p className="text-[11px] text-quaternary mb-0.5">Marital Status</p><p className="text-sm text-primary font-medium">{CLIENT.maritalStatus}</p></div>
            <div><p className="text-[11px] text-quaternary mb-0.5">Children</p><p className="text-sm text-primary font-medium">{CLIENT.children} children (aged {CLIENT.childrenAges})</p></div>
          </div>
        </SectionCard>
      );
      case "superfunds": return (
        <SectionCard key={id} id={id} title="Client's Existing Superfunds" defaultOpen={false} actionLabel="Add Superfund" action={() => {}} {...dragProps}>
          <div className="px-4 py-4 text-sm text-quaternary text-center">No superfunds added</div>
        </SectionCard>
      );
      case "contact_info": return (
        <SectionCard key={id} id={id} title="Contact Information" defaultOpen={false} {...dragProps}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <div><p className="text-[11px] text-quaternary mb-0.5">Phone</p><p className="text-sm font-medium text-brand-secondary">{CLIENT.phone}</p></div>
            <div><p className="text-[11px] text-quaternary mb-0.5">Additional Phone(s)</p><p className="text-sm font-medium text-brand-secondary">{CLIENT.phone2}</p></div>
            <div><p className="text-[11px] text-quaternary mb-0.5">Preferred Contact Time</p><p className="text-sm text-primary font-medium">{CLIENT.contactTime}</p></div>
            <div className="col-span-2"><p className="text-[11px] text-quaternary mb-0.5">Email</p><p className="text-sm font-medium text-brand-secondary">{CLIENT.email}</p></div>
            <div className="col-span-2"><p className="text-[11px] text-quaternary mb-0.5">Additional Email(s)</p><p className="text-sm font-medium text-brand-secondary">{CLIENT.email2}</p></div>
          </div>
        </SectionCard>
      );
      case "customer_profile": return (
        <SectionCard key={id} id={id} title="Customer Profile" defaultOpen={false} {...dragProps}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            {[
              ["Marital Status", CLIENT.maritalStatus],
              ["Children", `${CLIENT.children} children (aged ${CLIENT.childrenAges})`],
              ["Address", CLIENT.address],
              ["City, State, Postcode", `${CLIENT.city}, ${CLIENT.state} ${CLIENT.postcode}`],
              ["Height", `${CLIENT.height} cm`],
              ["Weight", `${CLIENT.weight} kg`],
              ["BMI", CLIENT.bmi],
              ["Smoker Status", CLIENT.smoker ? "Smoker" : "Non-smoker"],
            ].map(([label, value]) => (
              <div key={label as string}><p className="text-[11px] text-quaternary mb-0.5">{label}</p><p className="text-sm text-primary font-medium">{value}</p></div>
            ))}
          </div>
        </SectionCard>
      );
      case "lead_progress": return (
        <SectionCard key={id} id={id} title="Lead Progress" defaultOpen={false} {...dragProps}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <div><p className="text-[11px] text-quaternary mb-0.5">Assigned To</p>
              <EditableField label="" value={CLIENT.assignedTo} options={USERS_LIST} />
            </div>
            <div><p className="text-[11px] text-quaternary mb-0.5">Created On</p><p className="text-sm text-primary font-medium">{CLIENT.createdOn}</p></div>
            <div><p className="text-[11px] text-quaternary mb-0.5">Assigned On</p><p className="text-sm text-primary font-medium">{CLIENT.assignedOn}</p></div>
            <div><p className="text-[11px] text-quaternary mb-0.5">Updated On</p><p className="text-sm text-primary font-medium">{CLIENT.updatedOn}</p></div>
          </div>
        </SectionCard>
      );
      case "lead_info": return (
        <SectionCard key={id} id={id} title="Lead Information" defaultOpen={false} {...dragProps}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            {[
              ["Campaign Group", CLIENT.campaignGroup], ["Campaign", CLIENT.campaign],
              ["Refer", CLIENT.refer || "—"], ["Keywords", CLIENT.keywords || "—"],
              ["Website", CLIENT.website || "—"], ["Path", CLIENT.path || "—"],
            ].map(([label, value]) => (
              <div key={label as string}><p className="text-[11px] text-quaternary mb-0.5">{label}</p><p className="text-sm text-primary font-medium">{value}</p></div>
            ))}
          </div>
        </SectionCard>
      );
      case "activity_log": return (
        <SectionCard key={id} id={id} title="Activity Log" defaultOpen={false} {...dragProps}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-secondary_alt border-b border-secondary">
                <tr>{["Date","User","Action","Note"].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-quaternary whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {ACTIVITY.map((row, i) => (
                  <tr key={i} className="hover:bg-secondary_alt">
                    <td className="px-4 py-2.5 text-xs text-tertiary whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-2.5 text-xs text-primary font-medium">{row.user}</td>
                    <td className="px-4 py-2.5 text-xs text-secondary">{row.action}</td>
                    <td className="px-4 py-2.5 text-xs text-tertiary max-w-xs truncate">{row.note}</td>
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

  return (
    <div className="lg:flex min-h-screen bg-primary">
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="flex-1 min-h-screen flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-5 pb-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full text-white text-base font-bold" style={{ background: statusColor }}>
              {CLIENT.firstName[0]}{CLIENT.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-primary" style={{ fontFamily:"'Metrophobic', sans-serif" }}>
                  Client #{CLIENT.id} — {CLIENT.title} {CLIENT.firstName} {CLIENT.middleName} {CLIENT.lastName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: statusColor, color: statusColor, background: "#FFF4F0" }}>
                  {CLIENT.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <EditableGroupField value={CLIENT.group} compact />
                <span className="text-xs text-quaternary">· Created {CLIENT.createdOn}</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary transition-colors">✏️ Edit</button>
            <DropdownButton variant="brand" label="New" icon="✚" items={[
              { label: "Quote",          icon: "💡" },
              { label: "Pre-Assessment", icon: "🩺" },
              { label: "Application",    icon: "📝" },
              { label: "Claim",          icon: "🛡️" },
              { label: "Dishonour",      icon: "⚠️" },
              { label: "Complaint",      icon: "💬" },
            ]} />
            <DropdownButton label="Actions" icon="⚡" items={[
              { label: "SMS",          icon: "💬" },
              { label: "Email",        icon: "✉️" },
              { label: "Form",         icon: "📋" },
              { label: "Schedule",     icon: "📅" },
              { label: "Upload Files", icon: "📎" },
              { label: "Set Status",   icon: "🔄" },
            ]} />
            <DropdownButton label="Other" icon="⋯" items={[
              { label: "PDF",            icon: "📄" },
              { label: "Docs",           icon: "📁" },
              { label: "Off APL",        icon: "🔕" },
              { label: "Marketing List", icon: "📊" },
            ]} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0 overflow-y-auto">

          {/* Main column */}
          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            {/* Hint */}
            <p className="text-[10px] text-quaternary px-1 flex items-center gap-1">
              <DotsGrid className="size-3" /> Drag sections to reorder
            </p>
            {sectionOrder.map(id => renderSection(id))}
          </div>

          {/* Right sidebar — collapsible */}
          <div className={"shrink-0 border-l border-secondary bg-primary hidden xl:flex flex-row transition-all duration-200 " + (sidebarPinned ? "w-80" : "w-10")}>
            {/* Toggle strip */}
            <div className="flex flex-col items-center pt-3 w-10 shrink-0">
              <button onClick={() => setSidebarPinned(p => { const next = !p; try { localStorage.setItem("axis_profile_sidebar_v1", next ? "1" : "0"); } catch {} return next; })} title={sidebarPinned ? "Collapse sidebar" : "Expand sidebar"}
                className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary transition-colors text-quaternary hover:text-secondary">
                {sidebarPinned ? <ChevronRight className="size-4" /> : <ChevronRight className="size-4 rotate-180" />}
              </button>
            </div>
            {/* Sidebar content */}
            {sidebarPinned && (
            <div className="flex-1 min-w-0 overflow-y-auto px-3 py-4 space-y-4">

            {/* Clients & Applications — collapsible */}
            <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-sm font-semibold text-primary">Clients & Applications</p>
                <div className="flex items-center gap-1">
                  {clientsExpanded && (
                    <>
                      <button className="flex size-7 items-center justify-center rounded-lg border border-secondary hover:bg-secondary transition-colors"><User01 className="size-3.5 text-quaternary" /></button>
                      <button className="flex size-7 items-center justify-center rounded-lg border border-secondary hover:bg-secondary transition-colors"><Users01 className="size-3.5 text-quaternary" /></button>
                      <button className="flex size-7 items-center justify-center rounded-lg border border-secondary hover:bg-secondary transition-colors"><Users01 className="size-3.5 text-quaternary" /></button>
                    </>
                  )}
                  <button onClick={() => setClientsExpanded(e => !e)} title={clientsExpanded ? "Minimise" : "Maximise"}
                    className="flex size-7 items-center justify-center rounded-lg border border-secondary hover:bg-secondary transition-colors ml-0.5">
                    {clientsExpanded ? <ChevronDown className="size-3.5 text-quaternary" /> : <ChevronRight className="size-3.5 text-quaternary" />}
                  </button>
                </div>
              </div>
              {clientsExpanded && (
                <div className="px-3 pb-3">
                  <div className="rounded-lg px-3 py-2.5 flex items-center justify-between text-sm font-semibold text-white" style={{ background: "#D34108" }}>
                    <span className="flex items-center gap-2 truncate"><User01 className="size-3.5 shrink-0" />{CLIENT.title} {CLIENT.firstName} ({CLIENT.preferredName}) {CLIENT.lastName}</span>
                    <span className="rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-[10px] shrink-0 ml-2">Prospect</span>
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Team */}
            <div>
              <p className="text-sm font-semibold text-primary mb-3">Assigned Team</p>
              <EditableField label="Consultant" value="James Nicholls" options={USERS_LIST} />
              <EditableField label="Admin" value="SLG Test Training" options={USERS_LIST} />
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-primary">Notes</p>
                <button className="text-xs font-medium text-brand-secondary hover:underline">Audit</button>
              </div>
              <div className="flex gap-2 mb-2">
                <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..."
                  onKeyDown={e => e.key === "Enter" && addNote()}
                  className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs outline-none focus:border-brand" />
                <button onClick={addNote} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-secondary hover:bg-secondary">
                  <Plus className="size-4 text-secondary" />
                </button>
              </div>
              {notes.length === 0
                ? <p className="text-center text-xs text-quaternary py-4">This section is empty</p>
                : <div className="space-y-2">{notes.map(n => (
                    <div key={n.id} className="rounded-lg border border-secondary bg-secondary_alt px-3 py-2">
                      <p className="text-xs text-primary">{n.text}</p>
                      <p className="text-[10px] text-quaternary mt-1">{n.author} · {n.date}</p>
                    </div>
                  ))}</div>
              }
            </div>

            {/* Calls */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2">Calls</p>
              <div className="space-y-2">
                {CALLS.map((call, i) => (
                  <div key={i} className="border-b border-secondary pb-2 last:border-0">
                    <p className="text-[11px] text-tertiary flex items-center gap-1"><Phone01 className="size-3 text-quaternary" />{call.date} | {call.status} | {call.duration}</p>
                    <p className="text-xs font-medium text-primary mt-0.5">{call.phone}</p>
                    <button className="text-[11px] text-brand-secondary hover:underline">Call recording</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled Actions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-primary">Scheduled Actions</p>
                <button className="text-xs font-medium text-brand-secondary hover:underline">New action</button>
              </div>
              <p className="text-center text-xs text-quaternary py-3">No actions scheduled</p>
            </div>

            {/* Attachments */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2">Attachments</p>
              <input placeholder="Search..." className="w-full rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs outline-none focus:border-brand mb-2" />
              <p className="text-center text-xs text-quaternary py-3">No files matching query found</p>
            </div>

            {/* File Library */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2">File Library</p>
              <input placeholder="Search..." className="w-full rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs outline-none focus:border-brand mb-2" />
              <div className="space-y-1.5">
                {FILE_LIBRARY.map((f, i) => (
                  <button key={i} className="flex items-start gap-2 w-full text-left hover:bg-secondary_alt rounded-lg p-1.5 transition-colors">
                    <File01 className="size-3.5 text-quaternary shrink-0 mt-0.5" />
                    <div className="min-w-0"><p className="text-[10px] text-quaternary">{f.date}</p><p className="text-xs text-brand-secondary hover:underline truncate">{f.name}</p></div>
                  </button>
                ))}
              </div>
            </div>
            </div>
            )}
          </div>
        </div>
      </main>

      {fieldPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setFieldPanelOpen(false)} />}
    </div>
  );
}
