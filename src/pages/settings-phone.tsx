import { useState } from 'react';
import { Phone01, Settings01, Microphone01, Users01, BarChart01, Plus } from '@untitledui/icons';
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";

// Types
interface PhoneNumber {
  id: string;
  number: string;
  friendlyName: string;
  location: string;
  capabilities: ('voice' | 'sms' | 'mms')[];
  assignment: { groupId: string; groupName: string; label: string } | null;
  status: 'active' | 'inactive';
}

interface UserAccess {
  id: string;
  name: string;
  email: string;
  initials: string;
  group: { id: string; name: string };
  callerId: string | null;
  softphoneEnabled: boolean;
  color: string;
}

interface PhoneSettings {
  recording: { enabled: boolean; retentionDays: number; storageUsedGB: number };
  transcription: { enabled: boolean; aiSummary: boolean; language: string };
}

interface UsageStats {
  inboundMinutes: number;
  outboundMinutes: number;
  transcriptionMinutes: number;
  estimatedCost: number;
  billingPeriod: { start: string; end: string };
}

type TabId = 'numbers' | 'recording' | 'transcription' | 'access' | 'usage';

// Mock data
const mockPhoneNumbers: PhoneNumber[] = [
  { id: 'PN1', number: '+61 2 5941 6786', friendlyName: 'SLS Main Line', location: 'Sydney, AU', capabilities: ['voice', 'sms'], assignment: { groupId: 'G1', groupName: 'SLS Team', label: 'Main inbound line' }, status: 'active' },
  { id: 'PN2', number: '+61 3 8400 2210', friendlyName: 'nexa Line', location: 'Melbourne, AU', capabilities: ['voice'], assignment: { groupId: 'G2', groupName: 'nexa Team', label: 'Secondary line' }, status: 'active' },
];

const mockUsers: UserAccess[] = [
  { id: 'U1', name: 'Rebel Thomas', email: 'rebel@slife.com.au', initials: 'RT', group: { id: 'G1', name: 'SLS Team' }, callerId: '+61 2 5941 6786', softphoneEnabled: true, color: '#FAECE7' },
  { id: 'U2', name: 'Nathaniel Wright', email: 'nathaniel@nexa.com.au', initials: 'NW', group: { id: 'G2', name: 'nexa Team' }, callerId: '+61 3 8400 2210', softphoneEnabled: true, color: '#EEEDFE' },
  { id: 'U3', name: 'Jane Smith', email: 'jane@slife.com.au', initials: 'JS', group: { id: 'G1', name: 'SLS Team' }, callerId: null, softphoneEnabled: false, color: '#F1EFE8' },
];

const mockSettings: PhoneSettings = {
  recording: { enabled: true, retentionDays: 90, storageUsedGB: 2.4 },
  transcription: { enabled: true, aiSummary: true, language: 'en-AU' },
};

const mockUsage: UsageStats = {
  inboundMinutes: 847,
  outboundMinutes: 1234,
  transcriptionMinutes: 2081,
  estimatedCost: 124.50,
  billingPeriod: { start: '2026-03-01', end: '2026-03-31' },
};

const groupColors: Record<string, { bg: string; text: string }> = {
  'SLS Team': { bg: '#FAECE7', text: '#993C1D' },
  'nexa Team': { bg: '#EEEDFE', text: '#3C3489' },
};

// Components
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors ${checked ? 'bg-[#D34108]' : 'bg-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${checked ? 'right-[2px]' : 'left-[2px]'}`} />
    </button>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: React.FC<{ className?: string }>; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${active ? 'text-[#D34108] border-[#D34108]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

function GroupBadge({ name }: { name: string }) {
  const colors = groupColors[name] || { bg: '#F1EFE8', text: '#444441' };
  return <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ backgroundColor: colors.bg, color: colors.text }}>{name}</span>;
}

function CapabilityBadge({ cap }: { cap: string }) {
  return <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded">{cap.charAt(0).toUpperCase() + cap.slice(1)}</span>;
}

// Tab Panels
function NumbersPanel({ numbers }: { numbers: PhoneNumber[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-primary">Phone Numbers</h3>
          <p className="text-sm text-tertiary">Manage your Twilio phone numbers</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-[#D34108] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B33607] transition-colors">
          <Plus className="size-4" /> Buy Number
        </button>
      </div>
      
      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {numbers.map(num => (
          <div key={num.id} className="border border-secondary rounded-xl p-4 bg-primary">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-primary">{num.friendlyName}</p>
                <p className="text-sm text-tertiary font-mono">{num.number}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${num.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {num.status}
              </span>
            </div>
            <p className="text-xs text-quaternary mb-2">{num.location}</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {num.capabilities.map(cap => <CapabilityBadge key={cap} cap={cap} />)}
            </div>
            {num.assignment && <GroupBadge name={num.assignment.groupName} />}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block border border-secondary rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary_alt border-b border-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-secondary">Number</th>
              <th className="text-left px-4 py-3 font-medium text-secondary">Name</th>
              <th className="text-left px-4 py-3 font-medium text-secondary">Location</th>
              <th className="text-left px-4 py-3 font-medium text-secondary">Capabilities</th>
              <th className="text-left px-4 py-3 font-medium text-secondary">Assignment</th>
              <th className="text-left px-4 py-3 font-medium text-secondary">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary">
            {numbers.map(num => (
              <tr key={num.id} className="hover:bg-secondary_alt transition-colors">
                <td className="px-4 py-3 font-mono">{num.number}</td>
                <td className="px-4 py-3 font-medium">{num.friendlyName}</td>
                <td className="px-4 py-3 text-tertiary">{num.location}</td>
                <td className="px-4 py-3"><div className="flex gap-1">{num.capabilities.map(cap => <CapabilityBadge key={cap} cap={cap} />)}</div></td>
                <td className="px-4 py-3">{num.assignment ? <GroupBadge name={num.assignment.groupName} /> : <span className="text-quaternary">—</span>}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${num.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {num.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordingPanel({ settings, onUpdate }: { settings: PhoneSettings; onUpdate: (s: PhoneSettings) => void }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-semibold text-primary">Call Recording</h3>
        <p className="text-sm text-tertiary">Configure automatic call recording settings</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-secondary rounded-xl">
          <div>
            <p className="font-medium text-primary">Enable Recording</p>
            <p className="text-sm text-tertiary">Automatically record all calls</p>
          </div>
          <Toggle checked={settings.recording.enabled} onChange={v => onUpdate({ ...settings, recording: { ...settings.recording, enabled: v } })} />
        </div>
        
        <div className="p-4 border border-secondary rounded-xl">
          <label className="block font-medium text-primary mb-2">Retention Period</label>
          <select
            value={settings.recording.retentionDays}
            onChange={e => onUpdate({ ...settings, recording: { ...settings.recording, retentionDays: Number(e.target.value) } })}
            className="w-full sm:w-48 border border-secondary rounded-lg px-3 py-2 text-sm bg-primary"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
        
        <div className="p-4 border border-secondary rounded-xl bg-secondary_alt">
          <p className="text-sm text-tertiary">Storage Used</p>
          <p className="text-2xl font-semibold text-primary">{settings.recording.storageUsedGB} GB</p>
        </div>
      </div>
    </div>
  );
}

function TranscriptionPanel({ settings, onUpdate }: { settings: PhoneSettings; onUpdate: (s: PhoneSettings) => void }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-semibold text-primary">Transcription</h3>
        <p className="text-sm text-tertiary">Configure AI-powered call transcription</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-secondary rounded-xl">
          <div>
            <p className="font-medium text-primary">Enable Transcription</p>
            <p className="text-sm text-tertiary">Automatically transcribe recorded calls</p>
          </div>
          <Toggle checked={settings.transcription.enabled} onChange={v => onUpdate({ ...settings, transcription: { ...settings.transcription, enabled: v } })} />
        </div>
        
        <div className="flex items-center justify-between p-4 border border-secondary rounded-xl">
          <div>
            <p className="font-medium text-primary">AI Summary</p>
            <p className="text-sm text-tertiary">Generate AI summaries of calls</p>
          </div>
          <Toggle checked={settings.transcription.aiSummary} onChange={v => onUpdate({ ...settings, transcription: { ...settings.transcription, aiSummary: v } })} disabled={!settings.transcription.enabled} />
        </div>
        
        <div className="p-4 border border-secondary rounded-xl">
          <label className="block font-medium text-primary mb-2">Language</label>
          <select
            value={settings.transcription.language}
            onChange={e => onUpdate({ ...settings, transcription: { ...settings.transcription, language: e.target.value } })}
            className="w-full sm:w-48 border border-secondary rounded-lg px-3 py-2 text-sm bg-primary"
          >
            <option value="en-AU">English (Australian)</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AccessPanel({ users }: { users: UserAccess[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-primary">User Access</h3>
        <p className="text-sm text-tertiary">Manage which users can use the softphone</p>
      </div>
      
      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {users.map(user => (
          <div key={user.id} className="border border-secondary rounded-xl p-4 bg-primary">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: user.color }}>
                {user.initials}
              </div>
              <div>
                <p className="font-medium text-primary">{user.name}</p>
                <p className="text-xs text-tertiary">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <GroupBadge name={user.group.name} />
              <span className={`px-2 py-0.5 rounded text-xs ${user.softphoneEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.softphoneEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block border border-secondary rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary_alt border-b border-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-secondary">User</th>
              <th className="text-left px-4 py-3 font-medium text-secondary">Group</th>
              <th className="text-left px-4 py-3 font-medium text-secondary">Caller ID</th>
              <th className="text-left px-4 py-3 font-medium text-secondary">Softphone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-secondary_alt transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: user.color }}>
                      {user.initials}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-tertiary">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><GroupBadge name={user.group.name} /></td>
                <td className="px-4 py-3 font-mono text-tertiary">{user.callerId || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${user.softphoneEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.softphoneEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsagePanel({ usage }: { usage: UsageStats }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-primary">Usage & Billing</h3>
        <p className="text-sm text-tertiary">Current billing period: {new Date(usage.billingPeriod.start).toLocaleDateString()} – {new Date(usage.billingPeriod.end).toLocaleDateString()}</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-secondary rounded-xl">
          <p className="text-sm text-tertiary">Inbound Minutes</p>
          <p className="text-2xl font-semibold text-primary">{usage.inboundMinutes.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-secondary rounded-xl">
          <p className="text-sm text-tertiary">Outbound Minutes</p>
          <p className="text-2xl font-semibold text-primary">{usage.outboundMinutes.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-secondary rounded-xl">
          <p className="text-sm text-tertiary">Transcription Minutes</p>
          <p className="text-2xl font-semibold text-primary">{usage.transcriptionMinutes.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-secondary rounded-xl bg-[#FEF6F3]">
          <p className="text-sm text-[#993C1D]">Estimated Cost</p>
          <p className="text-2xl font-semibold text-[#D34108]">${usage.estimatedCost.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

// Main Page
export function SettingsPhonePage() {
  const [activeTab, setActiveTab] = useState<TabId>('numbers');
  const [phoneNumbers] = useState(mockPhoneNumbers);
  const [users] = useState(mockUsers);
  const [settings, setSettings] = useState(mockSettings);
  const [usage] = useState(mockUsage);

  return (
    <div className="flex min-h-screen bg-primary">
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} activeUrl="/settings/phone" />
      
      <main className="flex-1 flex flex-col overflow-hidden lg:pl-[68px]">
        {/* Header */}
        <header className="shrink-0 border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#FEF6F3] flex items-center justify-center">
              <Phone01 className="size-5 text-[#D34108]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-primary">Phone System</h1>
              <p className="text-sm text-tertiary hidden sm:block">Manage Twilio phone numbers, recording, and softphone access</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="shrink-0 border-b border-secondary px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex gap-1 sm:gap-4">
            <TabButton active={activeTab === 'numbers'} onClick={() => setActiveTab('numbers')} icon={Phone01}>Numbers</TabButton>
            <TabButton active={activeTab === 'recording'} onClick={() => setActiveTab('recording')} icon={Microphone01}>Recording</TabButton>
            <TabButton active={activeTab === 'transcription'} onClick={() => setActiveTab('transcription')} icon={Settings01}>Transcription</TabButton>
            <TabButton active={activeTab === 'access'} onClick={() => setActiveTab('access')} icon={Users01}>Access</TabButton>
            <TabButton active={activeTab === 'usage'} onClick={() => setActiveTab('usage')} icon={BarChart01}>Usage</TabButton>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'numbers' && <NumbersPanel numbers={phoneNumbers} />}
          {activeTab === 'recording' && <RecordingPanel settings={settings} onUpdate={setSettings} />}
          {activeTab === 'transcription' && <TranscriptionPanel settings={settings} onUpdate={setSettings} />}
          {activeTab === 'access' && <AccessPanel users={users} />}
          {activeTab === 'usage' && <UsagePanel usage={usage} />}
        </div>
      </main>
    </div>
  );
}
