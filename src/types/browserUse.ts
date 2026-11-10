export type RunStatusType =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'stopping'
  | 'stopped';

export interface ProfileItem {
  id: string;
  name: string;
  email?: string;
  status: 'authenticated' | 'needs_login' | 'unverified';
  createdAt?: string;
  lastUsedAt?: string;
  isSimulated?: boolean;
}

export interface ApiHarvestService {
  id: string;
  name: string;
  logo: string;
  websiteUrl: string;
  freeTierDescription: string;
  keyUrl: string;
  instructionsPrompt: string;
}

export interface HarvestedKey {
  id: string;
  serviceId: string;
  serviceName: string;
  profileId: string;
  profileName: string;
  apiKey: string;
  createdAt: string;
  notes?: string;
}

export interface BrowserSession {
  id: string;
  status: 'running' | 'stopped' | 'failed' | 'timeout';
  liveUrl?: string;
  cdpUrl?: string;
  timeout?: number;
  proxyCountryCode?: string | null;
  profileId?: string | null;
  enableRecording?: boolean;
  createdAt?: string;
  expiresAt?: string;
  isSimulated?: boolean;
}

export interface RunEventItem {
  id: number | string;
  type: string;
  data?: any;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  sessionId?: string;
  status: RunStatusType;
  task: string;
  model: string;
  profileId?: string;
  liveUrl?: string;
  recordingUrl?: string;
  result?: any;
  error?: string;
  createdAt: string;
  finishedAt?: string;
  events?: RunEventItem[];
  isSimulated?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  category: 'scraping' | 'monitoring' | 'qa' | 'research';
  defaultPrompt: string;
  targetUrl: string;
  model: string;
  proxyCountryCode: string;
  icon: string;
}

export interface StatusResponse {
  browserUseConfigured: boolean;
  browserUseKeyPresent?: boolean;
  browserUseKeyValid?: boolean;
  browserUseError?: string | null;
  browserUseKeyMasked: string | null;
  geminiConfigured: boolean;
  baseUrl: string;
  recommendedModels: string[];
}
