import { useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { 
  X, SearchMd, Download01, Settings04, ChevronRight, 
  Mail01, Phone01, File01, Eye, Edit02, DotsGrid, InfoCircle, 
  RefreshCw01
} from "@untitledui/icons";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { createPortal } from "react-dom";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PolicyBenefit {
  id: number;
  adviser: string;
  provider: string;
  policyNumber: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  dob: string;
  age: number;
  benefitType: string;
  ownership: "Super" | "Ordinary";
  sumInsured: number;
  info: string;
  cpi: boolean;
  exclusions: boolean;
  loading: number | null;
  payMethod: string;
  premium: number;
  frequency: string;
  structure: string;
  startDate: string;
  updated: string;
  status: "Active" | "Inactive";
  lapseDate: string | null;
  outstandingAmount: number | null;
  emailStatus: string | null;
  state: string;
  code: string;
  childName?: string;
  childAge?: number;
}

interface ColDef { 
  key: string; 
  label: string; 
  defaultVisible: boolean; 
  minWidth?: number; 
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "active", label: "Active Benefits" },
  { id: "inactive", label: "Inactive Benefits" },
  { id: "policies", label: "Policies" },
  { id: "overdue", label: "Overdue" },
  { id: "state", label: "State Report" },
  { id: "age", label: "Age Group Report" },
  { id: "quotes", label: "Quotes" },
  { id: "email", label: "Email Settings" },
];

const BENEFIT_TYPES = [
  "Life Insurance", "TPD", "Trauma", "Child Trauma", "Income Protection",
  "Accidental Life", "Accidental TPD", "Accidental IP", "Business Expense", "Ancillary"
];

const PROVIDERS = ["Zurich", "TAL", "MetLife", "AIA", "OnePath", "NEOS", "MLC", "Asteron", "ClearView", "BT"];
const ADVISERS = ["Toni Smilevski", "Sonny Lowe", "Caitlin Gardiner", "Neil Ritter", "Stephen Hartley", "Nicky Godfrey"];
const PAY_METHODS = ["Direct Debit", "Credit Card", "Rollover", "Manual Payment", "Billing Notice"];
const FREQUENCIES = ["Annual", "Monthly", "Quarterly", "Half-yearly"];
const STRUCTURES = ["Stepped", "Level", "Blended", "Level to Age 65", "Level to Age 70"];
const STATES = ["ACT", "NSW", "VIC", "QLD", "TAS", "WA", "SA", "NT"];
const CODES = ["STD", "PRM", "GRP", "IND", "FAM"];

const CHART_COLORS = ["#D34108", "#3B485B", "#F97316", "#6B7280", "#EA580C", "#9CA3AF", "#FB923C", "#4B5563", "#FDBA74", "#374151"];

const BENEFITS_COLS: ColDef[] = [
  { key: "info", label: "ⓘ", defaultVisible: true, minWidth: 40 },
  { key: "adviser", label: "ADVISER", defaultVisible: true },
  { key: "provider", label: "PROVIDER", defaultVisible: true },
  { key: "policy", label: "POLICY", defaultVisible: true },
  { key: "client", label: "CLIENT", defaultVisible: true, minWidth: 180 },
  { key: "dob", label: "DOB", defaultVisible: true },
  { key: "benefit", label: "BENEFIT", defaultVisible: true },
  { key: "ownership", label: "OWNERSHIP", defaultVisible: true },
  { key: "sumInsured", label: "SUM INSURED", defaultVisible: true },
  { key: "infoText", label: "INFO", defaultVisible: false },
  { key: "cpi", label: "CPI", defaultVisible: true },
  { key: "excl", label: "EXCL", defaultVisible: true },
  { key: "load", label: "LOAD", defaultVisible: false },
  { key: "payMethod", label: "PAY METHOD", defaultVisible: true },
  { key: "premium", label: "PREMIUM", defaultVisible: true },
  { key: "freq", label: "FREQ", defaultVisible: true },
  { key: "stpLvl", label: "STP/LVL", defaultVisible: false },
  { key: "start", label: "START", defaultVisible: true },
  { key: "updated", label: "UPDATED", defaultVisible: false },
  { key: "actions", label: "⚙", defaultVisible: true, minWidth: 40 },
];

const POLICIES_COLS: ColDef[] = [
  { key: "adviser", label: "ADVISER", defaultVisible: true },
  { key: "client", label: "CLIENT NAME", defaultVisible: true, minWidth: 180 },
  { key: "email", label: "EMAIL", defaultVisible: true },
  { key: "provider", label: "PROVIDER", defaultVisible: true },
  { key: "policy", label: "POLICY", defaultVisible: true },
  { key: "commenced", label: "COMMENCED", defaultVisible: true },
  { key: "ownership", label: "OWNERSHIP", defaultVisible: true },
  { key: "daysUntil", label: "DAYS UNTIL ANNIV", defaultVisible: true },
  { key: "premiumAnnual", label: "PREMIUM (ANNUAL)", defaultVisible: true },
  { key: "premium", label: "PREMIUM", defaultVisible: true },
  { key: "payMethod", label: "PAY METHOD", defaultVisible: true },
  { key: "freq", label: "FREQUENCY", defaultVisible: true },
  { key: "actions", label: "⚙", defaultVisible: true, minWidth: 40 },
];

const OVERDUE_COLS: ColDef[] = [
  { key: "adviser", label: "ADVISER", defaultVisible: true },
  { key: "client", label: "CLIENT NAME", defaultVisible: true, minWidth: 180 },
  { key: "email", label: "EMAIL", defaultVisible: true },
  { key: "provider", label: "PROVIDER", defaultVisible: true },
  { key: "policy", label: "POLICY NUMBER", defaultVisible: true },
  { key: "ownership", label: "OWNERSHIP", defaultVisible: true },
  { key: "outstanding", label: "OUTSTANDING", defaultVisible: true },
  { key: "payMethod", label: "PAY METHOD", defaultVisible: true },
  { key: "lapseDate", label: "LAPSE DATE", defaultVisible: true },
  { key: "updated", label: "UPDATED", defaultVisible: true },
  { key: "emailStatus", label: "EMAIL STATUS", defaultVisible: true },
  { key: "actions", label: "⚙", defaultVisible: true, minWidth: 40 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function randomPick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function generateAge(): number { return Math.floor(Math.random() * 60) + 18; }
function generateDOB(age: number): string {
  const year = new Date().getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

const CLIENTS = [
  { id: 1, name: "Mikey Lawrence", email: "heymikey@gmail.com" },
  { id: 2, name: "Ashwin Santiago", email: "ashwin@asantiago.com" },
  { id: 3, name: "Lister Dyer", email: "lister.dyer@email.com" },
  { id: 4, name: "Alastair Walker", email: "a.walker@company.au" },
  { id: 5, name: "Thierry Wetzel", email: "thierry.w@mail.com" },
  { id: 6, name: "David Adams", email: "david.adams@gmail.com" },
  { id: 7, name: "Neil Hartley", email: "neil.hartley@outlook.com" },
  { id: 8, name: "Paula Reeves", email: "p.reeves@business.com.au" },
  { id: 9, name: "Ricardo Curioso", email: "ricardo@curioso.net" },
  { id: 10, name: "Tracey Hester", email: "tracey.hester@work.com" },
  { id: 11, name: "Sarah Mitchell", email: "sarah.m@email.com" },
  { id: 12, name: "James Cooper", email: "j.cooper@business.au" },
  { id: 13, name: "Emma Wilson", email: "emma.wilson@mail.com" },
  { id: 14, name: "Michael Brown", email: "m.brown@company.com" },
  { id: 15, name: "Jessica Taylor", email: "jessica.t@gmail.com" },
];

const MOCK_POLICIES: PolicyBenefit[] = Array.from({ length: 682 }, (_, i) => {
  const client = randomPick(CLIENTS);
  const age = generateAge();
  const isChild = Math.random() < 0.05;
  const isInactive = Math.random() < 0.12;
  const isOverdue = isInactive && Math.random() < 0.4;
  
  return {
    id: 1000 + i,
    adviser: randomPick(ADVISERS),
    provider: randomPick(PROVIDERS),
    policyNumber: `POL-${String(3100000 + Math.floor(Math.random() * 200000))}`,
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    dob: generateDOB(age),
    age,
    benefitType: isChild ? "Child Trauma" : randomPick(BENEFIT_TYPES),
    ownership: Math.random() > 0.3 ? "Super" : "Ordinary",
    sumInsured: Math.floor(Math.random() * 2000000) + 100000,
    info: Math.random() > 0.7 ? "Indemnity 30 Days To Age 65 Clm Exc: Yes" : "",
    cpi: Math.random() > 0.4,
    exclusions: Math.random() > 0.8,
    loading: Math.random() > 0.85 ? Math.floor(Math.random() * 50) + 10 : null,
    payMethod: randomPick(PAY_METHODS),
    premium: Math.floor(Math.random() * 500) + 50,
    frequency: randomPick(FREQUENCIES),
    structure: randomPick(STRUCTURES),
    startDate: randomDate(2015, 2024),
    updated: randomDate(2024, 2025),
    status: isInactive ? "Inactive" : "Active",
    lapseDate: isInactive ? randomDate(2024, 2025) : null,
    outstandingAmount: isOverdue ? Math.floor(Math.random() * 5000) + 500 : null,
    emailStatus: isOverdue ? (Math.random() > 0.5 ? "All emails sent" : "Pending") : null,
    state: randomPick(STATES),
    code: randomPick(CODES),
    childName: isChild ? `${["Austin", "Emily", "Jack", "Sophie"][Math.floor(Math.random() * 4)]} ${client.name.split(" ")[1]}` : undefined,
    childAge: isChild ? Math.floor(Math.random() * 15) + 1 : undefined,
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ColumnPanel({ defs, order, visible, onToggle, onReorder, onClose }: {
  defs: ColDef[]; order: string[]; visible: Record<string, boolean>;
  onToggle: (k: string) => void; onReorder: (o: string[]) => void; onClose: () => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  
  function handleDragStart(i: number) { dragIdx.current = i; }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOver(i);
  }
  function handleDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const newOrder = [...order];
    const [removed] = newOrder.splice(dragIdx.current, 1);
    newOrder.splice(i, 0, removed);
    onReorder(newOrder);
    dragIdx.current = null;
    setDragOver(null);
  }
  
  return (
    <div className="absolute right-0 top-10 z-50 w-60 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-secondary">
        <p className="text-xs font-semibold text-primary">Columns</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onReorder(defs.map((d: ColDef) => d.key))} className="text-[10px] text-brand-secondary hover:underline">Reset</button>
          <button onClick={onClose} className="text-quaternary hover:text-secondary"><X className="size-3.5" /></button>
        </div>
      </div>
      <ul className="max-h-64 overflow-y-auto divide-y divide-secondary text-xs">
        {order.map((key, i) => {
          const col = defs.find((d: ColDef) => d.key === key);
          if (!col) return null;
          return (
            <li key={key} draggable onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)} onDrop={() => handleDrop(i)}
              className={"flex items-center gap-2 px-3 py-2 hover:bg-secondary_alt cursor-grab " + (dragOver === i ? "bg-brand-secondary" : "")}>
              <DotsGrid className="size-3.5 text-quaternary shrink-0" />
              <input type="checkbox" checked={visible[key]} onChange={() => onToggle(key)} className="rounded border-secondary accent-[#D34108] size-3.5 shrink-0" />
              <span className="flex-1 truncate text-secondary">{col.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActionMenu({ onClose }: { onClose: () => void }) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-6 z-50 w-44 rounded-xl border border-secondary bg-white shadow-xl overflow-hidden py-1">
        {[
          { label: "View Details", icon: Eye },
          { label: "Edit", icon: Edit02 },
          { label: "Email Client", icon: Mail01 },
          { label: "Call Client", icon: Phone01 },
          { label: "Generate PDF", icon: File01 },
        ].map(item => (
          <button key={item.label} onClick={onClose} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-primary hover:bg-secondary_alt">
            <item.icon className="size-3.5 text-quaternary" />{item.label}
          </button>
        ))}
      </div>
    </>,
    document.body
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardTab({ data }: { data: PolicyBenefit[] }) {
  const activeData = data.filter(p => p.status === "Active");
  
  // Provider premiums
  const providerPremiums = useMemo(() => {
    const map: Record<string, number> = {};
    activeData.forEach(p => {
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      map[p.provider] = (map[p.provider] || 0) + annualPremium;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [activeData]);
  
  // Benefit premiums
  const benefitPremiums = useMemo(() => {
    const map: Record<string, number> = {};
    activeData.forEach(p => {
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      map[p.benefitType] = (map[p.benefitType] || 0) + annualPremium;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [activeData]);
  
  // Adviser stats
  const adviserStats = useMemo(() => {
    const map: Record<string, { clients: Set<number>, covers: number, premium: number }> = {};
    activeData.forEach(p => {
      if (!map[p.adviser]) map[p.adviser] = { clients: new Set(), covers: 0, premium: 0 };
      map[p.adviser].clients.add(p.clientId);
      map[p.adviser].covers++;
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      map[p.adviser].premium += annualPremium;
    });
    return Object.entries(map).map(([name, s]) => ({ 
      name, clients: s.clients.size, covers: s.covers, premium: s.premium 
    })).sort((a, b) => b.premium - a.premium);
  }, [activeData]);
  
  // Provider stats
  const providerStats = useMemo(() => {
    const map: Record<string, { clients: Set<number>, covers: number, premium: number }> = {};
    activeData.forEach(p => {
      if (!map[p.provider]) map[p.provider] = { clients: new Set(), covers: 0, premium: 0 };
      map[p.provider].clients.add(p.clientId);
      map[p.provider].covers++;
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      map[p.provider].premium += annualPremium;
    });
    return Object.entries(map).map(([name, s]) => ({ 
      name, clients: s.clients.size, covers: s.covers, premium: s.premium 
    })).sort((a, b) => b.premium - a.premium);
  }, [activeData]);
  
  // Cross-tab matrix: Provider × Benefit
  const premiumMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    activeData.forEach(p => {
      if (!matrix[p.provider]) matrix[p.provider] = {};
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      matrix[p.provider][p.benefitType] = (matrix[p.provider][p.benefitType] || 0) + annualPremium;
    });
    return matrix;
  }, [activeData]);
  
  const totalPremium = adviserStats.reduce((sum, a) => sum + a.premium, 0);
  const totalClients = new Set(activeData.map(p => p.clientId)).size;
  const totalCovers = activeData.length;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-secondary bg-primary p-5">
          <p className="text-xs text-tertiary uppercase tracking-wider">Total Annual Premium</p>
          <p className="text-2xl font-semibold text-primary mt-1">${totalPremium.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-secondary bg-primary p-5">
          <p className="text-xs text-tertiary uppercase tracking-wider">Total Clients</p>
          <p className="text-2xl font-semibold text-primary mt-1">{totalClients}</p>
        </div>
        <div className="rounded-xl border border-secondary bg-primary p-5">
          <p className="text-xs text-tertiary uppercase tracking-wider">Total Covers</p>
          <p className="text-2xl font-semibold text-primary mt-1">{totalCovers}</p>
        </div>
      </div>
      
      {/* Donut Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Premiums Split */}
        <div className="rounded-xl border border-secondary bg-primary p-5">
          <h3 className="text-sm font-semibold text-primary mb-1">Provider Premiums Split</h3>
          <p className="text-xs text-tertiary mb-4">Annual premium by insurer</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={providerPremiums} cx="50%" cy="45%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={2}>
                  {providerPremiums.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Annual Premium"]} 
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" iconSize={8}
                  wrapperStyle={{ paddingTop: 16, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Benefit Premiums Split */}
        <div className="rounded-xl border border-secondary bg-primary p-5">
          <h3 className="text-sm font-semibold text-primary mb-1">Benefit Premiums Split</h3>
          <p className="text-xs text-tertiary mb-4">Annual premium by cover type</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={benefitPremiums} cx="50%" cy="45%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={2}>
                  {benefitPremiums.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Annual Premium"]} 
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" iconSize={8}
                  wrapperStyle={{ paddingTop: 16, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Adviser */}
        <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
          <div className="px-5 py-4 border-b border-secondary">
            <h3 className="text-sm font-semibold text-primary">Policies and Clients by Advisers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-tertiary border-b border-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-quaternary">Adviser Name</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-quaternary">Clients</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-quaternary">Covers</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-quaternary">Annual Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {adviserStats.map(a => (
                  <tr key={a.name} className="hover:bg-secondary_alt">
                    <td className="px-4 py-3 text-primary">{a.name}</td>
                    <td className="px-4 py-3 text-right text-tertiary">{a.clients}</td>
                    <td className="px-4 py-3 text-right text-tertiary">{a.covers}</td>
                    <td className="px-4 py-3 text-right text-primary font-medium">${a.premium.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-tertiary font-semibold">
                  <td className="px-4 py-3 text-brand-secondary">Total</td>
                  <td className="px-4 py-3 text-right text-brand-secondary">{totalClients}</td>
                  <td className="px-4 py-3 text-right text-brand-secondary">{totalCovers}</td>
                  <td className="px-4 py-3 text-right text-brand-secondary">${totalPremium.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* By Provider */}
        <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
          <div className="px-5 py-4 border-b border-secondary">
            <h3 className="text-sm font-semibold text-primary">Policies and Clients by Provider</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-tertiary border-b border-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-quaternary">Provider</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-quaternary">Clients</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-quaternary">Covers</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-quaternary">Annual Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {providerStats.map(p => (
                  <tr key={p.name} className="hover:bg-secondary_alt">
                    <td className="px-4 py-3 text-primary">{p.name}</td>
                    <td className="px-4 py-3 text-right text-tertiary">{p.clients}</td>
                    <td className="px-4 py-3 text-right text-tertiary">{p.covers}</td>
                    <td className="px-4 py-3 text-right text-primary font-medium">${p.premium.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-tertiary font-semibold">
                  <td className="px-4 py-3 text-brand-secondary">Total</td>
                  <td className="px-4 py-3 text-right text-brand-secondary">{totalClients}</td>
                  <td className="px-4 py-3 text-right text-brand-secondary">{totalCovers}</td>
                  <td className="px-4 py-3 text-right text-brand-secondary">${totalPremium.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Premium Matrix */}
      <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
        <div className="px-5 py-4 border-b border-secondary">
          <h3 className="text-sm font-semibold text-primary">Annual Premiums: Benefit Category × Provider</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-tertiary border-b border-secondary">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-quaternary whitespace-nowrap">Provider</th>
                {BENEFIT_TYPES.map(b => (
                  <th key={b} className="px-3 py-3 text-right text-xs font-medium text-quaternary whitespace-nowrap">{b.replace("Insurance", "Ins.").replace("Protection", "Prot.").replace("Accidental", "Acc.")}</th>
                ))}
                <th className="px-3 py-3 text-right text-xs font-medium text-quaternary whitespace-nowrap bg-secondary">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {Object.keys(premiumMatrix).sort().map(provider => {
                const row = premiumMatrix[provider];
                const rowTotal = Object.values(row).reduce((sum, v) => sum + v, 0);
                return (
                  <tr key={provider} className="hover:bg-secondary_alt">
                    <td className="px-3 py-2.5 text-primary whitespace-nowrap">{provider}</td>
                    {BENEFIT_TYPES.map(b => (
                      <td key={b} className="px-3 py-2.5 text-right text-tertiary text-xs">
                        {row[b] ? `$${Math.round(row[b]).toLocaleString()}` : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right text-primary font-medium text-xs bg-secondary/30">${rowTotal.toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr className="bg-tertiary font-semibold">
                <td className="px-3 py-3 text-brand-secondary">Total</td>
                {BENEFIT_TYPES.map(b => {
                  const colTotal = Object.values(premiumMatrix).reduce((sum, row) => sum + (row[b] || 0), 0);
                  return <td key={b} className="px-3 py-3 text-right text-brand-secondary text-xs">${Math.round(colTotal).toLocaleString()}</td>;
                })}
                <td className="px-3 py-3 text-right text-brand-secondary text-xs bg-secondary/30">${totalPremium.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BenefitsTab({ data, status, navigate }: { data: PolicyBenefit[]; status: "Active" | "Inactive"; navigate: (path: string) => void }) {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("All");
  const [benefitFilter, setBenefitFilter] = useState("All");
  const [adviserFilter, setAdviserFilter] = useState("All");
  const [codeFilter, setCodeFilter] = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [actionMenuRow, setActionMenuRow] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState("schedule");
  
  const [colState, setColState] = useState(() => ({
    order: BENEFITS_COLS.map((c: ColDef) => c.key),
    visible: Object.fromEntries(BENEFITS_COLS.map((c: ColDef) => [c.key, c.defaultVisible]))
  }));
  
  const filtered = useMemo(() => {
    return data
      .filter(p => p.status === status)
      .filter(p => providerFilter === "All" || p.provider === providerFilter)
      .filter(p => benefitFilter === "All" || p.benefitType === benefitFilter)
      .filter(p => adviserFilter === "All" || p.adviser === adviserFilter)
      .filter(p => codeFilter === "All" || p.code === codeFilter)
      .filter(p => {
        if (!search) return true;
        const s = search.toLowerCase();
        return p.clientName.toLowerCase().includes(s) || 
               p.policyNumber.toLowerCase().includes(s) ||
               p.adviser.toLowerCase().includes(s) ||
               p.provider.toLowerCase().includes(s);
      });
  }, [data, status, providerFilter, benefitFilter, adviserFilter, codeFilter, search]);
  
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const visibleCols = colState.order.filter((k: string) => colState.visible[k]).map((k: string) => BENEFITS_COLS.find((c: ColDef) => c.key === k)!);
  
  const toggleCol = (k: string) => setColState(s => ({ ...s, visible: { ...s.visible, [k]: !s.visible[k] } }));
  const reorderCols = (o: string[]) => setColState(s => ({ ...s, order: o }));
  
  const generatePDF = () => {
    alert(`Generating ${documentType} PDF for ${filtered.length} records...`);
  };
  
  const openQuoting = () => {
    alert("Opening quoting tool with selected client data...");
  };
  
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          {[10, 15, 25, 50, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
        </select>
        
        <select value={providerFilter} onChange={e => { setProviderFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Providers</option>
          {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        
        <select value={benefitFilter} onChange={e => { setBenefitFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Benefits</option>
          {BENEFIT_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        
        <select value={adviserFilter} onChange={e => { setAdviserFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Advisers</option>
          {ADVISERS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        
        <select value={codeFilter} onChange={e => { setCodeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Codes</option>
          {CODES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-quaternary pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..."
            className="w-full rounded-lg border border-secondary bg-primary pl-9 pr-3 py-2 text-sm text-primary outline-none focus:border-brand-primary" />
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <select value={documentType} onChange={e => setDocumentType(e.target.value)}
            className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
            <option value="schedule">Schedule PDF</option>
            <option value="benefits">Benefits Report</option>
            <option value="summary">Summary Document</option>
          </select>
          
          <button onClick={generatePDF} className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt">
            <File01 className="size-4" />Generate
          </button>
          
          <button onClick={() => alert("Generating client summary...")} className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt">
            Summary
          </button>
          
          <button onClick={openQuoting} className="inline-flex items-center gap-2 rounded-lg bg-brand-solid text-white px-3 py-2 text-sm font-medium hover:bg-brand-solid_hover">
            Quoting
          </button>
          
          <div className="relative">
            <button onClick={() => setColPanelOpen(v => !v)}
              className={"inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " + 
                (colPanelOpen ? "border-brand-primary bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-secondary_alt")}>
              <Settings04 className="size-4" />Columns
            </button>
            {colPanelOpen && <ColumnPanel defs={BENEFITS_COLS} order={colState.order} visible={colState.visible} onToggle={toggleCol} onReorder={reorderCols} onClose={() => setColPanelOpen(false)} />}
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-tertiary border-b border-secondary">
            <tr>
              {visibleCols.map((col: ColDef) => (
                <th key={col.key} className="px-3 py-3 text-left text-xs font-medium text-quaternary whitespace-nowrap" style={{ minWidth: col.minWidth }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary bg-primary">
            {pageRows.length === 0 ? (
              <tr><td colSpan={visibleCols.length} className="px-4 py-16 text-center text-sm text-quaternary">No {status.toLowerCase()} benefits found</td></tr>
            ) : pageRows.map(row => (
              <>
                <tr key={row.id} className="group hover:bg-secondary_alt">
                  {visibleCols.map((col: ColDef) => (
                    <td key={col.key} className="px-3 py-2.5">
                      {col.key === "info" && (
                        <button onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)} className="text-brand-secondary hover:text-brand-primary">
                          <InfoCircle className="size-4" />
                        </button>
                      )}
                      {col.key === "adviser" && <span className="text-xs text-secondary">{row.adviser}</span>}
                      {col.key === "provider" && <span className="text-xs text-secondary">{row.provider}</span>}
                      {col.key === "policy" && (
                        <button onClick={() => navigate(`/policy/${row.id}`)} className="text-xs text-brand-secondary hover:underline">
                          {row.policyNumber}
                        </button>
                      )}
                      {col.key === "client" && (
                        <button onClick={() => navigate(`/client/${row.clientId}`)} className="text-xs text-primary font-medium hover:underline">
                          {row.childName ? `${row.childName} (Child)` : row.clientName}
                        </button>
                      )}
                      {col.key === "dob" && <span className="text-xs text-secondary">{row.dob} ({row.childAge || row.age})</span>}
                      {col.key === "benefit" && (
                        <span className="text-xs text-secondary" title={row.benefitType}>{row.benefitType}</span>
                      )}
                      {col.key === "ownership" && (
                        <span className="text-xs text-secondary" title={row.ownership === "Super" ? "Superannuation funded" : "Personally funded"}>
                          {row.ownership}
                        </span>
                      )}
                      {col.key === "sumInsured" && <span className="text-xs text-primary font-medium">${row.sumInsured.toLocaleString()}</span>}
                      {col.key === "infoText" && <span className="text-xs text-tertiary truncate max-w-[200px] block">{row.info || "—"}</span>}
                      {col.key === "cpi" && <span className="text-xs text-secondary">{row.cpi ? "Yes" : "No"}</span>}
                      {col.key === "excl" && <span className="text-xs text-secondary">{row.exclusions ? "Yes" : "No"}</span>}
                      {col.key === "load" && <span className="text-xs text-secondary">{row.loading ? `${row.loading}%` : "—"}</span>}
                      {col.key === "payMethod" && <span className="text-xs text-secondary">{row.payMethod}</span>}
                      {col.key === "premium" && <span className="text-xs text-primary font-medium">${row.premium.toLocaleString()}</span>}
                      {col.key === "freq" && <span className="text-xs text-secondary">{row.frequency}</span>}
                      {col.key === "stpLvl" && <span className="text-xs text-secondary">{row.structure}</span>}
                      {col.key === "start" && <span className="text-xs text-secondary">{row.startDate}</span>}
                      {col.key === "updated" && <span className="text-xs text-secondary">{row.updated}</span>}
                      {col.key === "actions" && (
                        <div className="relative">
                          <button onClick={() => setActionMenuRow(actionMenuRow === row.id ? null : row.id)} className="text-quaternary hover:text-secondary">
                            <Settings04 className="size-4" />
                          </button>
                          {actionMenuRow === row.id && <ActionMenu onClose={() => setActionMenuRow(null)} />}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                {expandedRow === row.id && (
                  <tr className="bg-secondary_alt">
                    <td colSpan={visibleCols.length} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div><span className="text-quaternary">Structure:</span> <span className="text-primary ml-1">{row.structure}</span></div>
                        <div><span className="text-quaternary">Loading:</span> <span className="text-primary ml-1">{row.loading ? `${row.loading}%` : "None"}</span></div>
                        <div><span className="text-quaternary">State:</span> <span className="text-primary ml-1">{row.state}</span></div>
                        <div><span className="text-quaternary">Code:</span> <span className="text-primary ml-1">{row.code}</span></div>
                        {row.info && <div className="col-span-2 md:col-span-4"><span className="text-quaternary">Info:</span> <span className="text-primary ml-1">{row.info}</span></div>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-tertiary">Total: <span className="font-medium text-primary">{filtered.length}</span></p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary_alt disabled:opacity-40">
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={"size-8 rounded-lg text-sm font-medium " + (p === page ? "bg-brand-solid text-white" : "text-secondary hover:bg-secondary_alt")}>
                {p}
              </button>
            ))}
            {totalPages > 7 && <span className="px-2 text-tertiary">...</span>}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary_alt disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PoliciesTab({ data, navigate }: { data: PolicyBenefit[]; navigate: (path: string) => void }) {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [adviserFilter, setAdviserFilter] = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  
  // Calculate days until anniversary for each policy
  const policiesWithAnniv = useMemo(() => {
    const today = new Date();
    return data.filter(p => p.status === "Active").map(p => {
      const [day, month, year] = p.startDate.split("/").map(Number);
      const annivThisYear = new Date(today.getFullYear(), month - 1, day);
      if (annivThisYear < today) annivThisYear.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.ceil((annivThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const annivMonth = annivThisYear.toLocaleString("en-AU", { month: "long" });
      return { ...p, daysUntil, annivMonth };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [data]);
  
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const filtered = useMemo(() => {
    return policiesWithAnniv
      .filter(p => providerFilter === "All" || p.provider === providerFilter)
      .filter(p => monthFilter === "All" || p.annivMonth === monthFilter)
      .filter(p => adviserFilter === "All" || p.adviser === adviserFilter)
      .filter(p => !search || p.clientName.toLowerCase().includes(search.toLowerCase()) || p.policyNumber.toLowerCase().includes(search.toLowerCase()));
  }, [policiesWithAnniv, providerFilter, monthFilter, adviserFilter, search]);
  
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          {[10, 15, 25, 50, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
        </select>
        
        <select value={providerFilter} onChange={e => { setProviderFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Providers</option>
          {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        
        <select value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Months</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <select value={adviserFilter} onChange={e => { setAdviserFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Advisers</option>
          {ADVISERS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-quaternary pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..."
            className="w-full rounded-lg border border-secondary bg-primary pl-9 pr-3 py-2 text-sm text-primary outline-none focus:border-brand-primary" />
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => alert("Generating PDF...")} className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt">
            <Download01 className="size-4" />Generate
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-tertiary border-b border-secondary">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">ADVISER</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">CLIENT NAME</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">EMAIL</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">PROVIDER</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">POLICY</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">COMMENCED</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">OWNERSHIP</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary">DAYS UNTIL ANNIV</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary">PREMIUM (ANNUAL)</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary">PREMIUM</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">PAY METHOD</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">FREQUENCY</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-quaternary">⚙</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary bg-primary">
            {pageRows.length === 0 ? (
              <tr><td colSpan={13} className="px-4 py-16 text-center text-sm text-quaternary">No policies found</td></tr>
            ) : pageRows.map((row: PolicyBenefit & { daysUntil: number }) => {
              const annualPremium = row.frequency === "Monthly" ? row.premium * 12 : 
                                   row.frequency === "Quarterly" ? row.premium * 4 :
                                   row.frequency === "Half-yearly" ? row.premium * 2 : row.premium;
              return (
                <tr key={row.id} className="hover:bg-secondary_alt">
                  <td className="px-3 py-2.5 text-xs text-secondary">{row.adviser}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => navigate(`/client/${row.clientId}`)} className="text-xs text-primary font-medium hover:underline">
                      {row.clientName}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-tertiary">{row.clientEmail}</td>
                  <td className="px-3 py-2.5 text-xs text-secondary">{row.provider}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => navigate(`/policy/${row.id}`)} className="text-xs text-brand-secondary hover:underline">
                      {row.policyNumber}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-secondary">{row.startDate}</td>
                  <td className="px-3 py-2.5 text-xs text-secondary">{row.ownership}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={"text-xs font-medium " + (row.daysUntil <= 30 ? "text-brand-secondary" : "text-primary")}>
                      {row.daysUntil}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-primary font-medium">${annualPremium.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-secondary">${row.premium.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs text-secondary">{row.payMethod}</td>
                  <td className="px-3 py-2.5 text-xs text-secondary">{row.frequency}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button className="text-quaternary hover:text-secondary"><Settings04 className="size-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-tertiary">Total: <span className="font-medium text-primary">{filtered.length}</span></p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary_alt disabled:opacity-40">
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={"size-8 rounded-lg text-sm font-medium " + (p === page ? "bg-brand-solid text-white" : "text-secondary hover:bg-secondary_alt")}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary_alt disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OverdueTab({ data, navigate }: { data: PolicyBenefit[]; navigate: (path: string) => void }) {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("All");
  const [adviserFilter, setAdviserFilter] = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  
  const overdueData = useMemo(() => {
    return data.filter(p => p.status === "Inactive" && p.outstandingAmount);
  }, [data]);
  
  const filtered = useMemo(() => {
    return overdueData
      .filter(p => providerFilter === "All" || p.provider === providerFilter)
      .filter(p => adviserFilter === "All" || p.adviser === adviserFilter)
      .filter(p => !search || p.clientName.toLowerCase().includes(search.toLowerCase()) || p.policyNumber.toLowerCase().includes(search.toLowerCase()));
  }, [overdueData, providerFilter, adviserFilter, search]);
  
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          {[10, 15, 25, 50, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
        </select>
        
        <select value={providerFilter} onChange={e => { setProviderFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Providers</option>
          {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        
        <select value={adviserFilter} onChange={e => { setAdviserFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
          <option value="All">All Advisers</option>
          {ADVISERS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-quaternary pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..."
            className="w-full rounded-lg border border-secondary bg-primary pl-9 pr-3 py-2 text-sm text-primary outline-none focus:border-brand-primary" />
        </div>
        
        <div className="ml-auto">
          <button onClick={() => alert("Generating PDF...")} className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt">
            <Download01 className="size-4" />Generate
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-tertiary border-b border-secondary">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">ADVISER</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">CLIENT NAME</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">EMAIL</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">PROVIDER</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">POLICY NUMBER</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">OWNERSHIP</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary">OUTSTANDING</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">PAY METHOD</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">LAPSE DATE</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">UPDATED</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">EMAIL STATUS</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-quaternary">⚙</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary bg-primary">
            {pageRows.length === 0 ? (
              <tr><td colSpan={12} className="px-4 py-16 text-center text-sm text-quaternary">No overdue policies found</td></tr>
            ) : pageRows.map(row => (
              <tr key={row.id} className="hover:bg-secondary_alt">
                <td className="px-3 py-2.5 text-xs text-secondary">{row.adviser}</td>
                <td className="px-3 py-2.5">
                  <button onClick={() => navigate(`/client/${row.clientId}`)} className="text-xs text-primary font-medium hover:underline">
                    {row.clientName}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-xs text-tertiary">{row.clientEmail}</td>
                <td className="px-3 py-2.5 text-xs text-secondary">{row.provider}</td>
                <td className="px-3 py-2.5">
                  <button onClick={() => navigate(`/policy/${row.id}`)} className="text-xs text-brand-secondary hover:underline">
                    {row.policyNumber}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-xs text-secondary">{row.ownership}</td>
                <td className="px-3 py-2.5 text-right text-xs text-error-primary font-medium">${row.outstandingAmount?.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-xs text-secondary">{row.payMethod}</td>
                <td className="px-3 py-2.5 text-xs text-secondary">{row.lapseDate}</td>
                <td className="px-3 py-2.5 text-xs text-secondary">{row.updated}</td>
                <td className="px-3 py-2.5">
                  <span className={"text-xs " + (row.emailStatus === "All emails sent" ? "text-success-primary" : "text-warning-primary")}>
                    {row.emailStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button className="text-quaternary hover:text-secondary"><Settings04 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-tertiary">Total: <span className="font-medium text-primary">{filtered.length}</span></p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary_alt disabled:opacity-40">
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={"size-8 rounded-lg text-sm font-medium " + (p === page ? "bg-brand-solid text-white" : "text-secondary hover:bg-secondary_alt")}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary_alt disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StateReportTab({ data, navigate }: { data: PolicyBenefit[]; navigate: (path: string) => void }) {
  const activeData = data.filter(p => p.status === "Active");
  
  const stateStats = useMemo(() => {
    const stats: Record<string, { clients: Set<number>, covers: number, benefits: Record<string, number>, premium: number }> = {};
    
    [...STATES, "Unknown"].forEach(state => {
      stats[state] = { clients: new Set(), covers: 0, benefits: {}, premium: 0 };
      BENEFIT_TYPES.forEach(b => stats[state].benefits[b] = 0);
    });
    
    activeData.forEach(p => {
      const state = STATES.includes(p.state) ? p.state : "Unknown";
      stats[state].clients.add(p.clientId);
      stats[state].covers++;
      stats[state].benefits[p.benefitType] = (stats[state].benefits[p.benefitType] || 0) + 1;
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      stats[state].premium += annualPremium;
    });
    
    return [...STATES, "Unknown"].map(state => ({
      state,
      clients: stats[state].clients.size,
      covers: stats[state].covers,
      benefits: stats[state].benefits,
      premium: stats[state].premium,
    })).filter(s => s.covers > 0);
  }, [activeData]);
  
  const totals = useMemo(() => {
    const t = { clients: new Set<number>(), covers: 0, benefits: {} as Record<string, number>, premium: 0 };
    BENEFIT_TYPES.forEach(b => t.benefits[b] = 0);
    activeData.forEach(p => {
      t.clients.add(p.clientId);
      t.covers++;
      t.benefits[p.benefitType] = (t.benefits[p.benefitType] || 0) + 1;
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      t.premium += annualPremium;
    });
    return { ...t, clientCount: t.clients.size };
  }, [activeData]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">State Report</h2>
        <button onClick={() => alert("Generating PDF...")} className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt">
          <Download01 className="size-4" />Generate
        </button>
      </div>
      
      <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-tertiary border-b border-secondary">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">State</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary">Clients</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary">Covers</th>
              {BENEFIT_TYPES.slice(0, -1).map(b => (
                <th key={b} className="px-3 py-3 text-right text-xs font-medium text-quaternary whitespace-nowrap">
                  {b.replace("Insurance", "").replace("Protection", "Prot.").replace("Accidental", "Acc.").trim()}
                </th>
              ))}
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary bg-secondary">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary bg-primary">
            {stateStats.map(s => (
              <tr key={s.state} className="hover:bg-secondary_alt">
                <td className="px-3 py-2.5">
                  <button onClick={() => navigate(`/insurance?tab=active&state=${s.state}`)} className="text-xs text-brand-secondary hover:underline font-medium">
                    {s.state}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-secondary">{s.clients}</td>
                <td className="px-3 py-2.5 text-right text-xs text-secondary">{s.covers}</td>
                {BENEFIT_TYPES.slice(0, -1).map(b => (
                  <td key={b} className="px-3 py-2.5 text-right text-xs text-tertiary">{s.benefits[b] || "—"}</td>
                ))}
                <td className="px-3 py-2.5 text-right text-xs text-primary font-medium bg-secondary/30">${s.premium.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-tertiary font-semibold">
              <td className="px-3 py-3 text-xs text-brand-secondary">Total</td>
              <td className="px-3 py-3 text-right text-xs text-brand-secondary">{totals.clientCount}</td>
              <td className="px-3 py-3 text-right text-xs text-brand-secondary">{totals.covers}</td>
              {BENEFIT_TYPES.slice(0, -1).map(b => (
                <td key={b} className="px-3 py-3 text-right text-xs text-brand-secondary">{totals.benefits[b] || "—"}</td>
              ))}
              <td className="px-3 py-3 text-right text-xs text-brand-secondary bg-secondary/30">${totals.premium.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgeGroupReportTab({ data }: { data: PolicyBenefit[] }) {
  const activeData = data.filter(p => p.status === "Active");
  
  const AGE_GROUPS = ["1-10", "11-20", "21-30", "31-40", "41-50", "51-60", "61-70", "71-80", "81-90"];
  
  const ageStats = useMemo(() => {
    const stats: Record<string, { clients: Set<number>, covers: number, benefits: Record<string, number>, premium: number }> = {};
    
    AGE_GROUPS.forEach(group => {
      stats[group] = { clients: new Set(), covers: 0, benefits: {}, premium: 0 };
      BENEFIT_TYPES.forEach(b => stats[group].benefits[b] = 0);
    });
    
    activeData.forEach(p => {
      const age = p.childAge || p.age;
      let group = "81-90";
      if (age <= 10) group = "1-10";
      else if (age <= 20) group = "11-20";
      else if (age <= 30) group = "21-30";
      else if (age <= 40) group = "31-40";
      else if (age <= 50) group = "41-50";
      else if (age <= 60) group = "51-60";
      else if (age <= 70) group = "61-70";
      else if (age <= 80) group = "71-80";
      
      stats[group].clients.add(p.clientId);
      stats[group].covers++;
      stats[group].benefits[p.benefitType] = (stats[group].benefits[p.benefitType] || 0) + 1;
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      stats[group].premium += annualPremium;
    });
    
    return AGE_GROUPS.map(group => ({
      group,
      clients: stats[group].clients.size,
      covers: stats[group].covers,
      benefits: stats[group].benefits,
      premium: stats[group].premium,
    })).filter(s => s.covers > 0);
  }, [activeData]);
  
  const totals = useMemo(() => {
    const t = { clients: new Set<number>(), covers: 0, benefits: {} as Record<string, number>, premium: 0 };
    BENEFIT_TYPES.forEach(b => t.benefits[b] = 0);
    activeData.forEach(p => {
      t.clients.add(p.clientId);
      t.covers++;
      t.benefits[p.benefitType] = (t.benefits[p.benefitType] || 0) + 1;
      const annualPremium = p.frequency === "Monthly" ? p.premium * 12 : 
                           p.frequency === "Quarterly" ? p.premium * 4 :
                           p.frequency === "Half-yearly" ? p.premium * 2 : p.premium;
      t.premium += annualPremium;
    });
    return { ...t, clientCount: t.clients.size };
  }, [activeData]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Age Group Report</h2>
        <button onClick={() => alert("Generating PDF...")} className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt">
          <Download01 className="size-4" />Generate
        </button>
      </div>
      
      <div className="rounded-xl border border-secondary overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-tertiary border-b border-secondary">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">Age Group</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary">Clients</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary">Covers</th>
              {BENEFIT_TYPES.slice(0, -1).map(b => (
                <th key={b} className="px-3 py-3 text-right text-xs font-medium text-quaternary whitespace-nowrap">
                  {b.replace("Insurance", "").replace("Protection", "Prot.").replace("Accidental", "Acc.").trim()}
                </th>
              ))}
              <th className="px-3 py-3 text-right text-xs font-medium text-quaternary bg-secondary">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary bg-primary">
            {ageStats.map(s => (
              <tr key={s.group} className="hover:bg-secondary_alt">
                <td className="px-3 py-2.5 text-xs text-primary font-medium">{s.group}</td>
                <td className="px-3 py-2.5 text-right text-xs text-secondary">{s.clients}</td>
                <td className="px-3 py-2.5 text-right text-xs text-secondary">{s.covers}</td>
                {BENEFIT_TYPES.slice(0, -1).map(b => (
                  <td key={b} className="px-3 py-2.5 text-right text-xs text-tertiary">{s.benefits[b] || "—"}</td>
                ))}
                <td className="px-3 py-2.5 text-right text-xs text-primary font-medium bg-secondary/30">${s.premium.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-tertiary font-semibold">
              <td className="px-3 py-3 text-xs text-brand-secondary">Total</td>
              <td className="px-3 py-3 text-right text-xs text-brand-secondary">{totals.clientCount}</td>
              <td className="px-3 py-3 text-right text-xs text-brand-secondary">{totals.covers}</td>
              {BENEFIT_TYPES.slice(0, -1).map(b => (
                <td key={b} className="px-3 py-3 text-right text-xs text-brand-secondary">{totals.benefits[b] || "—"}</td>
              ))}
              <td className="px-3 py-3 text-right text-xs text-brand-secondary bg-secondary/30">${totals.premium.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuotesTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-secondary bg-primary p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-brand-secondary flex items-center justify-center mb-4">
          <File01 className="size-8 text-brand-primary" />
        </div>
        <h2 className="text-lg font-semibold text-primary mb-2">Insurance Quoting</h2>
        <p className="text-sm text-tertiary mb-6 max-w-md mx-auto">
          Launch the quoting tool to generate insurance quotes for your clients. Client data will be pre-populated automatically.
        </p>
        <button onClick={() => window.open("https://omnilife.com.au", "_blank")} 
          className="inline-flex items-center gap-2 rounded-lg bg-brand-solid text-white px-6 py-3 text-sm font-medium hover:bg-brand-solid_hover">
          Open Quoting Tool
          <ChevronRight className="size-4" />
        </button>
      </div>
      
      <div className="rounded-xl border border-secondary bg-primary p-6">
        <h3 className="text-sm font-semibold text-primary mb-4">Quick Quote</h3>
        <p className="text-xs text-tertiary mb-4">Select a client to pre-populate their details in the quoting tool.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Select Client</label>
            <select className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
              <option value="">Choose a client...</option>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-solid text-white px-4 py-2 text-sm font-medium hover:bg-brand-solid_hover">
              Launch Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailSettingsTab() {
  const [emailLevel, setEmailLevel] = useState("company");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpBcc, setSmtpBcc] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [fromName, setFromName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("renewal");
  
  const templates = [
    { id: "birthday", name: "HappyBirthday", active: true },
    { id: "renewal", name: "InsuranceRenewal", active: true },
    { id: "overdue1", name: "OverdueEm", active: true },
    { id: "overdue2", name: "OverdueEm2", active: false },
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Configuration */}
      <div className="space-y-6">
        {/* SMTP Settings */}
        <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
          <div className="px-5 py-4 border-b border-secondary">
            <h3 className="text-sm font-semibold text-primary">SMTP Settings</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Email Level</label>
              <select value={emailLevel} onChange={e => setEmailLevel(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
                <option value="company">Company</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">SMTP Host</label>
              <select value={smtpHost} onChange={e => setSmtpHost(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none">
                <option value="smtp.gmail.com">smtp.gmail.com</option>
                <option value="smtp.office365.com">smtp.office365.com</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">SMTP Email</label>
              <input type="email" value={smtpEmail} onChange={e => setSmtpEmail(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">SMTP Password</label>
              <input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">SMTP BCC</label>
              <input type="email" value={smtpBcc} onChange={e => setSmtpBcc(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none" placeholder="bcc@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Reply To</label>
              <input type="email" value={replyTo} onChange={e => setReplyTo(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none" placeholder="reply@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">SMTP From Name</label>
              <input type="text" value={fromName} onChange={e => setFromName(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none" placeholder="Your Company Name" />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt">
                Test SMTP
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand-solid text-white px-4 py-2 text-sm font-medium hover:bg-brand-solid_hover">
                Save SMTP
              </button>
            </div>
          </div>
        </div>
        
        {/* Document Templates */}
        <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
          <div className="px-5 py-4 border-b border-secondary">
            <h3 className="text-sm font-semibold text-primary">Email Templates</h3>
          </div>
          <div className="divide-y divide-secondary">
            {templates.map(t => (
              <div key={t.id} className={"flex items-center justify-between px-5 py-3 hover:bg-secondary_alt cursor-pointer " + (selectedTemplate === t.id ? "bg-secondary_alt" : "")}
                onClick={() => setSelectedTemplate(t.id)}>
                <div className="flex items-center gap-3">
                  <div className={"size-2 rounded-full " + (t.active ? "bg-success-primary" : "bg-quaternary")} />
                  <span className="text-sm text-primary">{t.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded hover:bg-secondary text-quaternary hover:text-secondary"><Edit02 className="size-3.5" /></button>
                  <button className="p-1.5 rounded hover:bg-secondary text-quaternary hover:text-secondary"><Eye className="size-3.5" /></button>
                  <button className="p-1.5 rounded hover:bg-secondary text-quaternary hover:text-secondary"><RefreshCw01 className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Panel - Email Builder Preview */}
      <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
        <div className="px-5 py-4 border-b border-secondary flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">Email Builder</h3>
          <span className="text-xs text-tertiary">Template: {templates.find(t => t.id === selectedTemplate)?.name}</span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Subject Line</label>
            <input type="text" defaultValue="{{ClientName}} your {{Provider}} policy is due for renewal"
              className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Days Before Trigger</label>
            <input type="number" defaultValue={30}
              className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="attachPdf" defaultChecked className="rounded border-secondary accent-[#D34108]" />
            <label htmlFor="attachPdf" className="text-sm text-primary">Attach Policy Schedule PDF</label>
          </div>
          
          <div className="border border-secondary rounded-lg p-4 bg-secondary_alt min-h-[300px]">
            <p className="text-xs text-tertiary mb-4">Drag and drop content blocks:</p>
            <div className="grid grid-cols-4 gap-2">
              {["Columns", "Heading", "Text", "Divider", "Image", "Button", "HTML", "Menu"].map(block => (
                <div key={block} className="rounded-lg border border-dashed border-secondary bg-primary p-2 text-center text-xs text-tertiary cursor-move hover:border-brand-primary hover:text-brand-secondary">
                  {block}
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 border border-secondary rounded-lg bg-primary">
              <p className="text-xs text-quaternary mb-2">Merge tags:</p>
              <div className="flex flex-wrap gap-2">
                {["{{Name}}", "{{RenDate}}", "{{Provider}}", "{{PolNum}}", "{{AdvisorName}}"].map(tag => (
                  <span key={tag} className="px-2 py-1 rounded bg-secondary text-xs text-secondary font-mono">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-solid text-white px-4 py-2.5 text-sm font-medium hover:bg-brand-solid_hover">
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function InsuranceBookPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get("tab") || "dashboard";
  
  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };
  
  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="hidden lg:block w-[70px] shrink-0" />
      
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Insurance Book</h1>
              <p className="text-sm text-tertiary mt-0.5">Manage your life insurance book of business</p>
            </div>
          </div>
          
          {/* Tab Bar */}
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setTab(tab.id)}
                className={"flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + 
                  (currentTab === tab.id ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === "dashboard" && <DashboardTab data={MOCK_POLICIES} />}
          {currentTab === "active" && <BenefitsTab data={MOCK_POLICIES} status="Active" navigate={navigate} />}
          {currentTab === "inactive" && <BenefitsTab data={MOCK_POLICIES} status="Inactive" navigate={navigate} />}
          {currentTab === "policies" && <PoliciesTab data={MOCK_POLICIES} navigate={navigate} />}
          {currentTab === "overdue" && <OverdueTab data={MOCK_POLICIES} navigate={navigate} />}
          {currentTab === "state" && <StateReportTab data={MOCK_POLICIES} navigate={navigate} />}
          {currentTab === "age" && <AgeGroupReportTab data={MOCK_POLICIES} />}
          {currentTab === "quotes" && <QuotesTab />}
          {currentTab === "email" && <EmailSettingsTab />}
        </div>
      </main>
    </div>
  );
}
