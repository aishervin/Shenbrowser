import React, { useEffect, useState } from 'react';
import {
  X,
  Volume2,
  BookmarkPlus,
  BookmarkCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  Brain,
  Layers,
} from 'lucide-react';
import { WordAnalysis, SavedWord } from '../types';
import { playPartnerSpeech } from '../utils/speech';

interface WordInspectorModalProps {
  word: string;
  contextSentence: string;
  targetLanguageName: string;
  languageCode: string;
  onClose: () => void;
  onSaveToDeck: (savedWord: Omit<SavedWord, 'id' | 'dateAdded'>) => void;
  isSaved: boolean;
}

export const WordInspectorModal: React.FC<WordInspectorModalProps> = ({
  word,
  contextSentence,
  targetLanguageName,
  languageCode,
  onClose,
  onSaveToDeck,
  isSaved,
}) => {
  const [analysis, setAnalysis] = useState<WordAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch('/api/analyze-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word,
        contextSentence,
        targetLanguage: targetLanguageName,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to analyze word');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setAnalysis(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError('Unable to analyze this word at the moment.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [word, contextSentence, targetLanguageName]);

  const handlePlayWordAudio = () => {
    setIsPlayingAudio(true);
    playPartnerSpeech({
      text: word,
      targetLanguage: targetLanguageName,
      languageCode,
      playbackRate: 0.9,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handleBookmark = () => {
    if (!analysis) return;
    onSaveToDeck({
      word: analysis.word,
      translation: analysis.definition,
      languageId: targetLanguageName.toLowerCase(),
      partOfSpeech: analysis.partOfSpeech,
      contextSentence: contextSentence,
      mastered: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500" />

        {/* Top actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Word Deep Dive • {targetLanguageName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium animate-pulse">
              Analyzing grammar, phonetics & usage for "{word}"...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-8 text-center text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Content */}
        {!isLoading && analysis && (
          <div className="mt-4 space-y-4">
            {/* Word title, phonetic, and audio button */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-baseline space-x-2.5">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{analysis.word}</h3>
                  {analysis.lemma && analysis.lemma !== analysis.word && (
                    <span className="text-xs text-slate-400">
                      (Base form: <span className="text-slate-200 font-semibold">{analysis.lemma}</span>)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-1">
                  {analysis.ipa && (
                    <span className="font-mono text-xs text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      /{analysis.ipa}/
                    </span>
                  )}
                  {analysis.partOfSpeech && (
                    <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      {analysis.partOfSpeech}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handlePlayWordAudio}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-slate-800 text-indigo-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Listen to native pronunciation"
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-xl transition-all cursor-pointer border ${
                    isSaved
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                  title={isSaved ? 'In your Vocabulary Deck' : 'Save to Vocabulary Deck'}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-5 h-5 text-amber-400" />
                  ) : (
                    <BookmarkPlus className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Meaning & Definition */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Meaning
              </span>
              <p className="text-sm font-medium text-slate-100">{analysis.definition}</p>
              {analysis.literalMeaning && (
                <p className="text-xs text-slate-400 mt-1 italic">
                  Literal: {analysis.literalMeaning}
                </p>
              )}
            </div>

            {/* Example in Context */}
            {analysis.exampleUsage && (
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Example in Conversation
                </span>
                <p className="text-xs font-semibold text-slate-200">
                  {analysis.exampleUsage.sentenceInTargetLanguage}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 italic">
                  {analysis.exampleUsage.translationInEnglish}
                </p>
              </div>
            )}

            {/* Memory Tip (Mnemonic) */}
            {analysis.memoryTip && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 flex items-start space-x-2.5">
                <Brain className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                    Memory Trick
                  </span>
                  <p className="text-xs text-slate-300">{analysis.memoryTip}</p>
                </div>
              </div>
            )}

            {/* Synonyms if any */}
            {analysis.synonyms && analysis.synonyms.length > 0 && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-medium">Similar:</span>
                <div className="flex flex-wrap gap-1">
                  {analysis.synonyms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
