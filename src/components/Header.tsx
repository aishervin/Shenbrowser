import React from 'react';
import {
  Globe,
  Sparkles,
  BookOpen,
  Volume2,
  Sliders,
  CheckCircle2,
  Flame,
  Award,
  ChevronDown,
  Eye,
  EyeOff,
  User,
  Compass,
} from 'lucide-react';
import { Language, PartnerPersona, CEFRLevel } from '../types';
import { SUPPORTED_LANGUAGES, CEFR_LEVELS } from '../data/constants';

interface HeaderProps {
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  currentLevel: CEFRLevel;
  onSelectLevel: (level: CEFRLevel) => void;
  currentPersona: PartnerPersona;
  onOpenPersonaModal: () => void;
  onOpenScenarioModal: () => void;
  onOpenVocabularyModal: () => void;
  onOpenSummaryModal: () => void;
  savedWordsCount: number;
  totalXp: number;
  streakDays: number;
  immersionMode: boolean;
  onToggleImmersion: () => void;
  showRomanization: boolean;
  onToggleRomanization: () => void;
  speechSpeed: number;
  onChangeSpeed: (speed: number) => void;
  turnsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onSelectLanguage,
  currentLevel,
  onSelectLevel,
  currentPersona,
  onOpenPersonaModal,
  onOpenScenarioModal,
  onOpenVocabularyModal,
  onOpenSummaryModal,
  savedWordsCount,
  totalXp,
  streakDays,
  immersionMode,
  onToggleImmersion,
  showRomanization,
  onToggleRomanization,
  speechSpeed,
  onChangeSpeed,
  turnsCount,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = React.useState(false);

  const activeLevelObj = CEFR_LEVELS.find((l) => l.level === currentLevel) || CEFR_LEVELS[1];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Partner Preview */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  LinguaFlow
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live Partner
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Practicing with <span className="text-slate-200 font-medium">{currentPersona.name}</span> ({currentLanguage.name})
              </p>
            </div>
          </div>

          {/* Scenario Trigger */}
          <button
            onClick={onOpenScenarioModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-all cursor-pointer shadow-sm"
            title="Change practice scenario or topic"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Change Scenario</span>
            <span className="md:hidden">Scenario</span>
          </button>
        </div>

        {/* Core Controls: Language, Level, Partner Persona */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200 hover:border-indigo-500/50 hover:bg-slate-850 transition-all cursor-pointer"
            >
              <span className="text-sm">{currentLanguage.flag}</span>
              <span>{currentLanguage.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-56 max-h-80 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Target Language
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        onSelectLanguage(lang);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        currentLanguage.id === lang.id
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{lang.flag}</span>
                        <div className="text-left">
                          <div>{lang.name}</div>
                          <div className="text-[10px] text-slate-400">{lang.nativeName}</div>
                        </div>
                      </div>
                      {currentLanguage.id === lang.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* CEFR Level Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLevelDropdownOpen(!levelDropdownOpen)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${activeLevelObj.color}`}
              title="Target CEFR Language Proficiency Level"
            >
              <span>Level {currentLevel}</span>
              <span className="text-[10px] font-normal opacity-80 hidden sm:inline">({activeLevelObj.label})</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {levelDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLevelDropdownOpen(false)}
                />
                <div className="absolute right-0 sm:left-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Proficiency (CEFR Level)
                  </div>
                  {CEFR_LEVELS.map((lvl) => (
                    <button
                      key={lvl.level}
                      onClick={() => {
                        onSelectLevel(lvl.level);
                        setLevelDropdownOpen(false);
                      }}
                      className={`w-full flex flex-col text-left px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        currentLevel === lvl.level
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{lvl.level} — {lvl.label}</span>
                        {currentLevel === lvl.level && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Partner Persona Switcher */}
          <button
            onClick={onOpenPersonaModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
            title="Choose AI partner avatar, personality, and voice"
          >
            <img
              src={currentPersona.avatar}
              alt={currentPersona.name}
              className="w-4 h-4 rounded-full object-cover ring-1 ring-indigo-400"
            />
            <span className="hidden sm:inline">{currentPersona.name}</span>
          </button>

          {/* Immersion Mode Toggle */}
          <button
            onClick={onToggleImmersion}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              immersionMode
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={immersionMode ? 'Immersion Mode Active: Translations hidden by default' : 'Assisted Mode: Translations shown'}
          >
            {immersionMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Immersion</span>
          </button>

          {/* Romanization / Pinyin toggle if non-Latin */}
          {currentLanguage.romanizationName && (
            <button
              onClick={onToggleRomanization}
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                showRomanization
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title={`Toggle ${currentLanguage.romanizationName} phonetics`}
            >
              <span className="text-[11px] font-bold">Aa</span>
              <span className="hidden sm:inline">{currentLanguage.romanizationName}</span>
            </button>
          )}

          {/* Speech Speed Pill */}
          <button
            onClick={() => {
              const speeds = [0.75, 1.0, 1.25];
              const nextIndex = (speeds.indexOf(speechSpeed) + 1) % speeds.length;
              onChangeSpeed(speeds[nextIndex]);
            }}
            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
            title="Speech Playback Speed (0.75x slow, 1.0x normal, 1.25x fast)"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{speechSpeed}x</span>
          </button>

          {/* Vocabulary Deck Button */}
          <button
            onClick={onOpenVocabularyModal}
            className="relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
            title="Saved Vocabulary & Flashcards"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Deck</span>
            {savedWordsCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {savedWordsCount}
              </span>
            )}
          </button>

          {/* Stats: XP & Streak */}
          <div className="hidden lg:flex items-center space-x-2 pl-1 border-l border-slate-800">
            <div className="flex items-center space-x-1 text-xs text-amber-400 font-semibold" title="Current Practice Streak">
              <Flame className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400" />
              <span>{streakDays}d</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-indigo-400 font-bold" title="Total XP Earned">
              <Award className="w-3.5 h-3.5" />
              <span>{totalXp} XP</span>
            </div>
          </div>

          {/* Complete / Evaluation Summary Trigger */}
          {turnsCount >= 2 && (
            <button
              onClick={onOpenSummaryModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer animate-in fade-in"
              title="End session and get AI Fluency & Grammar Evaluation"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>End & Evaluate</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
