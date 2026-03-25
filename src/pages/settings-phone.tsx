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
