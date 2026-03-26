import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01, X, Settings01, Lock01 } from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskTab = "all" | "scheduled";
type ObjectType = "lead" | "application" | "claim" | "dishonour" | "complaint" | "policy";

interface Task {
  id: number; name: string; object: ObjectType; customerName: string;
  state: string; group: string; assignedTo: string; scheduled: string | null;
  requested: string; lastAction: string; creator: string; lastNote: string;
  taskType: string; overdue: boolean;
}
interface ScheduledTask {
  id: number; task: string; object: ObjectType; customerName: string;
  state: string; group: string; assignedTo: string; scheduled: string;
  requested: string; creator: string; note: string;
}

// ─── Column definitions ───────────────────────────────────────────────────────
interface ColDef { key: string; label: string; defaultVisible: boolean; minWidth?: number; }

const ALL_TASK_COLS: ColDef[] = [
  { key: "name",         label: "Task",          defaultVisible: true,  minWidth: 160 },
  { key: "object",       label: "Object",         defaultVisible: true  },
  { key: "customerName", label: "Customer Name",  defaultVisible: true  },
  { key: "state",        label: "State",          defaultVisible: true  },
  { key: "group",        label: "Group",          defaultVisible: true  },
  { key: "assignedTo",   label: "Assigned To",    defaultVisible: true  },
  { key: "taskType",     label: "Task Type",      defaultVisible: false },
  { key: "scheduled",    label: "Scheduled",      defaultVisible: true  },
  { key: "requested",    label: "Requested",      defaultVisible: true  },
  { key: "lastAction",   label: "Last Action",    defaultVisible: true  },
  { key: "creator",      label: "Creator",        defaultVisible: true  },
  { key: "lastNote",     label: "Last Note",      defaultVisible: true  },
];

const SCHED_COLS: ColDef[] = [
  { key: "task",         label: "Task",           defaultVisible: true, minWidth: 160 },
  { key: "object",       label: "Object",          defaultVisible: true },
  { key: "customerName", label: "Customer Name",   defaultVisible: true },
  { key: "state",        label: "State",           defaultVisible: true },
  { key: "group",        label: "Group",           defaultVisible: true },
  { key: "assignedTo",   label: "Assigned To",     defaultVisible: true },
  { key: "scheduled",    label: "Scheduled",       defaultVisible: true },
  { key: "requested",    label: "Requested",       defaultVisible: true },
  { key: "creator",      label: "Creator",         defaultVisible: true },
  { key: "note",         label: "Note",            defaultVisible: true },
];

const STORE_KEY_ALL   = "axis_tasks_cols_all_v1";
const STORE_KEY_SCHED = "axis_tasks_cols_sched_v1";

function loadColState(key: string, defs: ColDef[]): { order: string[]; visible: Record<string, boolean> } {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return {
    order:   defs.map(c => c.key),
    visible: Object.fromEntries(defs.map(c => [c.key, c.defaultVisible])),
  };
}
function saveColState(key: string, state: { order: string[]; visible: Record<string, boolean> }) {
  localStorage.setItem(key, JSON.stringify(state));
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const GROUPS = ["UFinancial","Surety","Vital","Hunter Galloway","Armor Insurance Solutions","CH Life","Covered Life","DGB Insurance Solutions","Bestplan","Assurance Insurance"];
const USERS  = ["James N","John Rojas","Maysee Chang","Dean Hines","Lucas Kenyon","Nate Elston","Advice Team","Audits Team","Adam Cowburn","Caitlin Gardiner"];
const TASK_TYPES = ["Call","Note","Update","Email","SMS","Schedule","File","Document"];

const MOCK_ALL_TASKS: Task[] = [
  { id:1,  name:"Introduction Call",        object:"lead",        customerName:"Sophie Hartley",         state:"Prospect",                       group:"Surety",                    assignedTo:"James N",     scheduled:null,               requested:"2026-03-23 09:00", lastAction:"2026-03-23 09:01", creator:"James N",     lastNote:"Called — no answer, left voicemail",                    taskType:"Call",     overdue:false },
  { id:2,  name:"Life Insurance Discussion", object:"application", customerName:"Ryan Castellano",        state:"Quote Sent",                     group:"UFinancial",                assignedTo:"John Rojas",  scheduled:null,               requested:"2026-03-23 08:30", lastAction:"2026-03-23 08:31", creator:"John Rojas",  lastNote:"Discussed income protection options",                    taskType:"Call",     overdue:false },
  { id:3,  name:"Compliance Audit",          object:"application", customerName:"Mei Zhang",              state:"Compliance Review",              group:"Vital",                     assignedTo:"Audits Team", scheduled:null,               requested:"2026-03-22 14:00", lastAction:"2026-03-22 16:00", creator:"Dean Hines",  lastNote:"Audit in progress — pending sign-off",                  taskType:"Note",     overdue:true  },
  { id:4,  name:"Claim Follow-Up",           object:"claim",       customerName:"Natalie Brooks",         state:"New Case",                       group:"Hunter Galloway",           assignedTo:"Maysee Chang",scheduled:null,               requested:"2026-03-21 10:00", lastAction:"2026-03-22 09:00", creator:"Maysee Chang",lastNote:"Awaiting medical documentation from GP",                taskType:"Note",     overdue:true  },
  { id:5,  name:"Dishonour Resolution",      object:"dishonour",   customerName:"James O'Sullivan",       state:"Action Required",                group:"Surety",                    assignedTo:"James N",     scheduled:null,               requested:"2026-03-20 08:00", lastAction:"2026-03-23 07:00", creator:"James N",     lastNote:"Bank details updated — re-submit direct debit",         taskType:"Update",   overdue:true  },
  { id:6,  name:"Policy Renewal Review",     object:"policy",      customerName:"Aisha Patel",            state:"Renewal Due",                    group:"UFinancial",                assignedTo:"John Rojas",  scheduled:"2026-04-01 10:00", requested:"2026-03-15 12:00", lastAction:"2026-03-20 11:00", creator:"John Rojas",  lastNote:"Renewal 1 Nov — revisit cover reduction quote",         taskType:"Schedule", overdue:false },
  { id:7,  name:"Initial Fact Find",         object:"lead",        customerName:"Tom Patterson",          state:"Scheduled Appointment",          group:"UFinancial",                assignedTo:"James N",     scheduled:"2026-03-25 14:00", requested:"2026-03-22 16:00", lastAction:"2026-03-22 16:00", creator:"James N",     lastNote:"Appointment confirmed for 25 March 2pm",               taskType:"Call",     overdue:false },
  { id:8,  name:"Application Submission",    object:"application", customerName:"Priya Mehta",            state:"Add Policy/Application Number",  group:"CH Life",                   assignedTo:"Maysee Chang",scheduled:null,               requested:"2026-03-19 09:00", lastAction:"2026-03-22 10:00", creator:"Maysee Chang",lastNote:"Application lodged — awaiting insurer decision",         taskType:"Document", overdue:false },
  { id:9,  name:"Complaint Acknowledgement", object:"complaint",   customerName:"Daniel Okafor",          state:"Open",                           group:"Covered Life",              assignedTo:"Advice Team", scheduled:null,               requested:"2026-03-18 13:00", lastAction:"2026-03-21 15:00", creator:"Advice Team", lastNote:"Acknowledged in writing — escalated to senior adviser", taskType:"Note",     overdue:true  },
  { id:10, name:"Quote Presentation",        object:"lead",        customerName:"Marcus Chen",            state:"Quote Sent",                     group:"DGB Insurance Solutions",   assignedTo:"Lucas Kenyon",scheduled:"2026-03-26 11:00", requested:"2026-03-21 10:00", lastAction:"2026-03-22 09:00", creator:"Lucas Kenyon",lastNote:"Quote sent via email — follow up next week",             taskType:"Email",    overdue:false },
  { id:11, name:"Inforce Confirmation",      object:"policy",      customerName:"Natalie Brooks",         state:"Client",                         group:"Hunter Galloway",           assignedTo:"Maysee Chang",scheduled:null,               requested:"2026-03-17 09:00", lastAction:"2026-03-22 08:00", creator:"Maysee Chang",lastNote:"Policy confirmed inforce by TAL",                        taskType:"Update",   overdue:false },
  { id:12, name:"SMS Follow-Up",             object:"lead",        customerName:"Sophie Hartley",         state:"Prospect",                       group:"Surety",                    assignedTo:"James N",     scheduled:null,               requested:"2026-03-23 10:00", lastAction:"2026-03-23 10:01", creator:"James N",     lastNote:"SMS sent — awaiting reply",                             taskType:"SMS",      overdue:false },
];

const MOCK_SCHEDULED: ScheduledTask[] = [
  { id:1,  task:"Policy Review Call",      object:"policy",      customerName:"Keshmini Raman",          state:"Quote Sent",                    group:"UFinancial",   assignedTo:"Dean Hines",  scheduled:"2027-02-28 09:25", requested:"2026-02-18 10:00", creator:"Dean Hines",  note:"Contact Kena to do her insurances. Her home construction should be completed." },
  { id:2,  task:"Application Review",      object:"application", customerName:"Minh Thong David Hoang",  state:"Add Policy/Application Number", group:"Surety",       assignedTo:"Maysee Chang",scheduled:"2027-02-21 08:21", requested:"2026-02-19 09:00", creator:"Maysee Chang",note:"Review and remove spine exclusion? Check with David if he's had any symptoms." },
  { id:3,  task:"TPD Cover Review",        object:"lead",        customerName:"Robert Mackay",           state:"Client",                        group:"Vital",        assignedTo:"Maysee Chang",scheduled:"2027-01-01 11:21", requested:"2026-02-02 01:00", creator:"Maysee Chang",note:"Review - to add TPD cover? Check with Robert — was declined last year." },
  { id:4,  task:"Trauma Reinstatement",    object:"claim",       customerName:"Cong Khanh Dao",          state:"New Case",                      group:"Hunter Galloway",assignedTo:"Maysee Chang",scheduled:"2026-12-03 08:30", requested:"2026-02-04 02:00", creator:"Maysee Chang",note:"Investigate Khanh's Trauma reinstatement option due this time." },
  { id:5,  task:"Renewal Touchbase",       object:"policy",      customerName:"Dean Douglas",            state:"Client",                        group:"UFinancial",   assignedTo:"Maysee Chang",scheduled:"2026-10-05 11:07", requested:"2026-02-20 01:00", creator:"Maysee Chang",note:"Touchbase as renewal 1 Nov - revisit cover reduction quote for Dean." },
  { id:6,  task:"Renewal Touchbase",       object:"policy",      customerName:"Kylie Rae Douglas",       state:"Client",                        group:"UFinancial",   assignedTo:"Maysee Chang",scheduled:"2026-09-14 12:06", requested:"2026-02-20 01:00", creator:"Maysee Chang",note:"Touchbase as renewal 11 Oct - revisit cover reduction quote for Kylie." },
  { id:7,  task:"DV Follow-Up",            object:"lead",        customerName:"Monica Blazic",           state:"In Progress",                   group:"Covered Life", assignedTo:"Nate Elston", scheduled:"2026-07-28 10:30", requested:"2026-01-28 05:00", creator:"Nate Elston", note:"Client asked for FUP in 6 months still dealing with DV" },
  { id:8,  task:"Return to Work Review",   object:"application", customerName:"Kirsty Kitchener",        state:"Add Policy/Application Number", group:"Surety",       assignedTo:"Maysee Chang",scheduled:"2026-07-06 12:29", requested:"2026-03-19 01:00", creator:"Maysee Chang",note:"Contact Kirsty for review - tpd any/own and IP after she returns to working" },
  { id:9,  task:"Income Cover Quote FU",   object:"lead",        customerName:"Analise Fairall",         state:"Quote Sent",                    group:"Hunter Galloway",assignedTo:"Maysee Chang",scheduled:"2026-07-01 13:11", requested:"2026-03-09 02:00", creator:"Maysee Chang",note:"FU Analise for income cover quote. She's returning to work on 22 July." },
  { id:10, task:"Life Insurance Discussion",object:"application",customerName:"James Schiwy",            state:"Scheduled Appointment",         group:"UFinancial",   assignedTo:"John Rojas",  scheduled:"2026-04-15 08:00", requested:"2026-03-01 09:00", creator:"John Rojas",  note:"Life Insurance Discussion (James & Rebecca)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", { day:"2-digit", month:"short" }) + " " +
    d.toLocaleTimeString("en-AU", { hour:"2-digit", minute:"2-digit", hour12:false });
}
function isOverdue(d: string) { return new Date(d) < new Date(); }

const OBJECT_BADGE: Record<ObjectType, { label: string; cls: string }> = {
  lead:        { label:"Lead",        cls:"bg-blue-100 text-blue-700"   },
  application: { label:"Application", cls:"bg-purple-100 text-purple-700"},
  claim:       { label:"Claim",       cls:"bg-red-100 text-red-700"     },
  dishonour:   { label:"Dishonour",   cls:"bg-orange-100 text-orange-700"},
  complaint:   { label:"Complaint",   cls:"bg-yellow-100 text-yellow-700"},
  policy:      { label:"Policy",      cls:"bg-green-100 text-green-700" },
};

// ─── Column selector panel ────────────────────────────────────────────────────
function ColumnPanel({
  defs, order, visible,
  onToggle, onReorder, onClose,
}: {
  defs: ColDef[];
  order: string[];
  visible: Record<string, boolean>;
  onToggle: (key: string) => void;
  onReorder: (newOrder: string[]) => void;
  onClose: () => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function onDragStart(i: number) { dragIdx.current = i; }
  function onDragEnter(i: number) { setDragOver(i); }
  function onDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...order];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    dragIdx.current = null;
    setDragOver(null);
  }
  function onDragEnd() { dragIdx.current = null; setDragOver(null); }

  const orderedDefs = order.map(k => defs.find(d => d.key === k)).filter(Boolean) as ColDef[];

  return (
    <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary">
        <p className="text-sm font-semibold text-primary">Columns</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onReorder(defs.map(d => d.key))}
            className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose} className="text-fg-quaternary hover:text-secondary">
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-quaternary px-4 pt-2 pb-1">Drag to reorder · toggle to show/hide</p>
      <ul className="max-h-80 overflow-y-auto py-1">
        {orderedDefs.map((col, i) => (
          <li key={col.key}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(i)}
            onDragEnd={onDragEnd}
            className={"flex items-center gap-3 px-4 py-2.5 cursor-grab transition-colors " +
              (dragOver === i ? "bg-brand-secondary" : "hover:bg-secondary_alt")}>
            {/* Drag handle */}
            <svg className="size-3.5 text-fg-quaternary shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="4" width="10" height="1.5" rx="0.75"/>
              <rect x="3" y="7.25" width="10" height="1.5" rx="0.75"/>
              <rect x="3" y="10.5" width="10" height="1.5" rx="0.75"/>
            </svg>
            {/* Toggle */}
            <button onClick={() => onToggle(col.key)}
              className={"flex size-4 shrink-0 items-center justify-center rounded transition-colors " +
                (visible[col.key] ? "bg-brand-solid" : "border border-secondary bg-primary")}>
              {visible[col.key] && <svg className="size-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <span className={"text-xs " + (visible[col.key] ? "text-primary font-medium" : "text-quaternary")}>{col.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── TasksPage ────────────────────────────────────────────────────────────────
export function TasksPage() {
  const [tab, setTab] = useState<TaskTab>("all");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [taskTypeFilter, setTaskTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState("requested");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [colPanelOpen, setColPanelOpen] = useState(false);

  // Per-tab column state
  const [allCols, setAllCols]   = useState(() => loadColState(STORE_KEY_ALL,   ALL_TASK_COLS));
  const [schedCols, setSchedCols] = useState(() => loadColState(STORE_KEY_SCHED, SCHED_COLS));

  const colState  = tab === "all" ? allCols   : schedCols;
  const colDefs   = tab === "all" ? ALL_TASK_COLS : SCHED_COLS;
  const storeKey  = tab === "all" ? STORE_KEY_ALL : STORE_KEY_SCHED;
  const setCols   = tab === "all" ? setAllCols : setSchedCols;
  const LOCKED_COL = tab === "all" ? "name" : "task"; // Task name always first

  function updateCols(next: typeof allCols) {
    setCols(next);
    saveColState(storeKey, next);
  }
  function toggleCol(key: string) {
    if (key === LOCKED_COL) return; // Can't toggle locked column
    const next = { ...colState, visible: { ...colState.visible, [key]: !colState.visible[key] } };
    updateCols(next);
  }
  function reorderCols(order: string[]) {
    updateCols({ ...colState, order });
  }

  // Active ordered visible columns (locked column always first)
  const lockedCol = colDefs.find(d => d.key === LOCKED_COL);
  const visibleCols: ColDef[] = [];
  if (lockedCol) visibleCols.push(lockedCol);
  for (const k of colState.order) {
    if (k === LOCKED_COL) continue;
    const col = colDefs.find(d => d.key === k);
    if (col && colState.visible[col.key]) visibleCols.push(col);
  }

  // ── Filtered rows ──
  const filteredAll = useMemo(() => {
    let rows = MOCK_ALL_TASKS;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q) || r.state.toLowerCase().includes(q));
    }
    if (assigneeFilter !== "All") rows = rows.filter(r => r.assignedTo === assigneeFilter);
    if (groupFilter    !== "All") rows = rows.filter(r => r.group      === groupFilter);
    if (taskTypeFilter !== "All") rows = rows.filter(r => r.taskType   === taskTypeFilter);
    if (dateFilter === "today")   rows = rows.filter(r => r.requested.startsWith(new Date().toISOString().slice(0,10)));
    if (dateFilter === "week")    rows = rows.filter(r => new Date(r.requested) >= new Date(Date.now() - 7*86400000));
    return [...rows].sort((a, b) => {
      const va = String((a as any)[sortKey] ?? "");
      const vb = String((b as any)[sortKey] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [search, assigneeFilter, groupFilter, taskTypeFilter, dateFilter, sortKey, sortDir]);

  const filteredScheduled = useMemo(() => {
    let rows = MOCK_SCHEDULED;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.task.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q));
    }
    if (assigneeFilter !== "All") rows = rows.filter(r => r.assignedTo === assigneeFilter);
    if (groupFilter    !== "All") rows = rows.filter(r => r.group      === groupFilter);
    return rows;
  }, [search, assigneeFilter, groupFilter]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }
  function toggleRow(id: number) {
    setSelectedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    if (selectedRows.size === filteredAll.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filteredAll.map(r => r.id)));
  }

  function downloadCSV() {
    const rows = tab === "all" ? filteredAll : filteredScheduled;
    const headers = visibleCols.map(c => c.label);
    const csv = [
      headers.join(","),
      ...rows.map(r => visibleCols.map(c => {
        const val = (r as any)[c.key];
        return `"${String(val ?? "").replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = `tasks-${tab}-${Date.now()}.csv`;
    a.click();
  }

  // ── Column header with sort ──
  const Th = ({ col, isLocked, hasCheckbox }: { col: ColDef; isLocked?: boolean; hasCheckbox?: boolean }) => (
    <th onClick={() => toggleSort(col.key)}
      style={{ minWidth: col.minWidth }}
      draggable={!isLocked}
      onDragStart={e => { if (isLocked) { e.preventDefault(); return; } e.dataTransfer.setData("text/plain", col.key); e.dataTransfer.effectAllowed = "move"; }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        if (isLocked) return;
        const fromKey = e.dataTransfer.getData("text/plain");
        if (!fromKey || fromKey === col.key || fromKey === LOCKED_COL) return;
        const order = [...colState.order];
        const fi = order.indexOf(fromKey); const ti = order.indexOf(col.key);
        if (fi < 0 || ti < 0) return;
        order.splice(fi, 1); order.splice(ti, 0, fromKey);
        reorderCols(order);
      }}
      className={"cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap group/th" + (isLocked ? ` sticky ${hasCheckbox ? "left-10" : "left-0"} bg-tertiary z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]` : "")}>
      <span className="inline-flex items-center gap-1.5">
        {isLocked ? (
          <Lock01 className="size-3 text-fg-quaternary shrink-0" />
        ) : (
          <svg className="size-3 text-fg-quaternary opacity-0 group-hover/th:opacity-60 transition-opacity cursor-grab shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="4" width="10" height="1.5" rx="0.75"/>
            <rect x="3" y="7.25" width="10" height="1.5" rx="0.75"/>
            <rect x="3" y="10.5" width="10" height="1.5" rx="0.75"/>
          </svg>
        )}
        {col.label}
        <svg className={"size-3 transition-opacity " + (sortKey === col.key ? "opacity-100" : "opacity-20")} viewBox="0 0 10 12" fill="currentColor">
          <path d="M5 1l4 5H1z" opacity={sortDir === "asc" && sortKey === col.key ? "1" : "0.5"}/>
          <path d="M5 11l-4-5h8z" opacity={sortDir === "desc" && sortKey === col.key ? "1" : "0.5"}/>
        </svg>
      </span>
    </th>
  );

  // ── Cell renderer for All Tasks ──
  function renderAllCell(row: Task, key: string) {
    switch (key) {
      case "name": return (
        <div className="flex items-center gap-2">
          {row.overdue && <span className="size-1.5 rounded-full bg-[#D34108] shrink-0" />}
          <span className="font-medium text-primary group-hover:text-brand-secondary transition-colors truncate max-w-[200px]">{row.name}</span>
        </div>
      );
      case "object": return <span className="text-secondary text-xs">{OBJECT_BADGE[row.object].label}</span>;
      case "scheduled": return row.scheduled
        ? <span className="text-secondary text-xs">{formatDateTime(row.scheduled)}</span>
        : <span className="text-quaternary text-xs">—</span>;
      case "requested":  return <span className="text-secondary text-xs">{formatDateTime(row.requested)}</span>;
      case "lastAction": return <span className="text-secondary text-xs">{formatDateTime(row.lastAction)}</span>;
      case "lastNote":   return <p className="text-xs text-secondary truncate max-w-[200px]">{row.lastNote}</p>;
      default:           return <span className="text-secondary text-xs">{String((row as any)[key] ?? "—")}</span>;
    }
  }

  // ── Cell renderer for Scheduled ──
  function renderSchedCell(row: ScheduledTask, key: string) {
    switch (key) {
      case "task": return <span className="font-medium text-primary group-hover:text-brand-secondary transition-colors truncate max-w-[200px]">{row.task}</span>;
      case "object": return <span className="text-secondary text-xs">{OBJECT_BADGE[row.object].label}</span>;
      case "scheduled": return <span className="text-secondary text-xs">{formatDateTime(row.scheduled)}</span>;
      case "requested": return <span className="text-secondary text-xs">{formatDateTime(row.requested)}</span>;
      case "note":      return <p className="text-xs text-secondary truncate max-w-[240px]">{row.note}</p>;
      default:          return <span className="text-secondary text-xs">{String((row as any)[key] ?? "—")}</span>;
    }
  }

  const overdueCount = MOCK_ALL_TASKS.filter(t => t.overdue).length;
  const todayCount   = MOCK_ALL_TASKS.filter(t => t.scheduled && !isOverdue(t.scheduled)).length;
  const hasFilters   = search || assigneeFilter !== "All" || groupFilter !== "All" || taskTypeFilter !== "All";

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">

        {/* ── Header ── */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{ fontFamily:"'Metrophobic', sans-serif" }}>Your Tasks</h1>
              <p className="text-sm text-tertiary mt-0.5">
                {filteredAll.length} tasks ·{" "}
                {overdueCount > 0 && <span className="text-error-primary font-medium">{overdueCount} overdue · </span>}
                {todayCount} due today
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer">
                <option value="all">Select Dates...</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
              </select>
              <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[120px]">
                <option value="All">All Users</option>
                {USERS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[120px]">
                <option value="All">Group</option>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={taskTypeFilter} onChange={e => setTaskTypeFilter(e.target.value)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[120px]">
                <option value="All">Task Type</option>
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex items-center gap-0 -mb-px">
            {([
              { key:"all",       label:"All Tasks", count:MOCK_ALL_TASKS.length  },
              { key:"scheduled", label:"Scheduled", count:MOCK_SCHEDULED.length  },
            ] as const).map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={"flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " +
                  (tab === key ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                {label}
                <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (tab === key ? "bg-brand-secondary text-brand-secondary" : "bg-secondary text-quaternary")}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Task name..."
              className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-3 py-2 text-sm text-primary outline-none focus:border-brand" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>}
          </div>

          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary">{selectedRows.size} selected</span>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Assign To ▾</button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {hasFilters && (
              <button onClick={() => { setSearch(""); setAssigneeFilter("All"); setGroupFilter("All"); setTaskTypeFilter("All"); }}
                className="text-sm text-brand-secondary hover:underline">Clear filters</button>
            )}
            <button onClick={downloadCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
              <Download01 className="size-4 text-success-primary" />
              Download CSV
            </button>

            {/* Column selector button */}
            <div className="relative">
              <button onClick={() => setColPanelOpen(v => !v)}
                className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
                  (colPanelOpen ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-secondary")}>
                <Settings01 className="size-4" />
                Edit Columns
                <span className="rounded-full bg-brand-secondary text-brand-secondary text-[10px] font-semibold px-1.5 py-0.5">
                  {visibleCols.length}/{colDefs.length}
                </span>
              </button>
              {colPanelOpen && (
                <ColumnPanel
                  defs={colDefs}
                  order={colState.order}
                  visible={colState.visible}
                  onToggle={toggleCol}
                  onReorder={reorderCols}
                  onClose={() => setColPanelOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-tertiary border-b border-secondary">
                <tr>
                  {tab === "all" && (
                    <th className="px-3 py-3 w-10 sticky left-0 bg-tertiary z-10">
                      <input type="checkbox"
                        checked={selectedRows.size === filteredAll.length && filteredAll.length > 0}
                        onChange={toggleAll}
                        className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                    </th>
                  )}
                  {visibleCols.map((col, idx) => (
                    <Th key={col.key} col={col} isLocked={idx === 0} hasCheckbox={tab === "all"} />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary bg-primary">
                {tab === "all" ? (
                  filteredAll.length === 0
                    ? <tr><td colSpan={visibleCols.length + 1} className="px-4 py-16 text-center text-sm text-quaternary">No tasks found</td></tr>
                    : filteredAll.map(row => (
                        <tr key={row.id}
                          className={"group transition-colors hover:bg-secondary_alt cursor-pointer " + (row.overdue ? "bg-[#FFFAF9]" : "")}>
                          <td className="px-3 py-3 sticky left-0 bg-primary group-hover:bg-secondary_alt z-10">
                            <input type="checkbox" checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)}
                              className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                          </td>
                          {visibleCols.map((col, idx) => (
                            <td key={col.key} className={"px-3 py-3 " + (idx === 0 ? "sticky left-10 bg-primary group-hover:bg-secondary_alt z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]" : "")}>{renderAllCell(row, col.key)}</td>
                          ))}
                        </tr>
                      ))
                ) : (
                  filteredScheduled.length === 0
                    ? <tr><td colSpan={visibleCols.length} className="px-4 py-16 text-center text-sm text-quaternary">No scheduled tasks found</td></tr>
                    : filteredScheduled.map(row => (
                        <tr key={row.id} className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                          {visibleCols.map((col, idx) => (
                            <td key={col.key} className={"px-3 py-3 " + (idx === 0 ? "sticky left-0 bg-primary group-hover:bg-secondary_alt z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]" : "")}>{renderSchedCell(row, col.key)}</td>
                          ))}
                        </tr>
                      ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-quaternary mt-3 px-1">
            {tab === "all" ? filteredAll.length : filteredScheduled.length} records
            {" · "}{visibleCols.length} of {colDefs.length} columns shown
          </p>
        </div>
      </main>

      {/* Close column panel on outside click */}
      {colPanelOpen && <div className="fixed inset-0 z-40" onClick={() => setColPanelOpen(false)} />}
    </div>
  );
}
