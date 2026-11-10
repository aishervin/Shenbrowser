export type RunStatusType =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'stopping'
  | 'stopped';

export interface BrowserSession {
  id: string;
  status: 'running' | 'stopped' | 'failed' | 'timeout';
  liveUrl?: string;
  cdpUrl?: string;
  timeout?: number;
  proxyCountryCode?: string | null;
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
  browserUseKeyMasked: string | null;
  geminiConfigured: boolean;
  baseUrl: string;
  recommendedModels: string[];
}
