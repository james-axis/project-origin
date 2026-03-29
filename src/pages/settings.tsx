import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Settings01, List, Users01, Shield01, Bell01, Link01, Phone01,
  ChevronDown, ChevronRight, Plus, DotsGrid, Trash01, Edit01,
  Zap, X, Check, InfoCircle, AlertCircle, ArrowLeft,
  Building01, MarkerPin01, Globe01, PhoneCall01, CheckCircle,
  Clock, PlayCircle, SearchLg, RefreshCw01, File01, 
  File02, FileText01, Tag01, Mail01, MessageSquare01, Calendar,
  UserPlus01, UserX01, MoreHorizontal, Key01, Code01,
} from "@untitledui/icons";

type TriggerType = "object_created" | "task_completed";
type TemplateStatus = "draft" | "published" | "archived";
type TaskBuilderView = "workflows" | "templates" | "tasks";
type WizardStep = 1 | 2 | 3;

const PRACTICES = ["All Practices", "LIP", "Tony Insurance", "Surehaven", "Averse to Risk", "Living Rich"];
const ASSIGNEE_ROLES = ["Consultant", "Admin", "Services", "Compliance", "Manager", "Task Master"];

// Main settings groups with their sub-tabs
const settingsGroups = [
  {
    id: "task-builder",
    label: "Task Builder",
    icon: List,
    tabs: [
      { id: "task-flows", label: "Task Flows" },
    ],
  },
  {
    id: "users",
    label: "Users & Access",
    icon: Users01,
    tabs: [
      { id: "users", label: "Users" },
      { id: "groups", label: "Groups" },
      { id: "teams", label: "Teams" },
      { id: "roles", label: "Roles" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield01,
    tabs: [
      { id: "active-sessions", label: "Active Sessions" },
      { id: "session-history", label: "Session History" },
      { id: "login-attempts", label: "Login Attempts" },
    ],
  },
  {
    id: "templates",
    label: "Templates",
    icon: File02,
    tabs: [
      { id: "task-templates", label: "Task Templates" },
      { id: "file-library", label: "File Library" },
      { id: "sms-templates", label: "SMS Templates" },
      { id: "email-templates", label: "Email Templates" },
      { id: "docx-templates", label: "DOCx Templates" },
    ],
  },
  {
    id: "forms",
    label: "Forms & Data",
    icon: FileText01,
    tabs: [
      { id: "form-field-types", label: "Form Field Types" },
      { id: "lead-forms", label: "Lead Forms" },
      { id: "form-field-aliases", label: "Form Field Aliases" },
      { id: "tags", label: "Tags" },
    ],
  },
  {
    id: "business",
    label: "Business Config",
    icon: Building01,
    tabs: [
      { id: "budget-calculators", label: "Budget Calculators" },
      { id: "close-reasons", label: "Close Reasons" },
      { id: "marketing-lists", label: "Marketing Lists" },
      { id: "scheduled-tasks", label: "Scheduled Tasks" },
      { id: "leaves", label: "Leaves" },
      { id: "adviser-codes", label: "Adviser Codes" },
      { id: "insurance-type-mappings", label: "Insurance Type Mappings" },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Link01,
    tabs: [
      { id: "phone", label: "Phone System" },
      { id: "email-import", label: "Email Import" },
      { id: "email-groups", label: "Email Groups" },
      { id: "webhooks", label: "Webhooks" },
      { id: "affiliates", label: "Affiliates" },
      { id: "apis", label: "APIs" },
      { id: "neos-advisers", label: "NEOS Advisers" },
      { id: "report-permissions", label: "Report Permissions" },
    ],
  },
];

// Legacy tabs for backwards compatibility
const settingsTabs = [
  { id: "task-builder", label: "Task Builder", icon: List },
  { id: "general", label: "General", icon: Settings01 },
  { id: "users", label: "Users & Permissions", icon: Users01 },
  { id: "security", label: "Security", icon: Shield01 },
  { id: "notifications", label: "Notifications", icon: Bell01 },
  { id: "phone", label: "Phone System", icon: Phone01 },
  { id: "integrations", label: "Integrations", icon: Link01 },
];

type RuleType = "overdue_assign" | "auto_not_completed";

interface TaskRule {
  id: string;
  type: RuleType;
  minutes?: number;    // for overdue_assign: trigger after N minutes
  assignTo?: string;   // for overdue_assign: user/role to reassign to
  hours?: number;      // for auto_not_completed: mark after N hours
}

interface TaskItem {
  id: number;
  name: string;
  triggerType: TriggerType;
  assigneeRole: string;
  enabled: boolean;
  condition?: string;
  completionOptions?: string[];
  subtasks?: string[];
  rules?: TaskRule[];
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Initial data ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
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
        { id: 99, name: "Compliance Audit", triggerType: "task_completed", assigneeRole: "Services", enabled: true, completionOptions: ["Pass", "On Hold", "Remediation Required"] },
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Helpers ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Confirm modal ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 4-Step Creation Wizard ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
interface WizardState {
  step: WizardStep;
  // Step 1 — task flow
  selectedDomainId: string;
  newWorkflowColor: string;
  newTemplateName: string;
  newTemplatePractices: string[];
  copyFromTemplateId: string;
  // Step 2 — tasks
  tasks: TaskItem[];
  // Step 3 — review
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
    selectedDomainId: prefillDomainId ?? (domains[0]?.id ?? ""),
    newWorkflowColor: "bg-brand-solid",
    newTemplateName: "",
    newTemplatePractices: ["All Practices"],
    copyFromTemplateId: "",
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

  const activeDomain = domains.find(d => d.id === s.selectedDomainId) ?? null;
  const taskLibrary = buildTaskLibrary(domains);

  function togglePractice(p: string) {
    if (p === "All Practices") { setS(prev => ({ ...prev, newTemplatePractices: ["All Practices"] })); return; }
    const without = s.newTemplatePractices.filter(x => x !== "All Practices");
    const next = without.includes(p) ? without.filter(x => x !== p) : [...without, p];
    setS(prev => ({ ...prev, newTemplatePractices: next.length === 0 ? ["All Practices"] : next }));
  }

  function canAdvance() {
    if (s.step === 1) return !!s.selectedDomainId && !!s.newTemplateName.trim();
    return true;
  }

  function advance() {
    if (s.step === 1 && s.copyFromTemplateId) {
      const srcTasks = domains.flatMap(d => d.templates).find(t => t.id === s.copyFromTemplateId)?.tasks
        ?.map(t => ({ ...t, id: Date.now() + Math.floor(Math.random() * 9999) })) ?? [];
      setS(prev => ({ ...prev, tasks: srcTasks, step: 2 as WizardStep }));
    } else {
      setS(prev => ({ ...prev, tasks: prev.step === 1 ? [] : prev.tasks, step: (prev.step + 1) as WizardStep }));
    }
  }

  function handleFinish() {
    const status: TemplateStatus = s.publishNow ? "published" : "draft";
    const finalTasks = s.tasks;

    const template: WorkflowTemplate = {
      id: Date.now().toString(),
      name: s.newTemplateName.trim(),
      status,
      practices: s.newTemplatePractices,
      tasks: finalTasks,
    };

    const existingDomain = domains.find(d => d.id === s.selectedDomainId);
    if (existingDomain) {
      onComplete({ domain: existingDomain, template, isNewDomain: false });
    } else {
      // selectedDomainId holds the custom name typed by the user
      const newDomain: DomainConfig = {
        id: s.selectedDomainId.toLowerCase().replace(/\s+/g, "-"),
        label: s.selectedDomainId.trim(),
        description: "",
        color: s.newWorkflowColor,
        templates: [template],
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

  const STEP_LABELS = ["Task Flow", "Tasks", "Review"];

  const practiceLabel = s.newTemplatePractices.includes("All Practices") ? "All Practices" : s.newTemplatePractices.join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-2xl rounded-2xl border border-secondary bg-primary shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-primary">Task chain builder</h2>
            <p className="text-sm text-tertiary mt-0.5">Step {s.step} of 3 — {STEP_LABELS[s.step - 1]}</p>
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
                {i < 2 && <div className={"flex-1 mx-3 h-px " + (stepNum < s.step ? "bg-brand-solid" : "bg-secondary")} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Step 1: Task Flow ── */}
          {s.step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-secondary">Task flow name</label>
                <input value={s.newTemplateName} onChange={e => setS(prev => ({ ...prev, newTemplateName: e.target.value }))}
                  className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Standard, LIP Pilot, High Value Client" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-secondary">Workflow label</label>
                <select value={s.selectedDomainId} onChange={e => setS(prev => ({ ...prev, selectedDomainId: e.target.value }))}
                  className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                  {domains.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
                <p className="text-xs text-tertiary">A label that groups this task flow in the table — e.g. Application, Claim, Dishonour</p>
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
                <select value={s.copyFromTemplateId} onChange={e => setS(prev => ({ ...prev, copyFromTemplateId: e.target.value }))}
                  className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">Start from scratch</option>
                  {domains.flatMap(d => d.templates.map(t => ({ id: t.id, label: d.label + " — " + t.name }))).map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Step 3: Tasks ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */}
          {s.step === 2 && (
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
                      <p className="text-xs text-tertiary">{idx === 0 ? "Fires on object created" : "Fires when previous is completed"}{task.condition ? " ÃÂÃÂÃÂÃÂ· if " + task.condition : ""}</p>
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

          {/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Step 4: Review & Publish ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */}
          {s.step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-tertiary">Review your configuration before saving.</p>

              <div className="rounded-xl border border-secondary bg-secondary_alt p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Workflow</span>
                  <span className="text-sm font-medium text-primary">{activeDomain?.label ?? s.selectedDomainId}</span>
                </div>
                <div className="h-px bg-secondary" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Task flow</span>
                  <span className="text-sm font-medium text-primary">{s.newTemplateName}</span>
                </div>
                <div className="h-px bg-secondary" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Applies to</span>
                  <span className="text-sm text-secondary">{s.newTemplatePractices.join(", ")}</span>
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
            <span className="text-xs text-quaternary">{s.step} of 3</span>
            {s.step < 3
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

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Task row (for task chain view) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
function TaskRow({ task, index, isFirst, domainColor, onEdit, onDelete, onDragStart, onDragOver, onDrop, isDragOver }: {
  task: TaskItem; index: number; isFirst: boolean; domainColor: string;
  onEdit: (t: TaskItem) => void; onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  isDragOver: boolean;
}) {
  return (
    <div draggable onDragStart={e => onDragStart(e, index)} onDragOver={e => onDragOver(e, index)} onDrop={e => onDrop(e, index)}
      className={"group relative flex items-start sm:items-center gap-3 rounded-xl border px-3 sm:px-4 py-3 transition-all " + (isDragOver ? "border-brand bg-brand-primary_alt shadow-md" : "border-secondary bg-primary hover:border-primary hover:shadow-sm")}>
      <div className="hidden sm:block cursor-grab text-fg-quaternary mt-0.5 opacity-0 group-hover:opacity-100"><DotsGrid className="size-4" aria-hidden /></div>
      <div className="flex flex-col items-center w-6 shrink-0 mt-0.5">
        {isFirst ? <div className={"flex size-6 items-center justify-center rounded-full text-white " + domainColor}><Zap className="size-3" aria-hidden /></div>
          : <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-tertiary">{index + 1}</div>}
      </div>
      <div className="flex flex-1 min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex flex-1 flex-col min-w-0 gap-0.5">
          <div className="flex items-center gap-2">
            <span className={"text-sm font-medium " + (task.enabled ? "text-primary" : "text-disabled")}>{task.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-tertiary">{isFirst ? "Fires on object created" : "Fires when previous is completed"}</span>
            {task.condition && <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-secondary font-mono">if {task.condition}</span>}
            {task.rules && task.rules.length > 0 && <span className="rounded-md bg-brand-secondary px-1.5 py-0.5 text-[11px] text-brand-secondary">{task.rules.length} rule{task.rules.length !== 1 ? "s" : ""}</span>}
            {task.subtasks && task.subtasks.length > 0 && <span className="rounded-md bg-warning-secondary px-1.5 py-0.5 text-[11px] text-warning-primary">if attempted: {task.subtasks.length} subtask{task.subtasks.length !== 1 ? "s" : ""}</span>}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="shrink-0 rounded-md border border-secondary bg-secondary px-2 py-1 text-xs text-secondary">{task.assigneeRole}</span>
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(task)} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary transition-colors"><Edit01 className="size-4" aria-hidden /></button>
            <button onClick={() => onDelete(task.id)} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors"><Trash01 className="size-4" aria-hidden /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Edit task modal ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
function EditTaskModal({ task, onSave, onClose }: { task: TaskItem | null; onSave: (t: TaskItem) => void; onClose: () => void }) {
  const [form, setForm] = useState<TaskItem>(task ?? { id: Date.now(), name: "", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true, subtasks: [] });
  const [newSubtask, setNewSubtask] = useState("");

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setForm(prev => ({ ...prev, subtasks: [...(prev.subtasks ?? []), newSubtask.trim()] }));
    setNewSubtask("");
  }

  function removeSubtask(i: number) {
    setForm(prev => ({ ...prev, subtasks: (prev.subtasks ?? []).filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg rounded-2xl border border-secondary bg-primary shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <div><h3 className="text-base font-medium text-primary">{task ? "Edit task" : "New task"}</h3><p className="text-sm text-tertiary">Configure this task</p></div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" aria-hidden /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Task name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. Introduction Call" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Assignee role</label>
            <select value={form.assigneeRole} onChange={e => setForm({ ...form, assigneeRole: e.target.value })} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand">
              {ASSIGNEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {/* Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-secondary">Rules <span className="font-normal text-tertiary">(optional)</span></label>
                <p className="text-xs text-tertiary mt-0.5">Automation that fires based on time or inactivity</p>
              </div>
              <button onClick={() => setForm(prev => ({ ...prev, rules: [...(prev.rules ?? []), { id: Date.now().toString(), type: "overdue_assign", minutes: 60, assignTo: "" }] }))}
                className="inline-flex items-center gap-1 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary transition-colors">
                <Plus className="size-3" aria-hidden />Add rule
              </button>
            </div>

            {(form.rules ?? []).length === 0 && (
              <div className="rounded-xl border border-dashed border-secondary px-4 py-4 text-center">
                <p className="text-xs text-tertiary">No rules yet — click Add rule to automate this task</p>
              </div>
            )}

            {(form.rules ?? []).map((rule, i) => (
              <div key={rule.id} className="rounded-xl border border-secondary bg-secondary_alt p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <select value={rule.type}
                    onChange={e => setForm(prev => ({ ...prev, rules: (prev.rules ?? []).map((r, ri) => ri === i ? { ...r, type: e.target.value as RuleType } : r) }))}
                    className="flex-1 rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                    <option value="overdue_assign">Task is overdue — reassign to another user</option>
                    <option value="auto_not_completed">Mark as Not Completed after time limit</option>
                  </select>
                  <button onClick={() => setForm(prev => ({ ...prev, rules: (prev.rules ?? []).filter((_, ri) => ri !== i) }))}
                    className="ml-2 flex size-7 items-center justify-center rounded-lg text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors shrink-0">
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>

                {rule.type === "overdue_assign" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-secondary shrink-0">After</span>
                    <input type="number" min={1} value={rule.minutes ?? 60}
                      onChange={e => setForm(prev => ({ ...prev, rules: (prev.rules ?? []).map((r, ri) => ri === i ? { ...r, minutes: parseInt(e.target.value) || 60 } : r) }))}
                      className="w-20 rounded-lg border border-primary bg-primary px-2.5 py-1.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                    <span className="text-xs text-secondary shrink-0">minutes with no completion, reassign to</span>
                    <select value={rule.assignTo ?? ""}
                      onChange={e => setForm(prev => ({ ...prev, rules: (prev.rules ?? []).map((r, ri) => ri === i ? { ...r, assignTo: e.target.value } : r) }))}
                      className="flex-1 min-w-[120px] rounded-lg border border-primary bg-primary px-2.5 py-1.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                      <option value="">Select role...</option>
                      {ASSIGNEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {rule.type === "auto_not_completed" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-secondary shrink-0">After</span>
                    <input type="number" min={1} value={rule.hours ?? 24}
                      onChange={e => setForm(prev => ({ ...prev, rules: (prev.rules ?? []).map((r, ri) => ri === i ? { ...r, hours: parseInt(e.target.value) || 24 } : r) }))}
                      className="w-20 rounded-lg border border-primary bg-primary px-2.5 py-1.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                    <span className="text-xs text-secondary shrink-0">hours, automatically mark this task as <strong>Not Completed</strong> and advance the chain</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Attempted subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-secondary">Attempted subtasks <span className="font-normal text-tertiary">(optional)</span></label>
              {(form.subtasks ?? []).length > 0 && <span className="text-xs text-quaternary">{form.subtasks?.length} in chain</span>}
            </div>
            <div className="rounded-lg border border-secondary bg-secondary_alt px-3 py-2.5 space-y-1">
              <p className="text-xs text-tertiary leading-relaxed">
                When this task is marked <strong className="text-secondary font-medium">Attempted</strong>, the first subtask auto-creates. Each subtask follows the same flow — <strong className="text-secondary font-medium">Complete</strong> fires the next subtask; <strong className="text-secondary font-medium">Attempted</strong> fires the one after that. The main chain only advances when the current item is Completed.
              </p>
              <p className="text-xs text-tertiary">Order matters — arrange subtasks in logical follow-up sequence.</p>
            </div>
            {(form.subtasks ?? []).length > 0 && (
              <div className="rounded-xl border border-secondary overflow-hidden">
                {(form.subtasks ?? []).map((sub, i) => (
                  <div key={i} className={"flex items-center gap-2 px-3 py-2.5 " + (i < (form.subtasks?.length ?? 0) - 1 ? "border-b border-secondary" : "")}>
                    <div className="size-4 rounded border border-secondary shrink-0" />
                    <span className="flex-1 text-sm text-primary">{sub}</span>
                    <button onClick={() => removeSubtask(i)} className="flex size-6 items-center justify-center rounded text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors">
                      <X className="size-3" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSubtask()}
                className="flex-1 rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="Add a subtask..."
              />
              <button onClick={addSubtask} disabled={!newSubtask.trim()}
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary disabled:opacity-40 transition-colors">
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>


        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()} className="flex-1 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-50 transition-colors">
            <span className="flex items-center justify-center gap-1.5"><Check className="size-3.5" aria-hidden />Save task</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Task Builder ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ

// ─── Flow Chart View ─────────────────────────────────────────────────────────

// Node types available in the palette
type FlowNodeType =
  | "task"         // Standard task (existing)
  | "trigger"      // Trigger / start event
  | "send_email"   // Send email
  | "send_sms"     // Send SMS
  | "notification" // Push / in-app notification
  | "call"         // Phone call
  | "change_status"// Change object status
  | "assign_to"    // Assign to adviser/user
  | "create_task"  // Create a new task
  | "split"        // Conditional split / branch
  | "integration"  // External integration
  | "upload_docs"  // Upload / request documents
  | "wait"         // Wait / delay
  | "note"         // Comment / note
  | "end";         // End of flow

interface FlowCanvasNode {
  uid: string;            // unique id on canvas
  type: FlowNodeType;
  label: string;
  subtitle?: string;
  taskItem?: TaskItem;    // only for "task" nodes wired to real tasks
  x: number;
  y: number;
  enabled: boolean;
  config?: Record<string, string>;
}

interface FlowEdge {
  fromUid: string;
  toUid: string;
  label?: string;
}

const NODE_TYPE_META: Record<FlowNodeType, { label: string; color: string; bg: string; icon: string; shape: "rect"|"diamond"|"pill"|"circle"; category: string }> = {
  trigger:      { label:"Trigger",         color:"#D34108", bg:"#FFF4F0", icon:"⚡", shape:"pill",    category:"Flow" },
  task:         { label:"Task",            color:"#3B82F6", bg:"#EFF6FF", icon:"✓",  shape:"rect",    category:"Actions" },
  send_email:   { label:"Send Email",      color:"#8B5CF6", bg:"#F5F3FF", icon:"✉",  shape:"rect",    category:"Communications" },
  send_sms:     { label:"Send SMS",        color:"#EC4899", bg:"#FDF2F8", icon:"💬", shape:"rect",    category:"Communications" },
  notification: { label:"Notification",   color:"#F59E0B", bg:"#FFFBEB", icon:"🔔", shape:"rect",    category:"Communications" },
  call:         { label:"Call",            color:"#10B981", bg:"#F0FDF4", icon:"📞", shape:"rect",    category:"Communications" },
  change_status:{ label:"Change Status",  color:"#6366F1", bg:"#EEF2FF", icon:"🔄", shape:"rect",    category:"Actions" },
  assign_to:    { label:"Assign To",      color:"#0EA5E9", bg:"#F0F9FF", icon:"👤", shape:"rect",    category:"Actions" },
  create_task:  { label:"Create Task",    color:"#3B82F6", bg:"#EFF6FF", icon:"📋", shape:"rect",    category:"Actions" },
  split:        { label:"Split / Branch", color:"#7C3AED", bg:"#EDE9FE", icon:"⑂",  shape:"diamond", category:"Flow" },
  integration:  { label:"Integration",   color:"#64748B", bg:"#F8FAFC", icon:"🔌", shape:"rect",    category:"Integrations" },
  upload_docs:  { label:"Upload Docs",   color:"#0891B2", bg:"#ECFEFF", icon:"📁", shape:"rect",    category:"Actions" },
  wait:         { label:"Wait / Delay",  color:"#9CA3AF", bg:"#F9FAFB", icon:"⏱",  shape:"rect",    category:"Flow" },
  note:         { label:"Note",          color:"#D97706", bg:"#FFFBEB", icon:"📝", shape:"rect",    category:"Flow" },
  end:          { label:"End",           color:"#EF4444", bg:"#FFF5F5", icon:"⏹",  shape:"circle",  category:"Flow" },
};

const PALETTE_CATEGORIES = ["Flow", "Actions", "Communications", "Integrations"];

const NODE_W = 220;
const NODE_H = 84;
const ROW_GAP = 52;

// Build initial canvas from TaskItem array (linear chain)
function buildInitialCanvas(tasks: TaskItem[]): { nodes: FlowCanvasNode[]; edges: FlowEdge[] } {
  const nodes: FlowCanvasNode[] = [];
  const edges: FlowEdge[] = [];
  let y = 0;

  // Start trigger node
  const triggerUid = "trigger_0";
  nodes.push({ uid: triggerUid, type:"trigger", label:"Flow Start", subtitle:"Object created", x:0, y, enabled:true });
  y += NODE_H + ROW_GAP;

  let prevUid = triggerUid;
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const uid = `task_${t.id}`;
    nodes.push({ uid, type:"task", label:t.name, subtitle:t.assigneeRole, taskItem:t, x:0, y, enabled:t.enabled });
    edges.push({ fromUid: prevUid, toUid: uid, label: i === 0 ? "" : "done" });
    prevUid = uid;
    y += NODE_H + ROW_GAP;
  }

  // End node
  const endUid = "end_0";
  nodes.push({ uid: endUid, type:"end", label:"Flow End", x:0, y, enabled:true });
  edges.push({ fromUid: prevUid, toUid: endUid, label: "done" });

  return { nodes, edges };
}

function uid() { return `node_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

function FlowChartView({
  tasks, domainColor, onEditTask, onDeleteTask, onReorder, onAddTask,
}: {
  tasks: TaskItem[];
  domainColor: string;
  onEditTask: (t: TaskItem) => void;
  onDeleteTask: (id: number) => void;
  onReorder: (tasks: TaskItem[]) => void;
  onAddTask: () => void;
}) {
  const initial = React.useMemo(() => buildInitialCanvas(tasks), [tasks.length]);
  const [nodes, setNodes] = React.useState<FlowCanvasNode[]>(initial.nodes);
  const [edges, setEdges] = React.useState<FlowEdge[]>(initial.edges);
  const [zoom, setZoom] = React.useState(85);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [selectedUid, setSelectedUid] = React.useState<string | null>(null);
  const [draggingUid, setDraggingUid] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [paletteType, setPaletteType] = React.useState<FlowNodeType | null>(null);
  const [addMenuAt, setAddMenuAt] = React.useState<{ x: number; y: number; afterUid: string } | null>(null);
  const panRef = React.useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const brandColor = domainColor === "bg-brand-solid" ? "#D34108" : domainColor === "bg-warning-solid" ? "#F59E0B" : domainColor === "bg-success-solid" ? "#22C55E" : "#D34108";

  // Canvas dimensions
  const canvasW = 700;
  const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y)) + NODE_H + 100 : 400;

  // ── Pan canvas ──
  function onCanvasMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-interactive]")) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
    const onMove = (ev: MouseEvent) => {
      if (!panRef.current) return;
      setPan({ x: panRef.current.startPanX + ev.clientX - panRef.current.startX, y: panRef.current.startPanY + ev.clientY - panRef.current.startY });
    };
    const onUp = () => { panRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    setSelectedUid(null);
    setAddMenuAt(null);
  }

  // ── Drag node on canvas ──
  function startNodeDrag(e: React.MouseEvent, nodeUid: string) {
    e.stopPropagation();
    const node = nodes.find(n => n.uid === nodeUid);
    if (!node) return;
    // Compute offset from node top-left in canvas coords
    const container = containerRef.current!.getBoundingClientRect();
    const scale = zoom / 100;
    const cx = (e.clientX - container.left - pan.x - canvasW / 2 * scale) / scale;
    const cy = (e.clientY - container.top - pan.y) / scale;
    setDraggingUid(nodeUid);
    setDragOffset({ x: cx - node.x, y: cy - node.y });
    const onMove = (ev: MouseEvent) => {
      const cx2 = (ev.clientX - container.left - pan.x - canvasW / 2 * scale) / scale;
      const cy2 = (ev.clientY - container.top - pan.y) / scale;
      setNodes(prev => prev.map(n => n.uid === nodeUid ? { ...n, x: cx2 - dragOffset.x, y: cy2 - dragOffset.y } : n));
    };
    const onUp = () => { setDraggingUid(null); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // ── Add node from palette or menu ──
  function addNodeAfter(afterUid: string, type: FlowNodeType) {
    const meta = NODE_TYPE_META[type];
    const afterNode = nodes.find(n => n.uid === afterUid);
    if (!afterNode) return;
    const newUid = uid();
    const newY = afterNode.y + NODE_H + ROW_GAP;
    // Shift all nodes below down
    const shiftedNodes = nodes.map(n => n.uid !== afterUid && n.y >= newY ? { ...n, y: n.y + NODE_H + ROW_GAP } : n);
    const newNode: FlowCanvasNode = { uid: newUid, type, label: meta.label, subtitle: "", x: 0, y: newY, enabled: true };
    // Rewire edges: afterUid -> old-next becomes afterUid -> new -> old-next
    const outEdge = edges.find(e => e.fromUid === afterUid);
    const newEdges = edges.filter(e => e.fromUid !== afterUid);
    newEdges.push({ fromUid: afterUid, toUid: newUid, label: "done" });
    if (outEdge) newEdges.push({ fromUid: newUid, toUid: outEdge.toUid, label: "done" });
    setNodes([...shiftedNodes, newNode]);
    setEdges(newEdges);
    setAddMenuAt(null);
    setSelectedUid(newUid);
  }

  // ── Delete node from canvas ──
  function deleteNode(nodeUid: string) {
    const inEdge = edges.find(e => e.toUid === nodeUid);
    const outEdge = edges.find(e => e.fromUid === nodeUid);
    const newEdges = edges.filter(e => e.fromUid !== nodeUid && e.toUid !== nodeUid);
    if (inEdge && outEdge) newEdges.push({ fromUid: inEdge.fromUid, toUid: outEdge.toUid, label: "done" });
    setNodes(prev => prev.filter(n => n.uid !== nodeUid));
    setEdges(newEdges);
    setSelectedUid(null);
  }

  // ── Node renderer ──
  function renderNode(node: FlowCanvasNode, i: number) {
    const meta = NODE_TYPE_META[node.type];
    const isSelected = selectedUid === node.uid;
    const isDragging = draggingUid === node.uid;
    const cx = canvasW / 2 + node.x - NODE_W / 2;

    const isSpecial = node.type === "end" || node.type === "trigger";
    const specialW = 140;
    const specialCx = canvasW / 2 + node.x - specialW / 2;

    if (node.type === "end" || node.type === "trigger") {
      return (
        <div key={node.uid} data-interactive="1"
          onClick={e => { e.stopPropagation(); setSelectedUid(node.uid === selectedUid ? null : node.uid); setAddMenuAt(null); }}
          onMouseDown={e => startNodeDrag(e, node.uid)}
          style={{ position:"absolute", left: specialCx, top: node.y, width: specialW, cursor: isDragging ? "grabbing" : "grab", zIndex: isDragging ? 50 : isSelected ? 10 : 1 }}>
          <div className={"flex items-center justify-center gap-2 rounded-full px-4 py-2.5 border-2 select-none transition-all " +
            (isSelected ? "shadow-lg" : "hover:shadow-md")}
            style={{ borderColor: isSelected ? meta.color : "#E2E8F0", background: meta.bg }}>
            <span className="text-base">{meta.icon}</span>
            <span className="text-xs font-semibold" style={{ color: meta.color }}>{node.label}</span>
          </div>
        </div>
      );
    }

    if (node.type === "split") {
      return (
        <div key={node.uid} data-interactive="1"
          onClick={e => { e.stopPropagation(); setSelectedUid(node.uid === selectedUid ? null : node.uid); setAddMenuAt(null); }}
          onMouseDown={e => startNodeDrag(e, node.uid)}
          style={{ position:"absolute", left: cx, top: node.y, width: NODE_W, cursor: isDragging ? "grabbing" : "grab", zIndex: isDragging ? 50 : isSelected ? 10 : 1 }}>
          <div className={"border-2 select-none transition-all bg-white " + (isSelected ? "shadow-lg" : "hover:shadow-md")}
            style={{ borderColor: isSelected ? meta.color : "#E2E8F0", transform:"rotate(0deg)", borderRadius:12 }}>
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white text-sm" style={{ background: meta.color }}>⑂</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary">{node.label}</p>
                <p className="text-[10px] text-quaternary">{node.subtitle || "Add condition"}</p>
              </div>
              <div className="flex gap-1">
                <span className="rounded-full text-[10px] px-2 py-0.5 font-medium" style={{ background: meta.bg, color: meta.color }}>Branch</span>
              </div>
            </div>
          </div>
          {isSelected && (
            <div data-interactive="1" className="absolute -right-9 top-2 flex flex-col gap-1">
              <button onClick={e => { e.stopPropagation(); deleteNode(node.uid); }}
                className="flex size-7 items-center justify-center rounded-lg bg-white border border-secondary shadow-sm hover:border-error-primary hover:text-error-primary text-quaternary">
                <svg className="size-3" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={node.uid} data-interactive="1"
        onClick={e => { e.stopPropagation(); setSelectedUid(node.uid === selectedUid ? null : node.uid); setAddMenuAt(null); }}
        onMouseDown={e => startNodeDrag(e, node.uid)}
        style={{ position:"absolute", left: cx, top: node.y, width: NODE_W, cursor: isDragging ? "grabbing" : "grab", zIndex: isDragging ? 50 : isSelected ? 10 : 1 }}>
        <div className={"rounded-2xl border-2 bg-white select-none transition-all " + (isSelected ? "shadow-lg" : "shadow-sm hover:shadow-md hover:border-gray-300")}
          style={{ borderColor: isSelected ? meta.color : "#E2E8F0" }}>
          <div className="flex items-center gap-2.5 px-3 pt-3 pb-1.5">
            <div className="flex shrink-0 size-8 items-center justify-center rounded-xl text-white text-sm" style={{ background: meta.color }}>
              {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary truncate">{node.label}</p>
              <p className="text-[10px] text-quaternary truncate">{node.subtitle || meta.label}</p>
            </div>
            <div className={"shrink-0 size-2 rounded-full " + (node.enabled ? "bg-green-400" : "bg-gray-300")} />
          </div>
          <div className="flex items-center gap-1.5 px-3 pb-2.5 flex-wrap">
            <span className="rounded-full text-[10px] px-2 py-0.5 font-medium" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
            {node.config?.assignee && <span className="rounded-full bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5">{node.config.assignee}</span>}
            {node.config?.status  && <span className="rounded-full bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5">{node.config.status}</span>}
          </div>
        </div>
        {isSelected && (
          <div data-interactive="1" className="absolute -right-9 top-2 flex flex-col gap-1">
            {node.type === "task" && node.taskItem && (
              <button onClick={e => { e.stopPropagation(); onEditTask(node.taskItem!); }}
                className="flex size-7 items-center justify-center rounded-lg bg-white border border-secondary shadow-sm hover:border-brand hover:text-brand-secondary text-secondary">
                <svg className="size-3" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5a2.121 2.121 0 013 3L5 15H1v-4L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); deleteNode(node.uid); }}
              className="flex size-7 items-center justify-center rounded-lg bg-white border border-secondary shadow-sm hover:border-error-primary hover:text-error-primary text-quaternary">
              <svg className="size-3" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">

      {/* ── Left palette ── */}
      <div className="w-52 shrink-0 border-r border-secondary bg-primary overflow-y-auto flex flex-col">
        <div className="px-3 pt-3 pb-2 border-b border-secondary">
          <p className="text-[10px] font-semibold text-quaternary uppercase tracking-wider">Node Palette</p>
          <p className="text-[10px] text-quaternary mt-0.5">Drag onto canvas or use + buttons</p>
        </div>
        {PALETTE_CATEGORIES.map(cat => (
          <div key={cat} className="px-2 pt-2 pb-1">
            <p className="text-[9px] font-bold text-quaternary uppercase tracking-wider px-1 mb-1">{cat}</p>
            {(Object.entries(NODE_TYPE_META) as [FlowNodeType, typeof NODE_TYPE_META[FlowNodeType]][])
              .filter(([, m]) => m.category === cat)
              .map(([type, meta]) => (
                <div key={type}
                  draggable
                  onDragStart={e => { setPaletteType(type); e.dataTransfer.effectAllowed = "copy"; }}
                  onDragEnd={() => setPaletteType(null)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 cursor-grab hover:bg-secondary_alt transition-colors mb-0.5 select-none">
                  <div className="flex size-6 items-center justify-center rounded-lg text-xs shrink-0" style={{ background: meta.bg }}>
                    <span style={{ fontSize: 12 }}>{meta.icon}</span>
                  </div>
                  <span className="text-xs text-secondary font-medium leading-tight">{meta.label}</span>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* ── Canvas + toolbar ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-secondary bg-primary shrink-0">
          <span className="text-xs text-quaternary">Click node to select · drag to move · + to insert</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setZoom(z => Math.max(40, z - 10))} className="flex size-6 items-center justify-center rounded border border-secondary text-secondary hover:bg-secondary text-sm">−</button>
            <span className="text-xs text-quaternary w-9 text-center tabular-nums">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(160, z + 10))} className="flex size-6 items-center justify-center rounded border border-secondary text-secondary hover:bg-secondary text-sm">+</button>
            <button onClick={() => { setZoom(85); setPan({ x: 0, y: 0 }); }} className="rounded border border-secondary px-2 py-1 text-xs text-secondary hover:bg-secondary">Reset</button>
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef}
          className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
          style={{ backgroundImage:"radial-gradient(circle, #CBD5E1 1px, transparent 1px)", backgroundSize:"24px 24px", backgroundColor:"#F8F9FB" }}
          onMouseDown={onCanvasMouseDown}
          onDragOver={e => { if (paletteType) e.preventDefault(); }}
          onDrop={e => {
            if (!paletteType || !containerRef.current) return;
            const container = containerRef.current.getBoundingClientRect();
            const scale = zoom / 100;
            const cx = (e.clientX - container.left - pan.x - canvasW / 2 * scale) / scale;
            const cy = (e.clientY - container.top - pan.y) / scale;
            const meta = NODE_TYPE_META[paletteType];
            const newUid = uid();
            setNodes(prev => [...prev, { uid: newUid, type: paletteType, label: meta.label, x: cx, y: cy, enabled: true }]);
            setPaletteType(null);
            setSelectedUid(newUid);
          }}>

          <div style={{ position:"absolute", left: pan.x, top: pan.y, transformOrigin:"50% 0", transform:`scale(${zoom/100})`, width: canvasW, height: Math.max(600, maxY) }}>

            {/* SVG edges */}
            <svg style={{ position:"absolute", inset:0, width:canvasW, height:Math.max(600,maxY), pointerEvents:"none" }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={brandColor} opacity="0.6" />
                </marker>
              </defs>
              {edges.map((edge, ei) => {
                const fromNode = nodes.find(n => n.uid === edge.fromUid);
                const toNode = nodes.find(n => n.uid === edge.toUid);
                if (!fromNode || !toNode) return null;
                const isFromSpecial = fromNode.type === "trigger" || fromNode.type === "end";
                const isToSpecial = toNode.type === "trigger" || toNode.type === "end";
                const fW = isFromSpecial ? 140 : NODE_W;
                const tW = isToSpecial ? 140 : NODE_W;
                const x1 = canvasW/2 + fromNode.x;
                const y1 = fromNode.y + NODE_H;
                const x2 = canvasW/2 + toNode.x;
                const y2 = toNode.y;
                const midY = (y1 + y2) / 2;
                return (
                  <g key={ei}>
                    <path d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                      stroke={brandColor} strokeWidth="1.5" fill="none" opacity="0.45" markerEnd="url(#arrow)" />
                    {edge.label && (
                      <>
                        <rect x={x2-18} y={midY-8} width="36" height="16" rx="8" fill="white" stroke={brandColor} strokeWidth="1" opacity="0.9"/>
                        <text x={x2} y={midY+4} textAnchor="middle" fontSize="7" fill={brandColor} fontFamily="Metrophobic,sans-serif" fontWeight="700">{edge.label}</text>
                      </>
                    )}
                    {/* Insert (+) button mid-edge */}
                    <g style={{ cursor:"pointer" }} data-interactive="1"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setAddMenuAt({ x: x2, y: midY, afterUid: edge.fromUid }); setSelectedUid(null); }}>
                      <circle cx={x2} cy={midY} r="10" fill="white" stroke={brandColor} strokeWidth="1.5" opacity="0.9"/>
                      <text x={x2} y={midY+4} textAnchor="middle" fontSize="13" fill={brandColor} style={{ userSelect:"none" }}>+</text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node, i) => renderNode(node, i))}

            {/* Add-node context menu */}
            {addMenuAt && (
              <div data-interactive="1"
                style={{ position:"absolute", left: addMenuAt.x + 12, top: addMenuAt.y - 20, zIndex:100, width: 200 }}
                className="rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-secondary">
                  <p className="text-xs font-semibold text-primary">Insert node</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {(Object.entries(NODE_TYPE_META) as [FlowNodeType, typeof NODE_TYPE_META[FlowNodeType]][])
                    .filter(([t]) => t !== "trigger")
                    .map(([type, meta]) => (
                      <button key={type}
                        onClick={() => addNodeAfter(addMenuAt.afterUid, type)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-secondary_alt text-left transition-colors">
                        <div className="flex size-6 items-center justify-center rounded-md text-xs" style={{ background: meta.bg }}>
                          <span style={{ fontSize:12 }}>{meta.icon}</span>
                        </div>
                        <span className="text-xs text-secondary">{meta.label}</span>
                      </button>
                    ))}
                </div>
                <button onClick={() => setAddMenuAt(null)} className="w-full px-3 py-1.5 text-xs text-quaternary hover:bg-secondary border-t border-secondary">Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* Legend strip */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-secondary bg-primary shrink-0 flex-wrap overflow-x-auto">
          {(Object.entries(NODE_TYPE_META) as [FlowNodeType, typeof NODE_TYPE_META[FlowNodeType]][]).map(([type, meta]) => (
            <div key={type} className="flex items-center gap-1 shrink-0">
              <span className="text-xs">{meta.icon}</span>
              <span className="text-[10px] text-quaternary">{meta.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskBuilder() {
  const [domains, setDomains] = useState<DomainConfig[]>(initialDomains);
  const [view, setView] = useState<TaskBuilderView>("templates");
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [editingTask, setEditingTask] = useState<TaskItem | null | "new">(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<"list"|"flow">("list");

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

  function deleteFlow(domainId: string, templateId: string) {
    setDomains(prev => prev.map(d => {
      if (d.id !== domainId) return d;
      const remaining = d.templates.filter(t => t.id !== templateId);
      return { ...d, templates: remaining };
    }).filter(d => d.templates.length > 0));
    // If we just deleted the active flow, go back to the list
    if (activeDomainId === domainId && activeTemplateId === templateId) {
      setActiveDomainId(null);
      setActiveTemplateId(null);
      setView("templates");
    }
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

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ View: Workflows table ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  if (view === "workflows") {
    // Legacy fallback — redirect to templates view
    setView("templates");
    return null;
  }

  // View: Task Flows table (all templates across all domains)
  if (view === "templates") {
    const allFlows: Array<{ domainId: string; domainLabel: string; domainColor: string; template: WorkflowTemplate }> = [];
    domains.forEach(d => d.templates.forEach(t => allFlows.push({ domainId: d.id, domainLabel: d.label, domainColor: d.color, template: t })));

    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-primary">Task Flows</h2>
            <p className="text-sm text-tertiary mt-0.5">All task chains across the CRM</p>
          </div>
          <button onClick={() => openWizard(1)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
            <Plus className="size-3.5" aria-hidden />New task flow
          </button>
        </div>

        <div className="rounded-xl border border-secondary overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_2fr_1.5fr_1fr_auto] gap-4 px-4 py-3 bg-secondary_alt border-b border-secondary">
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Task flow</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Workflow</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Applies to</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Status</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider">Tasks</span>
            <span className="text-xs font-semibold text-quaternary uppercase tracking-wider"></span>
          </div>
          {allFlows.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-secondary">No task flows yet</p>
              <p className="text-xs text-tertiary mt-1">Click New task flow to create your first</p>
            </div>
          )}
          {allFlows.map(({ domainId, domainLabel, domainColor, template }, i) => (
            <div key={template.id} onClick={() => { setActiveDomainId(domainId); setActiveTemplateId(template.id); setView("tasks"); }}
              className={"grid grid-cols-[2fr_1.5fr_2fr_1.5fr_1fr_auto] gap-4 px-4 py-4 items-center cursor-pointer transition-colors hover:bg-secondary_alt " + (i < allFlows.length - 1 ? "border-b border-secondary" : "")}>
              <span className="text-sm font-medium text-primary">{template.name}</span>
              <div className="flex items-center gap-2">
                <span className={"size-2 rounded-full shrink-0 " + domainColor} />
                <span className="text-sm text-secondary">{domainLabel}</span>
              </div>
              <span className="text-sm text-tertiary truncate">{template.practices.join(", ")}</span>
              <div><StatusBadge status={template.status} /></div>
              <span className="text-sm text-secondary">{template.tasks.length} task{template.tasks.length !== 1 ? "s" : ""}</span>
              <button onClick={e => { e.stopPropagation(); deleteFlow(domainId, template.id); }}
                className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors">
                <Trash01 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        {wizardOpen && <Wizard domains={domains} startStep={wizardStep} onComplete={handleWizardComplete} onClose={() => setWizardOpen(false)} />}
      </div>
    );
  }


  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ View: Tasks (drag-drop chain) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  if (view === "tasks" && activeDomain && activeTemplate) {
    return (
      <div className="flex flex-col min-h-0" style={{ height: "100%" }}>
        {/* Breadcrumb + toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-secondary shrink-0">
          <div className="flex items-center gap-2 text-sm text-tertiary">
            <button onClick={() => setView("templates")} className="hover:text-primary transition-colors">Task Flows</button>
            <ChevronRight className="size-3.5 text-quaternary" aria-hidden />
            <span className="font-medium text-primary">{activeTemplate.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-secondary bg-secondary p-0.5">
              <button onClick={() => setTaskViewMode("list")}
                className={"flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors " +
                  (taskViewMode === "list" ? "bg-white text-primary shadow-xs" : "text-quaternary hover:text-secondary")}>
                <svg className="size-3.5" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                List
              </button>
              <button onClick={() => setTaskViewMode("flow")}
                className={"flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors " +
                  (taskViewMode === "flow" ? "bg-white text-primary shadow-xs" : "text-quaternary hover:text-secondary")}>
                <svg className="size-3.5" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="2" stroke="currentColor" strokeWidth="1.25"/><circle cx="4" cy="13" r="2" stroke="currentColor" strokeWidth="1.25"/><circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M8 5v3M8 8l-3 3M8 8l3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
                Flow
              </button>
            </div>
            <StatusBadge status={activeTemplate.status} />
            {activeTemplate.status !== "published"
              ? <button onClick={() => setConfirmPublish(true)} className="rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">Publish</button>
              : <button onClick={() => setConfirmUnpublish(true)} className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Unpublish</button>
            }
          </div>
        </div>

        {/* Flow view */}
        {taskViewMode === "flow" && (
          <div className="flex-1 min-h-0" style={{ height: "calc(100% - 56px)" }}>
            <FlowChartView
              tasks={activeTemplate.tasks}
              domainColor={activeDomain.color}
              onEditTask={setEditingTask}
              onDeleteTask={id => updateTemplate(activeTemplate.tasks.filter(t => t.id !== id))}
              onReorder={updateTemplate}
              onAddTask={() => setEditingTask("new")}
            />
          </div>
        )}

        {/* List view */}
        {taskViewMode === "list" && <>
        {/* Info */}
        <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-2 rounded-xl border border-secondary bg-secondary_alt px-4 py-3 shrink-0">
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
        </>}

        {editingTask !== null && <EditTaskModal task={editingTask === "new" ? null : editingTask} onSave={task => { editingTask === "new" ? updateTemplate([...activeTemplate.tasks, { ...task, triggerType: "task_completed" }]) : updateTemplate(activeTemplate.tasks.map(t => t.id === task.id ? task : t)); setEditingTask(null); }} onClose={() => setEditingTask(null)} />}
        {wizardOpen && <Wizard domains={domains} startStep={3} prefillDomainId={activeDomain.id} prefillTemplateId={activeTemplate.id} onComplete={handleWizardComplete} onClose={() => setWizardOpen(false)} />}
        {confirmPublish && <ConfirmModal title="Publish template?" message={(() => { const conflicts = getConflictingTemplates(); return (<>Template <strong>{activeTemplate.name}</strong> will become active for <strong>{activeTemplate.practices.join(", ")}</strong>.{conflicts.length > 0 && <> <span className="block mt-2 text-warning-primary font-medium">â  This will archive {conflicts.map(t => <strong key={t.id}>{t.name}</strong>).reduce((a: React.ReactNode[], b, i) => [...a, i > 0 ? ', ' : '', b], [])}, which {conflicts.length === 1 ? 'is' : 'are'} currently published for overlapping practices.</span></>}</>); })()} confirmLabel="Yes, publish" confirmClass="bg-brand-solid text-white hover:bg-brand-solid_hover" onConfirm={() => setTemplateStatus("published")} onClose={() => setConfirmPublish(false)} />}
        {confirmUnpublish && <ConfirmModal title="Archive template?" message={<>Template <strong>{activeTemplate.name}</strong> will stop creating new tasks immediately.</>} confirmLabel="Yes, archive" confirmClass="bg-error-primary text-white hover:opacity-90" onConfirm={() => setTemplateStatus("archived")} onClose={() => setConfirmUnpublish(false)} />}
      </div>
    );
  }

  return null;
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Placeholder ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
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

// ─── Phone Settings ───────────────────────────────────────────────────────────
const API_BASE = 'https://project-origin-production-1216.up.railway.app';

// Types for Phone System
interface Practice {
  id: string;
  practice_name: string;
  contact_name: string;
  contact_email: string;
  abn?: string;
  afsl_number?: string;
  is_subaccount: boolean;
  twilio_subaccount_sid?: string;
  twilio_account_sid?: string;
  address_sid?: string;
  bundle_sid?: string;
  bundle_status: string;
  twiml_app_sid?: string;
  setup_step: string;
  setup_status: string;
}

interface PhoneNumber {
  id: string;
  phone_number: string;
  friendly_name: string;
  number_type: string;
  is_active: boolean;
  practice_id: string;
  call_flow_id?: string;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  region: string;
  locality?: string;
  capabilities: { voice: boolean; sms?: boolean };
}

interface SetupStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETUP_STEPS: SetupStep[] = [
  { id: 'practice', label: 'Practice Details', description: 'Register your practice', icon: Building01 },
  { id: 'number', label: 'Phone Number', description: 'Purchase a number', icon: PhoneCall01 },
];

type PhoneSubTab = "practices" | "numbers" | "flows" | "recording" | "transcription" | "access" | "usage";
type WizardStepId = 'practice' | 'number' | 'routing';

function PhoneSettings() {
  const [subTab, setSubTab] = useState<PhoneSubTab>("practices");
  const [practices, setPractices] = useState<Practice[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [wizardPractice, setWizardPractice] = useState<Practice | null>(null);
  const [wizardLoading, setWizardLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    practiceName: '',
    contactName: '',
    contactEmail: '',
    abn: '',
    afslNumber: '',
    useSubaccount: false, // false = Axis Organisation, true = Separate Organisation
    numberType: 'local',
    numberCountry: 'US', // Default to US for instant purchase (no regulatory bundle needed)
    selectedNumber: '',
    selectedNumberIndex: -1,
  });
  
  // Available numbers for purchase
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [searchingNumbers, setSearchingNumbers] = useState(false);
  
  // Settings state
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(true);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(false);
  
  // Edit/Delete practice state
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
  const [deletingPractice, setDeletingPractice] = useState<Practice | null>(null);
  const [editForm, setEditForm] = useState({ practiceName: '', contactName: '', contactEmail: '', abn: '', afslNumber: '', useSubaccount: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [convertingToSubaccount, setConvertingToSubaccount] = useState(false);
  
  // Filter state
  const [orgFilter, setOrgFilter] = useState<'all' | 'axis' | 'separate'>('all');

  // Call flows state
  const [callFlows, setCallFlows] = useState<any[]>([]);
  const [loadingFlows, setLoadingFlows] = useState(false);
  const [editingFlow, setEditingFlow] = useState<any | null>(null);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowForm, setFlowForm] = useState({
    name: '',
    greetingText: 'Thank you for calling. Please hold while we connect you.',
    routeType: 'direct',
    routeDestination: '',
    recordingEnabled: true,
    transcriptionEnabled: false,
    timeoutSeconds: 30,
    fallbackAction: 'voicemail',
  });

  const subTabs: { id: PhoneSubTab; label: string }[] = [
    { id: "practices", label: "Practices" },
    { id: "numbers", label: "Numbers" },
    { id: "flows", label: "Call Flows" },
    { id: "recording", label: "Recording" },
    { id: "transcription", label: "Transcription" },
    { id: "access", label: "Access" },
    { id: "usage", label: "Usage" },
  ];

  // Fetch practices and numbers on load
  useEffect(() => {
    fetchPractices();
    fetchPhoneNumbers();
    fetchCallFlows();
  }, []);

  const fetchPractices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/telnyx/practices`);
      if (res.ok) {
        const data = await res.json();
        // Ensure data is an array before setting state
        setPractices(Array.isArray(data) ? data : []);
      } else {
        // API returned an error, set empty array
        setPractices([]);
      }
    } catch (err) {
      console.error('Error fetching practices:', err);
      setPractices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/telnyx/phone-numbers`);
      if (res.ok) {
        const data = await res.json();
        // Ensure data is an array before setting state
        setPhoneNumbers(Array.isArray(data) ? data : []);
      } else {
        setPhoneNumbers([]);
      }
    } catch (err) {
      console.error('Error fetching phone numbers:', err);
      setPhoneNumbers([]);
    }
  };

  const fetchCallFlows = async () => {
    setLoadingFlows(true);
    try {
      const res = await fetch(`${API_BASE}/api/call-flows`);
      if (res.ok) {
        const data = await res.json();
        // Ensure data is an array before setting state
        setCallFlows(Array.isArray(data) ? data : []);
      } else {
        // API returned an error, set empty array
        setCallFlows([]);
      }
    } catch (err) {
      console.error('Error fetching call flows:', err);
      setCallFlows([]);
    } finally {
      setLoadingFlows(false);
    }
  };

  const saveCallFlow = async () => {
    try {
      const method = editingFlow ? 'PUT' : 'POST';
      const url = editingFlow 
        ? `${API_BASE}/api/call-flows/${editingFlow.id}` 
        : `${API_BASE}/api/call-flows`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flowForm.name,
          greeting_text: flowForm.greetingText,
          route_type: flowForm.routeType,
          route_destination: flowForm.routeDestination,
          recording_enabled: flowForm.recordingEnabled,
          transcription_enabled: flowForm.transcriptionEnabled,
          timeout_seconds: flowForm.timeoutSeconds,
          fallback_action: flowForm.fallbackAction,
        }),
      });
      
      if (res.ok) {
        fetchCallFlows();
        setShowFlowModal(false);
        setEditingFlow(null);
        setFlowForm({
          name: '',
          greetingText: 'Thank you for calling. Please hold while we connect you.',
          routeType: 'direct',
          routeDestination: '',
          recordingEnabled: true,
          transcriptionEnabled: false,
          timeoutSeconds: 30,
          fallbackAction: 'voicemail',
        });
      }
    } catch (err) {
      console.error('Error saving call flow:', err);
    }
  };

  const deleteCallFlow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this call flow?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/call-flows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCallFlows();
      }
    } catch (err) {
      console.error('Error deleting call flow:', err);
    }
  };

  const openEditFlow = (flow: any) => {
    setEditingFlow(flow);
    setFlowForm({
      name: flow.name || '',
      greetingText: flow.greeting_text || '',
      routeType: flow.route_type || 'direct',
      routeDestination: flow.route_destination || '',
      recordingEnabled: flow.recording_enabled ?? true,
      transcriptionEnabled: flow.transcription_enabled ?? false,
      timeoutSeconds: flow.timeout_seconds || 30,
      fallbackAction: flow.fallback_action || 'voicemail',
    });
    setShowFlowModal(true);
  };

  // Wizard handlers
  const startSetupWizard = (practice?: Practice) => {
    setError(null);
    if (practice) {
      setWizardPractice(practice);
      // Populate form data from existing practice
      setFormData(prev => ({
        ...prev,
        practiceName: practice.practice_name || '',
        contactName: practice.contact_name || '',
        contactEmail: practice.contact_email || '',
        abn: practice.abn || '',
        afslNumber: practice.afsl_number || '',
        useSubaccount: practice.is_subaccount || false,
      }));
      // Determine which step to continue from
      const stepIndex = getStepIndexForPractice(practice);
      setWizardStep(stepIndex);
    } else {
      setWizardPractice(null);
      setWizardStep(0);
      setFormData({
        practiceName: '',
        contactName: '',
        contactEmail: '',
        abn: '',
        afslNumber: '',
        useSubaccount: false,
        numberType: 'local',
        numberCountry: 'US',
        selectedNumber: '',
        selectedNumberIndex: -1,
      });
    }
    setShowWizard(true);
  };

  // Simplified step tracking for 2-step wizard
  const getStepIndexForPractice = (practice: Practice): number => {
    // Map setup_step to wizard step index
    // Backend values: 'practice_created' -> 'number_purchased' -> 'complete'
    switch (practice.setup_step) {
      case 'practice_created':
        return 1; // Completed practice details, now needs phone number
      case 'number_purchased':
      case 'routing_complete':
      case 'complete':
        return 1; // Fully complete - on number step (for review)
      default:
        // Fallback: check phone numbers to determine step
        const practiceNumbers = phoneNumbers.filter(n => n.practice_id === practice.id);
        if (practiceNumbers.length > 0) {
          return 1; // Has numbers, complete
        }
        return 1; // Has practice details (since practice exists), needs number
    }
  };

  const getStepStatus = (stepIndex: number, practice: Practice | null): 'complete' | 'current' | 'pending' => {
    if (!practice) return stepIndex === 0 ? 'current' : 'pending';
    const currentStepIndex = getStepIndexForPractice(practice);
    if (stepIndex < currentStepIndex) return 'complete';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  // Step 1: Create Practice
  const handleCreatePractice = async () => {
    setWizardLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/telnyx/practices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceName: formData.practiceName,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          abn: formData.abn,
          afslNumber: formData.afslNumber,
          useSubaccount: formData.useSubaccount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create practice');
      // Backend returns practice object directly, not { practice: ... }
      setWizardPractice(data);
      setWizardStep(1);
      fetchPractices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWizardLoading(false);
    }
  };

  // (Address and compliance steps removed - single account architecture)

  // Step 2: Search available numbers (from main Axis account)
  const searchAvailableNumbers = async () => {
    if (!wizardPractice) return;
    setSearchingNumbers(true);
    setAvailableNumbers([]);
    try {
      // Use country selector - defaults to US for instant purchase
      const country = formData.numberCountry || 'US';
      const res = await fetch(
        `${API_BASE}/api/telnyx/practices/${wizardPractice.id}/available-numbers?country=${country}&type=${formData.numberType}`
      );
      const data = await res.json();
      if (res.ok) {
        setAvailableNumbers(data);
      }
    } catch (err) {
      console.error('Error searching numbers:', err);
    } finally {
      setSearchingNumbers(false);
    }
  };

  // Purchase number (from main Axis account)
  const handlePurchaseNumber = async () => {
    if (!wizardPractice || !formData.selectedNumber) return;
    setWizardLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/telnyx/practices/${wizardPractice.id}/phone-numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.selectedNumber,
          friendlyName: `${wizardPractice.practice_name} - Main`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to purchase number');
      // Complete the wizard
      setShowWizard(false);
      setWizardPractice(null);
      fetchPhoneNumbers();
      fetchPractices();
      fetchCallFlows();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWizardLoading(false);
    }
  };

  // Assign call flow to a phone number
  const assignFlowToNumber = async (numberId: string, flowId: string | null) => {
    try {
      const res = await fetch(`${API_BASE}/api/telnyx/phone-numbers/${numberId}/assign-flow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callFlowId: flowId }),
      });
      if (!res.ok) throw new Error('Failed to assign flow');
      fetchPhoneNumbers();
    } catch (err: any) {
      console.error('Error assigning flow:', err);
      setError(err.message);
    }
  };

  // Edit practice
  const handleEditPractice = async () => {
    if (!editingPractice) return;
    setActionLoading(true);
    try {
      // Check if converting to subaccount
      const isConverting = editForm.useSubaccount && !editingPractice.is_subaccount;
      
      const res = await fetch(`${API_BASE}/api/telnyx/practices/${editingPractice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceName: editForm.practiceName,
          contactName: editForm.contactName,
          contactEmail: editForm.contactEmail,
          abn: editForm.abn,
          afslNumber: editForm.afslNumber,
          convertToSubaccount: isConverting,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update practice');
      setEditingPractice(null);
      setConvertingToSubaccount(false);
      fetchPractices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete practice
  const handleDeletePractice = async () => {
    if (!deletingPractice) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/telnyx/practices/${deletingPractice.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete practice');
      setDeletingPractice(null);
      fetchPractices();
      fetchPhoneNumbers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (practice: Practice) => {
    setError(null);
    setEditForm({
      practiceName: practice.practice_name || '',
      contactName: practice.contact_name || '',
      contactEmail: practice.contact_email || '',
      abn: practice.abn || '',
      afslNumber: practice.afsl_number || '',
      useSubaccount: practice.is_subaccount || false,
    });
    setConvertingToSubaccount(false);
    setEditingPractice(practice);
  };

  // Render Wizard Stepper
  const renderStepper = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {SETUP_STEPS.map((step, index) => {
        const status = getStepStatus(index, wizardPractice);
        const Icon = step.icon;
        const isLast = index === SETUP_STEPS.length - 1;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all
                ${status === 'complete' ? 'bg-success-solid text-white' : ''}
                ${status === 'current' ? 'bg-brand-solid text-white ring-4 ring-brand-solid/20' : ''}
                ${status === 'pending' ? 'bg-secondary text-quaternary' : ''}
              `}>
                {status === 'complete' ? (
                  <Check className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${status === 'current' ? 'text-brand-secondary' : status === 'complete' ? 'text-success-primary' : 'text-quaternary'}`}>
                  {step.label}
                </p>
              </div>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 ${index < wizardStep ? 'bg-success-solid' : 'bg-secondary'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Render current wizard step content
  const renderWizardContent = () => {
    switch (wizardStep) {
      case 0: // Practice Details
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary">Register Your Practice</h3>
              <p className="text-sm text-tertiary mt-1">Enter your practice details to get started</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-secondary mb-1.5">Practice Name *</label>
                <input
                  type="text"
                  value={formData.practiceName}
                  onChange={e => setFormData(prev => ({ ...prev, practiceName: e.target.value }))}
                  onInput={e => setFormData(prev => ({ ...prev, practiceName: (e.target as HTMLInputElement).value }))}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Axis Insurance Pty Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Contact Name</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  onInput={e => setFormData(prev => ({ ...prev, contactName: (e.target as HTMLInputElement).value }))}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Contact Email *</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  onInput={e => setFormData(prev => ({ ...prev, contactEmail: (e.target as HTMLInputElement).value }))}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="john@practice.com.au"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">ABN</label>
                <input
                  type="text"
                  value={formData.abn}
                  onChange={e => setFormData(prev => ({ ...prev, abn: e.target.value }))}
                  onInput={e => setFormData(prev => ({ ...prev, abn: (e.target as HTMLInputElement).value }))}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="12 345 678 901"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">AFSL Number</label>
                <input
                  type="text"
                  value={formData.afslNumber}
                  onChange={e => setFormData(prev => ({ ...prev, afslNumber: e.target.value }))}
                  onInput={e => setFormData(prev => ({ ...prev, afslNumber: (e.target as HTMLInputElement).value }))}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="123456"
                />
              </div>
            </div>
            
            {/* Organisation Type */}
            <div className="pt-4 border-t border-secondary">
              <label className="block text-sm font-medium text-secondary mb-3">Organisation Setup</label>
              <div className="space-y-3">
                <label 
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    !formData.useSubaccount 
                      ? 'border-brand-solid bg-brand-secondary/30' 
                      : 'border-secondary hover:border-tertiary'
                  }`}
                >
                  <input
                    type="radio"
                    name="orgType"
                    checked={!formData.useSubaccount}
                    onChange={() => setFormData(prev => ({ ...prev, useSubaccount: false }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-primary">Setup under Axis Organisation</div>
                    <div className="text-sm text-tertiary mt-0.5">
                      Recommended for most practices. Phone numbers billed to Axis account.
                    </div>
                  </div>
                </label>
                <label 
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.useSubaccount 
                      ? 'border-brand-solid bg-brand-secondary/30' 
                      : 'border-secondary hover:border-tertiary'
                  }`}
                >
                  <input
                    type="radio"
                    name="orgType"
                    checked={formData.useSubaccount}
                    onChange={() => setFormData(prev => ({ ...prev, useSubaccount: true }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-primary">Setup under Separate Organisation</div>
                    <div className="text-sm text-tertiary mt-0.5">
                      For separate billing or practices at high risk of breaching Twilio's terms of service. 
                      Creates an isolated subaccount.
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary">
              <button
                onClick={() => setShowWizard(false)}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePractice}
                disabled={!formData.practiceName || !formData.contactEmail || wizardLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-solid rounded-lg hover:bg-brand-solid_hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {wizardLoading && <RefreshCw01 className="size-4 animate-spin" />}
                Create Practice
              </button>
            </div>
          </div>
        );

      case 1: // Phone Number
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary">Purchase Phone Number</h3>
              <p className="text-sm text-tertiary mt-1">Search and purchase a phone number for your practice</p>
            </div>
            <div className="flex gap-3">
              <select
                value={formData.numberCountry}
                onChange={e => {
                  setFormData(prev => ({ ...prev, numberCountry: e.target.value, selectedNumber: '', selectedNumberIndex: -1 }));
                  setAvailableNumbers([]);
                }}
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="US">United States (+1)</option>
                <option value="AU">Australia (+61)</option>
                <option value="GB">United Kingdom (+44)</option>
              </select>
              <select
                value={formData.numberType}
                onChange={e => {
                  setFormData(prev => ({ ...prev, numberType: e.target.value, selectedNumber: '', selectedNumberIndex: -1 }));
                  setAvailableNumbers([]);
                }}
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="local">Local</option>
                <option value="mobile">Mobile</option>
                <option value="tollFree">Toll-Free</option>
              </select>
              <button
                onClick={searchAvailableNumbers}
                disabled={searchingNumbers}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-solid rounded-lg hover:bg-brand-solid_hover disabled:opacity-50 flex items-center gap-2"
              >
                {searchingNumbers ? <RefreshCw01 className="size-4 animate-spin" /> : <SearchLg className="size-4" />}
                Search Numbers
              </button>
            </div>
            {formData.numberCountry === 'AU' && (
              <div className="p-3 rounded-lg bg-warning-secondary border border-warning">
                <p className="text-xs text-warning-primary flex items-center gap-2">
                  <InfoCircle className="size-4" />
                  AU numbers require Axis regulatory bundle approval. Contact admin if unavailable.
                </p>
              </div>
            )}
            {availableNumbers.length > 0 && (
              <div className="rounded-xl border border-secondary overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-tertiary border-b border-secondary sticky top-0">
                    <tr>
                      <th className="w-12 px-4 py-3"></th>
                      <th className="w-1/2 text-left px-4 py-3 text-xs font-medium text-quaternary uppercase tracking-wider">Number</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-quaternary uppercase tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary">
                    {availableNumbers.map((num, index) => (
                      <tr 
                        key={index} 
                        onClick={() => setFormData(prev => ({ ...prev, selectedNumber: num.phoneNumber, selectedNumberIndex: index }))}
                        className={`cursor-pointer transition-colors ${formData.selectedNumberIndex === index ? 'bg-brand-secondary' : 'hover:bg-secondary_alt'}`}
                      >
                        <td className="px-4 py-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.selectedNumberIndex === index ? 'border-brand-solid bg-brand-solid' : 'border-secondary'}`}>
                            {formData.selectedNumberIndex === index && <Check className="size-2.5 text-white" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-primary text-sm">{num.friendlyName}</td>
                        <td className="px-4 py-3 text-tertiary text-sm">{num.locality || num.region}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {formData.selectedNumber && (
              <div className="p-4 rounded-lg bg-brand-secondary border border-brand">
                <p className="text-sm font-medium text-brand-secondary">Selected: <span className="font-mono">{formData.selectedNumber}</span></p>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-secondary">
              <button
                onClick={() => setWizardStep(0)}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary flex items-center gap-2"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              <button
                onClick={handlePurchaseNumber}
                disabled={!formData.selectedNumber || wizardLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-success-solid rounded-lg hover:bg-success-solid/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {wizardLoading && <RefreshCw01 className="size-4 animate-spin" />}
                <CheckCircle className="size-4" />
                Complete Setup
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Wizard Modal
  // Mock users for access tab
  const MOCK_USERS_PHONE = [
    { id: "1", name: "Isaac Dickman", email: "isaac@axis.com", softphoneEnabled: true, extension: "101" },
    { id: "2", name: "Maysee Chang", email: "maysee@axis.com", softphoneEnabled: true, extension: "102" },
    { id: "3", name: "John Rojas", email: "john@axis.com", softphoneEnabled: false, extension: "103" },
    { id: "4", name: "Natasha Carlson", email: "natasha@axis.com", softphoneEnabled: true, extension: "104" },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* Wizard Modal - rendered inline to preserve input state */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-primary rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Phone System Setup</h2>
                <button onClick={() => setShowWizard(false)} className="text-quaternary hover:text-secondary">
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {renderStepper()}
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-error-secondary border border-error">
                  <p className="text-sm text-error-primary flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    {error}
                  </p>
                </div>
              )}
              {renderWizardContent()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Practice Modal */}
      {editingPractice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-primary rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-secondary">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Edit Practice</h2>
                <button onClick={() => setEditingPractice(null)} className="text-quaternary hover:text-secondary">
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Practice Name *</label>
                <input
                  type="text"
                  value={editForm.practiceName}
                  onInput={(e) => setEditForm(prev => ({ ...prev, practiceName: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 rounded-lg border border-secondary bg-primary text-primary text-sm focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Contact Name</label>
                <input
                  type="text"
                  value={editForm.contactName}
                  onInput={(e) => setEditForm(prev => ({ ...prev, contactName: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 rounded-lg border border-secondary bg-primary text-primary text-sm focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={editForm.contactEmail}
                  onInput={(e) => setEditForm(prev => ({ ...prev, contactEmail: (e.target as HTMLInputElement).value }))}
                  className="w-full px-3 py-2 rounded-lg border border-secondary bg-primary text-primary text-sm focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">ABN</label>
                  <input
                    type="text"
                    value={editForm.abn}
                    onInput={(e) => setEditForm(prev => ({ ...prev, abn: (e.target as HTMLInputElement).value }))}
                    className="w-full px-3 py-2 rounded-lg border border-secondary bg-primary text-primary text-sm focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">AFSL Number</label>
                  <input
                    type="text"
                    value={editForm.afslNumber}
                    onInput={(e) => setEditForm(prev => ({ ...prev, afslNumber: (e.target as HTMLInputElement).value }))}
                    className="w-full px-3 py-2 rounded-lg border border-secondary bg-primary text-primary text-sm focus:ring-2 focus:ring-brand-solid focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Organisation Type */}
              <div className="pt-4 border-t border-secondary">
                <label className="block text-sm font-medium text-secondary mb-2">Organisation Type</label>
                <div className="p-3 rounded-lg bg-secondary/50 border border-secondary">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        editingPractice.is_subaccount 
                          ? 'bg-warning-secondary text-warning-primary' 
                          : 'bg-secondary text-tertiary'
                      }`}>
                        {editingPractice.is_subaccount ? 'Separate Organisation' : 'Axis Organisation'}
                      </span>
                      {editingPractice.twilio_account_sid && (
                        <p className="text-xs text-quaternary mt-1 font-mono">{editingPractice.twilio_account_sid}</p>
                      )}
                    </div>
                    {!editingPractice.is_subaccount && (
                      <button
                        type="button"
                        onClick={() => setConvertingToSubaccount(!convertingToSubaccount)}
                        className="text-xs text-brand-secondary hover:text-brand-primary font-medium"
                      >
                        {convertingToSubaccount ? 'Cancel' : 'Convert to Separate'}
                      </button>
                    )}
                  </div>
                  
                  {convertingToSubaccount && !editingPractice.is_subaccount && (
                    <div className="mt-3 pt-3 border-t border-secondary">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="confirmConvert"
                          checked={editForm.useSubaccount}
                          onChange={(e) => setEditForm(prev => ({ ...prev, useSubaccount: e.target.checked }))}
                          className="mt-0.5"
                        />
                        <label htmlFor="confirmConvert" className="text-xs text-secondary leading-relaxed">
                          <strong>Convert to Separate Organisation.</strong> This will create a new Twilio subaccount 
                          for isolated billing and risk management. This action cannot be undone.
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-error-secondary border border-error">
                  <p className="text-sm text-error-primary">{error}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-secondary flex justify-end gap-3">
              <button
                onClick={() => setEditingPractice(null)}
                className="px-4 py-2 text-sm font-medium text-tertiary hover:text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPractice}
                disabled={actionLoading || !editForm.practiceName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-solid rounded-lg hover:bg-brand-solid_hover disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Practice Confirmation Modal */}
      {deletingPractice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-primary rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-secondary">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Delete Practice</h2>
                <button onClick={() => setDeletingPractice(null)} className="text-quaternary hover:text-secondary">
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-error-secondary flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="size-6 text-error-primary" />
                </div>
                <div>
                  <p className="text-sm text-secondary">
                    Are you sure you want to delete <strong className="text-primary">{deletingPractice.practice_name}</strong>?
                  </p>
                  <p className="text-sm text-tertiary mt-2">
                    This will permanently delete the practice and release any associated phone numbers. This action cannot be undone.
                  </p>
                </div>
              </div>
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-error-secondary border border-error">
                  <p className="text-sm text-error-primary">{error}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-secondary flex justify-end gap-3">
              <button
                onClick={() => setDeletingPractice(null)}
                className="px-4 py-2 text-sm font-medium text-tertiary hover:text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePractice}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-error-primary rounded-lg hover:bg-error-primary/90 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Practice'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-secondary_alt rounded-lg p-1 w-fit">
        {subTabs.map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${subTab === tab.id ? "bg-primary text-primary shadow-sm" : "text-tertiary hover:text-secondary"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Practices Tab */}
      {subTab === "practices" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary">Practice Phone Systems</h3>
              <p className="text-xs text-tertiary mt-0.5">Manage phone systems for each practice</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value as 'all' | 'axis' | 'separate')}
                className="rounded-lg border border-secondary bg-primary px-3 py-1.5 text-xs text-secondary focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="all">All Organisations</option>
                <option value="axis">Axis Org only</option>
                <option value="separate">Separate Org only</option>
              </select>
              <button 
                onClick={() => startSetupWizard()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-solid_hover transition-colors"
              >
                <Plus className="size-3" />Setup New Practice
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw01 className="size-6 text-tertiary animate-spin" />
            </div>
          ) : practices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-secondary p-12 text-center">
              <Building01 className="size-12 text-quaternary mx-auto mb-3" />
              <h4 className="font-medium text-primary">No practices configured</h4>
              <p className="text-sm text-tertiary mt-1">Get started by setting up your first practice phone system</p>
              <button 
                onClick={() => startSetupWizard()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover"
              >
                <Plus className="size-4" />Setup First Practice
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {practices
                .filter(p => {
                  if (orgFilter === 'all') return true;
                  if (orgFilter === 'axis') return !p.is_subaccount;
                  if (orgFilter === 'separate') return p.is_subaccount;
                  return true;
                })
                .map(practice => {
                const stepIndex = getStepIndexForPractice(practice);
                const isComplete = practice.setup_status === 'complete';
                const progress = Math.round((stepIndex / SETUP_STEPS.length) * 100);
                
                return (
                  <div key={practice.id} className="rounded-xl border border-secondary p-4 hover:border-tertiary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isComplete ? 'bg-success-secondary' : 'bg-brand-secondary'}`}>
                          {isComplete ? (
                            <CheckCircle className="size-5 text-success-primary" />
                          ) : (
                            <Building01 className="size-5 text-brand-secondary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-primary">{practice.practice_name}</h4>
                          <p className="text-xs text-tertiary">{practice.contact_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {practice.afsl_number && (
                              <span className="text-xs text-quaternary">AFSL: {practice.afsl_number}</span>
                            )}
                            {practice.is_subaccount ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-warning-secondary text-warning-primary">
                                Separate Org
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-secondary text-tertiary">
                                Axis Org
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success-secondary text-success-primary">
                            <span className="size-1.5 rounded-full bg-success-primary" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning-secondary text-warning-primary">
                            <span className="size-1.5 rounded-full bg-warning-primary" />
                            Setup in Progress
                          </span>
                        )}
                        <button
                          onClick={() => openEditModal(practice)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-tertiary hover:text-secondary transition-colors"
                          title="Edit practice"
                        >
                          <Edit01 className="size-4" />
                        </button>
                        <button
                          onClick={() => { setError(null); setDeletingPractice(practice); }}
                          className="p-1.5 rounded-lg hover:bg-error-secondary text-tertiary hover:text-error-primary transition-colors"
                          title="Delete practice"
                        >
                          <Trash01 className="size-4" />
                        </button>
                      </div>
                    </div>
                    {!isComplete && (
                      <div className="mt-4 pt-4 border-t border-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-tertiary">Setup Progress</span>
                          <span className="text-xs font-medium text-secondary">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-brand-solid rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-tertiary">
                            Next: {SETUP_STEPS[stepIndex]?.label || 'Complete'}
                          </span>
                          <button
                            onClick={() => startSetupWizard(practice)}
                            className="text-xs font-medium text-brand-secondary hover:text-brand-secondary/80"
                          >
                            Continue Setup →
                          </button>
                        </div>
                      </div>
                    )}
                    {isComplete && (
                      <div className="mt-4 pt-4 border-t border-secondary">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-tertiary">
                            <span className="flex items-center gap-1.5">
                              <PhoneCall01 className="size-3.5" />
                              {phoneNumbers.filter(n => n.practice_id === practice.id).length} number(s)
                            </span>
                          </div>
                          <button
                            onClick={() => startSetupWizard(practice)}
                            className="text-xs font-medium text-brand-secondary hover:text-brand-secondary/80"
                          >
                            Manage →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Numbers Tab */}
      {subTab === "numbers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary">Phone Numbers</h3>
              <p className="text-xs text-tertiary mt-0.5">All purchased phone numbers across practices — assign call flows to configure routing</p>
            </div>
          </div>
          {phoneNumbers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-secondary p-12 text-center">
              <PhoneCall01 className="size-12 text-quaternary mx-auto mb-3" />
              <h4 className="font-medium text-primary">No phone numbers</h4>
              <p className="text-sm text-tertiary mt-1">Complete practice setup to purchase phone numbers</p>
            </div>
          ) : (
            <div className="rounded-xl border border-secondary overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-tertiary border-b border-secondary">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">Number</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">Label</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">Call Flow</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary">
                  {phoneNumbers.map(num => (
                    <tr key={num.id} className="hover:bg-secondary_alt transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-primary">{num.phone_number}</div>
                        <div className="text-xs text-tertiary capitalize">{num.number_type}</div>
                      </td>
                      <td className="px-4 py-3 text-secondary">{num.friendly_name || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={num.call_flow_id || ''}
                          onChange={(e) => assignFlowToNumber(num.id, e.target.value || null)}
                          className="w-full max-w-[200px] px-2 py-1.5 rounded-lg border border-secondary bg-primary text-sm text-primary focus:border-brand focus:ring-1 focus:ring-brand"
                        >
                          <option value="">No flow assigned</option>
                          {callFlows.map(flow => (
                            <option key={flow.id} value={flow.id}>{flow.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${num.is_active ? "bg-success-secondary text-success-primary" : "bg-secondary text-quaternary"}`}>
                          <span className={`size-1.5 rounded-full ${num.is_active ? "bg-success-primary" : "bg-quaternary"}`} />
                          {num.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Call Flows Tab */}
      {subTab === "flows" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary">Call Flows</h3>
              <p className="text-xs text-tertiary mt-0.5">Configure how incoming calls are routed and handled</p>
            </div>
            <button
              onClick={() => {
                setEditingFlow(null);
                setFlowForm({
                  name: '',
                  greetingText: 'Thank you for calling. Please hold while we connect you.',
                  routeType: 'direct',
                  routeDestination: '',
                  recordingEnabled: true,
                  transcriptionEnabled: false,
                  timeoutSeconds: 30,
                  fallbackAction: 'voicemail',
                });
                setShowFlowModal(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid/90 transition-colors"
            >
              <Plus className="size-4" />
              New Call Flow
            </button>
          </div>

          {loadingFlows ? (
            <div className="py-12 text-center text-sm text-quaternary">Loading call flows...</div>
          ) : callFlows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-secondary p-12 text-center">
              <Zap className="size-12 text-quaternary mx-auto mb-3" />
              <h4 className="font-medium text-primary">No call flows configured</h4>
              <p className="text-sm text-tertiary mt-1">Create a call flow to define how incoming calls are handled</p>
              <button
                onClick={() => setShowFlowModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid/90"
              >
                <Plus className="size-4" />
                Create Call Flow
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {callFlows.map(flow => (
                <div key={flow.id} className="rounded-xl border border-secondary p-4 hover:border-brand/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-primary">{flow.name}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          flow.route_type === 'direct' ? 'bg-blue-100 text-blue-700' :
                          flow.route_type === 'ivr' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {flow.route_type === 'direct' ? 'Direct' : flow.route_type === 'ivr' ? 'IVR Menu' : 'Ring Group'}
                        </span>
                      </div>
                      <p className="text-sm text-tertiary mt-1 line-clamp-1">{flow.greeting_text || 'No greeting configured'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-quaternary">
                        {flow.route_destination && (
                          <span className="flex items-center gap-1">
                            <PhoneCall01 className="size-3.5" />
                            Routes to: {flow.route_destination}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {flow.timeout_seconds}s timeout
                        </span>
                        {flow.recording_enabled && (
                          <span className="flex items-center gap-1">
                            <PlayCircle className="size-3.5" />
                            Recording on
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditFlow(flow)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-tertiary hover:text-secondary transition-colors"
                        title="Edit flow"
                      >
                        <Edit01 className="size-4" />
                      </button>
                      <button
                        onClick={() => deleteCallFlow(flow.id)}
                        className="p-1.5 rounded-lg hover:bg-error-secondary text-tertiary hover:text-error-primary transition-colors"
                        title="Delete flow"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assign Flow to Number */}
          {callFlows.length > 0 && phoneNumbers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-secondary">
              <h4 className="text-sm font-semibold text-primary mb-3">Assign Flows to Numbers</h4>
              <div className="rounded-xl border border-secondary overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-tertiary border-b border-secondary">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">Phone Number</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">Assigned Flow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary">
                    {phoneNumbers.map(num => (
                      <tr key={num.id} className="hover:bg-secondary_alt transition-colors">
                        <td className="px-4 py-3 font-mono text-primary">{num.phone_number}</td>
                        <td className="px-4 py-3">
                          <select 
                            className="rounded-lg border border-secondary bg-primary px-3 py-1.5 text-sm text-primary w-full max-w-xs"
                            value={num.call_flow_id || ''}
                            onChange={async (e) => {
                              try {
                                await fetch(`${API_BASE}/api/telnyx/phone-numbers/${num.id}/assign-flow`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ call_flow_id: e.target.value || null }),
                                });
                                fetchPhoneNumbers();
                              } catch (err) {
                                console.error('Error assigning flow:', err);
                              }
                            }}
                          >
                            <option value="">No flow assigned</option>
                            {callFlows.map(flow => (
                              <option key={flow.id} value={flow.id}>{flow.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Call Flow Modal */}
      {showFlowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-primary rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">
                  {editingFlow ? 'Edit Call Flow' : 'New Call Flow'}
                </h3>
                <button onClick={() => setShowFlowModal(false)} className="text-quaternary hover:text-secondary">
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Flow Name</label>
                <input
                  type="text"
                  value={flowForm.name}
                  onChange={(e) => setFlowForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Line, Support Queue"
                  className="w-full rounded-lg border border-secondary px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Greeting Message</label>
                <textarea
                  value={flowForm.greetingText}
                  onChange={(e) => setFlowForm(prev => ({ ...prev, greetingText: e.target.value }))}
                  placeholder="Text-to-speech greeting for callers"
                  rows={3}
                  className="w-full rounded-lg border border-secondary px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Routing Type</label>
                <select
                  value={flowForm.routeType}
                  onChange={(e) => setFlowForm(prev => ({ ...prev, routeType: e.target.value }))}
                  className="w-full rounded-lg border border-secondary px-3 py-2 text-sm"
                >
                  <option value="direct">Direct - Route to single destination</option>
                  <option value="ring-group">Ring Group - Ring multiple users</option>
                  <option value="ivr">IVR Menu - Interactive menu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Route Destination</label>
                <input
                  type="text"
                  value={flowForm.routeDestination}
                  onChange={(e) => setFlowForm(prev => ({ ...prev, routeDestination: e.target.value }))}
                  placeholder="Phone number or SIP URI"
                  className="w-full rounded-lg border border-secondary px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Ring Timeout</label>
                  <select
                    value={flowForm.timeoutSeconds}
                    onChange={(e) => setFlowForm(prev => ({ ...prev, timeoutSeconds: parseInt(e.target.value) }))}
                    className="w-full rounded-lg border border-secondary px-3 py-2 text-sm"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={45}>45 seconds</option>
                    <option value={60}>60 seconds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">If No Answer</label>
                  <select
                    value={flowForm.fallbackAction}
                    onChange={(e) => setFlowForm(prev => ({ ...prev, fallbackAction: e.target.value }))}
                    className="w-full rounded-lg border border-secondary px-3 py-2 text-sm"
                  >
                    <option value="voicemail">Go to Voicemail</option>
                    <option value="hangup">Hang Up</option>
                    <option value="forward">Forward to Another Number</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-secondary">
                <div>
                  <p className="text-sm font-medium text-primary">Call Recording</p>
                  <p className="text-xs text-tertiary">Record calls using this flow</p>
                </div>
                <button
                  onClick={() => setFlowForm(prev => ({ ...prev, recordingEnabled: !prev.recordingEnabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${flowForm.recordingEnabled ? "bg-brand-solid" : "bg-secondary"}`}
                >
                  <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${flowForm.recordingEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-secondary">
                <div>
                  <p className="text-sm font-medium text-primary">Transcription</p>
                  <p className="text-xs text-tertiary">Auto-transcribe recorded calls</p>
                </div>
                <button
                  onClick={() => setFlowForm(prev => ({ ...prev, transcriptionEnabled: !prev.transcriptionEnabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${flowForm.transcriptionEnabled ? "bg-brand-solid" : "bg-secondary"}`}
                >
                  <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${flowForm.transcriptionEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-secondary flex justify-end gap-3">
              <button
                onClick={() => setShowFlowModal(false)}
                className="px-4 py-2 rounded-lg border border-secondary text-sm font-medium text-secondary hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCallFlow}
                disabled={!flowForm.name}
                className="px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid/90 disabled:opacity-50 transition-colors"
              >
                {editingFlow ? 'Save Changes' : 'Create Flow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Tab */}
      {subTab === "recording" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-semibold text-primary">Call Recording</h3>
            <p className="text-xs text-tertiary mt-0.5">Configure automatic call recording settings</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-secondary">
              <div>
                <p className="text-sm font-medium text-primary">Enable Call Recording</p>
                <p className="text-xs text-tertiary mt-0.5">Automatically record all inbound and outbound calls</p>
              </div>
              <button onClick={() => setRecordingEnabled(!recordingEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${recordingEnabled ? "bg-brand-solid" : "bg-secondary"}`}>
                <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${recordingEnabled ? "left-6" : "left-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-secondary">
              <div>
                <p className="text-sm font-medium text-primary">Recording Retention</p>
                <p className="text-xs text-tertiary mt-0.5">How long to keep call recordings</p>
              </div>
              <select className="rounded-lg border border-secondary bg-primary px-3 py-1.5 text-sm text-primary">
                <option>30 days</option>
                <option>90 days</option>
                <option>1 year</option>
                <option>Forever</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Transcription Tab */}
      {subTab === "transcription" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-semibold text-primary">Transcription & AI</h3>
            <p className="text-xs text-tertiary mt-0.5">Configure automatic transcription and AI features</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-secondary">
              <div>
                <p className="text-sm font-medium text-primary">Auto Transcription</p>
                <p className="text-xs text-tertiary mt-0.5">Automatically transcribe recorded calls</p>
              </div>
              <button onClick={() => setTranscriptionEnabled(!transcriptionEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${transcriptionEnabled ? "bg-brand-solid" : "bg-secondary"}`}>
                <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${transcriptionEnabled ? "left-6" : "left-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-secondary">
              <div>
                <p className="text-sm font-medium text-primary">AI Call Summary</p>
                <p className="text-xs text-tertiary mt-0.5">Generate AI summaries of call content</p>
              </div>
              <button onClick={() => setAiSummaryEnabled(!aiSummaryEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${aiSummaryEnabled ? "bg-brand-solid" : "bg-secondary"}`}>
                <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${aiSummaryEnabled ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Tab */}
      {subTab === "access" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-primary">User Access</h3>
            <p className="text-xs text-tertiary mt-0.5">Manage which users can access the softphone</p>
          </div>
          <div className="rounded-xl border border-secondary overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tertiary border-b border-secondary">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">Extension</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-quaternary">Softphone Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {MOCK_USERS_PHONE.map(user => (
                  <tr key={user.id} className="hover:bg-secondary_alt transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary">{user.name}</p>
                      <p className="text-xs text-tertiary">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-secondary">{user.extension}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.softphoneEnabled ? "bg-success-secondary text-success-primary" : "bg-secondary text-quaternary"}`}>
                        {user.softphoneEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {subTab === "usage" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-primary">Usage & Billing</h3>
            <p className="text-xs text-tertiary mt-0.5">Current billing period: 1 Mar – 31 Mar 2026</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-secondary">
              <p className="text-xs text-tertiary">Total Minutes</p>
              <p className="text-2xl font-semibold text-primary mt-1">2,847</p>
              <p className="text-xs text-success-primary mt-1">↓ 12% from last month</p>
            </div>
            <div className="p-4 rounded-xl border border-secondary">
              <p className="text-xs text-tertiary">Total Calls</p>
              <p className="text-2xl font-semibold text-primary mt-1">412</p>
              <p className="text-xs text-tertiary mt-1">This billing period</p>
            </div>
            <div className="p-4 rounded-xl border border-secondary">
              <p className="text-xs text-tertiary">Recordings</p>
              <p className="text-2xl font-semibold text-primary mt-1">389</p>
              <p className="text-xs text-tertiary mt-1">94% of calls</p>
            </div>
            <div className="p-4 rounded-xl border border-secondary">
              <p className="text-xs text-tertiary">Estimated Cost</p>
              <p className="text-2xl font-semibold text-primary mt-1">$142</p>
              <p className="text-xs text-tertiary mt-1">Based on usage</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Settings page ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
// ─── Mock users data for Users section ──────────────────────────────────────
const MOCK_USERS_ADMIN = [
  { id: 1, name: "Adam Cowburn", email: "adam.cowburn@slife.com.au", position: "Life Insurance Specialist", group: "Kadota Assurance Pty Ltd", roles: ["Commissions user", "Consultant", "Admin"], extension: "279", tags: "nexa", leads: 15, status: "active" },
  { id: 2, name: "Adam Spilsted", email: "adam.spilsted@slife.com.au", position: "Life Insurance Specialist", group: "URinsured Pty Ltd", roles: ["Commissions user", "Consultant", "Admin"], extension: "600", tags: "nexa", leads: 115, status: "active" },
  { id: 3, name: "Adrian Ranieri", email: "adrian.ranieri@slife.com.au", position: "Life Risk Specialist", group: "InsureYou Advisory Pty Ltd", roles: ["Consultant", "Admin"], extension: "307", tags: "SLS", leads: 4, status: "active" },
  { id: 4, name: "Adviser TBC", email: "adviser.tbc@slife.com.au", position: "", group: "", roles: ["Consultant", "Admin"], extension: "", tags: "", leads: 2, status: "active" },
  { id: 5, name: "Aldrine Regido", email: "aldrine.regido@slife.com.au", position: "Admin - Data Processing", group: "2020 Insurance Advisers, Averse To Risk", roles: ["Payments", "Services"], extension: "", tags: "Data Processing", leads: 0, status: "active" },
  { id: 6, name: "Ali Jama", email: "ali.jama@slife.com.au", position: "Life Insurance Specialist", group: "PWP Services", roles: ["Commissions user", "Consultant", "Admin"], extension: "234", tags: "SLS", leads: 109, status: "active" },
  { id: 7, name: "Ami Heyman", email: "ami.heyman@slife.com.au", position: "Life Insurance Specialist", group: "Personal Insurance Options", roles: ["Commissions user", "Consultant", "Admin"], extension: "220", tags: "SLS", leads: 706, status: "active" },
  { id: 8, name: "Andrej Kudriavcev", email: "andrej.kudriavcev@slife.com.au", position: "IT Support", group: "", roles: ["System Admin"], extension: "", tags: "", leads: 14, status: "active" },
  { id: 9, name: "Annie Erasmo", email: "annie.erasmo@slife.com.au", position: "Compliance Officer", group: "", roles: ["Audits"], extension: "", tags: "Compliance Team", leads: 0, status: "active" },
  { id: 10, name: "Ben Tutton", email: "ben.tutton@slife.com.au", position: "Life Insurance Specialist", group: "Vital Life Insurance", roles: ["Commissions user", "Consultant", "Admin"], extension: "213", tags: "SLS", leads: 364, status: "active" },
  { id: 11, name: "Biren Amin", email: "biren.amin@slife.com.au", position: "Life Insurance Specialist", group: "Ensurlife Pty Ltd", roles: ["Consultant", "Admin"], extension: "", tags: "nexa", leads: 1, status: "active" },
  { id: 12, name: "Brent Fraser", email: "brent.fraser@slife.com.au", position: "Life Insurance Specialist", group: "SafeNet Solutions", roles: ["Commissions user", "Consultant", "Admin"], extension: "221", tags: "SLS", leads: 475, status: "active" },
];

// ─── Users Section Component ─────────────────────────────────────────────────
function UsersSection() {
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  const filteredUsers = MOCK_USERS_ADMIN.filter((u) => {
    if (tab === "active" && u.status !== "active") return false;
    if (tab === "inactive" && u.status !== "inactive") return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: number) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Active Users</h2>
          <p className="text-sm text-tertiary mt-0.5">Manage user accounts, roles, and permissions</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}>
          <Plus className="size-4" />
          Create User
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-6 border-b border-secondary">
        <button
          onClick={() => setTab("active")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "active" ? "border-brand-solid text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary"
          }`}
        >
          Active Users
        </button>
        <button
          onClick={() => setTab("inactive")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "inactive" ? "border-brand-solid text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary"
          }`}
        >
          Inactive Users
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-quaternary" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-secondary bg-primary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">User Role</option>
          <option value="admin">Admin</option>
          <option value="consultant">Consultant</option>
          <option value="commissions">Commissions user</option>
        </select>
        <select
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value)}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">User Group</option>
          <option value="kadota">Kadota Assurance</option>
          <option value="pwp">PWP Services</option>
          <option value="vital">Vital Life Insurance</option>
        </select>
        <input
          type="text"
          placeholder="Search Tags..."
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm outline-none focus:border-brand transition-colors"
        />
      </div>

      {/* Action toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary transition-colors">
          <Plus className="size-4" /> Create User
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary transition-colors">
          <Users01 className="size-4" /> Assign to Group
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary transition-colors">
          <X className="size-4" /> Remove from Group
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary transition-colors">
          <Shield01 className="size-4" /> Assign to Role
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary transition-colors">
          <X className="size-4" /> Remove from Role
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary transition-colors">
          <Plus className="size-4" /> Add tags...
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary transition-colors">
          <X className="size-4" /> Remove tags...
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary transition-colors">
          <AlertCircle className="size-4" /> Disable Users
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary" style={{ background: "#3B485B" }}>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleAll}
                    className="rounded border-white/30"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white whitespace-nowrap">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white whitespace-nowrap">Position</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white whitespace-nowrap">Groups</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white whitespace-nowrap">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white whitespace-nowrap">Extension</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white whitespace-nowrap">Tags</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white whitespace-nowrap">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-secondary_alt transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="rounded border-secondary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-brand-secondary hover:underline cursor-pointer">{user.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary">{user.position || "—"}</td>
                  <td className="px-4 py-3">
                    {user.group ? (
                      <span className="text-sm text-brand-secondary hover:underline cursor-pointer">🔒 {user.group}</span>
                    ) : (
                      <span className="text-sm text-quaternary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary">{user.roles.join(", ")}</td>
                  <td className="px-4 py-3 text-sm text-secondary">{user.extension || "—"}</td>
                  <td className="px-4 py-3">
                    {user.tags ? (
                      <span className="text-sm text-brand-secondary hover:underline cursor-pointer">{user.tags}</span>
                    ) : (
                      <span className="text-sm text-quaternary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-brand-secondary hover:underline cursor-pointer">{user.leads}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Generic placeholder for sections not yet built ─────────────────────────
function SettingsPlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Settings01 className="size-8 text-quaternary" />
      </div>
      <h2 className="text-lg font-semibold text-primary mb-1">{title}</h2>
      <p className="text-sm text-tertiary text-center max-w-sm">{description || `Configure ${title.toLowerCase()} settings`}</p>
    </div>
  );
}

// ─── Settings page with grouped horizontal tabs ─────────────────────────────
export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const groupParam = searchParams.get("tab") || "task-builder";
  const subTabParam = searchParams.get("sub");
  
  // Find current group
  const currentGroup = settingsGroups.find(g => g.id === groupParam) || settingsGroups[0];
  
  // Active sub-tab within group (defaults to first tab in group)
  const [activeSubTab, setActiveSubTab] = useState(subTabParam || currentGroup.tabs[0]?.id || "");
  
  // Update sub-tab when group changes
  useEffect(() => {
    const group = settingsGroups.find(g => g.id === groupParam);
    if (group && !group.tabs.find(t => t.id === activeSubTab)) {
      setActiveSubTab(group.tabs[0]?.id || "");
    }
  }, [groupParam, activeSubTab]);

  const handleGroupChange = (groupId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", groupId);
    newParams.delete("sub");
    setSearchParams(newParams);
    const group = settingsGroups.find(g => g.id === groupId);
    if (group) {
      setActiveSubTab(group.tabs[0]?.id || "");
    }
  };

  const handleSubTabChange = (tabId: string) => {
    setActiveSubTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sub", tabId);
    setSearchParams(newParams);
  };

  // Render content based on active group and sub-tab
  function renderContent() {
    // Task Builder group - use existing TaskBuilder component
    if (currentGroup.id === "task-builder") {
      return <TaskBuilder />;
    }
    
    // Users & Access group
    if (currentGroup.id === "users") {
      switch (activeSubTab) {
        case "users": return <UsersSection />;
        case "groups": return <SettingsPlaceholder title="Groups" description="Manage user groups and their permissions" />;
        case "teams": return <SettingsPlaceholder title="Teams" description="Configure teams and team assignments" />;
        case "roles": return <SettingsPlaceholder title="Roles" description="Define roles and their associated permissions" />;
        default: return <UsersSection />;
      }
    }
    
    // Security group
    if (currentGroup.id === "security") {
      switch (activeSubTab) {
        case "active-sessions": return <SettingsPlaceholder title="Active Sessions" description="View and manage currently active user sessions" />;
        case "session-history": return <SettingsPlaceholder title="Session History" description="Review historical session data and login activity" />;
        case "login-attempts": return <SettingsPlaceholder title="Login Attempts" description="Monitor login attempts and security events" />;
        default: return <SettingsPlaceholder title="Security" />;
      }
    }
    
    // Templates group
    if (currentGroup.id === "templates") {
      switch (activeSubTab) {
        case "task-templates": return <SettingsPlaceholder title="Task Templates" description="Create and manage reusable task templates" />;
        case "file-library": return <SettingsPlaceholder title="File Library" description="Organize and manage shared files" />;
        case "sms-templates": return <SettingsPlaceholder title="SMS Templates" description="Configure SMS message templates" />;
        case "email-templates": return <SettingsPlaceholder title="Email Templates" description="Design and manage email templates" />;
        case "docx-templates": return <SettingsPlaceholder title="DOCx Templates" description="Manage Word document templates" />;
        default: return <SettingsPlaceholder title="Templates" />;
      }
    }
    
    // Forms & Data group
    if (currentGroup.id === "forms") {
      switch (activeSubTab) {
        case "form-field-types": return <SettingsPlaceholder title="Form Field Types" description="Configure custom form field types" />;
        case "lead-forms": return <SettingsPlaceholder title="Lead Forms" description="Design and manage lead capture forms" />;
        case "form-field-aliases": return <SettingsPlaceholder title="Form Field Aliases" description="Set up field aliases for form integration" />;
        case "tags": return <SettingsPlaceholder title="Tags" description="Manage tags for organizing records" />;
        default: return <SettingsPlaceholder title="Forms & Data" />;
      }
    }
    
    // Business Config group
    if (currentGroup.id === "business") {
      switch (activeSubTab) {
        case "budget-calculators": return <SettingsPlaceholder title="Budget Calculators" description="Configure budget calculation tools" />;
        case "close-reasons": return <SettingsPlaceholder title="Close Reasons" description="Define reasons for closing leads or applications" />;
        case "marketing-lists": return <SettingsPlaceholder title="Marketing Lists" description="Manage marketing distribution lists" />;
        case "scheduled-tasks": return <SettingsPlaceholder title="Scheduled Tasks" description="Configure automated task schedules" />;
        case "leaves": return <SettingsPlaceholder title="Leaves" description="Manage leave requests and approvals" />;
        case "adviser-codes": return <SettingsPlaceholder title="Adviser Codes" description="Configure adviser identification codes" />;
        case "insurance-type-mappings": return <SettingsPlaceholder title="Insurance Type Mappings" description="Map insurance types to products" />;
        default: return <SettingsPlaceholder title="Business Config" />;
      }
    }
    
    // Integrations group
    if (currentGroup.id === "integrations") {
      switch (activeSubTab) {
        case "phone": return <PhoneSettings />;
        case "email-import": return <SettingsPlaceholder title="Email Import" description="Configure email import settings" />;
        case "email-groups": return <SettingsPlaceholder title="Email Groups" description="Manage email distribution groups" />;
        case "webhooks": return <SettingsPlaceholder title="Webhooks" description="Set up webhook integrations" />;
        case "affiliates": return <SettingsPlaceholder title="Affiliates" description="Manage affiliate partnerships" />;
        case "apis": return <SettingsPlaceholder title="APIs" description="Configure API access and keys" />;
        case "neos-advisers": return <SettingsPlaceholder title="NEOS Advisers" description="Manage NEOS adviser integrations" />;
        case "report-permissions": return <SettingsPlaceholder title="Report Permissions" description="Configure report access permissions" />;
        default: return <SettingsPlaceholder title="Integrations" />;
      }
    }
    
    return <SettingsPlaceholder title="Settings" />;
  }

  return (
    <div className="flex flex-col h-full min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      {/* Header with group tabs */}
      <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <h1 className="text-xl font-semibold text-primary mb-4" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Settings</h1>
        
        {/* Primary group tabs */}
        <div className="flex overflow-x-auto gap-0 -mb-px">
          {settingsGroups.map(group => {
            const Icon = group.icon;
            const isActive = currentGroup.id === group.id;
            return (
              <button 
                key={group.id} 
                onClick={() => handleGroupChange(group.id)} 
                className={"flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (isActive ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}
              >
                <Icon className={"size-4 " + (isActive ? "text-brand-secondary" : "text-fg-quaternary")} aria-hidden />
                {group.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Sub-tabs for current group (only show if group has multiple tabs and isn't task-builder) */}
      {currentGroup.id !== "task-builder" && currentGroup.tabs.length > 1 && (
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-6 -mb-px">
            {currentGroup.tabs.map(tab => {
              const isActive = activeSubTab === tab.id;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => handleSubTabChange(tab.id)} 
                  className={"py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (isActive ? "border-brand-solid text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
