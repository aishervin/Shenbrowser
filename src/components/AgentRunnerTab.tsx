import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Bot,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  RotateCw,
  Clock,
  Layers,
  Shield,
  Video,
  FileCode,
  FileText,
  AlertCircle,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { AgentRun, RunEventItem } from '../types/browserUse';

interface AgentRunnerTabProps {
  currentRun: AgentRun | null;
  isRunning: boolean;
  onStartRun: (config: {
    task: string;
    model: string;
    proxyCountryCode: string;
    record: boolean;
    keepAlive: number;
  }) => Promise<void>;
  onCancelRun: (runId: string) => Promise<void>;
  onOpenPromptArchitectWithTask?: (task: string) => void;
  initialPrompt?: string;
}

export const AgentRunnerTab: React.FC<AgentRunnerTabProps> = ({
  currentRun,
  isRunning,
  onStartRun,
  onCancelRun,
  onOpenPromptArchitectWithTask,
  initialPrompt = '',
}) => {
  const [taskPrompt, setTaskPrompt] = useState(
    initialPrompt ||
      'Go to https://news.ycombinator.com and extract the top 5 articles with their title, link, and points as a JSON list.'
  );
  const [model, setModel] = useState<string>('gpt-5.6-luna');
  const [proxyCountry, setProxyCountry] = useState<string>('de');
  const [recordVideo, setRecordVideo] = useState<boolean>(true);
  const [keepAlive, setKeepAlive] = useState<number>(120);

  const [copiedResult, setCopiedResult] = useState(false);
  const [activeResultView, setActiveResultView] = useState<'raw' | 'synthesized'>('raw');
  const [synthesizedReport, setSynthesizedReport] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showLiveBrowserFullscreen, setShowLiveBrowserFullscreen] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setTaskPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskPrompt.trim() || isRunning) return;
    setSynthesizedReport(null);
    onStartRun({
      task: taskPrompt.trim(),
      model,
      proxyCountryCode: proxyCountry,
      record: recordVideo,
      keepAlive,
    });
  };

  const handleCopyResult = () => {
    if (!currentRun?.result) return;
    const text =
      typeof currentRun.result === 'string'
        ? currentRun.result
        : JSON.stringify(currentRun.result, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleSynthesizeWithGemini = async () => {
    if (!currentRun?.result || isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/agent/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: currentRun.task,
          rawOutput: currentRun.result,
        }),
      });
      const data = await res.json();
      if (data.synthesizedText) {
        setSynthesizedReport(data.synthesizedText);
        setActiveResultView('synthesized');
      }
    } catch (err) {
      console.error('Synthesis failed:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Config Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-5 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Browser Agent Directive</h2>
            </div>
            {onOpenPromptArchitectWithTask && (
              <button
                type="button"
                onClick={() => onOpenPromptArchitectWithTask(taskPrompt)}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all cursor-pointer"
                title="Optimize with Gemini AI Prompt Architect"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Optimize with Gemini</span>
              </button>
            )}
          </div>

          {/* Task Input Textarea */}
          <div className="relative">
            <textarea
              rows={3}
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Describe the web task in plain English (e.g., 'Go to https://news.ycombinator.com and extract the top 10 articles with their points and author')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 leading-relaxed font-sans resize-y"
            />
          </div>

          {/* Configuration Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Managed Model */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Cloud Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="gpt-5.6-luna">gpt-5.6-luna (Fast & accurate - Recommended)</option>
                <option value="gpt-5.6-sol">gpt-5.6-sol (High reasoning for complex forms)</option>
              </select>
            </div>

            {/* Residential Proxy Country */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Residential Proxy
              </label>
              <select
                value={proxyCountry}
                onChange={(e) => setProxyCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="de">🇩🇪 Germany (Default EU proxy)</option>
                <option value="us">🇺🇸 United States</option>
                <option value="gb">🇬🇧 United Kingdom</option>
                <option value="fr">🇫🇷 France</option>
                <option value="none">Disabled (Direct cloud IP)</option>
              </select>
            </div>

            {/* KeepAlive Browser Duration */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Browser KeepAlive
              </label>
              <select
                value={keepAlive}
                onChange={(e) => setKeepAlive(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={120}>2 minutes (120s - Standard)</option>
                <option value={300}>5 minutes (300s)</option>
                <option value={600}>10 minutes (600s)</option>
              </select>
            </div>

            {/* Video Recording & Run Actions */}
            <div className="flex items-end justify-between gap-2">
              <label className="flex items-center space-x-2 text-xs text-slate-300 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordVideo}
                  onChange={(e) => setRecordVideo(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-cyan-400" /> Record Video
                </span>
              </label>

              {isRunning ? (
                <button
                  type="button"
                  onClick={() => currentRun && onCancelRun(currentRun.id)}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/20 transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Cancel Run</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!taskPrompt.trim()}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Agent</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Execution Monitor View */}
      {currentRun && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in">
          {/* Left / Top: Live Browser Screen & Status */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
              {/* Header with status */}
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      currentRun.status === 'running'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                        : currentRun.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : currentRun.status === 'cancelled'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {currentRun.status === 'running' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-1" />
                    )}
                    <span>{currentRun.status}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {currentRun.id.slice(0, 16)}</span>
                  {currentRun.isSimulated && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      Simulation Mode
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {currentRun.liveUrl && (
                    <a
                      href={currentRun.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Open Live Preview in New Tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Browser Screen / Canvas */}
              <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                {currentRun.liveUrl ? (
                  <iframe
                    src={currentRun.liveUrl}
                    title="Live Browser Observation"
                    className="w-full h-full border-0"
                    allow="clipboard-read; clipboard-write"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                      <Bot className="w-6 h-6 animate-pulse" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      {isRunning ? 'Cloud Browser Driving Web Page...' : 'Task Execution Screen'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {currentRun.task}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Extracted Output / Results Card */}
            {currentRun.result && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Agent Output</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSynthesizeWithGemini}
                      disabled={isSynthesizing}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>{isSynthesizing ? 'Synthesizing...' : 'Gemini Synthesis'}</span>
                    </button>

                    <button
                      onClick={handleCopyResult}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedResult ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* View switcher if synthesized report exists */}
                {synthesizedReport && (
                  <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 w-fit text-xs">
                    <button
                      onClick={() => setActiveResultView('raw')}
                      className={`px-2.5 py-1 rounded ${activeResultView === 'raw' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'}`}
                    >
                      Raw JSON
                    </button>
                    <button
                      onClick={() => setActiveResultView('synthesized')}
                      className={`px-2.5 py-1 rounded ${activeResultView === 'synthesized' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'}`}
                    >
                      AI Synthesis
                    </button>
                  </div>
                )}

                {activeResultView === 'synthesized' && synthesizedReport ? (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {synthesizedReport}
                  </div>
                ) : (
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-80 overflow-y-auto scrollbar-thin">
                    {typeof currentRun.result === 'string'
                      ? currentRun.result
                      : JSON.stringify(currentRun.result, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Right / Bottom: Action Steps Timeline & Live Logs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-4 flex flex-col h-[560px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Action Steps & Events</h3>
                </div>
                <span className="text-xs text-slate-400">
                  {currentRun.events ? `${currentRun.events.length} events` : 'Streaming'}
                </span>
              </div>

              {/* Event Stream */}
              <div className="flex-1 overflow-y-auto pt-3 space-y-3 font-mono text-xs">
                {currentRun.events && currentRun.events.length > 0 ? (
                  currentRun.events.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-cyan-400 font-bold uppercase">{ev.type}</span>
                        <span>{new Date(ev.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-200 text-xs break-words">
                        {typeof ev.data === 'object'
                          ? JSON.stringify(ev.data, null, 2)
                          : String(ev.data || '')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                    <Clock className="w-6 h-6 animate-spin text-slate-400" />
                    <p className="text-xs">Connecting to cloud browser stream...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
