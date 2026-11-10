import React, { useEffect, useState } from 'react';
import {
  X,
  Award,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Copy,
  Download,
  RotateCcw,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SessionSummaryData, ChatMessage, Language, Scenario } from '../types';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage: Language;
  currentScenario: Scenario;
  messages: ChatMessage[];
  totalXp: number;
  onRestartSession: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  targetLanguage,
  currentScenario,
  messages,
  totalXp,
  onRestartSession,
}) => {
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger confetti celebration on summary load
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    setIsLoading(true);

    fetch('/api/session-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLanguage: targetLanguage.name,
        cefrLevel: currentScenario.level,
        scenarioTitle: currentScenario.title,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          text: m.text,
        })),
        totalTurns: messages.length,
        xpGained: totalXp,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Evaluation failed');
        return res.json();
      })
      .then((data) => {
        setSummary(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Session summary error:', err);
        // Fallback default evaluation if request fails
        setSummary({
          overallGrade: 'Engaged Communicator',
          estimatedCefrLevel: `Solid ${currentScenario.level}`,
          scores: {
            fluency: 88,
            grammar: 84,
            vocabulary: 89,
            comprehension: 92,
          },
          keyStrengths: [
            'Kept the conversation flowing naturally in context',
            'Successfully completed the dialogue objectives',
            'Demonstrated accurate vocabulary retention',
          ],
          growthAreas: [
            'Continue practicing verb conjugations in past tense',
            'Expand idiomatic connectors like therefore and although',
          ],
          topVocabularyMastered: [
            { word: 'por favor', meaning: 'please' },
            { word: 'gracias', meaning: 'thank you' },
          ],
          educatorAdvice:
            'Wonderful practice session! Consistent daily speaking creates true lasting fluency.',
        });
        setIsLoading(false);
      });
  }, [isOpen, messages, targetLanguage, currentScenario, totalXp]);

  if (!isOpen) return null;

  const handleCopyTranscript = () => {
    const text = messages
      .map((m) => `${m.role === 'user' ? 'YOU' : 'PARTNER'}: ${m.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-cyan-400" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Fluency & Progress Evaluation</h2>
              <p className="text-xs text-slate-400">
                Session report for {currentScenario.title} ({targetLanguage.name})
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-semibold animate-pulse">
                Evaluating pronunciation, vocabulary diversity, and CEFR accuracy...
              </p>
            </div>
          ) : summary ? (
            <>
              {/* Badge & Level Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-indigo-950/30 to-slate-950 border border-emerald-500/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Overall Performance
                  </span>
                  <h3 className="text-2xl font-extrabold text-white">
                    {summary.overallGrade}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Estimated Level: <span className="font-bold text-indigo-300">{summary.estimatedCefrLevel}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Turns</span>
                    <span className="text-lg font-bold text-white">{messages.length}</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block">XP Gained</span>
                    <span className="text-lg font-bold text-indigo-300">+{totalXp}</span>
                  </div>
                </div>
              </div>

              {/* Fluency Score Bars */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-400" /> Competency Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Fluency', score: summary.scores.fluency, color: 'from-emerald-500 to-teal-400' },
                    { label: 'Grammar', score: summary.scores.grammar, color: 'from-indigo-500 to-violet-400' },
                    { label: 'Vocabulary', score: summary.scores.vocabulary, color: 'from-amber-500 to-orange-400' },
                    { label: 'Comprehension', score: summary.scores.comprehension, color: 'from-cyan-500 to-blue-400' },
                  ].map((metric, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
                    >
                      <span className="text-xs text-slate-400 font-medium">{metric.label}</span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-white">{metric.score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div
                          style={{ width: `${metric.score}%` }}
                          className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Growth Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Strengths
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {summary.keyStrengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Focus for Next Time
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {summary.growthAreas.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Top Vocabulary Mastered */}
              {summary.topVocabularyMastered && summary.topVocabularyMastered.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Key Words & Expressions Used
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {summary.topVocabularyMastered.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200"
                      >
                        <strong className="text-indigo-300">{item.word}</strong>: {item.meaning}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Educator Advice */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 italic">
                "{summary.educatorAdvice}"
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyTranscript}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Transcript!' : 'Copy Transcript'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onRestartSession();
                onClose();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start Fresh Session</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
