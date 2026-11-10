import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Bot,
  Trash2,
} from 'lucide-react';
import { AgentRun } from '../types/browserUse';

interface HistoryTabProps {
  runs: AgentRun[];
  onSelectRun: (run: AgentRun) => void;
  onClearHistory: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  runs,
  onSelectRun,
  onClearHistory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (run: AgentRun) => {
    const text =
      typeof run.result === 'string'
        ? run.result
        : JSON.stringify(run.result, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedId(run.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Agent Run History</span>
          </h2>
          <p className="text-xs text-slate-400">
            Audit trail of completed web tasks, timestamps, and extracted data
          </p>
        </div>

        {runs.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Runs Table / List */}
      {runs.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No Past Runs Recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Trigger an automation task in the Agent Runner to view execution logs, steps, and output snapshots here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div
              key={run.id}
              onClick={() => onSelectRun(run)}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-md"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      run.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : run.status === 'running'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {run.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {run.id.slice(0, 16)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400 font-mono">{run.model}</span>
                </div>

                <p className="text-xs font-medium text-slate-200 line-clamp-2">
                  {run.task}
                </p>

                <div className="text-[11px] text-slate-500">
                  {new Date(run.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {run.result && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(run);
                    }}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Output"
                  >
                    {copiedId === run.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
                <span className="text-xs text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  View Run &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
