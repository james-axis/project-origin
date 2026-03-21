import React, { useState, useRef, useEffect } from "react";
import {
  Settings01, List, Users01, Shield01, Bell01, Link01,
  ChevronDown, ChevronRight, Plus, DotsGrid, Trash01, Edit01, Lock01,
  Zap, Toggle01Right, X, Check, InfoCircle, AlertCircle, ArrowLeft,
} from "@untitledui/icons";

type TriggerType = "object_created" | "task_completed";
type TemplateStatus = "draft" | "published" | "archived";
type TaskBuilderView = "workflows" | "templates" | "tasks";
type WizardStep = 1 | 2 | 3 | 4;

const PRACTICES = ["All Practices", "LIP", "Tony Insurance", "Surehaven", "Averse to Risk", "Living Rich"];
const ASSIGNEE_ROLES = ["Consultant", "Admin", "Services", "Compliance", "Manager"];

const settingsTabs = [
  { id: "task-builder", label: "Task Builder", icon: List },
  { id: "general", label: "General", icon: Settings01 },
  { id: "users", label: "Users & Permissions", icon: Users01 },
  { id: "security", label: "Security", icon: Shield01 },
  { id: "notifications", label: "Notifications", icon: Bell01 },
  { id: "integrations", label: "Integrations", icon: Link01 },
];

interface TaskItem {
  id: number;
  name: string;
  triggerType: TriggerType;
  assigneeRole: string;
  enabled: boolean;
  locked?: boolean;
  condition?: string;
  completionOptions?: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  status: TemplateStatus;
  practices: string[];
  tasks: TaskItem[];
}

interface DomainConfig {
  id: string;
  label: string;
  description: string;
  color: string;
  templates: WorkflowTemplate[];
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Initial data ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
const initialDomains: DomainConfig[] = [
  {
    id: "application", label: "Application",
    description: "Full client journey from new lead through to inforce",
    color: "bg-brand-solid",
    templates: [{
      id: "app-standard", name: "Standard", status: "published", practices: ["All Practices"],
      tasks: [
        { id: 166, name: "Introduction Call", triggerType: "object_created", assigneeRole: "Consultant", enabled: true },
        { id: 207, name: "Initial Life Discussion", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 147, name: "Life Insurance Discussion", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 102, name: "Quote Review", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 150, name: "Life Insurance Follow-up", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 172, name: "Book Insurance Review", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 134, name: "Add Policy / Application Number", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
        { id: 117, name: "Send application submitted email to client", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 159, name: "Upload face to face documents", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true, condition: "meeting_type = face_to_face" },
        { id: 99, name: "Compliance Audit", triggerType: "task_completed", assigneeRole: "Services", enabled: true, locked: true, completionOptions: ["Pass", "On Hold", "Remediation Required"] },
        { id: 135, name: "Compliance Billing", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 154, name: "Audit Finalisation", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 133, name: "Input life insurance amounts & premiums", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
        { id: 180, name: "Inforce call & email", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
      ],
    }],
  },
  {
    id: "dishonour", label: "Dishonour",
    description: "Missed payment recovery flow",
    color: "bg-warning-solid",
    templates: [{
      id: "dis-standard", name: "Standard", status: "published", practices: ["All Practices"],
      tasks: [
        { id: 36, name: "Initial follow up", triggerType: "object_created", assigneeRole: "Consultant", enabled: true },
        { id: 183, name: "Check if policy is paid up to date", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
        { id: 230, name: "Support action - call / email", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 59, name: "Re-attempt follow up", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 44, name: "Re-instatement form", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
      ],
    }],
  },
  {
    id: "claim", label: "Claim",
    description: "End-to-end claim lodgement and assessment",
    color: "bg-error-solid",
    templates: [{
      id: "claim-standard", name: "Standard", status: "published", practices: ["All Practices"],
      tasks: [
        { id: 47, name: "Initial claims form", triggerType: "object_created", assigneeRole: "Services", enabled: true },
        { id: 64, name: "Certified ID", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
        { id: 48, name: "Medicare release form", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 53, name: "Initial doctors form", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 49, name: "Financials", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 52, name: "TFN declaration", triggerType: "task_completed", assigneeRole: "Services", enabled: true, condition: "claim_type = income_protection" },
        { id: 51, name: "Payment forms", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 50, name: "Follow-up assessment", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
      ],
    }],
  },
];

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Helpers ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
const STATUS_STYLES: Record<TemplateStatus, string> = {
  draft: "bg-secondary text-tertiary",
  published: "bg-success-secondary text-success-primary",
  archived: "bg-secondary text-disabled",
};

function StatusBadge({ status }: { status: TemplateStatus }) {
  return <span className={"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize " + STATUS_STYLES[status]}>{status}</span>;
}

function buildTaskLibrary(domains: DomainConfig[]): TaskItem[] {
  const seen = new Set<string>();
  const lib: TaskItem[] = [];
  domains.forEach(d => d.templates.forEach(t => t.tasks.forEach(task => {
    if (!seen.has(task.name)) { seen.add(task.name); lib.push(task); }
  })));
  return lib;
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Confirm modal ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onClose }: {
  title: string; message: React.ReactNode; confirmLabel: string; confirmClass: string;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl">
        <div className="flex items-start gap-4 px-5 pt-5 pb-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-secondary">
            <AlertCircle className="size-5 text-warning-primary" aria-hidden />
          </div>
          <div><h3 className="text-base font-semibold text-primary">{title}</h3><p className="mt-1 text-sm text-tertiary">{message}</p></div>
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={"flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " + confirmClass}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ 4-Step Creation Wizard ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
interface WizardState {
  step: WizardStep;
  // Step 1 ÃÂ¢ÃÂÃÂ workflow
  workflowMode: "existing" | "new";
  selectedDomainId: string;
  newWorkflowName: string;
  newWorkflowDesc: string;
  newWorkflowColor: string;
  // Step 2 ÃÂ¢ÃÂÃÂ template
  templateMode: "existing" | "new";
  selectedTemplateId: string;
  newTemplateName: string;
  newTemplatePractices: string[];
  copyFromTemplateId: string;
  // Step 3 ÃÂ¢ÃÂÃÂ tasks (edit the task list)
  tasks: TaskItem[];
  // Step 4 ÃÂ¢ÃÂÃÂ review (status)
  publishNow: boolean;
}

function Wizard({ domains, startStep, prefillDomainId, prefillTemplateId, onComplete, onClose }: {
  domains: DomainConfig[];
  startStep: WizardStep;
  prefillDomainId?: string;
  prefillTemplateId?: string;
  onComplete: (result: { domain: DomainConfig | null; template: WorkflowTemplate; isNewDomain: boolean }) => void;
  onClose: () => void;
}) {
  const prefillDomain = domains.find(d => d.id === prefillDomainId);
  const prefillTemplate = prefillDomain?.templates.find(t => t.id === prefillTemplateId);

  const [s, setS] = useState<WizardState>({
    step: startStep,
    workflowMode: prefillDomainId ? "existing" : "new",
    selectedDomainId: prefillDomainId ?? (domains[0]?.id ?? ""),
    newWorkflowName: "", newWorkflowDesc: "", newWorkflowColor: "bg-brand-solid",
    templateMode: prefillTemplateId ? "existing" : "new",
    selectedTemplateId: prefillTemplateId ?? (prefillDomain?.templates[0]?.id ?? ""),
    newTemplateName: "", newTemplatePractices: ["All Practices"], copyFromTemplateId: "",
    tasks: prefillTemplate?.tasks ?? [],
    publishNow: false,
  });

  const [practiceDropOpen, setPracticeDropOpen] = useState(false);
  const practiceRef = useRef<HTMLDivElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (practiceRef.current && !practiceRef.current.contains(e.target as Node)) setPracticeDropOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const activeDomain = s.workflowMode === "existing" ? domains.find(d => d.id === s.selectedDomainId) : null;
  const activeTemplate = s.templateMode === "existing" && activeDomain
    ? activeDomain.templates.find(t => t.id === s.selectedTemplateId) : null;
  const taskLibrary = buildTaskLibrary(domains);
  const colors = ["bg-brand-solid", "bg-success-solid", "bg-warning-solid", "bg-error-solid", "bg-secondary"];

  function togglePractice(p: string) {
    if (p === "All Practices") { setS(prev => ({ ...prev, newTemplatePractices: ["All Practices"] })); return; }
    const without = s.newTemplatePractices.filter(x => x !== "All Practices");
    const next = without.includes(p) ? without.filter(x => x !== p) : [...without, p];
    setS(prev => ({ ...prev, newTemplatePractices: next.length === 0 ? ["All Practices"] : next }));
  }

  function canAdvance() {
    if (s.step === 1) return s.workflowMode === "existing" ? !!s.selectedDomainId : !!s.newWorkflowName.trim();
    if (s.step === 2) return s.templateMode === "existing" ? !!s.selectedTemplateId : !!s.newTemplateName.trim();
    if (s.step === 3) return true;
    return true;
  }

  function advance() {
    if (s.step === 2 && s.templateMode === "existing" && activeTemplate) {
      setS(prev => ({ ...prev, tasks: [...activeTemplate.tasks], step: 3 }));
    } else if (s.step === 2 && s.templateMode === "new" && s.copyFromTemplateId) {
      const srcTasks = domains.flatMap(d => d.templates).find(t => t.id === s.copyFromTemplateId)?.tasks ?? [];
      setS(prev => ({ ...prev, tasks: [...srcTasks], step: 3 }));
    } else {
      setS(prev => ({ ...prev, tasks: prev.step === 2 ? [] : prev.tasks, step: (prev.step + 1) as WizardStep }));
    }
  }

  function handleFinish() {
    const status: TemplateStatus = s.publishNow ? "published" : "draft";
    const finalTasks = s.tasks;

    // Build template
    const template: WorkflowTemplate = s.templateMode === "existing" && activeTemplate
      ? { ...activeTemplate, tasks: finalTasks, status }
      : { id: Date.now().toString(), name: s.newTemplateName.trim(), status, practices: s.newTemplatePractices, tasks: finalTasks };

    if (s.workflowMode === "existing" && activeDomain) {
      onComplete({ domain: activeDomain, template, isNewDomain: false });
    } else {
      const newDomain: DomainConfig = {
        id: s.newWorkflowName.toLowerCase().replace(/\s+/g, "-"),
        label: s.newWorkflowName.trim(), description: s.newWorkflowDesc,
        color: s.newWorkflowColor, templates: [template],
      };
      onComplete({ domain: newDomain, template, isNewDomain: true });
    }
    onClose();
  }

  function addTask(task?: Partial<TaskItem>) {
    const t: TaskItem = { id: Date.now(), name: task?.name ?? "", triggerType: "task_completed", assigneeRole: task?.assigneeRole ?? "Consultant", enabled: true, ...task };
    setS(prev => ({ ...prev, tasks: [...prev.tasks, t] }));
  }

  function removeTask(id: number) { setS(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) })); }

  function handleDrop(dropIdx: number) {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOver(null); return; }
    const tasks = [...s.tasks];
    const [moved] = tasks.splice(dragIdx, 1);
    tasks.splice(dropIdx, 0, moved);
    setS(prev => ({ ...prev, tasks: tasks.map((t, i) => ({ ...t, triggerType: (i === 0 ? "object_created" : "task_completed") as TriggerType })) }));
    setDragIdx(null); setDragOver(null);
  }

  const STEP_LABELS = ["Workflow", "Template", "Tasks", "Review"];

  const practiceLabel = s.newTemplatePractices.includes("All Practices") ? "All Practices" : s.newTemplatePractices.join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-2xl rounded-2xl border border-secondary bg-primary shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-primary">Task chain builder</h2>
            <p className="text-sm text-tertiary mt-0.5">Step {s.step} of 4 ÃÂ¢ÃÂÃÂ {STEP_LABELS[s.step - 1]}</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary transition-colors"><X className="size-4" aria-hidden /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-secondary flex-shrink-0">
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as WizardStep;
            const isDone = stepNum < s.step;
            const isActive = stepNum === s.step;
            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div className={"flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors " + (isDone ? "bg-brand-solid text-white" : isActive ? "bg-brand-secondary text-brand-secondary border border-brand" : "bg-secondary text-tertiary")}>
                    {isDone ? <Check className="size-3" aria-hidden /> : stepNum}
                  </div>
                  <span className={"text-sm transition-colors " + (isActive ? "font-semibold text-primary" : isDone ? "text-secondary" : "text-tertiary")}>{label}</span>
                </div>
                {i < 3 && <div className={"flex-1 mx-3 h-px " + (stepNum < s.step ? "bg-brand-solid" : "bg-secondary")} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Step 1: Workflow ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ */}
          {s.step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-tertiary">Select an existing workflow or create a new one.</p>
              <div className="flex gap-3">
                <button onClick={() => setS(prev => ({ ...prev, workflowMode: "existing" }))} className={"flex-1 rounded-xl border-2 p-4 text-left transition-colors " + (s.workflowMode === "existing" ? "border-brand bg-brand-secondary" : "border-secondary hover:border-primary")}>
                  <p className={"text-sm font-semibold " + (s.workflowMode === "existing" ? "text-brand-secondary" : "text-primary")}>Use existing workflow</p>
                  <p className="text-xs text-tertiary mt-1">Add a template to a workflow that already exists</p>
                </button>
                <button onClick={() => setS(prev => ({ ...prev, workflowMode: "new" }))} className={"flex-1 rounded-xl border-2 p-4 text-left transition-colors " + (s.workflowMode === "new" ? "border-brand bg-brand-secondary" : "border-secondary hover:border-primary")}>
                  <p className={"text-sm font-semibold " + (s.workflowMode === "new" ? "text-brand-secondary" : "text-primary")}>Create new workflow</p>
                  <p className="text-xs text-tertiary mt-1">Start a brand new workflow category</p>
                </button>
              </div>

              {s.workflowMode === "existing" && (
                <div className="space-y-2">
                  {domains.map(d => (
                    <button key={d.id} onClick={() => setS(prev => ({ ...prev, selectedDomainId: d.id }))}
                      className={"flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors " + (s.selectedDomainId === d.id ? "border-brand bg-brand-secondary" : "border-secondary hover:border-primary hover:bg-secondary_alt")}>
                      <span className={"size-3 rounded-full shrink-0 " + d.color} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary">{d.label}</p>
                        <p className="text-xs text-tertiary mt-0.5">{d.description}</p>
                      </div>
                      <div className="text-xs text-quaternary">{d.templates.length} template{d.templates.length !== 1 ? "s" : ""}</div>
                      {s.selectedDomainId === d.id && <Check className="size-4 text-brand-secondary shrink-0" aria-hidden />}
                    </button>
                  ))}
                </div>
              )}

              {s.workflowMode === "new" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-secondary">Workflow name</label>
                    <input value={s.newWorkflowName} onChange={e => setS(prev => ({ ...prev, newWorkflowName: e.target.value }))} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. Complaints, Renewals" autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-secondary">Description <span className="font-normal text-tertiary">(optional)</span></label>
                    <input value={s.newWorkflowDesc} onChange={e => setS(prev => ({ ...prev, newWorkflowDesc: e.target.value }))} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="Brief description" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-secondary">Colour</label>
                    <div className="flex gap-2">{colors.map(c => (<button key={c} onClick={() => setS(prev => ({ ...prev, newWorkflowColor: c }))} className={"size-7 rounded-full " + c + (s.newWorkflowColor === c ? " ring-2 ring-offset-2 ring-brand" : "")} />))}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Step 2: Template ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ */}
          {s.step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-tertiary">
                {s.workflowMode === "existing" && activeDomain ? <>Adding a template to <strong className="text-primary">{activeDomain.label}</strong>.</> : <>Creating a template for the new workflow.</>}
              </p>
              {s.workflowMode === "existing" && activeDomain && activeDomain.templates.length > 0 && (
                <div className="flex gap-3">
                  <button onClick={() => setS(prev => ({ ...prev, templateMode: "existing" }))} className={"flex-1 rounded-xl border-2 p-4 text-left transition-colors " + (s.templateMode === "existing" ? "border-brand bg-brand-secondary" : "border-secondary hover:border-primary")}>
                    <p className={"text-sm font-semibold " + (s.templateMode === "existing" ? "text-brand-secondary" : "text-primary")}>Edit existing</p>
                    <p className="text-xs text-tertiary mt-1">Modify tasks in an existing template</p>
                  </button>
                  <button onClick={() => setS(prev => ({ ...prev, templateMode: "new" }))} className={"flex-1 rounded-xl border-2 p-4 text-left transition-colors " + (s.templateMode === "new" ? "border-brand bg-brand-secondary" : "border-secondary hover:border-primary")}>
                    <p className={"text-sm font-semibold " + (s.templateMode === "new" ? "text-brand-secondary" : "text-primary")}>New template</p>
                    <p className="text-xs text-tertiary mt-1">Create a fresh template for this workflow</p>
                  </button>
                </div>
              )}

              {s.templateMode === "existing" && activeDomain && (
                <div className="space-y-2">
                  {activeDomain.templates.map(t => (
                    <button key={t.id} onClick={() => setS(prev => ({ ...prev, selectedTemplateId: t.id }))}
                      className={"flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors " + (s.selectedTemplateId === t.id ? "border-brand bg-brand-secondary" : "border-secondary hover:border-primary hover:bg-secondary_alt")}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-primary">{t.name}</p>
                          <StatusBadge status={t.status} />
                        </div>
                        <p className="text-xs text-tertiary mt-0.5">Applies to: {t.practices.join(", ")} ÃÂÃÂ· {t.tasks.length} tasks</p>
                      </div>
                      {s.selectedTemplateId === t.id && <Check className="size-4 text-brand-secondary shrink-0" aria-hidden />}
                    </button>
                  ))}
                </div>
              )}

              {(s.templateMode === "new" || !activeDomain) && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-secondary">Template name</label>
                    <input value={s.newTemplateName} onChange={e => setS(prev => ({ ...prev, newTemplateName: e.target.value }))} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. LIP Pilot, High Value Client, Standard" autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-secondary">Applies to</label>
                    <div className="relative" ref={practiceRef}>
                      <button onClick={() => setPracticeDropOpen(!practiceDropOpen)} className="w-full flex items-center justify-between rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary hover:border-brand transition-colors">
                        <span className={s.newTemplatePractices.includes("All Practices") ? "text-tertiary" : ""}>{practiceLabel}</span>
                        <ChevronDown className={"size-4 text-fg-quaternary transition-transform " + (practiceDropOpen ? "rotate-180" : "")} aria-hidden />
                      </button>
                      {practiceDropOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border border-secondary bg-primary shadow-lg py-1 max-h-48 overflow-y-auto">
                          {PRACTICES.map(p => {
                            const active = s.newTemplatePractices.includes(p);
                            return (
                              <button key={p} onClick={() => togglePractice(p)} className={"flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors " + (active ? "bg-active text-primary font-medium" : "text-secondary hover:bg-secondary_alt")}>
                                <span>{p}</span>
                                {active && <Check className="size-3.5 text-brand-secondary shrink-0" aria-hidden />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-tertiary">Pilot a new flow with one practice before rolling out to all</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-secondary">Copy tasks from <span className="font-normal text-tertiary">(optional)</span></label>
                    <select value={s.copyFromTemplateId} onChange={e => setS(prev => ({ ...prev, copyFromTemplateId: e.target.value }))} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                      <option value="">Start from scratch</option>
                      {domains.flatMap(d => d.templates.map(t => ({ id: t.id, label: d.label + " ÃÂ¢ÃÂÃÂ " + t.name }))).map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Step 3: Tasks ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ */}
          {s.step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-tertiary">Drag to reorder. First task fires on object creation; each subsequent task fires when the previous is completed.</p>
                <div className="flex items-center gap-2">
                  <select onChange={e => { if (e.target.value) { const t = taskLibrary.find(x => String(x.id) === e.target.value); if (t) addTask(t); e.target.value = ""; }}} className="rounded-lg border border-secondary bg-primary px-2 py-1.5 text-xs text-secondary outline-none focus:border-brand">
                    <option value="">+ From library</option>
                    {taskLibrary.filter(t => !s.tasks.some(x => x.name === t.name)).map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {s.tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary py-10 text-center">
                  <p className="text-sm font-medium text-secondary">No tasks yet</p>
                  <p className="text-xs text-tertiary mt-1">Add from the library or create a new task below</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {s.tasks.map((task, idx) => (
                  <div key={task.id} draggable onDragStart={() => setDragIdx(idx)} onDragEnd={() => { setDragIdx(null); setDragOver(null); }} onDragOver={e => { e.preventDefault(); setDragOver(idx); }} onDrop={() => handleDrop(idx)}
                    className={"flex items-center gap-3 rounded-xl border px-3 py-3 transition-all " + (dragOver === idx ? "border-brand bg-brand-primary_alt" : "border-secondary bg-primary hover:border-primary")}>
                    <div className="cursor-grab text-fg-quaternary opacity-40 hover:opacity-100"><DotsGrid className="size-4" aria-hidden /></div>
                    <div className={"flex size-6 items-center justify-center rounded-full shrink-0 " + (idx === 0 ? "bg-brand-secondary text-brand-secondary" : "bg-secondary text-tertiary")}>
                      {idx === 0 ? <Zap className="size-3" aria-hidden /> : <span className="text-xs font-medium">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{task.name}</p>
                      <p className="text-xs text-tertiary">{idx === 0 ? "Fires on object created" : "Fires when previous is completed"}{task.condition ? " ÃÂÃÂ· if " + task.condition : ""}</p>
                    </div>
                    <span className="text-xs text-quaternary shrink-0">{task.assigneeRole}</span>
                    <button onClick={() => removeTask(task.id)} className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors"><X className="size-3.5" aria-hidden /></button>
                  </div>
                ))}
              </div>

              {/* Quick add new task */}
              <NewTaskInline onAdd={task => addTask(task)} />
            </div>
          )}

          {/* ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Step 4: Review & Publish ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ */}
          {s.step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-tertiary">Review your configuration before saving.</p>

              <div className="rounded-xl border border-secondary bg-secondary_alt p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Workflow</span>
                  <span className="text-sm font-medium text-primary">{s.workflowMode === "existing" ? (activeDomain?.label ?? "") : s.newWorkflowName}</span>
                </div>
                <div className="h-px bg-secondary" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Template</span>
                  <span className="text-sm font-medium text-primary">{s.templateMode === "existing" ? (activeTemplate?.name ?? "") : s.newTemplateName}</span>
                </div>
                <div className="h-px bg-secondary" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Applies to</span>
                  <span className="text-sm text-secondary">{s.templateMode === "existing" ? (activeTemplate?.practices.join(", ") ?? "") : s.newTemplatePractices.join(", ")}</span>
                </div>
                <div className="h-px bg-secondary" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Tasks</span>
                  <span className="text-sm text-secondary">{s.tasks.length} task{s.tasks.length !== 1 ? "s" : ""} in chain</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-secondary bg-primary px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-primary">Publish immediately</p>
                  <p className="text-xs text-tertiary mt-0.5">Tasks will start auto-creating for new objects right away</p>
                </div>
                <button onClick={() => setS(prev => ({ ...prev, publishNow: !prev.publishNow }))} className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors " + (s.publishNow ? "bg-brand-solid" : "bg-tertiary")}>
                  <span className={"inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform " + (s.publishNow ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>
              {!s.publishNow && <p className="text-xs text-tertiary">Template will be saved as <strong>Draft</strong> and won't create tasks until published.</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-secondary px-6 py-4 flex-shrink-0">
          <button onClick={() => { if (s.step > 1) setS(prev => ({ ...prev, step: (prev.step - 1) as WizardStep })); else onClose(); }} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
            <ArrowLeft className="size-4" aria-hidden />{s.step > 1 ? "Back" : "Cancel"}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-quaternary">{s.step} of 4</span>
            {s.step < 4
              ? <button onClick={advance} disabled={!canAdvance()} className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-40 transition-colors">Continue</button>
              : <button onClick={handleFinish} className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">{s.publishNow ? "Save & publish" : "Save as draft"}</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick inline task adder in wizard step 3
function NewTaskInline({ onAdd }: { onAdd: (task: Partial<TaskItem>) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Consultant");
  const [open, setOpen] = useState(false);
  function submit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), assigneeRole: role });
    setName(""); setOpen(false);
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-tertiary hover:border-primary hover:text-secondary hover:bg-secondary_alt transition-colors w-full">
        <Plus className="size-4" aria-hidden />Add new task
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand bg-brand-secondary px-3 py-2.5">
      <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} autoFocus className="flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-tertiary" placeholder="Task name..." />
      <select value={role} onChange={e => setRole(e.target.value)} className="bg-transparent text-xs text-secondary outline-none border-none">
        {ASSIGNEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <button onClick={submit} className="flex size-6 items-center justify-center rounded-md bg-brand-solid text-white hover:bg-brand-solid_hover transition-colors"><Check className="size-3.5" aria-hidden /></button>
      <button onClick={() => setOpen(false)} className="flex size-6 items-center justify-center rounded-md text-fg-quaternary hover:bg-secondary transition-colors"><X className="size-3.5" aria-hidden /></button>
    </div>
  );
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Task row (for task chain view) ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
function TaskRow({ task, index, isFirst, domainColor, onToggle, onEdit, onDelete, onDragStart, onDragOver, onDrop, isDragOver }: {
  task: TaskItem; index: number; isFirst: boolean; domainColor: string;
  onToggle: (id: number) => void; onEdit: (t: TaskItem) => void; onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  isDragOver: boolean;
}) {
  return (
    <div draggable={!task.locked} onDragStart={e => onDragStart(e, index)} onDragOver={e => onDragOver(e, index)} onDrop={e => onDrop(e, index)}
      className={"group relative flex items-start sm:items-center gap-3 rounded-xl border px-3 sm:px-4 py-3 transition-all " + (isDragOver ? "border-brand bg-brand-primary_alt shadow-md" : "border-secondary bg-primary hover:border-primary hover:shadow-sm") + (!task.enabled ? " opacity-50" : "")}>
      <div className={"hidden sm:block cursor-grab text-fg-quaternary mt-0.5 " + (task.locked ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100")}><DotsGrid className="size-4" aria-hidden /></div>
      <div className="flex flex-col items-center w-6 shrink-0 mt-0.5">
        {isFirst ? <div className={"flex size-6 items-center justify-center rounded-full text-white " + domainColor}><Zap className="size-3" aria-hidden /></div>
          : <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-tertiary">{index + 1}</div>}
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
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="shrink-0 rounded-md border border-secondary bg-secondary px-2 py-1 text-xs text-secondary">{task.assigneeRole}</span>
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={() => onToggle(task.id)} className={"flex size-8 items-center justify-center rounded-lg transition-colors " + (task.enabled ? "text-success-primary hover:bg-success-secondary" : "text-fg-quaternary hover:bg-secondary")}><Toggle01Right className="size-4" aria-hidden /></button>
            <button onClick={() => onEdit(task)} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary transition-colors"><Edit01 className="size-4" aria-hidden /></button>
            {!task.locked && <button onClick={() => onDelete(task.id)} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors"><Trash01 className="size-4" aria-hidden /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Edit task modal ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
function EditTaskModal({ task, onSave, onClose }: { task: TaskItem | null; onSave: (t: TaskItem) => void; onClose: () => void }) {
  const [form, setForm] = useState<TaskItem>(task ?? { id: Date.now(), name: "", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg rounded-2xl border border-secondary bg-primary shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <div><h3 className="text-base font-medium text-primary">{task ? "Edit task" : "New task"}</h3><p className="text-sm text-tertiary">Configure this task</p></div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" aria-hidden /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5"><label className="block text-sm font-medium text-secondary">Task name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. Introduction Call" /></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-secondary">Assignee role</label><select value={form.assigneeRole} onChange={e => setForm({ ...form, assigneeRole: e.target.value })} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand">{ASSIGNEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-secondary">Condition <span className="font-normal text-tertiary">(optional)</span></label><input value={form.condition ?? ""} onChange={e => setForm({ ...form, condition: e.target.value || undefined })} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. meeting_type = face_to_face" /></div>
          <div className="flex items-center justify-between rounded-xl border border-secondary bg-secondary_alt px-4 py-3"><div className="flex items-center gap-2.5"><Lock01 className="size-4 text-fg-tertiary shrink-0" aria-hidden /><div><p className="text-sm font-medium text-primary">System locked</p><p className="text-xs text-tertiary">Prevent reordering or deleting</p></div></div><button onClick={() => setForm({ ...form, locked: !form.locked })} className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors " + (form.locked ? "bg-brand-solid" : "bg-tertiary")}><span className={"inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform " + (form.locked ? "translate-x-4" : "translate-x-0.5")} /></button></div>
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()} className="flex-1 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-50 transition-colors"><span className="flex items-center justify-center gap-1.5"><Check className="size-3.5" aria-hidden />Save task</span></button>
        </div>
      </div>
    </div>
  );
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Task Builder ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
function TaskBuilder() {
  const [domains, setDomains] = useState<DomainConfig[]>(initialDomains);
  const [view, setView] = useState<TaskBuilderView>("workflows");
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [editingTask, setEditingTask] = useState<TaskItem | null | "new">(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  const activeDomain = domains.find(d => d.id === activeDomainId);
  const activeTemplate = activeDomain?.templates.find(t => t.id === activeTemplateId);

  function openWizard(step: WizardStep) { setWizardStep(step); setWizardOpen(true); }

  function handleWizardComplete({ domain, template, isNewDomain }: { domain: DomainConfig | null; template: WorkflowTemplate; isNewDomain: boolean }) {
    setDomains(prev => {
      if (isNewDomain && domain) return [...prev, domain];
      if (!domain) return prev;
      return prev.map(d => {
        if (d.id !== domain.id) return d;
        const exists = d.templates.some(t => t.id === template.id);
        return { ...d, templates: exists ? d.templates.map(t => t.id === template.id ? template : t) : [...d.templates, template] };
      });
    });
    if (isNewDomain && domain) setActiveDomainId(domain.id);
    setTimeout(() => setActiveTemplateId(template.id), 0);
  }

  function updateTemplate(tasks: TaskItem[]) {
    if (!activeDomainId || !activeTemplateId) return;
    setDomains(prev => prev.map(d => d.id !== activeDomainId ? d : {
      ...d, templates: d.templates.map(t => t.id !== activeTemplateId ? t : { ...t, tasks })
    }));
  }

  function setTemplateStatus(status: TemplateStatus) {
    if (!activeDomainId || !activeTemplateId) return;
    setDomains(prev => prev.map(d => d.id !== activeDomainId ? d : {
      ...d, templates: d.templates.map(t => {
        if (t.id === activeTemplateId) return { ...t, status };
        // When publishing, unpublish any other template in this domain whose practices conflict
        if (status === "published" && t.status === "published") {
          const newPractices = prev
            .find(dd => dd.id === activeDomainId)
            ?.templates.find(tt => tt.id === activeTemplateId)?.practices ?? [];
          const hasConflict =
            newPractices.includes("All Practices") ||
            t.practices.includes("All Practices") ||
            t.practices.some(p => newPractices.includes(p));
          if (hasConflict) return { ...t, status: "archived" };
        }
        return t;
      })
    }));
  }

  function getConflictingTemplates(): WorkflowTemplate[] {
    if (!activeDomainId || !activeTemplateId) return [];
    const domain = domains.find(d => d.id === activeDomainId);
    if (!domain) return [];
    const current = domain.templates.find(t => t.id === activeTemplateId);
    if (!current) return [];
    return domain.templates.filter(t =>
      t.id !== activeTemplateId &&
      t.status === "published" &&
      (current.practices.includes("All Practices") ||
       t.practices.includes("All Practices") ||
       t.practices.some(p => current.practices.includes(p)))
    );
  }

  function handleDragStart(_: React.DragEvent<HTMLDivElement>, i: number) { setDragIndex(i); }
  function handleDragOver(e: React.DragEvent<HTMLDivElement>, i: number) { e.preventDefault(); setDragOverIndex(i); }
  function handleDrop(_: React.DragEvent<HTMLDivElement>, dropIdx: number) {
    if (!activeTemplate || dragIndex === null || dragIndex === dropIdx) { setDragOverIndex(null); setDragIndex(null); return; }
    const tasks = [...activeTemplate.tasks];
    const [moved] = tasks.splice(dragIndex, 1);
    tasks.splice(dropIdx, 0, moved);
    updateTemplate(tasks.map((t, i) => ({ ...t, triggerType: (i === 0 ? "object_created" : "task_completed") as TriggerType })));
    setDragOverIndex(null); setDragIndex(null);
  }

  // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ View: Workflows table ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
  if (view === "workflows") {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-primary">Workflows</h2>
            <p className="text-sm text-tertiary mt-0.5">All active task chain categories across the CRM</p>
          </div>
          <button onClick={() => openWizard(1)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
            <Plus className="size-3.5" aria-hidden />New workflow
          </button>
        </div>

        <div className="rounded-xl border border-secondary overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-4 px-4 py-3 bg-secondary_alt border-b border-secondary">
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Workflow</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Description</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Templates</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Published</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider"></span>
          </div>
          {/* Rows */}
          {domains.map((d, i) => {
            const publishedCount = d.templates.filter(t => t.status === "published").length;
            return (
              <div key={d.id} onClick={() => { setActiveDomainId(d.id); setView("templates"); }}
                className={"grid grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-4 px-4 py-4 items-center cursor-pointer transition-colors hover:bg-secondary_alt " + (i < domains.length - 1 ? "border-b border-secondary" : "")}>
                <div className="flex items-center gap-3">
                  <span className={"size-2.5 rounded-full shrink-0 " + d.color} />
                  <span className="text-sm font-medium text-primary">{d.label}</span>
                </div>
                <span className="text-sm text-tertiary truncate">{d.description}</span>
                <span className="text-sm text-secondary">{d.templates.length}</span>
                <span className="text-sm text-secondary">{publishedCount}</span>
                <div className="flex justify-end"><ChevronRight className="size-4 text-fg-quaternary" aria-hidden /></div>
              </div>
            );
          })}
        </div>

        {wizardOpen && <Wizard domains={domains} startStep={wizardStep} onComplete={handleWizardComplete} onClose={() => setWizardOpen(false)} />}
      </div>
    );
  }

  // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ View: Templates table ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
  if (view === "templates" && activeDomain) {
    return (
      <div className="p-4 sm:p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-tertiary mb-5">
          <button onClick={() => setView("workflows")} className="hover:text-primary transition-colors">Workflows</button>
          <ChevronRight className="size-3.5 text-quaternary" aria-hidden />
          <span className="font-medium text-primary">{activeDomain.label}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={"size-3 rounded-full " + activeDomain.color} />
              <h2 className="text-lg font-semibold text-primary">{activeDomain.label}</h2>
            </div>
            <p className="text-sm text-tertiary mt-0.5">{activeDomain.description}</p>
          </div>
          <button onClick={() => openWizard(2)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
            <Plus className="size-3.5" aria-hidden />New template
          </button>
        </div>

        <div className="rounded-xl border border-secondary overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_2fr_1fr_auto] gap-4 px-4 py-3 bg-secondary_alt border-b border-secondary">
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Template</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Applies to</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Status</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Tasks</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider"></span>
          </div>
          {activeDomain.templates.map((t, i) => (
            <div key={t.id} onClick={() => { setActiveTemplateId(t.id); setView("tasks"); }}
              className={"grid grid-cols-[2fr_2fr_2fr_1fr_auto] gap-4 px-4 py-4 items-center cursor-pointer transition-colors hover:bg-secondary_alt " + (i < activeDomain.templates.length - 1 ? "border-b border-secondary" : "")}>
              <span className="text-sm font-medium text-primary">{t.name}</span>
              <span className="text-sm text-tertiary">{t.practices.join(", ")}</span>
              <div><StatusBadge status={t.status} /></div>
              <span className="text-sm text-secondary">{t.tasks.filter(x => x.enabled).length} active</span>
              <ChevronRight className="size-4 text-fg-quaternary" aria-hidden />
            </div>
          ))}
        </div>

        {wizardOpen && <Wizard domains={domains} startStep={2} prefillDomainId={activeDomain.id} onComplete={handleWizardComplete} onClose={() => setWizardOpen(false)} />}
      </div>
    );
  }

  // ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ View: Tasks (drag-drop chain) ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
  if (view === "tasks" && activeDomain && activeTemplate) {
    return (
      <div className="flex flex-col min-h-0">
        {/* Breadcrumb + toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-secondary">
          <div className="flex items-center gap-2 text-sm text-tertiary">
            <button onClick={() => setView("workflows")} className="hover:text-primary transition-colors">Workflows</button>
            <ChevronRight className="size-3.5 text-quaternary" aria-hidden />
            <button onClick={() => setView("templates")} className="hover:text-primary transition-colors">{activeDomain.label}</button>
            <ChevronRight className="size-3.5 text-quaternary" aria-hidden />
            <span className="font-medium text-primary">{activeTemplate.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={activeTemplate.status} />
            <button onClick={() => openWizard(3)} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
              <Plus className="size-3.5" aria-hidden />New task
            </button>
            {activeTemplate.status !== "published"
              ? <button onClick={() => setConfirmPublish(true)} className="rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">Publish</button>
              : <button onClick={() => setConfirmUnpublish(true)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Unpublish</button>
            }
          </div>
        </div>

        {/* Info */}
        <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-2 rounded-xl border border-secondary bg-secondary_alt px-4 py-3">
          <InfoCircle className="size-4 text-fg-tertiary mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs text-tertiary leading-relaxed">
            <strong className="font-medium text-secondary">First task</strong> fires on object creation. Each subsequent task fires when the previous is marked complete.
            Applies to: <strong className="font-medium text-secondary">{activeTemplate.practices.join(", ")}</strong>.
          </p>
        </div>

        {/* Task list */}
        <div className="flex flex-col gap-2 p-4 sm:p-6">
          {activeTemplate.tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary py-12 text-center">
              <p className="text-sm font-medium text-secondary">No tasks yet</p>
              <p className="text-xs text-tertiary mt-1">Click New task to start building this chain</p>
            </div>
          )}
          {activeTemplate.tasks.map((task, index) => (
            <div key={task.id} className="relative">
              {index > 0 && <div className="absolute left-[2.35rem] sm:left-[3.1rem] -top-1 h-2 w-px bg-tertiary opacity-30" />}
              <TaskRow task={task} index={index} isFirst={index === 0} domainColor={activeDomain.color}
                onToggle={id => updateTemplate(activeTemplate.tasks.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))}
                onEdit={setEditingTask}
                onDelete={id => updateTemplate(activeTemplate.tasks.filter(t => t.id !== id))}
                onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                isDragOver={dragOverIndex === index} />
            </div>
          ))}
          <button onClick={() => setEditingTask("new")} className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-tertiary hover:border-primary hover:text-secondary hover:bg-secondary_alt transition-colors">
            <Plus className="size-4" aria-hidden />Add task to chain
          </button>
        </div>

        {editingTask !== null && <EditTaskModal task={editingTask === "new" ? null : editingTask} onSave={task => { editingTask === "new" ? updateTemplate([...activeTemplate.tasks, { ...task, triggerType: "task_completed" }]) : updateTemplate(activeTemplate.tasks.map(t => t.id === task.id ? task : t)); setEditingTask(null); }} onClose={() => setEditingTask(null)} />}
        {wizardOpen && <Wizard domains={domains} startStep={3} prefillDomainId={activeDomain.id} prefillTemplateId={activeTemplate.id} onComplete={handleWizardComplete} onClose={() => setWizardOpen(false)} />}
        {confirmPublish && <ConfirmModal title="Publish template?" message={(() => { const conflicts = getConflictingTemplates(); return (<>Template <strong>{activeTemplate.name}</strong> will become active for <strong>{activeTemplate.practices.join(", ")}</strong>.{conflicts.length > 0 && <> <span className="block mt-2 text-warning-primary font-medium">⚠ This will archive {conflicts.map(t => <strong key={t.id}>{t.name}</strong>).reduce((a: React.ReactNode[], b, i) => [...a, i > 0 ? ', ' : '', b], [])}, which {conflicts.length === 1 ? 'is' : 'are'} currently published for overlapping practices.</span></>}</>); })()} confirmLabel="Yes, publish" confirmClass="bg-brand-solid text-white hover:bg-brand-solid_hover" onConfirm={() => setTemplateStatus("published")} onClose={() => setConfirmPublish(false)} />}
        {confirmUnpublish && <ConfirmModal title="Archive template?" message={<>Template <strong>{activeTemplate.name}</strong> will stop creating new tasks immediately.</>} confirmLabel="Yes, archive" confirmClass="bg-error-primary text-white hover:opacity-90" onConfirm={() => setTemplateStatus("archived")} onClose={() => setConfirmUnpublish(false)} />}
      </div>
    );
  }

  return null;
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Placeholder ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
function PlaceholderSection({ title }: { title: string; description?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-secondary bg-secondary_alt"><Settings01 className="size-5 text-fg-tertiary" aria-hidden /></div>
        <p className="text-sm font-medium text-primary">{title}</p>
        <p className="mt-1 text-sm text-tertiary">This section will be built out in Phase 3.</p>
      </div>
    </div>
  );
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ Settings page ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
export function Settings() {
  const [activeTab, setActiveTab] = useState("task-builder");
  return (
    <div className="flex flex-col h-full min-h-screen">
      <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <h1 className="text-xl font-semibold text-primary mb-4" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Settings</h1>
        <div className="flex overflow-x-auto gap-0 -mb-px">
          {settingsTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={"flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (isActive ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                <Icon className={"size-4 " + (isActive ? "text-brand-secondary" : "text-fg-quaternary")} aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "task-builder" && <TaskBuilder />}
        {activeTab === "general" && <PlaceholderSection title="General" />}
        {activeTab === "users" && <PlaceholderSection title="Users & Permissions" />}
        {activeTab === "security" && <PlaceholderSection title="Security" />}
        {activeTab === "notifications" && <PlaceholderSection title="Notifications" />}
        {activeTab === "integrations" && <PlaceholderSection title="Integrations" />}
      </div>
    </div>
  );
}
