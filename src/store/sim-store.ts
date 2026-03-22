// ─────────────────────────────────────────────────────────────────────────────
// Axis Simulation Store — localStorage-backed, zero backend required
// ─────────────────────────────────────────────────────────────────────────────

export type TaskStatus = "open" | "completed" | "attempted" | "not_completed";

export interface SimLead {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  phone: string;
  policyType: string;
  practice: string;
  createdAt: string;
}

export interface SimTask {
  id: string;
  leadId: string;
  templateTaskId: number;   // references the task template id
  name: string;
  assigneeRole: string;
  status: TaskStatus;
  sortOrder: number;
  parentTaskId?: string;    // set if this is a subtask
  subtaskIndex?: number;    // position within the subtask chain
  subtaskTemplates?: string[]; // subtask names from template
  condition?: string;
  completionOptions?: string[];
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

// ─── Seed: Application task chain ────────────────────────────────────────────
export const APPLICATION_CHAIN = [
  { id: 166, name: "Introduction Call",                         assigneeRole: "Consultant", sortOrder: 0,  subtasks: ["Follow-up call", "Send voicemail", "Email intro"] },
  { id: 207, name: "Initial Life Discussion",                   assigneeRole: "Consultant", sortOrder: 1,  subtasks: ["Reschedule call", "Send discussion summary"] },
  { id: 147, name: "Life Insurance Discussion",                 assigneeRole: "Consultant", sortOrder: 2,  subtasks: [] },
  { id: 102, name: "Quote Review",                              assigneeRole: "Consultant", sortOrder: 3,  subtasks: ["Re-run quote", "Send quote by email"] },
  { id: 150, name: "Life Insurance Follow-up",                  assigneeRole: "Consultant", sortOrder: 4,  subtasks: ["Second follow-up call", "Send reminder email"] },
  { id: 172, name: "Book Insurance Review",                     assigneeRole: "Consultant", sortOrder: 5,  subtasks: [] },
  { id: 134, name: "Add Policy / Application Number",           assigneeRole: "Admin",      sortOrder: 6,  subtasks: [] },
  { id: 117, name: "Send application submitted email to client",assigneeRole: "Consultant", sortOrder: 7,  subtasks: [] },
  { id: 159, name: "Upload face to face documents",             assigneeRole: "Consultant", sortOrder: 8,  subtasks: [], condition: "meeting_type = face_to_face" },
  { id: 99,  name: "Compliance Audit",                          assigneeRole: "Services",   sortOrder: 9,  subtasks: [], completionOptions: ["Pass", "On Hold", "Remediation Required"] },
  { id: 135, name: "Compliance Billing",                        assigneeRole: "Services",   sortOrder: 10, subtasks: [] },
  { id: 154, name: "Audit Finalisation",                        assigneeRole: "Services",   sortOrder: 11, subtasks: [] },
  { id: 133, name: "Input life insurance amounts & premiums",   assigneeRole: "Admin",      sortOrder: 12, subtasks: [] },
  { id: 180, name: "Inforce call & email",                      assigneeRole: "Consultant", sortOrder: 13, subtasks: [] },
];

// ─── Seed: Fake leads ─────────────────────────────────────────────────────────
const SEED_LEADS: Omit<SimLead, "id" | "createdAt">[] = [
  { firstName: "Sarah",  lastName: "Mitchell",  dob: "1985-03-14", email: "sarah.mitchell@email.com",  phone: "0412 345 678", policyType: "Life + TPD", practice: "LIP" },
  { firstName: "James",  lastName: "Thornton",  dob: "1979-07-22", email: "james.thornton@email.com",  phone: "0423 456 789", policyType: "Life + Income Protection", practice: "Surehaven" },
  { firstName: "Emma",   lastName: "Davidson",  dob: "1991-11-05", email: "emma.davidson@email.com",   phone: "0434 567 890", policyType: "Life + Trauma", practice: "LIP" },
  { firstName: "Oliver", lastName: "Bancroft",  dob: "1988-09-30", email: "oliver.bancroft@email.com", phone: "0445 678 901", policyType: "Life only", practice: "Tony Insurance" },
  { firstName: "Chloe",  lastName: "Harrington",dob: "1995-01-18", email: "chloe.harrington@email.com",phone: "0456 789 012", policyType: "Life + TPD + Income Protection", practice: "Living Rich" },
];

const KEYS = {
  leads: "axis_sim_leads",
  tasks: "axis_sim_tasks",
  seeded: "axis_sim_seeded",
};

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Init: seed fake leads once ───────────────────────────────────────────────
export function initSimStore() {
  if (localStorage.getItem(KEYS.seeded)) return;
  const leads: SimLead[] = SEED_LEADS.map((l, i) => ({
    ...l,
    id: "seed-lead-" + i,
    createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  }));
  write(KEYS.leads, leads);
  localStorage.setItem(KEYS.seeded, "1");
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export function getLeads(): SimLead[] { return read<SimLead>(KEYS.leads); }

export function addLead(lead: Omit<SimLead, "id" | "createdAt">): SimLead {
  const leads = getLeads();
  const newLead: SimLead = { ...lead, id: "lead-" + Date.now(), createdAt: new Date().toISOString() };
  write(KEYS.leads, [...leads, newLead]);
  return newLead;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export function getTasks(): SimTask[] { return read<SimTask>(KEYS.tasks); }
export function getOpenTasks(): SimTask[] { return getTasks().filter(t => t.status === "open"); }
export function getLeadTasks(leadId: string): SimTask[] { return getTasks().filter(t => t.leadId === leadId); }

export function fireFirstTask(lead: SimLead): SimTask {
  const template = APPLICATION_CHAIN[0];
  const task: SimTask = {
    id: "task-" + Date.now(),
    leadId: lead.id,
    templateTaskId: template.id,
    name: template.name,
    assigneeRole: template.assigneeRole,
    status: "open",
    sortOrder: 0,
    subtaskTemplates: template.subtasks,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.tasks, [...getTasks(), task]);
  return task;
}

// Complete a task → fire next in chain (or next subtask if parent has more)
export function completeTask(taskId: string, notes?: string): SimTask | null {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  // Mark complete
  const updated = tasks.map(t => t.id === taskId ? { ...t, status: "completed" as TaskStatus, completedAt: new Date().toISOString(), notes } : t);

  let nextTask: SimTask | null = null;

  if (task.parentTaskId) {
    // This is a subtask — check if there are more subtasks after this one
    const parent = tasks.find(t => t.id === task.parentTaskId);
    const subtasks = parent?.subtaskTemplates ?? [];
    const nextSubtaskName = subtasks[(task.subtaskIndex ?? 0) + 1];

    if (nextSubtaskName) {
      // Fire next subtask
      nextTask = {
        id: "task-" + Date.now(),
        leadId: task.leadId,
        templateTaskId: task.templateTaskId,
        name: nextSubtaskName,
        assigneeRole: task.assigneeRole,
        status: "open",
        sortOrder: task.sortOrder,
        parentTaskId: task.parentTaskId,
        subtaskIndex: (task.subtaskIndex ?? 0) + 1,
        subtaskTemplates: subtasks,
        createdAt: new Date().toISOString(),
      };
    } else {
      // Last subtask completed → advance main chain from parent
      if (parent) {
        nextTask = fireNextChainTask(parent, updated);
      }
    }
  } else {
    // Top-level task — advance to next in chain
    nextTask = fireNextChainTask(task, updated);
  }

  write(KEYS.tasks, nextTask ? [...updated, nextTask] : updated);
  return nextTask;
}

// Attempted → spawn first subtask (or next if already in subtask chain)
export function attemptTask(taskId: string, notes?: string): SimTask | null {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const updated = tasks.map(t => t.id === taskId ? { ...t, status: "attempted" as TaskStatus, notes } : t);

  const subtasks = task.subtaskTemplates ?? [];
  if (subtasks.length === 0) {
    write(KEYS.tasks, updated);
    return null;
  }

  // If this is already a subtask, get next subtask name; else start from index 0
  const nextIdx = task.parentTaskId ? (task.subtaskIndex ?? 0) + 1 : 0;
  const nextName = subtasks[nextIdx];
  if (!nextName) {
    write(KEYS.tasks, updated);
    return null;
  }

  const nextTask: SimTask = {
    id: "task-" + Date.now(),
    leadId: task.leadId,
    templateTaskId: task.templateTaskId,
    name: nextName,
    assigneeRole: task.assigneeRole,
    status: "open",
    sortOrder: task.sortOrder,
    parentTaskId: task.parentTaskId ?? taskId,
    subtaskIndex: nextIdx,
    subtaskTemplates: subtasks,
    createdAt: new Date().toISOString(),
  };

  write(KEYS.tasks, [...updated, nextTask]);
  return nextTask;
}

function fireNextChainTask(task: SimTask, currentTasks: SimTask[]): SimTask | null {
  const nextTemplate = APPLICATION_CHAIN.find(t => t.sortOrder === task.sortOrder + 1);
  if (!nextTemplate) return null;

  // Check if this task already exists and is open (avoid duplicates)
  const exists = currentTasks.find(t => t.leadId === task.leadId && t.templateTaskId === nextTemplate.id && t.status === "open");
  if (exists) return null;

  return {
    id: "task-" + (Date.now() + 1),
    leadId: task.leadId,
    templateTaskId: nextTemplate.id,
    name: nextTemplate.name,
    assigneeRole: nextTemplate.assigneeRole,
    status: "open",
    sortOrder: nextTemplate.sortOrder,
    subtaskTemplates: nextTemplate.subtasks,
    condition: nextTemplate.condition,
    completionOptions: nextTemplate.completionOptions,
    createdAt: new Date().toISOString(),
  };
}

export function resetSim() {
  localStorage.removeItem(KEYS.leads);
  localStorage.removeItem(KEYS.tasks);
  localStorage.removeItem(KEYS.seeded);
  localStorage.removeItem(PANEL_KEY);
}

// ─── Task panel data (persisted per task instance) ────────────────────────────
const PANEL_KEY = "axis_sim_panel_data";

type PanelStore = Record<string, Record<string, string | string[] | boolean | undefined>>;

export function getPanelData(taskId: string) {
  try {
    const store: PanelStore = JSON.parse(localStorage.getItem(PANEL_KEY) ?? "{}");
    return store[taskId] ?? {};
  } catch { return {}; }
}

export function savePanelData(taskId: string, data: Record<string, string | string[] | boolean | undefined>) {
  try {
    const store: PanelStore = JSON.parse(localStorage.getItem(PANEL_KEY) ?? "{}");
    store[taskId] = data;
    localStorage.setItem(PANEL_KEY, JSON.stringify(store));
  } catch {}
}


