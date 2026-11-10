import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Volume2,
  Trash2,
  CheckCircle2,
  RotateCw,
  Search,
  Download,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { SavedWord } from '../types';
import { playPartnerSpeech } from '../utils/speech';

interface VocabularyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedWords: SavedWord[];
  onToggleMastered: (id: string) => void;
  onDeleteWord: (id: string) => void;
  targetLanguageName: string;
  languageCode: string;
}

export const VocabularyDrawer: React.FC<VocabularyDrawerProps> = ({
  isOpen,
  onClose,
  savedWords,
  onToggleMastered,
  onDeleteWord,
  targetLanguageName,
  languageCode,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'flashcards'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredWords = savedWords.filter(
    (w) =>
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayWord = (word: string) => {
    setPlayingWord(word);
    playPartnerSpeech({
      text: word,
      targetLanguage: targetLanguageName,
      languageCode,
      playbackRate: 0.9,
      onEnd: () => setPlayingWord(null),
      onError: () => setPlayingWord(null),
    });
  };

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(savedWords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `linguaflow-vocabulary-${targetLanguageName.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const currentFlashcard = filteredWords[flashcardIndex] || null;

  const nextFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev + 1) % (filteredWords.length || 1));
  };

  const prevFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev - 1 + filteredWords.length) % (filteredWords.length || 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Vocabulary Deck</h2>
              <p className="text-xs text-slate-400">
                {savedWords.length} words saved from your conversations
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

        {/* Tab switch & Search */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-800 space-y-3">
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Word List ({filteredWords.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('flashcards');
                setIsFlipped(false);
                setFlashcardIndex(0);
              }}
              disabled={filteredWords.length === 0}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'flashcards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              Flashcards Practice
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search word or meaning..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {savedWords.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Your deck is currently empty</p>
              <p className="text-xs text-slate-400 max-w-xs">
                During conversations, click any word or tap the "+ Bookmark" chips on your partner’s messages to build your personal practice deck!
              </p>
            </div>
          ) : activeTab === 'list' ? (
            <div className="space-y-2.5">
              {filteredWords.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{item.word}</span>
                      {item.partOfSpeech && (
                        <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                          {item.partOfSpeech}
                        </span>
                      )}
                      {item.mastered && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Mastered
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300">{item.translation}</div>
                    {item.contextSentence && (
                      <div className="text-[11px] text-slate-500 italic truncate max-w-xs">
                        "{item.contextSentence}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handlePlayWord(item.word)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Listen"
                    >
                      <Volume2 className="w-4 h-4 text-indigo-400" />
                    </button>
                    <button
                      onClick={() => onToggleMastered(item.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        item.mastered
                          ? 'text-emerald-400 hover:bg-emerald-950/40'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                      }`}
                      title={item.mastered ? 'Mark as Review' : 'Mark as Mastered'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteWord(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Flashcard Practice Mode */
            <div className="h-full flex flex-col justify-between py-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>
                  Card {flashcardIndex + 1} of {filteredWords.length}
                </span>
                <span className="text-[11px]">Tap card to flip</span>
              </div>

              {currentFlashcard && (
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="flex-1 min-h-[260px] max-h-[340px] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border-2 border-indigo-500/30 p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-xl relative transition-all duration-300 hover:border-indigo-400/60"
                >
                  <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    {isFlipped ? 'Meaning' : 'Target Language'}
                  </span>

                  {!isFlipped ? (
                    <div className="space-y-3">
                      <h3 className="text-3xl font-extrabold text-white tracking-tight">
                        {currentFlashcard.word}
                      </h3>
                      {currentFlashcard.partOfSpeech && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {currentFlashcard.partOfSpeech}
                        </span>
                      )}
                      <p className="text-xs text-slate-400 pt-2 flex items-center justify-center gap-1">
                        <RotateCw className="w-3.5 h-3.5 text-indigo-400" /> Click to reveal English meaning
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in zoom-in-95">
                      <p className="text-xl font-bold text-emerald-300">
                        {currentFlashcard.translation}
                      </p>
                      {currentFlashcard.contextSentence && (
                        <p className="text-xs text-slate-300 italic max-w-xs border-t border-slate-800 pt-3">
                          "{currentFlashcard.contextSentence}"
                        </p>
                      )}
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayWord(currentFlashcard.word);
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 hover:bg-indigo-600/50"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Listen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Flashcard Nav controls */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={prevFlashcard}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentFlashcard && (
                  <button
                    onClick={() => onToggleMastered(currentFlashcard.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      currentFlashcard.mastered
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {currentFlashcard.mastered ? '✓ Mastered' : 'Mark Mastered'}
                  </button>
                )}

                <button
                  onClick={nextFlashcard}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {savedWords.length > 0 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Deck (.json)</span>
            </button>
            <span className="text-xs text-slate-500">
              {savedWords.filter((w) => w.mastered).length} / {savedWords.length} mastered
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
