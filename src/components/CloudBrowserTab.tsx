import React, { useState } from 'react';
import {
  Monitor,
  Play,
  Square,
  Shield,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Video,
  Code,
  Info,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { BrowserSession } from '../types/browserUse';

interface CloudBrowserTabProps {
  activeBrowser: BrowserSession | null;
  isStarting: boolean;
  onStartBrowser: (options: {
    timeout: number;
    proxyCountryCode: string;
    enableRecording: boolean;
  }) => Promise<void>;
  onStopBrowser: (id: string) => Promise<void>;
}

export const CloudBrowserTab: React.FC<CloudBrowserTabProps> = ({
  activeBrowser,
  isStarting,
  onStartBrowser,
  onStopBrowser,
}) => {
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(10);
  const [proxyCountry, setProxyCountry] = useState<string>('de');
  const [enableRecording, setEnableRecording] = useState<boolean>(true);
  const [copiedCdp, setCopiedCdp] = useState(false);

  const handleStart = () => {
    onStartBrowser({
      timeout: timeoutMinutes,
      proxyCountryCode: proxyCountry,
      enableRecording,
    });
  };

  const handleCopyCdp = () => {
    if (!activeBrowser?.cdpUrl) return;
    navigator.clipboard.writeText(activeBrowser.cdpUrl);
    setCopiedCdp(true);
    setTimeout(() => setCopiedCdp(false), 2000);
  };

  const playwrightSample = activeBrowser?.cdpUrl
    ? `import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("${activeBrowser.cdpUrl}");
const page = await browser.newPage();
await page.goto("https://example.com");
console.log(await page.title());`
    : `import { chromium } from "playwright-core";

// Connect directly over CDP to your Browser Use Cloud instance
const browser = await chromium.connectOverCDP(cdpUrl);`;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Banner & Launcher Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Standalone Cloud Browser Infrastructure</h2>
              <p className="text-xs text-slate-400">
                Real cloud Chrome instances with stealth, residential proxies, and live CDP connectivity
              </p>
            </div>
          </div>

          {activeBrowser && activeBrowser.status === 'running' ? (
            <button
              onClick={() => onStopBrowser(activeBrowser.id)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/25 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop Browser & Refund Time</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isStarting ? 'Provisioning Cloud Chrome...' : 'Launch Cloud Browser'}</span>
            </button>
          )}
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Auto-Stop Timeout
            </label>
            <select
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
              disabled={activeBrowser?.status === 'running'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
            >
              <option value={5}>5 minutes (Quick check)</option>
              <option value={10}>10 minutes (Standard)</option>
              <option value={30}>30 minutes (Extended automation)</option>
              <option value={60}>60 minutes (Heavy workflow)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Residential Proxy Location
            </label>
            <select
              value={proxyCountry}
              onChange={(e) => setProxyCountry(e.target.value)}
              disabled={activeBrowser?.status === 'running'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
            >
              <option value="de">🇩🇪 Germany (Default EU stealth)</option>
              <option value="us">🇺🇸 United States</option>
              <option value="gb">🇬🇧 United Kingdom</option>
              <option value="none">Disabled (Datacenter IP)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-5">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={enableRecording}
                onChange={(e) => setEnableRecording(e.target.checked)}
                disabled={activeBrowser?.status === 'running'}
                className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-cyan-400" /> Enable Session Video
              </span>
            </label>
          </div>
        </div>

        {/* Billing rule note */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start space-x-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Cost Control Guarantee:</strong> When you click{' '}
            <span className="text-red-400 font-semibold">Stop & Refund</span>, Browser Use Cloud PATCHes{' '}
            <code className="text-cyan-300 font-mono text-[11px]">/api/v4/browsers/{'{id}'}</code> with{' '}
            <code className="text-cyan-300 font-mono text-[11px]">{`{"action":"stop"}`}</code>, immediately terminating the Chrome pod and refunding any unspent minutes.
          </div>
        </div>
      </div>

      {/* Active Browser Live Display */}
      {activeBrowser && activeBrowser.status === 'running' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Iframe Live Browser View */}
          <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                <span className="text-xs font-bold text-white">Live Remote Chrome Display</span>
                <span className="text-xs text-slate-500 font-mono">({activeBrowser.id.slice(0, 16)})</span>
              </div>
              <div className="flex items-center space-x-2">
                {activeBrowser.liveUrl && (
                  <a
                    href={activeBrowser.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:text-white transition-colors"
                  >
                    <span>Open Pop-out</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="relative w-full aspect-video bg-slate-950">
              {activeBrowser.liveUrl ? (
                <iframe
                  src={activeBrowser.liveUrl}
                  title="Remote Chrome Preview"
                  className="w-full h-full border-0"
                  allow="clipboard-read; clipboard-write"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Connecting to live cloud stream...
                </div>
              )}
            </div>
          </div>

          {/* CDP Connection & Integration Code Snippet */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">CDP Endpoint</h3>
                </div>
                <button
                  onClick={handleCopyCdp}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedCdp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCdp ? 'Copied' : 'Copy CDP URL'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all select-all">
                {activeBrowser.cdpUrl || 'Generating CDP WebSocket URL...'}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Connect from Playwright / Puppeteer
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto scrollbar-thin">
                  {playwrightSample}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-950/50 border border-slate-800/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Monitor className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No Standalone Cloud Browser Active</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Launch a dedicated cloud Chrome instance above to get an interactive live stream and a CDP WebSocket endpoint you can drive from your own Playwright, Puppeteer, or Selenium scripts.
          </p>
        </div>
      )}
    </div>
  );
};
