import { useState } from "react";
import {
  Settings01, List, Users01, Shield01, Bell01, Link01,
  ChevronRight, ChevronDown, Plus, DotsGrid, Trash01,
  Edit01, Lock01, Zap, Toggle01Right, X, Check, InfoCircle, Menu01,
} from "@untitledui/icons";

type Domain = "lead" | "application" | "dishonour" | "claim";
type TriggerType = "object_created" | "task_completed";

interface TaskItem {
  id: number; name: string; triggerType: TriggerType;
  assigneeRole: string; enabled: boolean;
  locked?: boolean; condition?: string; completionOptions?: string[];
}
interface DomainConfig {
  id: Domain; label: string; description: string; tasks: TaskItem[];
}

const initialDomains: DomainConfig[] = [
  { id: "lead", label: "Lead", description: "Pre-sale client journey from new lead to application", tasks: [
    { id: 166, name: "Introduction Call", triggerType: "object_created", assigneeRole: "Consultant", enabled: true },
    { id: 207, name: "Initial Life Discussion", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
    { id: 147, name: "Life Insurance Discussion", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
    { id: 102, name: "Quote Review", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
    { id: 150, name: "Life Insurance Follow-up", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
    { id: 172, name: "Book Insurance Review", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
  ]},
  { id: "application", label: "Application", description: "Application submission through to inforce or cancellation", tasks: [
    { id: 134, name: "Add Policy / Application Number", triggerType: "object_created", assigneeRole: "Admin", enabled: true },
    { id: 117, name: "Send application submitted email to client", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
    { id: 159, name: "Upload face to face documents", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true, condition: "meeting_type = face_to_face" },
    { id: 99, name: "Compliance Audit", triggerType: "task_completed", assigneeRole: "Services", enabled: true, locked: true, completionOptions: ["Pass", "On Hold", "Remediation Required"] },
    { id: 135, name: "Compliance Billing", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
    { id: 154, name: "Audit Finalisation", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
    { id: 133, name: "Input life insurance amounts & premiums", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
    { id: 180, name: "Inforce call & email", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
  ]},
  { id: "dishonour", label: "Dishonour", description: "Missed payment recovery flow", tasks: [
    { id: 36, name: "Initial follow up", triggerType: "object_created", assigneeRole: "Consultant", enabled: true },
    { id: 183, name: "Check if policy is paid up to date", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
    { id: 230, name: "Support action - call / email", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
    { id: 59, name: "Re-attempt follow up", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
    { id: 44, name: "Re-instatement form", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
  ]},
  { id: "claim", label: "Claim", description: "End-to-end claim lodgement and assessment", tasks: [
    { id: 47, name: "Initial claims form", triggerType: "object_created", assigneeRole: "Services", enabled: true },
    { id: 64, name: "Certified ID", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
    { id: 48, name: "Medicare release form", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
    { id: 53, name: "Initial doctors form", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
    { id: 49, name: "Financials", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
    { id: 52, name: "TFN declaration", triggerType: "task_completed", assigneeRole: "Services", enabled: true, condition: "claim_type = income_protection" },
    { id: 51, name: "Payment forms", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
    { id: 50, name: "Follow-up assessment", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
  ]},
];

const ASSIGNEE_ROLES = ["Consultant", "Admin", "Services", "Compliance", "Manager"];
const settingsNav = [
  { id: "task-builder", label: "Task Builder", icon: List },
  { id: "general", label: "General", icon: Settings01 },
  { id: "users", label: "Users & Permissions", icon: Users01 },
  { id: "security", label: "Security", icon: Shield01 },
  { id: "notifications", label: "Notifications", icon: Bell01 },
  { id: "integrations", label: "Integrations", icon: Link01 },
];
const domainDotMap: Record<Domain, string> = {
  lead: "bg-brand-solid", application: "bg-success-solid",
  dishonour: "bg-warning-solid", claim: "bg-error-solid",
};
const domainBadgeMap: Record<Domain, string> = {
  lead: "bg-brand-secondary text-brand-secondary",
  application: "bg-success-secondary text-success-primary",
  dishonour: "bg-warning-secondary text-warning-primary",
  claim: "bg-error-secondary text-error-primary",
};

function EditModal({ task, onSave, onClose }: { task: TaskItem | null; onSave: (t: TaskItem) => void; onClose: () => void }) {
  const [form, setForm] = useState<TaskItem>(
    task ?? { id: Date.now(), name: "", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true }
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-secondary bg-primary shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <div>
            <h3 className="text-base font-medium text-primary">{task ? "Edit task" : "New task"}</h3>
            <p className="text-sm text-tertiary">Configure this task in the chain</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary transition-colors">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Task name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              placeholder="e.g. Send submitted email to client" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Assignee role</label>
            <select value={form.assigneeRole} onChange={(e) => setForm({ ...form, assigneeRole: e.target.value })}
              className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors">
              {ASSIGNEE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Condition <span className="text-tertiary font-normal">(optional)</span></label>
            <input value={form.condition ?? ""} onChange={(e) => setForm({ ...form, condition: e.target.value || undefined })}
              className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary placeholder:text-placeholder font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              placeholder="e.g. meeting_type = face_to_face" />
            <p className="text-xs text-tertiary">Only create this task when condition is met</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-secondary bg-secondary_alt px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Lock01 className="size-4 text-fg-tertiary shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium text-primary">System locked</p>
                <p className="text-xs text-tertiary">Prevent reordering or deleting</p>
              </div>
            </div>
            <button onClick={() => setForm({ ...form, locked: !form.locked })}
              className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 " + (form.locked ? "bg-brand-solid" : "bg-tertiary")}>
              <span className={"inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform " + (form.locked ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors disabled:opacity-50">
            <Check className="size-3.5" aria-hidden />Save task
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, index, isFirst, domain, onToggle, onEdit, onDelete, onDragStart, onDragOver, onDrop, isDragOver }: {
  task: TaskItem; index: number; isFirst: boolean; domain: Domain;
  onToggle: (id: number) => void; onEdit: (t: TaskItem) => void; onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent, i: number) => void; onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (e: React.DragEvent, i: number) => void; isDragOver: boolean;
}) {
  return (
    <div draggable={!task.locked} onDragStart={(e) => onDragStart(e, index)} onDragOver={(e) => onDragOver(e, index)} onDrop={(e) => onDrop(e, index)}
      className={"group relative flex items-start sm:items-center gap-3 rounded-xl border px-3 sm:px-4 py-3 transition-all duration-100 " +
        (isDragOver ? "border-brand bg-brand-primary_alt shadow-md" : "border-secondary bg-primary hover:border-primary hover:shadow-sm") +
        (!task.enabled ? " opacity-50" : "")}>
      <div className={"hidden sm:block cursor-grab text-fg-quaternary mt-0.5 transition-opacity " + (task.locked ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100")}>
        <DotsGrid className="size-4" aria-hidden />
      </div>
      <div className="flex flex-col items-center w-6 shrink-0 mt-0.5">
        {isFirst ? (
          <div className={"flex size-6 items-center justify-center rounded-full " + domainBadgeMap[domain]}><Zap className="size-3" aria-hidden /></div>
        ) : (
          <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-tertiary">{index + 1}</div>
        )}
      </div>
      <div className="flex flex-1 min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex flex-1 flex-col min-w-0 gap-0.5">
          <div className="flex items-center gap-2">
            <span className={"text-sm font-medium " + (task.enabled ? "text-primary" : "text-disabled")}>{task.name}</span>
            {task.locked && <Lock01 className="size-3 text-fg-quaternary shrink-0" aria-hidden />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-tertiary">{isFirst ? "Fires on object created" : "Fires when previous is completed"}</span>
            {task.condition && <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-secondary font-mono">if {task.condition}</span>}
            {task.completionOptions && <span className="flex items-center gap-1 text-xs text-tertiary"><ChevronDown className="size-3" aria-hidden />{task.completionOptions.length} outcomes</span>}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="shrink-0 rounded-md border border-secondary bg-secondary px-2 py-1 text-xs text-secondary">{task.assigneeRole}</span>
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={() => onToggle(task.id)} className={"flex size-8 items-center justify-center rounded-lg transition-colors " + (task.enabled ? "text-success-primary hover:bg-success-secondary" : "text-fg-quaternary hover:bg-secondary")} title={task.enabled ? "Disable" : "Enable"}>
              <Toggle01Right className="size-4" aria-hidden />
            </button>
            <button onClick={() => onEdit(task)} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary transition-colors" title="Edit">
              <Edit01 className="size-4" aria-hidden />
            </button>
            {!task.locked && (
              <button onClick={() => onDelete(task.id)} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors" title="Remove">
                <Trash01 className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskBuilder() {
  const [domains, setDomains] = useState<DomainConfig[]>(initialDomains);
  const [activeDomain, setActiveDomain] = useState<Domain>("lead");
  const [editingTask, setEditingTask] = useState<TaskItem | null | "new">(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const domain = domains.find((d) => d.id === activeDomain)!;
  const updateDomain = (tasks: TaskItem[]) => setDomains((prev) => prev.map((d) => d.id === activeDomain ? { ...d, tasks } : d));
  const handleToggle = (id: number) => updateDomain(domain.tasks.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t));
  const handleDelete = (id: number) => updateDomain(domain.tasks.filter((t) => t.id !== id));
  const handleSave = (task: TaskItem) => {
    editingTask === "new" ? updateDomain([...domain.tasks, { ...task, triggerType: "task_completed" }]) : updateDomain(domain.tasks.map((t) => t.id === task.id ? task : t));
    setEditingTask(null);
  };
  const handleDragStart = (_: React.DragEvent, i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDrop = (_: React.DragEvent, dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) { setDragOverIndex(null); setDragIndex(null); return; }
    const tasks = [...domain.tasks];
    const [moved] = tasks.splice(dragIndex, 1);
    tasks.splice(dropIndex, 0, moved);
    updateDomain(tasks.map((t, i) => ({ ...t, triggerType: (i === 0 ? "object_created" : "task_completed") as TriggerType })));
    setDragOverIndex(null); setDragIndex(null);
  };
  const handlePublish = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex items-start justify-between gap-4 border-b border-secondary px-4 sm:px-8 py-4 sm:py-6">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-medium text-primary">Task Builder</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-tertiary hidden sm:block">Define the sequential task chain for each domain. Drag to reorder — each task fires when the previous one is marked complete.</p>
        </div>
        <button onClick={handlePublish}
          className={"shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " + (saved ? "bg-secondary border border-secondary text-secondary" : "bg-brand-solid text-white hover:bg-brand-solid_hover")}>
          {saved ? <><Check className="size-3.5" aria-hidden />Published</> : "Publish"}
        </button>
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden flex-col sm:flex-row">
        <div className="flex sm:hidden gap-2 overflow-x-auto px-4 py-3 border-b border-secondary">
          {domains.map((d) => (
            <button key={d.id} onClick={() => setActiveDomain(d.id)}
              className={"shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                (activeDomain === d.id ? "bg-active text-primary border border-primary" : "border border-secondary text-tertiary")}>
              <span className={"size-1.5 rounded-full " + domainDotMap[d.id]} />
              {d.label}
              <span className="text-quaternary">{d.tasks.filter(t => t.enabled).length}</span>
            </button>
          ))}
        </div>
        <div className="hidden sm:block w-52 shrink-0 border-r border-secondary bg-secondary_alt overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {domains.map((d) => (
              <button key={d.id} onClick={() => setActiveDomain(d.id)}
                className={"group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors " +
                  (activeDomain === d.id ? "bg-active text-primary font-medium" : "text-tertiary hover:bg-primary_hover hover:text-secondary")}>
                <div className="flex items-center gap-2.5">
                  <span className={"size-2 rounded-full shrink-0 " + domainDotMap[d.id]} />
                  <span className="text-sm">{d.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-quaternary">{d.tasks.filter((t) => t.enabled).length}</span>
                  {activeDomain === d.id && <ChevronRight className="size-3 text-fg-quaternary" aria-hidden />}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-secondary px-4 sm:px-6 py-3 sm:py-4 gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className={"rounded-lg px-2 sm:px-2.5 py-1 text-xs font-medium shrink-0 " + domainBadgeMap[activeDomain]}>{domain.label}</span>
              <p className="text-xs sm:text-sm text-tertiary truncate hidden sm:block">{domain.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-tertiary hidden sm:block">{domain.tasks.length} tasks</span>
              <button onClick={() => setEditingTask("new")}
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-secondary hover:bg-secondary transition-colors">
                <Plus className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Add task</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
          <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 flex items-start gap-2 rounded-xl border border-secondary bg-secondary_alt px-3 sm:px-4 py-2.5 sm:py-3">
            <InfoCircle className="size-3.5 sm:size-4 text-fg-tertiary mt-0.5 shrink-0" aria-hidden />
            <p className="text-xs text-tertiary leading-relaxed">
              <strong className="text-secondary font-medium">First task</strong> fires on object creation. Each subsequent task fires when the previous is marked complete. Lock tasks to protect from reordering.
            </p>
          </div>
          <div className="flex flex-col gap-2 p-3 sm:p-6">
            {domain.tasks.map((task, index) => (
              <div key={task.id} className="relative">
                {index > 0 && <div className="absolute left-[2.35rem] sm:left-[3.1rem] -top-1 h-2 w-px bg-tertiary opacity-30" />}
                <TaskRow task={task} index={index} isFirst={index === 0} domain={activeDomain}
                  onToggle={handleToggle} onEdit={setEditingTask} onDelete={handleDelete}
                  onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                  isDragOver={dragOverIndex === index} />
              </div>
            ))}
            <button onClick={() => setEditingTask("new")}
              className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-tertiary hover:border-primary hover:text-secondary hover:bg-secondary_alt transition-colors">
              <Plus className="size-4" aria-hidden />Add task to chain
            </button>
          </div>
        </div>
      </div>
      {editingTask !== null && (
        <EditModal task={editingTask === "new" ? null : editingTask} onSave={handleSave} onClose={() => setEditingTask(null)} />
      )}
    </div>
  );
}

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-secondary px-4 sm:px-8 py-4 sm:py-6">
        <h2 className="text-base sm:text-lg font-medium text-primary">{title}</h2>
        <p className="mt-0.5 text-sm text-tertiary">{description}</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-8 sm:p-12">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-secondary bg-secondary_alt">
            <Settings01 className="size-5 text-fg-tertiary" aria-hidden />
          </div>
          <p className="text-sm font-medium text-primary">{title}</p>
          <p className="mt-1 text-sm text-tertiary">This section will be built out in Phase 3.</p>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const [activeSection, setActiveSection] = useState("task-builder");
  const [navOpen, setNavOpen] = useState(false);
  const activeNav = settingsNav.find(n => n.id === activeSection);

  return (
    <div className="flex flex-col sm:flex-row h-full min-h-screen">
      <div className="flex sm:hidden items-center justify-between border-b border-secondary px-4 py-3 bg-primary">
        <div className="flex items-center gap-2">
          {activeNav && <activeNav.icon className="size-4 text-fg-secondary" aria-hidden />}
          <span className="text-sm font-medium text-primary">{activeNav?.label}</span>
        </div>
        <button onClick={() => setNavOpen(!navOpen)}
          className="flex items-center gap-1 rounded-lg border border-secondary px-2.5 py-1.5 text-xs text-secondary hover:bg-secondary transition-colors">
          <Menu01 className="size-3.5" aria-hidden />Menu
        </button>
      </div>
      {navOpen && (
        <div className="sm:hidden border-b border-secondary bg-secondary_alt px-4 py-2">
          {settingsNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveSection(item.id); setNavOpen(false); }}
                className={"flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors " +
                  (isActive ? "bg-active font-medium text-primary" : "text-tertiary hover:bg-primary_hover hover:text-secondary")}>
                <Icon className={"size-4 " + (isActive ? "text-fg-secondary" : "text-fg-quaternary")} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
      <aside className="hidden sm:block w-52 shrink-0 border-r border-secondary">
        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-quaternary">Settings</p>
          <nav className="space-y-0.5">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={"flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                    (isActive ? "bg-active font-medium text-primary" : "text-tertiary hover:bg-primary_hover hover:text-secondary")}>
                  <Icon className={"size-4 " + (isActive ? "text-fg-secondary" : "text-fg-quaternary")} aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {activeSection === "task-builder" && <TaskBuilder />}
        {activeSection === "general" && <PlaceholderSection title="General" description="Organisation name, timezone, and platform preferences" />}
        {activeSection === "users" && <PlaceholderSection title="Users & Permissions" description="Manage team members, roles, and access levels" />}
        {activeSection === "security" && <PlaceholderSection title="Security" description="Two-factor authentication, session management, and audit logs" />}
        {activeSection === "notifications" && <PlaceholderSection title="Notifications" description="Configure email, SMS, and in-app notification preferences" />}
        {activeSection === "integrations" && <PlaceholderSection title="Integrations" description="Connect DocuSign, phone, SMS, email, and AI copilot" />}
      </div>
    </div>
  );
}
