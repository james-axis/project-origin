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