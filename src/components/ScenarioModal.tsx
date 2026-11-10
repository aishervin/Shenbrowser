import React, { useState } from 'react';
import {
  X,
  Compass,
  Coffee,
  Plane,
  Briefcase,
  MessageCircle,
  ShoppingBag,
  HeartPulse,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Scenario, CEFRLevel, Language } from '../types';
import { SCENARIOS, CEFR_LEVELS } from '../data/constants';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  currentLanguage: Language;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  currentScenario,
  onSelectScenario,
  currentLanguage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customMode, setCustomMode] = useState<boolean>(false);

  // Custom scenario form state
  const [customTitle, setCustomTitle] = useState('');
  const [customLevel, setCustomLevel] = useState<CEFRLevel>('A2');
  const [customPartnerRole, setCustomPartnerRole] = useState('');
  const [customUserRole, setCustomUserRole] = useState('');
  const [customSituation, setCustomSituation] = useState('');
  const [customObjective, setCustomObjective] = useState('');

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-400" />;
      case 'Plane':
        return <Plane className="w-5 h-5 text-sky-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-indigo-400" />;
      case 'MessageCircle':
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-fuchsia-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      default:
        return <Compass className="w-5 h-5 text-indigo-400" />;
    }
  };

  const filteredScenarios =
    selectedCategory === 'all'
      ? SCENARIOS
      : SCENARIOS.filter((s) => s.category === selectedCategory);

  const handleStartCustomScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customSituation || !customObjective) return;

    const custom: Scenario = {
      id: `custom-${Date.now()}`,
      title: customTitle,
      category: 'custom',
      level: customLevel,
      icon: 'Compass',
      situation: customSituation,
      partnerRole: customPartnerRole || 'Native Partner',
      userRole: customUserRole || 'Language Learner',
      objective: customObjective,
      initialMessage: {
        [currentLanguage.id]: `¡Hola! (Ready for our custom scenario: "${customTitle}")`,
      },
      initialEnglish: `Hello! Welcome to our custom practice scenario: "${customTitle}". Let's begin!`,
    };

    onSelectScenario(custom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Choose Practice Scenario</h2>
              <p className="text-xs text-slate-400">
                Immerse yourself in authentic real-life dialogues in {currentLanguage.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCustomMode(!customMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                customMode
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{customMode ? 'Browse Curated' : 'Custom Roleplay'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar (when in curated mode) */}
        {!customMode && (
          <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/50 flex items-center space-x-2 overflow-x-auto scrollbar-thin">
            {[
              { id: 'all', label: 'All Scenarios' },
              { id: 'dining', label: '☕ Dining & Food' },
              { id: 'travel', label: '✈️ Travel & Transit' },
              { id: 'work', label: '💼 Career & Interview' },
              { id: 'daily', label: '💬 Daily Banter' },
              { id: 'culture', label: '🎨 Art & Market' },
              { id: 'emergency', label: '🩺 Health & Pharmacy' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!customMode ? (
            /* Curated Scenarios Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredScenarios.map((sc) => {
                const isSelected = currentScenario.id === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      onSelectScenario(sc);
                      onClose();
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-105 transition-transform">
                            {getIcon(sc.icon)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {sc.title}
                            </h3>
                            <span className="text-[10px] font-semibold text-slate-400">
                              Level {sc.level}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                        {sc.situation}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        <strong>Target:</strong> {sc.objective}
                      </div>
                      <div className="flex items-center text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                        <span>Start</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Roleplay Creator Form */
            <form onSubmit={handleStartCustomScenario} className="space-y-4 max-w-xl mx-auto py-2">
              <div className="text-center space-y-1 mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 mb-1">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Create Custom Scenario</h3>
                <p className="text-xs text-slate-400">
                  Roleplay any situation, from ordering street food in Oaxaca to pitching a startup in Tokyo!
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Scenario Title *
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Renting a scooter in Bali, Asking for directions in Madrid"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    AI Partner's Role
                  </label>
                  <input
                    type="text"
                    value={customPartnerRole}
                    onChange={(e) => setCustomPartnerRole(e.target.value)}
                    placeholder="e.g., Scooter rental owner, Local guide"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Role
                  </label>
                  <input
                    type="text"
                    value={customUserRole}
                    onChange={(e) => setCustomUserRole(e.target.value)}
                    placeholder="e.g., Solo backpacker, Exchange student"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proficiency Level
                </label>
                <select
                  value={customLevel}
                  onChange={(e) => setCustomLevel(e.target.value as CEFRLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl.level} value={lvl.level}>
                      Level {lvl.level} ({lvl.label}) - {lvl.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Setting & Context *
                </label>
                <textarea
                  required
                  rows={2}
                  value={customSituation}
                  onChange={(e) => setCustomSituation(e.target.value)}
                  placeholder="Describe where this conversation takes place and what is happening..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Practice Goal / Objective *
                </label>
                <input
                  type="text"
                  required
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                  placeholder="e.g., Ask about daily insurance rates, helmet size, and return time"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Start Custom Roleplay
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
