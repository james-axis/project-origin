import { useState, useEffect } from 'react';
import { Phone01, Settings01, Microphone01, Users01, BarChart01, Plus, Edit02, Check, XClose } from '@untitledui/icons-react';

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
  recording: {
    enabled: boolean;
    retentionDays: number;
    storageUsedGB: number;
  };
  transcription: {
    enabled: boolean;
    aiSummary: boolean;
    language: string;
  };
}

interface UsageStats {
  inboundMinutes: number;
  outboundMinutes: number;
  transcriptionMinutes: number;
  estimatedCost: number;
  billingPeriod: { start: string; end: string };
}

type TabId = 'numbers' | 'recording' | 'transcription' | 'access' | 'usage';

// Mock data - replace with API calls
const mockPhoneNumbers: PhoneNumber[] = [
  {
    id: 'PN1',
    number: '+61 2 5941 6786',
    friendlyName: 'SLS Main Line',
    location: 'Sydney, AU',
    capabilities: ['voice', 'sms'],
    assignment: { groupId: 'G1', groupName: 'SLS Team', label: 'Main inbound line' },
    status: 'active',
  },
  {
    id: 'PN2',
    number: '+61 3 8400 2210',
    friendlyName: 'nexa Line',
    location: 'Melbourne, AU',
    capabilities: ['voice'],
    assignment: { groupId: 'G2', groupName: 'nexa Team', label: 'Secondary line' },
    status: 'active',
  },
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

// Toggle Component
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors ${
        checked ? 'bg-[#D34108]' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div
        className={`absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${
          checked ? 'right-[2px]' : 'left-[2px]'
        }`}
      />
    </button>
  );
}

// Tab Button
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'text-[#D34108] border-[#D34108]'
          : 'text-gray-500 border-transparent hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

// Badge Component
function GroupBadge({ name }: { name: string }) {
  const colors = groupColors[name] || { bg: '#F1EFE8', text: '#444441' };
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-md"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {name}
    </span>
  );
}

function CapabilityBadge({ cap }: { cap: string }) {
  return (
    <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded">
      {cap.charAt(0).toUpperCase() + cap.slice(1)}
    </span>
  );
}

// Connection Status Card
function ConnectionStatus() {
  const [connected] = useState(true);
  const maskedSid = 'AC••••••••••••7b4f';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Phone01 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-gray-900">Twilio connection</p>
            <p className="text-[13px] text-gray-500">Account SID: {maskedSid}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={`text-[13px] font-medium ${connected ? 'text-emerald-700' : 'text-red-700'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button className="text-[13px] text-[#D34108] font-medium hover:underline">
            Edit credentials
          </button>
        </div>
      </div>
    </div>
  );
}

// Phone Numbers Tab
function PhoneNumbersTab() {
  const [numbers] = useState<PhoneNumber[]>(mockPhoneNumbers);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-medium text-gray-900">Phone numbers</h2>
          <p className="text-[13px] text-gray-500">Manage Twilio phone numbers and assign to adviser groups.</p>
        </div>
        <button className="flex items-center gap-1.5 bg-[#D34108] text-white px-3.5 py-2 rounded-lg text-[13px] font-medium hover:bg-[#b83a07] transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Buy number
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[160px_1fr_140px_100px_80px] px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>Number</span>
          <span>Assignment</span>
          <span>Capabilities</span>
          <span>Status</span>
          <span></span>
        </div>

        {/* Rows */}
        {numbers.map((num, i) => (
          <div
            key={num.id}
            className={`grid grid-cols-[160px_1fr_140px_100px_80px] px-4 py-3.5 items-center ${
              i < numbers.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{num.number}</p>
              <p className="text-xs text-gray-400">{num.location}</p>
            </div>
            <div className="flex items-center gap-2">
              {num.assignment && (
                <>
                  <GroupBadge name={num.assignment.groupName} />
                  <span className="text-[13px] text-gray-500">{num.assignment.label}</span>
                </>
              )}
            </div>
            <div className="flex gap-1.5">
              {num.capabilities.map((cap) => (
                <CapabilityBadge key={cap} cap={cap} />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${num.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-[13px] text-gray-500 capitalize">{num.status}</span>
            </div>
            <button className="text-[13px] text-gray-500 hover:text-gray-700">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recording Settings Tab
function RecordingTab() {
  const [settings, setSettings] = useState(mockSettings.recording);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
          <Settings01 className="w-4 h-4 text-amber-700" />
        </div>
        <h2 className="text-[15px] font-medium text-gray-900">Call recording settings</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-[13px] text-gray-600">Enable call recording</span>
          <Toggle checked={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} />
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-[13px] text-gray-600">Retention period</span>
          <select
            value={settings.retentionDays}
            onChange={(e) => setSettings({ ...settings, retentionDays: Number(e.target.value) })}
            className="text-[13px] px-2 py-1 border border-gray-200 rounded-md bg-white"
          >
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
            <option value={-1}>Forever</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-[13px] text-gray-600">Storage used</span>
          <span className="text-[13px] font-medium text-gray-900">{settings.storageUsedGB} GB</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Call recordings are stored securely in Twilio's AU1 region. Consent requirements vary by jurisdiction.
      </p>
    </div>
  );
}

// Transcription Settings Tab
function TranscriptionTab() {
  const [settings, setSettings] = useState(mockSettings.transcription);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
          <Microphone01 className="w-4 h-4 text-teal-700" />
        </div>
        <h2 className="text-[15px] font-medium text-gray-900">AI transcription settings</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-[13px] text-gray-600">Auto-transcribe calls</span>
          <Toggle checked={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} />
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-[13px] text-gray-600">Generate AI summary</span>
          <Toggle checked={settings.aiSummary} onChange={(v) => setSettings({ ...settings, aiSummary: v })} />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-[13px] text-gray-600">Language</span>
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="text-[13px] px-2 py-1 border border-gray-200 rounded-md bg-white"
          >
            <option value="en-AU">English (AU)</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Transcriptions are generated using Twilio's native Speech-to-Text. AI summaries extract key topics and next actions.
      </p>
    </div>
  );
}

// User Access Tab
function UserAccessTab() {
  const [users, setUsers] = useState<UserAccess[]>(mockUsers);

  const toggleSoftphone = (userId: string) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, softphoneEnabled: !u.softphoneEnabled } : u)));
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-medium text-gray-900">Adviser softphone access</h2>
        <p className="text-[13px] text-gray-500">Control which advisers can use the CRM softphone and their outbound caller ID.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_160px_140px_100px_80px] px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>Adviser</span>
          <span>Caller ID</span>
          <span>Group</span>
          <span>Softphone</span>
          <span></span>
        </div>

        {/* Rows */}
        {users.map((user, i) => (
          <div
            key={user.id}
            className={`grid grid-cols-[1fr_160px_140px_100px_80px] px-4 py-3 items-center ${
              i < users.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: user.color, color: groupColors[user.group.name]?.text || '#444' }}
              >
                {user.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <span className={`text-[13px] ${user.callerId ? 'text-gray-900' : 'text-gray-400'}`}>
              {user.callerId || 'Not assigned'}
            </span>
            <GroupBadge name={user.group.name} />
            <Toggle checked={user.softphoneEnabled} onChange={() => toggleSoftphone(user.id)} />
            <button className="text-[13px] text-gray-500 hover:text-gray-700">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Usage Tab
function UsageTab() {
  const [usage] = useState<UsageStats>(mockUsage);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <BarChart01 className="w-4 h-4 text-purple-700" />
          </div>
          <h2 className="text-[15px] font-medium text-gray-900">Usage this month</h2>
        </div>
        <span className="text-xs text-gray-400">
          Billing period: {formatDate(usage.billingPeriod.start)} – {formatDate(usage.billingPeriod.end)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Inbound minutes</p>
          <p className="text-xl font-medium text-gray-900">{usage.inboundMinutes.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Outbound minutes</p>
          <p className="text-xl font-medium text-gray-900">{usage.outboundMinutes.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Transcription minutes</p>
          <p className="text-xl font-medium text-gray-900">{usage.transcriptionMinutes.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Estimated cost</p>
          <p className="text-xl font-medium text-[#D34108]">${usage.estimatedCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-[13px] text-gray-500">
          Usage is calculated based on Twilio's per-minute pricing. Final invoicing may differ based on actual usage and any volume discounts applied.
          View detailed breakdown in the{' '}
          <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-[#D34108] hover:underline">
            Twilio Console
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// Main Settings Phone Page
export default function SettingsPhone() {
  const [activeTab, setActiveTab] = useState<TabId>('numbers');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'numbers', label: 'Phone numbers' },
    { id: 'recording', label: 'Recording' },
    { id: 'transcription', label: 'Transcription' },
    { id: 'access', label: 'User access' },
    { id: 'usage', label: 'Usage' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[13px] mb-1">
            <span className="text-gray-500">Settings</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#D34108] font-medium">Phone System</span>
          </div>
          <h1 className="text-2xl font-medium text-gray-900" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
            Phone system configuration
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Twilio integration, phone numbers, recording settings, and adviser access.
          </p>
        </div>

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'numbers' && <PhoneNumbersTab />}
        {activeTab === 'recording' && <RecordingTab />}
        {activeTab === 'transcription' && <TranscriptionTab />}
        {activeTab === 'access' && <UserAccessTab />}
        {activeTab === 'usage' && <UsageTab />}
      </div>
    </div>
  );
}
