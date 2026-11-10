import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Terminal,
  Github,
  ShoppingBag,
  CloudRain,
  CheckSquare,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { WorkflowTemplate } from '../types/browserUse';
import { WORKFLOW_TEMPLATES } from '../data/templates';

interface TemplateLibraryTabProps {
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

export const TemplateLibraryTab: React.FC<TemplateLibraryTabProps> = ({
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-amber-400" />;
      case 'Github':
        return <Github className="w-5 h-5 text-white" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-cyan-400" />;
      case 'CloudRain':
        return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'CheckSquare':
        return <CheckSquare className="w-5 h-5 text-emerald-400" />;
      default:
        return <Globe className="w-5 h-5 text-indigo-400" />;
    }
  };

  const filtered =
    selectedCategory === 'all'
      ? WORKFLOW_TEMPLATES
      : WORKFLOW_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Workflow Template Library</span>
          </h2>
          <p className="text-xs text-slate-400">
            Battle-tested automation recipes for web scraping, monitoring, and synthetic QA tests
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Templates' },
            { id: 'scraping', label: 'Scraping' },
            { id: 'research', label: 'Research' },
            { id: 'monitoring', label: 'Monitoring' },
            { id: 'qa', label: 'QA Testing' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 shadow-xl flex flex-col justify-between group transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-105 transition-transform">
                  {getIcon(item.icon)}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {item.description}
              </p>

              <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 line-clamp-3">
                {item.defaultPrompt}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono truncate max-w-[140px]">
                {item.targetUrl}
              </span>

              <button
                onClick={() => onSelectTemplate(item)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all cursor-pointer"
              >
                <span>Run in Agent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
