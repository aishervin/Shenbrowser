import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  FileCode,
  Shield,
  Layers,
} from 'lucide-react';

interface PromptArchitectTabProps {
  onLoadIntoRunner: (prompt: string, model: string, proxyCountry: string) => void;
  initialGoal?: string;
}

export const PromptArchitectTab: React.FC<PromptArchitectTabProps> = ({
  onLoadIntoRunner,
  initialGoal = '',
}) => {
  const [goal, setGoal] = useState(
    initialGoal || 'Search for trending open-source AI developer tools on GitHub and extract star counts and descriptions.'
  );
  const [targetUrl, setTargetUrl] = useState('');
  const [outputFormat, setOutputFormat] = useState('JSON');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [result, setResult] = useState<{
    optimizedTask: string;
    recommendedModel: string;
    recommendedProxyCountry: string;
    estimatedSteps: number;
    outputSchemaDescription: string;
    tips: string[];
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/agent/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawPrompt: goal.trim(),
          targetUrl: targetUrl.trim(),
          desiredOutputFormat: outputFormat,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result?.optimizedTask) return;
    navigator.clipboard.writeText(result.optimizedTask);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 p-5 shadow-xl flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">AI Agent Prompt Architect (Gemini Powered)</h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
            Browser automation agents thrive on precision. Let Google Gemini formulate unambiguous starting URLs, sequential actions, modal dismissals, and deterministic schema outputs for highest Browser Use Cloud reliability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Automation Goal *
              </label>
              <textarea
                rows={4}
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What do you want the cloud browser to accomplish? (e.g. Scrape flight prices, monitor competitor discounts, test a signup flow)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Starting Target URL (Optional)
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="e.g. https://github.com/trending, https://amazon.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Desired Output Format
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="JSON">Strict Structured JSON</option>
                <option value="Markdown Table">Markdown Table with Summary</option>
                <option value="Text">Human-Readable Paragraph Digest</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !goal.trim()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Synthesizing Architecture...' : 'Architect Prompt with Gemini'}</span>
            </button>
          </form>
        </div>

        {/* Output Architecture Review */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Engineered Agent Task</h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() =>
                      onLoadIntoRunner(
                        result.optimizedTask,
                        result.recommendedModel || 'gpt-5.6-luna',
                        result.recommendedProxyCountry || 'de'
                      )
                    }
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <span>Load into Runner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Optimized Directive */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono leading-relaxed whitespace-pre-wrap select-all max-h-60 overflow-y-auto">
                {result.optimizedTask}
              </div>

              {/* Execution Recommendations */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Recommended Model</span>
                  <span className="font-semibold text-cyan-300">{result.recommendedModel}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Proxy</span>
                  <span className="font-semibold text-slate-200">
                    {result.recommendedProxyCountry ? `🇩🇪 ${result.recommendedProxyCountry.toUpperCase()} (Stealth)` : 'Direct IP'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Steps</span>
                  <span className="font-semibold text-slate-200">~{result.estimatedSteps} steps</span>
                </div>
              </div>

              {/* Reliability Tips */}
              {result.tips && result.tips.length > 0 && (
                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Engineering Recommendations
                  </span>
                  {result.tips.map((tip, idx) => (
                    <div key={idx} className="text-slate-300 text-[11px] flex items-start gap-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">Prompt Engineering Console</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Enter your automation intent on the left and click "Architect Prompt with Gemini" to generate a bulletproof Browser Use Cloud directive.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
