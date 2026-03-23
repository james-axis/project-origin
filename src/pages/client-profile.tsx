import { useState, useRef, useEffect } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import {
  ChevronDown, ChevronRight, Plus, X, Edit01, Phone01, Mail01, Check,
  File01, User01, Users01, Tag01,
} from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityEntry { date: string; user: string; action: string; note?: string; }
interface CallEntry     { date: string; phone: string; status: string; duration: string; }
interface FileEntry     { date: string; name: string; }
interface NoteEntry     { id: number; text: string; author: string; date: string; }

// ─── Mock client data seeded from DB record 38456 ────────────────────────────
const CLIENT = {
  id: 38456,
  title: "Mr",
  firstName: "Jon",
  middleName: "(Jon)",
  lastName: "Doe",
  preferredName: "Jon",
  status: 0,
  statusLabel: "Prospect",
  dob: "15/06/1985",
  age: 40,
  gender: "Male",
  smoker: false,
  state: "NSW",
  city: "Sydney",
  postcode: "2000",
  address: "42 Martin Place",
  phone: "0412 345 678",
  phone2: "(02) 9876 5432",
  email: "jon.doe@testmail.com.au",
  email2: "jdoe.work@testmail.com.au",
  contactTime: "Afternoon",
  employment: "Employed full-time",
  occupation: "Software Engineer",
  salary: 95000,
  height: 178,
  weight: 82,
  bmi: "25.88",
  family: "Married",
  children: 2,
  childrenAges: "8, 5",
  maritalStatus: "Married",
  taxRate: "30.00%",
  group: "Three Dogs Insurance",
  referrer: "",
  affiliateCompany: "",
  tags: ["TEST CLIENT"],
  // Lead progress
  assignedTo: "SLG Test Training",
  consultant: "James Nicholls",
  admin: "SLG Test Training",
  createdOn: "16/03/2026 09:13",
  assignedOn: "17/03/2026 06:28",
  updatedOn: "17/03/2026 06:29",
  // Lead info
  campaignGroup: "Organic",
  campaign: "No Campaign",
  refer: "",
  keywords: "",
  website: "",
  path: "",
  nextContact: null as string | null,
  // Contacts
  callsMade: 0,
  emailsSent: 0,
  smsSent: 0,
  seventyPctSalary: "$66,500",
  marginaltaxRate: "30.00%",
};

const CALLS: CallEntry[] = [
  { date: "18/12/2024 09:55 AM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
  { date: "01/11/2024 01:08 PM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
  { date: "31/10/2024 02:47 PM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
  { date: "31/10/2024 11:34 AM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
  { date: "25/10/2024 01:29 PM", phone: "0412 345 678", status: "Completed", duration: "0:00" },
];

const ACTIVITY: ActivityEntry[] = [
  { date: "17/03/2026 06:28", user: "James Nicholls",  action: "Lead reassigned",  note: "Lead reassigned to SLG Test T (Admin)" },
  { date: "16/03/2026 09:13", user: "James Nicholls",  action: "Lead assigned",    note: "Lead assigned to James N" },
  { date: "16/03/2026 09:13", user: "James Nicholls",  action: "Lead created",     note: "Lead created" },
];

const FILE_LIBRARY: FileEntry[] = [
  { date: "15/10/2025", name: "SLS_Limited APL_Scripting_Oct 2025.pdf" },
  { date: "15/10/2025", name: "SLS_Full APL_Scripting_Oct 2025.pdf" },
  { date: "15/10/2025", name: "nexa Life Scripting_October 2025.pdf" },
  { date: "15/05/2025", name: "SLS - FSG_Part_1 - April 2025.pdf" },
  { date: "01/05/2025", name: "nexa_PrivacyPolicy.pdf" },
  { date: "01/05/2025", name: "Guide_to_Personal_Insurances.pdf" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Dropdown button ─────────────────────────────────────────────────────────
function DropdownButton({ label, icon, items, variant = "default" }: {
  label: string; icon?: string;
  items: { label: string; icon?: string; danger?: boolean }[];
  variant?: "default" | "brand";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={"inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors " +
          (variant === "brand"
            ? "border-brand-solid bg-brand-solid text-white hover:bg-brand-solid_hover"
            : "border-secondary bg-primary text-secondary hover:bg-secondary")}>
        {icon && <span>{icon}</span>}
        {label}
        <ChevronDown className="size-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden py-1">
          {items.map((item, i) => (
            <button key={i} onClick={() => setOpen(false)}
              className={"flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-secondary_alt transition-colors " +
                (item.danger ? "text-error-primary" : "text-primary")}>
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inline editable field ────────────────────────────────────────────────────
function EditableField({ label, value, options }: {
  label: string; value: string; options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  useEffect(() => { if (editing) (inputRef.current as HTMLElement | null)?.focus(); }, [editing]);
  return (
    <div className="flex items-center justify-between py-2 border-b border-secondary last:border-0">
      <div className="flex items-center gap-2 text-xs text-tertiary">
        <User01 className="size-3.5 text-quaternary" />
        {label}:
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          {options ? (
            <select ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={val} onChange={e => setVal(e.target.value)}
              onBlur={() => setEditing(false)}
              className="rounded border border-brand bg-primary px-2 py-0.5 text-xs text-primary outline-none">
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input ref={inputRef as React.RefObject<HTMLInputElement>}
              value={val} onChange={e => setVal(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={e => e.key === "Enter" && setEditing(false)}
              className="rounded border border-brand bg-primary px-2 py-0.5 text-xs text-primary outline-none w-32" />
          )}
          <button onClick={() => setEditing(false)}
            className="flex size-5 items-center justify-center rounded bg-brand-solid text-white hover:bg-brand-solid_hover">
            <Check className="size-3" />
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 group">
          <span className="text-xs font-medium text-primary group-hover:text-brand-secondary transition-colors">{val}</span>
          <Edit01 className="size-3 text-quaternary opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
}

// ─── Inline editable group field ──────────────────────────────────────────────
function EditableGroupField({ value }: { value: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const GROUPS = ["Three Dogs Insurance","UFinancial","Surety","Vital","Hunter Galloway","Covered Life","CH Life","Armor Insurance Solutions"];
  return editing ? (
    <div className="flex items-center gap-1.5 mt-0.5">
      <select value={val} onChange={e => setVal(e.target.value)}
        autoFocus onBlur={() => setEditing(false)}
        className="rounded border border-brand bg-primary px-2 py-0.5 text-xs text-primary outline-none flex-1">
        {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
      <button onClick={() => setEditing(false)}
        className="flex size-5 items-center justify-center rounded bg-brand-solid text-white">
        <Check className="size-3" />
      </button>
    </div>
  ) : (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1 group text-xs text-tertiary mt-0.5 hover:text-brand-secondary transition-colors">
      {val}
      <Edit01 className="size-3 text-quaternary opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
    </button>
  );
}

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode; span?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-4 py-4">
      {items.map((item, i) => (
        <div key={i} className={item.span ? "col-span-2 sm:col-span-2" : ""}>
          <p className="text-[11px] text-quaternary mb-0.5">{item.label}</p>
          <p className="text-sm text-primary font-medium">{item.value || <span className="text-quaternary">—</span>}</p>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, action, actionLabel, children, defaultOpen = true }: {
  title: string; action?: () => void; actionLabel?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-secondary_alt transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-brand-solid shrink-0" />
          <span className="text-sm font-semibold text-primary">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {action && actionLabel && (
            <button onClick={e => { e.stopPropagation(); action(); }}
              className="flex items-center gap-1 rounded-lg border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary hover:bg-secondary transition-colors">
              <Plus className="size-3.5 text-success-primary" />{actionLabel}
            </button>
          )}
          {open ? <ChevronDown className="size-4 text-quaternary" /> : <ChevronRight className="size-4 text-quaternary" />}
        </div>
      </button>
      {open && <div className="border-t border-secondary">{children}</div>}
    </div>
  );
}

function ActionButton({ label, icon, onClick, variant = "default" }: {
  label: string; icon?: string; onClick?: () => void; variant?: "default" | "danger";
}) {
  return (
    <button onClick={onClick}
      className={"inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors " +
        (variant === "danger"
          ? "border-error-primary bg-[#FEF2F2] text-error-primary hover:bg-[#FEE2E2]"
          : "border-secondary bg-primary text-secondary hover:bg-secondary")}>
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ClientProfilePage() {
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "applications" | "files">("details");

  const statusColor = "#D34108"; // Prospect

  function addNote() {
    if (!noteText.trim()) return;
    setNotes(prev => [{ id: Date.now(), text: noteText, author: "James Nicholls", date: new Date().toLocaleDateString("en-AU") }, ...prev]);
    setNoteText("");
  }

  return (
    <div className="lg:flex min-h-screen bg-primary">
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="flex-1 min-h-screen flex flex-col overflow-hidden">

        {/* ── Page header ── */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-5 pb-4 shrink-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-white text-base font-bold" style={{ background: statusColor }}>
                {CLIENT.firstName[0]}{CLIENT.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                    Client #{CLIENT.id} — {CLIENT.title} {CLIENT.firstName} {CLIENT.middleName} {CLIENT.lastName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    style={{ borderColor: statusColor, color: statusColor, background: "#FFF4F0" }}>
                    {CLIENT.statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5"><EditableGroupField value={CLIENT.group} /><span className="text-xs text-quaternary">· Created {CLIENT.createdOn}</span></div>
              </div>
            </div>
          </div>

          {/* Action toolbar */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <ActionButton label="Edit" icon="✏️" />
            <ActionButton label="Form" icon="📋" />
            <DropdownButton variant="brand" label="New" icon="✚" items={[
              { label: "Quote",          icon: "💡" },
              { label: "Pre-Assessment", icon: "🩺" },
              { label: "Application",    icon: "📝" },
              { label: "Claim",          icon: "🛡️" },
              { label: "Dishonour",      icon: "⚠️" },
              { label: "Complaint",      icon: "💬" },
            ]} />
            <DropdownButton label="Actions" icon="⚡" items={[
              { label: "SMS",           icon: "💬" },
              { label: "Email",         icon: "✉️" },
              { label: "Schedule",      icon: "📅" },
              { label: "Upload Files",  icon: "📎" },
              { label: "Set Status",    icon: "🔄" },
              { label: "Close",         icon: "✕", danger: true },
            ]} />
            <DropdownButton label="Other" icon="⋯" items={[
              { label: "PDF",            icon: "📄" },
              { label: "Docs",           icon: "📁" },
              { label: "Off APL",        icon: "🔕" },
              { label: "Marketing List", icon: "📊" },
            ]} />
          </div>
        </div>

        {/* ── Body: main + sidebar ── */}
        <div className="flex flex-1 min-h-0 overflow-y-auto">

          {/* Left main column */}
          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">

            {/* Customer Information */}
            <SectionCard title="Customer Information">
              <InfoGrid items={[
                { label: "First/Middle Name", value: `${CLIENT.title} ${CLIENT.firstName} ${CLIENT.middleName}` },
                { label: "Preferred Name",    value: CLIENT.preferredName },
                { label: "Last Name",         value: CLIENT.lastName },
                { label: "Employment / Occupation", value: `${CLIENT.employment} / ${CLIENT.occupation}` },
                { label: "DOB (Age)",         value: `${CLIENT.dob} (${CLIENT.age} years old)` },
                { label: "Gender",            value: CLIENT.gender },
                { label: "State",             value: `${CLIENT.state} (17:57)` },
                { label: "Next Contact",      value: CLIENT.nextContact },
                { label: "Contacts Made",     value: (
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-quaternary"><Phone01 className="size-3" />{CLIENT.callsMade}</span>
                    <span className="flex items-center gap-1 text-quaternary"><Mail01 className="size-3" />{CLIENT.emailsSent}</span>
                    <span className="flex items-center gap-1 text-quaternary">💬{CLIENT.smsSent}</span>
                  </span>
                )},
                { label: "Salary",            value: `$${CLIENT.salary.toLocaleString()}` },
                { label: "70% of Salary",     value: CLIENT.seventyPctSalary },
                { label: "Affiliate Company", value: CLIENT.affiliateCompany },
                { label: "Referrer Name",     value: CLIENT.referrer },
                { label: "Marginal Tax Rate", value: CLIENT.marginaltaxRate },
                { label: "Group",             value: CLIENT.group },
              ]} />
              {CLIENT.tags.length > 0 && (
                <div className="flex items-center gap-2 px-4 pb-3">
                  <Tag01 className="size-3.5 text-quaternary" />
                  <span className="text-xs text-quaternary">Tags:</span>
                  {CLIENT.tags.map(t => (
                    <span key={t} className="text-xs font-semibold text-brand-secondary hover:underline cursor-pointer">{t}</span>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Tasks */}
            <SectionCard title="Tasks" actionLabel="New Task" action={() => {}}>
              <div className="px-4 py-4 text-sm text-quaternary text-center">No tasks yet</div>
            </SectionCard>

            {/* Dependants */}
            <SectionCard title="Dependants" actionLabel="Add Dependant" action={() => {}}>
              <InfoGrid items={[
                { label: "Marital Status", value: CLIENT.maritalStatus },
                { label: "Children",       value: `${CLIENT.children} children (aged ${CLIENT.childrenAges})` },
              ]} />
            </SectionCard>

            {/* Client's Existing Superfunds */}
            <SectionCard title="Client's Existing Superfunds" actionLabel="Add Superfund" action={() => {}}>
              <div className="px-4 py-4 text-sm text-quaternary text-center">No superfunds added</div>
            </SectionCard>

            {/* Contact Information */}
            <SectionCard title="Contact Information">
              <InfoGrid items={[
                { label: "Phone",         value: <span className="text-brand-secondary">{CLIENT.phone}</span> },
                { label: "Additional Phone(s)", value: <span className="text-brand-secondary">{CLIENT.phone2}</span> },
                { label: "Preferred Contact Time", value: CLIENT.contactTime },
                { label: "Email",         value: <span className="text-brand-secondary">{CLIENT.email}</span>, span: true },
                { label: "Additional Email(s)", value: <span className="text-brand-secondary">{CLIENT.email2}</span>, span: true },
              ]} />
            </SectionCard>

            {/* Customer Profile */}
            <SectionCard title="Customer Profile">
              <InfoGrid items={[
                { label: "Marital Status",       value: CLIENT.maritalStatus },
                { label: "Children",             value: `${CLIENT.children} children (aged ${CLIENT.childrenAges})` },
                { label: "Address",              value: CLIENT.address },
                { label: "City, State, Postcode",value: `${CLIENT.city}, ${CLIENT.state} ${CLIENT.postcode}` },
                { label: "Height",               value: `${CLIENT.height} cm` },
                { label: "Weight",               value: `${CLIENT.weight} kg` },
                { label: "BMI",                  value: CLIENT.bmi },
                { label: "Smoker Status",        value: CLIENT.smoker ? "Smoker" : "Non-smoker" },
              ]} />
            </SectionCard>

            {/* Lead Progress */}
            <SectionCard title="Lead Progress">
              <InfoGrid items={[
                { label: "Assigned To",  value: CLIENT.assignedTo },
                { label: "Created On",   value: CLIENT.createdOn },
                { label: "Assigned On",  value: CLIENT.assignedOn },
                { label: "Updated On",   value: CLIENT.updatedOn },
              ]} />
            </SectionCard>

            {/* Lead Information */}
            <SectionCard title="Lead Information">
              <InfoGrid items={[
                { label: "Campaign Group", value: CLIENT.campaignGroup },
                { label: "Campaign",       value: CLIENT.campaign },
                { label: "Refer",          value: CLIENT.refer },
                { label: "Keywords",       value: CLIENT.keywords },
                { label: "Website",        value: CLIENT.website },
                { label: "Path",           value: CLIENT.path },
              ]} />
            </SectionCard>

            {/* Activity Log */}
            <SectionCard title="Activity Log" defaultOpen={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-secondary_alt border-b border-secondary">
                    <tr>
                      {["Date","User","Action","Note"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-quaternary whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
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
          </div>

          {/* Right sidebar */}
          <div className="w-80 shrink-0 border-l border-secondary bg-primary overflow-y-auto px-4 py-4 space-y-4 hidden xl:block">

            {/* Clients & Applications */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-primary">Clients & Applications</p>
              </div>
              {/* Role icons */}
              <div className="flex gap-2 mb-2">
                <button className="flex size-8 items-center justify-center rounded-lg border border-secondary hover:bg-secondary transition-colors">
                  <User01 className="size-4 text-quaternary" />
                </button>
                <button className="flex size-8 items-center justify-center rounded-lg border border-secondary hover:bg-secondary transition-colors">
                  <Users01 className="size-4 text-quaternary" />
                </button>
                <button className="flex size-8 items-center justify-center rounded-lg border border-secondary hover:bg-secondary transition-colors">
                  <Users01 className="size-4 text-quaternary" />
                </button>
              </div>
              {/* Active client card */}
              <div className="rounded-lg px-3 py-2.5 flex items-center justify-between text-sm font-semibold text-white" style={{ background: "#D34108" }}>
                <span className="flex items-center gap-2">
                  <User01 className="size-3.5" />
                  {CLIENT.title} {CLIENT.firstName} ({CLIENT.preferredName}) {CLIENT.lastName}
                </span>
                <span className="rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-[10px]">Prospect</span>
              </div>
            </div>

            {/* Assigned Team */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-primary">Assigned Team</p>

              </div>
              <EditableField label="Consultant" value="James Nicholls" options=["James Nicholls","SLG Test Training","Maysee Chang","John Rojas","Dean Hines","Lucas Kenyon","Adam Cowburn","Advice Team","Audits Team","Natasha Carlson"] />
              <EditableField label="Admin" value="SLG Test Training" options=["James Nicholls","SLG Test Training","Maysee Chang","John Rojas","Dean Hines","Lucas Kenyon","Adam Cowburn","Advice Team","Audits Team","Natasha Carlson"] />
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-primary">Notes</p>
                <button className="text-xs font-medium text-brand-secondary hover:underline">Audit</button>
              </div>
              <div className="flex gap-2 mb-2">
                <input value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  onKeyDown={e => e.key === "Enter" && addNote()}
                  className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-xs outline-none focus:border-brand" />
                <button onClick={addNote} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-secondary hover:bg-secondary">
                  <Plus className="size-4 text-secondary" />
                </button>
              </div>
              {notes.length === 0 ? (
                <p className="text-center text-xs text-quaternary py-4">This section is empty</p>
              ) : (
                <div className="space-y-2">
                  {notes.map(n => (
                    <div key={n.id} className="rounded-lg border border-secondary bg-secondary_alt px-3 py-2">
                      <p className="text-xs text-primary">{n.text}</p>
                      <p className="text-[10px] text-quaternary mt-1">{n.author} · {n.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calls */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2">Calls</p>
              <div className="space-y-2">
                {CALLS.map((call, i) => (
                  <div key={i} className="border-b border-secondary pb-2 last:border-0">
                    <p className="text-[11px] text-tertiary flex items-center gap-1">
                      <Phone01 className="size-3 text-quaternary" />
                      {call.date} | {call.status} | {call.duration}
                    </p>
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
              <div className="flex gap-1.5 mb-2">
                <input placeholder="Search..." className="flex-1 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs outline-none focus:border-brand" />
              </div>
              <p className="text-center text-xs text-quaternary py-3">No files matching query found</p>
            </div>

            {/* File Library */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2">File Library</p>
              <div className="flex gap-1.5 mb-2">
                <input placeholder="Search..." className="flex-1 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs outline-none focus:border-brand" />
              </div>
              <div className="space-y-1.5">
                {FILE_LIBRARY.map((f, i) => (
                  <button key={i} className="flex items-start gap-2 w-full text-left hover:bg-secondary_alt rounded-lg p-1.5 transition-colors">
                    <File01 className="size-3.5 text-quaternary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-quaternary">{f.date}</p>
                      <p className="text-xs text-brand-secondary hover:underline truncate">{f.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
