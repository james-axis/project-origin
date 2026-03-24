import { useState, useRef, useEffect } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { ChevronDown, ChevronRight, Plus, X, Edit01, Check, File01, User01, Users01, DotsGrid, Pin01, Pin02 } from "@untitledui/icons";

interface NoteEntry { id: number; text: string; author: string; date: string; }

const COMPLAINT = {
  id: 5, statusLabel: "Resolved", statusColor: "#22C55E",
  customer: { title:"Ms", firstName:"Nicky", lastName:"Test", phone:"0400780863", email:"Nicky@slifegroup.com.au", state:"NSW" },
  info: {
    type: "Other", received: "28/11/2024", assignedTo: "Nicky G",
    query: "Adviser implemented higher sum insured",
    resolution: "Reduce the sum insured and refund the client the additional premium debited. Provide formal apology.",
    createdOn: "29/11/2024", updatedOn: "04/12/2024",
    pendingActions: "",
  },
};
const FILE_LIBRARY = [{ date:"04/12/2024", name:"Complaint_resolution_letter.pdf" }];
const USERS_LIST = ["Nicky G","Sonny L","James Nicholls","Tracey D","Nicole T","Joanne R","SLG Support"];
const COMPLAINT_TYPES = ["Service Complaint","Advice Complaint","Product Complaint","Other"];

const SECTION_DEFS = [
  { id:"complaint_info", label:"Complaint Information" },
  { id:"tasks",          label:"Tasks" },
  { id:"contact_info",   label:"Contact Information" },
  { id:"activity_log",   label:"Activity Log" },
];
const SECTIONS_KEY = "axis_complaint_sections_v1";
function loadSO(): string[] { try { const r = localStorage.getItem(SECTIONS_KEY); if (r) return JSON.parse(r); } catch {} return SECTION_DEFS.map(s => s.id); }
function saveSO(o: string[]) { localStorage.setItem(SECTIONS_KEY, JSON.stringify(o)); }

function EditableSelect({ value, options }: { value: string; options: string[] }) {
  const [editing, setEditing] = useState(false); const [val, setVal] = useState(value);
  if (editing) return <span className="inline-flex items-center gap-1"><select value={val} onChange={e => setVal(e.target.value)} autoFocus onBlur={() => setEditing(false)} className="rounded border border-brand bg-primary px-1.5 py-0.5 text-xs text-primary outline-none">{options.map(o => <option key={o} value={o}>{o}</option>)}</select><button onClick={() => setEditing(false)} className="flex size-5 items-center justify-center rounded bg-brand-solid text-white"><Check className="size-3" /></button></span>;
  return <button onClick={() => setEditing(true)} className="flex items-center gap-1 group hover:text-brand-secondary text-sm text-primary font-medium">{val}<Edit01 className="size-3 text-quaternary opacity-0 group-hover:opacity-100" /></button>;
}

function DropdownButton({ label, icon, items }: { label: string; icon?: string; items: { label: string; icon?: string; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [open]);
  return <div ref={ref} className="relative"><button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary">{icon && <span>{icon}</span>}{label}</button>{open && <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden py-1">{items.map((item, i) => <button key={i} onClick={() => setOpen(false)} className={"flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-secondary_alt " + (item.danger ? "text-error-primary" : "text-primary")}>{item.icon && <span>{item.icon}</span>}{item.label}</button>)}</div>}</div>;
}

function StatusButton() {
  const [open, setOpen] = useState(false); const [current, setCurrent] = useState("Resolved"); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [open]);
  const statuses = [{ label:"In Progress", color:"#3B82F6" }, { label:"On Hold", color:"#F59E0B" }, { label:"Resolved", color:"#22C55E" }, { label:"Closed", color:"#6B7280" }];
  return <div ref={ref} className="relative"><button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary">🔄 Set Status</button>{open && <div className="absolute left-0 top-full mt-1 z-50 w-40 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden py-1">{statuses.map(s => <button key={s.label} onClick={() => { setCurrent(s.label); setOpen(false); }} className={"flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-secondary_alt " + (current === s.label ? "font-semibold" : "text-primary")}><span className="size-2 rounded-full shrink-0" style={{ background: s.color }} />{s.label}{current === s.label && <Check className="size-3 ml-auto text-brand-secondary" />}</button>)}</div>}</div>;
}

function SectionCard({ id, title, children, action, actionLabel, defaultOpen = true, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver }: {
  id: string; title: string; children: React.ReactNode; action?: () => void; actionLabel?: string; defaultOpen?: boolean;
  onDragStart?: (id: string) => void; onDragOver?: (id: string) => void; onDrop?: (id: string) => void; onDragEnd?: () => void; isDragOver?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div draggable onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(id); }} onDragOver={e => { e.preventDefault(); onDragOver?.(id); }} onDrop={() => onDrop?.(id)} onDragEnd={() => onDragEnd?.()}
      className={"rounded-xl border bg-primary overflow-hidden shadow-sm " + (isDragOver ? "border-brand ring-2 ring-brand ring-opacity-30" : "border-secondary")}>
      <div className="flex w-full items-center justify-between px-3 py-3 hover:bg-secondary_alt">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="cursor-grab text-quaternary p-0.5 shrink-0"><DotsGrid className="size-4" /></div>
          <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 text-left">
            <div className="w-1 h-4 rounded-full bg-brand-solid shrink-0" /><span className="text-sm font-semibold text-primary truncate">{title}</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {action && actionLabel && <button onClick={e => { e.stopPropagation(); action(); }} className="flex items-center gap-1 rounded-lg border border-secondary bg-primary px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary"><Plus className="size-3 text-success-primary" />{actionLabel}</button>}
          <button onClick={() => setOpen(o => !o)}>{open ? <ChevronDown className="size-4 text-quaternary" /> : <ChevronRight className="size-4 text-quaternary" />}</button>
        </div>
      </div>
      {open && <div className="border-t border-secondary">{children}</div>}
    </div>
  );
}

function IC({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="text-[11px] text-quaternary mb-0.5">{label}</p><div className="text-sm text-primary font-medium">{value || <span className="text-quaternary">—</span>}</div></div>;
}

export function ComplaintProfilePage() {
  const [noteText, setNoteText] = useState(""); const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => { try { const v = localStorage.getItem("axis_complaint_sidebar_v1"); return v === null ? true : v === "1"; } catch { return true; } });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(loadSO);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function handleDrop(toId: string) {
    if (!dragId || dragId === toId) return;
    const n = [...sectionOrder]; const fi = n.indexOf(dragId); const ti = n.indexOf(toId);
    n.splice(fi, 1); n.splice(ti, 0, dragId);
    setSectionOrder(n); saveSO(n); setDragId(null); setDragOverId(null);
  }
  function addNote() { if (!noteText.trim()) return; setNotes(p => [{ id: Date.now(), text: noteText, author: "James Nicholls", date: new Date().toLocaleDateString("en-AU") }, ...p]); setNoteText(""); }

  const dp = (id: string) => ({ onDragStart: (sid: string) => setDragId(sid), onDragOver: (sid: string) => setDragOverId(sid), onDrop: handleDrop, onDragEnd: () => { setDragId(null); setDragOverId(null); }, isDragOver: dragOverId === id });

  function renderSection(id: string) {
    switch (id) {
      case "complaint_info": return (
        <SectionCard key={id} id={id} title="Complaint Information" {...dp(id)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <IC label="Type" value={<EditableSelect value={COMPLAINT.info.type} options={COMPLAINT_TYPES} />} />
            <IC label="Assigned To" value={<EditableSelect value={COMPLAINT.info.assignedTo} options={USERS_LIST} />} />
            <IC label="Received" value={COMPLAINT.info.received} />
            <IC label="Status" value={<span className="inline-flex rounded-full bg-green-50 text-green-700 text-[11px] font-semibold px-2 py-0.5">{COMPLAINT.statusLabel}</span>} />
            <IC label="Created On" value={COMPLAINT.info.createdOn} />
            <IC label="Updated On" value={COMPLAINT.info.updatedOn} />
            <div className="col-span-2 sm:col-span-4">
              <p className="text-[11px] text-quaternary mb-0.5">Query</p>
              <p className="text-sm text-primary font-medium">{COMPLAINT.info.query}</p>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <p className="text-[11px] text-quaternary mb-0.5">Resolution</p>
              <p className="text-sm text-primary">{COMPLAINT.info.resolution || "—"}</p>
            </div>
          </div>
        </SectionCard>
      );
      case "tasks": return (
        <SectionCard key={id} id={id} title="Tasks" actionLabel="New Task" action={() => {}} {...dp(id)}>
          <div className="px-4 py-4 text-sm text-quaternary text-center">No tasks yet</div>
        </SectionCard>
      );
      case "contact_info": return (
        <SectionCard key={id} id={id} title="Contact Information" defaultOpen={false} {...dp(id)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
            <IC label="Phone" value={<span className="text-brand-secondary">{COMPLAINT.customer.phone}</span>} />
            <IC label="Email" value={<span className="text-brand-secondary">{COMPLAINT.customer.email}</span>} />
            <IC label="State" value={COMPLAINT.customer.state} />
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

  const sidebarContent = (
    <div className="flex-1 min-w-0 overflow-y-auto px-3 pb-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-primary mb-2">Client</p>
        <div className="rounded-lg px-3 py-2.5 flex items-center justify-between text-sm font-semibold text-white" style={{ background: "#22C55E" }}>
          <span className="flex items-center gap-2 truncate"><User01 className="size-3.5 shrink-0" />{COMPLAINT.customer.title} {COMPLAINT.customer.firstName} {COMPLAINT.customer.lastName}</span>
          <span className="rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-[10px] shrink-0 ml-2">Complaint</span>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold text-primary">Notes</p></div>
        <div className="flex gap-2 mb-2">
          <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." onKeyDown={e => e.key === "Enter" && addNote()} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs outline-none focus:border-brand" />
          <button onClick={addNote} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-secondary hover:bg-secondary"><Plus className="size-4 text-secondary" /></button>
        </div>
        {notes.length === 0 ? <p className="text-center text-xs text-quaternary py-4">No notes yet</p> : <div className="space-y-2">{notes.map(n => <div key={n.id} className="rounded-lg border border-secondary bg-secondary_alt px-3 py-2"><p className="text-xs text-primary">{n.text}</p><p className="text-[10px] text-quaternary mt-1">{n.author} · {n.date}</p></div>)}</div>}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold text-primary">Scheduled Actions</p><button className="text-xs font-medium text-brand-secondary hover:underline">New action</button></div>
        <p className="text-center text-xs text-quaternary py-3">No actions scheduled</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-primary mb-2">File Library</p>
        <div className="space-y-1.5">{FILE_LIBRARY.map((f, i) => <button key={i} className="flex items-start gap-2 w-full text-left hover:bg-secondary_alt rounded-lg p-1.5"><File01 className="size-3.5 text-quaternary shrink-0 mt-0.5" /><div className="min-w-0"><p className="text-[10px] text-quaternary">{f.date}</p><p className="text-xs text-brand-secondary hover:underline truncate">{f.name}</p></div></button>)}</div>
      </div>
    </div>
  );

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />
      <main className="flex-1 min-h-screen flex flex-col overflow-hidden">
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-5 pb-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full text-white text-base font-bold" style={{ background: COMPLAINT.statusColor }}>
              {COMPLAINT.customer.firstName[0]}{COMPLAINT.customer.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Complaint #{COMPLAINT.id}</h1>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: COMPLAINT.statusColor, color: COMPLAINT.statusColor, background: "#F0FDF4" }}>{COMPLAINT.statusLabel}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-brand-secondary font-medium cursor-pointer hover:underline">{COMPLAINT.customer.title} {COMPLAINT.customer.firstName} {COMPLAINT.customer.lastName}</span>
                <span className="text-xs text-quaternary">—</span>
                <span className="text-xs text-tertiary">{COMPLAINT.info.type}</span>
              </div>
            </div>
            <button title="Edit" className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg border border-secondary hover:bg-secondary hover:border-brand text-quaternary hover:text-brand-secondary"><Edit01 className="size-4" /></button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusButton />
            <DropdownButton label="Actions" icon="⚡" items={[{ label: "SMS", icon: "💬" }, { label: "Email", icon: "✉️" }, { label: "Schedule", icon: "📅" }, { label: "Upload Files", icon: "📎" }, ]} />
            <button onClick={() => setMobileSidebarOpen(true)} className="xl:hidden inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary"><Users01 className="size-3.5" /> More Info</button>
          </div>
        </div>
        <div className="flex flex-1 min-h-0 overflow-y-auto">
          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            <p className="text-[10px] text-quaternary px-1 flex items-center gap-1"><DotsGrid className="size-3" /> Drag sections to reorder</p>
            {sectionOrder.map(id => renderSection(id))}
          </div>
          <div className={"shrink-0 border-l border-secondary bg-primary hidden xl:flex flex-col transition-all duration-200 " + (sidebarPinned ? "w-80" : "w-10")}>
            <div className={"flex items-center px-2 pt-2 pb-1 " + (sidebarPinned ? "justify-end" : "justify-center")}>
              <button onClick={() => setSidebarPinned(p => { const n = !p; try { localStorage.setItem("axis_complaint_sidebar_v1", n ? "1" : "0"); } catch {} return n; })}
                className={"flex size-7 items-center justify-center rounded-lg transition-colors " + (sidebarPinned ? "text-brand-secondary bg-brand-secondary" : "text-quaternary hover:bg-secondary hover:text-secondary")}>
                {sidebarPinned ? <Pin01 className="size-3.5" /> : <Pin02 className="size-3.5" />}
              </button>
            </div>
            {sidebarPinned && sidebarContent}
          </div>
        </div>
      </main>
      {mobileSidebarOpen && (<><div className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={() => setMobileSidebarOpen(false)} /><div className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-primary border-l border-secondary flex flex-col xl:hidden shadow-2xl"><div className="flex items-center justify-end px-4 py-2 border-b border-secondary shrink-0"><button onClick={() => setMobileSidebarOpen(false)} className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary"><X className="size-4" /></button></div>{sidebarContent}</div></>)}
    </div>
  );
}
