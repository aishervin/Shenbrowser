import React from 'react';
import {
  X,
  Key,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { StatusResponse } from '../types/browserUse';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: StatusResponse | null;
  onRefreshStatus: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
}) => {
  const [copiedKeyName, setCopiedKeyName] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyVarName = () => {
    navigator.clipboard.writeText('BROWSER_USE_API_KEY');
    setCopiedKeyName(true);
    setTimeout(() => setCopiedKeyName(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Browser Use Cloud Credentials</h2>
              <p className="text-xs text-slate-400">
                EU Region endpoint: <code className="text-cyan-300 font-mono">api.eu.browser-use.com/api/v4</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connection Status Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Integration Status:</span>
            {status?.browserUseConfigured ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Connected ({status.browserUseKeyMasked})</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Not Detected</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 pt-1">
            {status?.browserUseConfigured
              ? 'Your Browser Use Cloud EU credentials are authenticated. All agent runs and cloud browser instances will provision over real stealth residential proxies.'
              : 'The BROWSER_USE_API_KEY environment secret is not set yet. The applet will run in interactive Simulation Mode until you add your key.'}
          </p>
        </div>

        {/* 3 Step Setup Guide */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            How to Connect Your Key (1-Minute Setup)
          </h3>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <div className="flex-1">
                <span>Create an EU API key on Browser Use Cloud dashboard:</span>
                <a
                  href="https://cloud.eu.browser-use.com/settings?tab=api-keys&new=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold underline block"
                >
                  <span>cloud.eu.browser-use.com/settings (1-click key)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <div className="flex-1">
                <span>In AI Studio, open the <strong>Settings &gt; Secrets</strong> panel and add:</span>
                <div className="mt-1 flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  <span>BROWSER_USE_API_KEY</span>
                  <button
                    onClick={handleCopyVarName}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Copy secret name"
                  >
                    {copiedKeyName ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <div className="flex-1">
                <span>Click <strong>Check Connection</strong> below to verify your active key!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onRefreshStatus}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <span>Check Connection</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
