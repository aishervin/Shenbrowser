/**
 * AI Browser Agent Builder
 * Workflow application for Browser Use Cloud V4 API & Gemini Prompt Architect
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { AgentRunnerTab } from './components/AgentRunnerTab';
import { CloudBrowserTab } from './components/CloudBrowserTab';
import { PromptArchitectTab } from './components/PromptArchitectTab';
import { TemplateLibraryTab } from './components/TemplateLibraryTab';
import { HistoryTab } from './components/HistoryTab';
import { ApiKeyModal } from './components/ApiKeyModal';
import { GoogleAccountsHarvesterTab } from './components/GoogleAccountsHarvesterTab';

import {
  StatusResponse,
  AgentRun,
  BrowserSession,
  WorkflowTemplate,
} from './types/browserUse';

export default function App() {
  const [activeTab, setActiveTab] = useState<'runner' | 'browser' | 'harvester' | 'architect' | 'templates' | 'history'>('harvester');
  const [status, setStatus] = useState<StatusResponse | null>(null);

  // Active runs & standalone browser
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeBrowser, setActiveBrowser] = useState<BrowserSession | null>(null);
  const [isStartingBrowser, setIsStartingBrowser] = useState<boolean>(false);

  // Prompt transfer between tabs
  const [activePromptText, setActivePromptText] = useState<string>('');

  // History state
  const [runsHistory, setRunsHistory] = useState<AgentRun[]>(() => {
    try {
      const saved = localStorage.getItem('ai_browser_runs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Modal
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Poll timer ref
  const pollTimerRef = useRef<any>(null);

  // Fetch status on mount
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.warn('Status check failed:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_browser_runs', JSON.stringify(runsHistory));
    } catch (e) {}
  }, [runsHistory]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Handler: Start an Agent Run
  const handleStartRun = (config: {
    task: string;
    model: string;
    proxyCountryCode: string;
    record: boolean;
    keepAlive: number;
    profileId?: string;
  }): Promise<AgentRun> => {
    return new Promise(async (resolve, reject) => {
      setIsRunning(true);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      const initialRunState: AgentRun = {
        id: `run-${Date.now()}`,
        task: config.task,
        model: config.model,
        status: 'running',
        createdAt: new Date().toISOString(),
        events: [
          {
            id: 1,
            type: 'run.queued',
            data: { message: 'Dispatching task to Browser Use Cloud v4 pod...' },
            createdAt: new Date().toISOString(),
          },
        ],
      };

      setCurrentRun(initialRunState);

      try {
        const res = await fetch('/api/agent/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: config.task,
            model: config.model,
            proxyCountryCode: config.proxyCountryCode,
            record: config.record,
            keepAlive: config.keepAlive,
            profileId: config.profileId,
            testMode: !status?.browserUseConfigured,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to dispatch agent run');
        }

        const runData = await res.json();

        const updatedRun: AgentRun = {
          ...initialRunState,
          id: runData.id || initialRunState.id,
          sessionId: runData.sessionId,
          status: runData.status || 'running',
          liveUrl: runData.liveUrl,
          isSimulated: runData.isSimulated,
        };

        setCurrentRun(updatedRun);

        // Start Polling Loop for status & action events
        let pollCount = 0;
        pollTimerRef.current = setInterval(async () => {
          pollCount++;
          try {
            // 1. Poll Status
            const statusRes = await fetch(`/api/agent/run/${updatedRun.id}/status`);
            const statusData = await statusRes.json();

            // 2. Poll Events
            const eventsRes = await fetch(`/api/agent/run/${updatedRun.id}/events`);
            const eventsData = await eventsRes.json();

            const currentEvents = eventsData.items || [];

            // In simulation mode without key, simulate progress events
            if (updatedRun.isSimulated) {
              if (pollCount === 2) {
                currentEvents.push({
                  id: 2,
                  type: 'browser.navigate',
                  data: { url: 'https://news.ycombinator.com', status: 200 },
                  createdAt: new Date().toISOString(),
                });
              } else if (pollCount === 4) {
                currentEvents.push({
                  id: 3,
                  type: 'browser.extract',
                  data: { itemsExtracted: 5, selector: '.athing' },
                  createdAt: new Date().toISOString(),
                });
              } else if (pollCount >= 6) {
                statusData.status = 'completed';
              }
            }

            const isTerminal =
              statusData.status === 'completed' ||
              statusData.status === 'failed' ||
              statusData.status === 'cancelled';

            if (isTerminal) {
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              setIsRunning(false);

              // Fetch final summary
              const summaryRes = await fetch(`/api/agent/run/${updatedRun.id}`);
              const summaryData = await summaryRes.json();

              const finalRun: AgentRun = {
                ...updatedRun,
                status: statusData.status,
                result: summaryData.result || [
                  { title: 'Show HN: Browser Use Cloud v4 Integration', points: 342, author: 'developer' },
                  { title: 'Modern Stealth Browsers and AI Agents', points: 285, author: 'cloudagent' },
                  { title: 'Autonomous Web Automation at Scale', points: 198, author: 'vibecoder' },
                ],
                finishedAt: new Date().toISOString(),
                events: currentEvents,
              };

              setCurrentRun(finalRun);
              setRunsHistory((prev) => [finalRun, ...prev.filter((r) => r.id !== finalRun.id)]);
              resolve(finalRun);
            } else {
              setCurrentRun((prev) => (prev ? { ...prev, status: statusData.status, events: currentEvents } : null));
            }
          } catch (pollErr) {
            console.warn('Poll error:', pollErr);
          }
        }, 2500);
      } catch (err: any) {
        console.error('Run failed to start:', err);
        setIsRunning(false);
        const errorRun: AgentRun = {
          ...initialRunState,
          status: 'failed',
          error: err?.message || 'Agent task execution failed',
        };
        setCurrentRun(errorRun);
        reject(err);
      }
    });
  };

  // Handler: Cancel Agent Run
  const handleCancelRun = async (runId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    try {
      await fetch(`/api/agent/run/${runId}/cancel`, { method: 'POST' });
    } catch (e) {}
    setIsRunning(false);
    setCurrentRun((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
  };

  // Handler: Launch Standalone Cloud Browser
  const handleStartBrowser = async (options: {
    timeout: number;
    proxyCountryCode: string;
    enableRecording: boolean;
  }) => {
    setIsStartingBrowser(true);
    try {
      const res = await fetch('/api/browser/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          testMode: !status?.browserUseConfigured,
        }),
      });

      const browserData = await res.json();
      if (res.ok && browserData && browserData.id) {
        setActiveBrowser(browserData);
      } else {
        const fallback: BrowserSession = {
          id: `sim-browser-${Date.now()}`,
          status: 'running',
          liveUrl: 'https://news.ycombinator.com',
          cdpUrl: `wss://api.eu.browser-use.com/cdp/sim-${Date.now()}`,
          timeout: options.timeout,
          proxyCountryCode: options.proxyCountryCode,
          isSimulated: true,
          createdAt: new Date().toISOString(),
        };
        setActiveBrowser(fallback);
      }
    } catch (err: any) {
      console.warn('Fallback to simulated cloud browser session:', err?.message);
      const fallback: BrowserSession = {
        id: `sim-browser-${Date.now()}`,
        status: 'running',
        liveUrl: 'https://news.ycombinator.com',
        cdpUrl: `wss://api.eu.browser-use.com/cdp/sim-${Date.now()}`,
        timeout: options.timeout,
        proxyCountryCode: options.proxyCountryCode,
        isSimulated: true,
        createdAt: new Date().toISOString(),
      };
      setActiveBrowser(fallback);
    } finally {
      setIsStartingBrowser(false);
    }
  };

  // Handler: Stop Standalone Cloud Browser
  const handleStopBrowser = async (id: string) => {
    try {
      await fetch(`/api/browser/${id}/stop`, { method: 'POST' });
    } catch (e) {}
    setActiveBrowser(null);
  };

  // Handler: Launch interactive cloud browser for manual Google login
  const handleLaunchInteractiveBrowser = async (profileId: string, startUrl: string): Promise<BrowserSession | null> => {
    setIsStartingBrowser(true);
    try {
      const res = await fetch('/api/browser/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeout: 15,
          proxyCountryCode: 'de',
          enableRecording: true,
          profileId,
          startUrl,
          testMode: !status?.browserUseConfigured,
        }),
      });

      const browserData = await res.json();
      if (res.ok && browserData && browserData.id) {
        setActiveBrowser(browserData);
        return browserData;
      }

      const fallback: BrowserSession = {
        id: `sim-browser-${Date.now()}`,
        status: 'running',
        liveUrl: startUrl || 'https://accounts.google.com',
        timeout: 15,
        proxyCountryCode: 'de',
        profileId,
        isSimulated: true,
        createdAt: new Date().toISOString(),
      };
      setActiveBrowser(fallback);
      return fallback;
    } catch (err: any) {
      console.warn('Fallback to simulated login browser session:', err?.message);
      const fallback: BrowserSession = {
        id: `sim-browser-${Date.now()}`,
        status: 'running',
        liveUrl: startUrl || 'https://accounts.google.com',
        timeout: 15,
        proxyCountryCode: 'de',
        profileId,
        isSimulated: true,
        createdAt: new Date().toISOString(),
      };
      setActiveBrowser(fallback);
      return fallback;
    } finally {
      setIsStartingBrowser(false);
    }
  };

  // Handler: Select Template
  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setActivePromptText(template.defaultPrompt);
    setActiveTab('runner');
  };

  // Handler: Prompt Architect load into runner
  const handleLoadArchitectIntoRunner = (prompt: string, model: string, proxyCountry: string) => {
    setActivePromptText(prompt);
    setActiveTab('runner');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        status={status}
        activeBrowser={activeBrowser}
        onStopActiveBrowser={() => activeBrowser && handleStopBrowser(activeBrowser.id)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'harvester' && (
          <GoogleAccountsHarvesterTab
            currentRun={currentRun}
            onStartAgentTask={async (task, profileId) => {
              return await handleStartRun({
                task,
                model: 'gpt-5.6-luna',
                proxyCountryCode: 'de',
                record: true,
                keepAlive: 120,
                profileId,
              });
            }}
            onLaunchInteractiveBrowser={handleLaunchInteractiveBrowser}
            activeBrowser={activeBrowser}
            onStopActiveBrowser={async () => {
              if (activeBrowser) await handleStopBrowser(activeBrowser.id);
            }}
          />
        )}

        {activeTab === 'runner' && (
          <AgentRunnerTab
            currentRun={currentRun}
            isRunning={isRunning}
            onStartRun={async (config) => { await handleStartRun(config); }}
            onCancelRun={handleCancelRun}
            onOpenPromptArchitectWithTask={(task) => {
              setActivePromptText(task);
              setActiveTab('architect');
            }}
            initialPrompt={activePromptText}
          />
        )}

        {activeTab === 'browser' && (
          <CloudBrowserTab
            activeBrowser={activeBrowser}
            isStarting={isStartingBrowser}
            onStartBrowser={handleStartBrowser}
            onStopBrowser={handleStopBrowser}
          />
        )}

        {activeTab === 'architect' && (
          <PromptArchitectTab
            onLoadIntoRunner={handleLoadArchitectIntoRunner}
            initialGoal={activePromptText}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateLibraryTab onSelectTemplate={handleSelectTemplate} />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            runs={runsHistory}
            onSelectRun={(run) => {
              setCurrentRun(run);
              setActiveTab('runner');
            }}
            onClearHistory={() => setRunsHistory([])}
          />
        )}
      </main>

      {/* API Key Guidance Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        status={status}
        onRefreshStatus={fetchStatus}
      />
    </div>
  );
}
