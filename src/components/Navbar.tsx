import React from 'react';
import {
  Globe,
  Bot,
  Play,
  Square,
  Sparkles,
  Layers,
  History,
  Key,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Monitor,
} from 'lucide-react';
import { StatusResponse, BrowserSession } from '../types/browserUse';

interface NavbarProps {
  activeTab: 'runner' | 'browser' | 'harvester' | 'architect' | 'templates' | 'history';
  onSelectTab: (tab: 'runner' | 'browser' | 'harvester' | 'architect' | 'templates' | 'history') => void;
  status: StatusResponse | null;
  activeBrowser: BrowserSession | null;
  onStopActiveBrowser: () => void;
  onOpenApiKeyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  status,
  activeBrowser,
  onStopActiveBrowser,
  onOpenApiKeyModal,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-md shadow-cyan-500/20">
            <Bot className="w-5 h-5 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                AI Browser Agent Builder
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Cloud v4
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous web agents & stealth cloud browsers with live observability
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
          {[
            { id: 'runner', label: 'Agent Runner', icon: Bot },
            { id: 'harvester', label: '🔐 Google & Keys', icon: Key },
            { id: 'browser', label: 'Cloud Browsers', icon: Monitor },
            { id: 'architect', label: 'Prompt Architect', icon: Sparkles },
            { id: 'templates', label: 'Templates', icon: Layers },
            { id: 'history', label: 'History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Controls, Active Browser Alert & API Key Status */}
        <div className="flex items-center space-x-2">
          {/* Active Browser Stop Button (if one is running) */}
          {activeBrowser && activeBrowser.status === 'running' && (
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="font-semibold hidden md:inline">Browser Active</span>
              <button
                onClick={onStopActiveBrowser}
                className="px-2 py-0.5 rounded bg-red-600/80 hover:bg-red-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                title="Stop browser to end billing and refund unused minutes"
              >
                Stop & Refund
              </button>
            </div>
          )}

          {/* Region Tag */}
          <div
            className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400"
            title="EU API Base URL: https://api.eu.browser-use.com/api/v4"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>EU Region</span>
          </div>

          {/* API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              status?.browserUseConfigured
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : status?.browserUseKeyPresent
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Browser Use Cloud API Credentials"
          >
            {status?.browserUseConfigured ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Connected</span>
                <span className="font-mono text-[10px] opacity-75">{status.browserUseKeyMasked}</span>
              </>
            ) : status?.browserUseKeyPresent ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>کلید نامعتبر (راهنما)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>حالت شبیه‌ساز (تنظیم کلید)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
