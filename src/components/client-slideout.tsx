// ─────────────────────────────────────────────────────────────────────────────
// Client Profile Slideout
// Usage: <ClientSlideout lead={lead} tasks={tasks} isOpen onClose={...} onSelectTask={...} />
// ─────────────────────────────────────────────────────────────────────────────

import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Mail01, Phone, Calendar, FileCheck01, ChevronRight, User01, Briefcase01, Building01 } from "@untitledui/icons";
import type { SimLead, SimTask } from "@/store/sim-store";
import { APPLICATION_CHAIN } from "@/store/sim-store";

const ROLE_COLORS: Record<string, string> = {
  Consultant:   "bg-brand-secondary text-brand-secondary",
  Admin:        "bg-secondary text-secondary",
  Services:     "bg-success-secondary text-success-primary",
  Compliance:   "bg-warning-secondary text-warning-primary",
  Manager:      "bg-secondary text-tertiary",
  "Task Master":"bg-[#EDE9FE] text-[#6D28D9]",
};

const STATUS_STYLES: Record<string, string> = {
  open:          "bg-brand-secondary text-brand-secondary",
  completed:     "bg-success-secondary text-success-primary",
  attempted:     "bg-warning-secondary text-warning-primary",
  not_completed: "bg-error-secondary text-error-primary",
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-secondary last:border-0">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary_alt">
        <Icon className="size-4 text-fg-tertiary" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-quaternary uppercase tracking-wider">{label}</p>
        <p className="text-sm text-primary mt-0.5 break-all">{value || "—"}</p>
      </div>
    </div>
  );
}

interface ClientSlideoutProps {
  lead: SimLead | null;
  tasks: SimTask[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: SimTask) => void;
}

export function ClientSlideout({ lead, tasks, isOpen, onClose, onSelectTask }: ClientSlideoutProps) {
  if (!lead) return null;

  const leadTasks = tasks.filter(t => t.leadId === lead.id);
  const openTasks = leadTasks.filter(t => t.status === "open");
  const completedCount = leadTasks.filter(t => t.status === "completed" && !t.parentTaskId).length;
  const total = APPLICATION_CHAIN.length;
  const pct = Math.round((completedCount / total) * 100);

  const initials = `${lead.firstName[0]}${lead.lastName[0]}`;

  // Compute age from DOB
  const age = lead.dob
    ? Math.floor((Date.now() - new Date(lead.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <SlideoutMenu isOpen={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      {({ close }) => (
        <>
          <SlideoutMenu.Header onClose={close}>
            {/* Cover banner */}
            <div className="absolute inset-x-0 top-0 h-24 rounded-tl-none" style={{ background: "linear-gradient(135deg, #D34108 0%, #3B485B 100%)" }} />

            {/* Avatar */}
            <div className="relative pt-10 pb-2">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary border-4 border-primary shadow-md text-xl font-bold text-brand-secondary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                {initials}
              </div>
            </div>

            {/* Name + badges */}
            <div className="mt-1">
              <h2 className="text-lg font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                {lead.firstName} {lead.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-secondary px-2.5 py-0.5 text-xs font-medium text-brand-secondary">
                  {lead.practice}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary">
                  {lead.policyType}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-tertiary">Application progress</span>
                <span className="text-xs font-semibold text-primary">{completedCount}/{total} tasks</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-brand-solid transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              {openTasks.length > 0 && (
                <p className="text-xs text-brand-secondary font-medium">{openTasks.length} task{openTasks.length !== 1 ? "s" : ""} open</p>
              )}
            </div>
          </SlideoutMenu.Header>

          <SlideoutMenu.Content>

            {/* ── Contact info ── */}
            <section>
              <p className="text-xs font-semibold text-quaternary uppercase tracking-wider mb-1">Contact</p>
              <div className="rounded-xl border border-secondary overflow-hidden bg-primary">
                <InfoRow icon={Mail01}   label="Email"    value={lead.email} />
                <InfoRow icon={Phone}    label="Phone"    value={lead.phone} />
                <InfoRow icon={Calendar} label="Date of birth" value={`${lead.dob}${age ? ` (age ${age})` : ""}`} />
              </div>
            </section>

            {/* ── Policy info ── */}
            <section>
              <p className="text-xs font-semibold text-quaternary uppercase tracking-wider mb-1">Policy</p>
              <div className="rounded-xl border border-secondary overflow-hidden bg-primary">
                <InfoRow icon={FileCheck01} label="Cover type"  value={lead.policyType} />
                <InfoRow icon={Building01}  label="Practice"    value={lead.practice} />
                <InfoRow icon={Briefcase01} label="Lead since"  value={new Date(lead.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })} />
              </div>
            </section>

            {/* ── Task chain ── */}
            <section>
              <p className="text-xs font-semibold text-quaternary uppercase tracking-wider mb-2">Task chain</p>

              {/* Chain progress steps */}
              <div className="flex gap-1 mb-3">
                {APPLICATION_CHAIN.map(ct => {
                  const instance = leadTasks.find(t => t.templateTaskId === ct.id && !t.parentTaskId);
                  return (
                    <div key={ct.id} title={`${ct.sortOrder + 1}. ${ct.name}`}
                      className={"h-1.5 flex-1 rounded-full " + (
                        instance?.status === "completed" ? "bg-success-solid" :
                        instance?.status === "attempted" ? "bg-warning-solid" :
                        instance?.status === "open"      ? "bg-brand-solid" :
                        "bg-tertiary opacity-20"
                      )} />
                  );
                })}
              </div>

              {/* Open tasks */}
              {openTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-secondary px-4 py-4 text-center">
                  <p className="text-xs text-tertiary">
                    {completedCount === total ? "All tasks complete — lead is inforce 🎉" : "No open tasks right now"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {openTasks.map(task => {
                    const isSubtask = !!task.parentTaskId;
                    const chainIdx = APPLICATION_CHAIN.findIndex(t => t.id === task.templateTaskId);
                    return (
                      <button key={task.id} onClick={() => { onSelectTask(task); onClose(); }}
                        className="flex items-center gap-3 w-full rounded-xl border border-secondary bg-primary px-3 py-3 text-left hover:border-brand hover:bg-brand-secondary transition-colors group">
                        <div className={"flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold " + (ROLE_COLORS[task.assigneeRole] ?? "bg-secondary text-secondary")}>
                          {isSubtask ? "↳" : chainIdx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{task.name}</p>
                          <p className="text-xs text-tertiary">{task.assigneeRole}{isSubtask ? " · subtask" : ""}</p>
                        </div>
                        <ChevronRight className="size-4 text-fg-quaternary group-hover:text-brand-secondary shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Completed tasks (collapsed list) */}
              {completedCount > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] font-semibold text-quaternary uppercase tracking-wider">Completed ({completedCount})</p>
                  <div className="space-y-1">
                    {leadTasks.filter(t => t.status === "completed" && !t.parentTaskId).map(task => {
                      const chainIdx = APPLICATION_CHAIN.findIndex(t => t.id === task.templateTaskId);
                      return (
                        <div key={task.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary_alt">
                          <div className={"flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold " + (STATUS_STYLES[task.status] ?? "")}>
                            ✓
                          </div>
                          <p className="text-xs text-tertiary truncate">{chainIdx + 1}. {task.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ── User info ── */}
            <section>
              <p className="text-xs font-semibold text-quaternary uppercase tracking-wider mb-1">Account</p>
              <div className="rounded-xl border border-secondary overflow-hidden bg-primary">
                <InfoRow icon={User01}   label="Client ID"    value={lead.id} />
                <InfoRow icon={Calendar} label="Created"      value={new Date(lead.createdAt).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} />
              </div>
            </section>

          </SlideoutMenu.Content>

          <SlideoutMenu.Footer>
            <div className="flex gap-2">
              <button onClick={close} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
                Close
              </button>
              {openTasks.length > 0 && (
                <button onClick={() => { onSelectTask(openTasks[0]); close(); }}
                  className="flex-1 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
                  Action next task
                </button>
              )}
            </div>
          </SlideoutMenu.Footer>
        </>
      )}
    </SlideoutMenu>
  );
}
