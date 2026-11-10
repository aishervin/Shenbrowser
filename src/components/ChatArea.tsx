import React, { useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookmarkPlus,
  BookmarkCheck,
  RotateCcw,
  Compass,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage, PartnerPersona, Scenario, VocabularyWord } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  partner: PartnerPersona;
  scenario: Scenario;
  targetLanguageName: string;
  isAiResponding: boolean;
  playingAudioMessageId: string | null;
  onPlayAudio: (message: ChatMessage) => void;
  onStopAudio: () => void;
  onWordClick: (word: string, contextSentence: string) => void;
  onSaveVocabulary: (vocab: VocabularyWord, contextSentence: string) => void;
  savedWordMap: Record<string, boolean>;
  immersionMode: boolean;
  showRomanization: boolean;
  onOpenScenarioModal: () => void;
  onSelectSuggestedReply?: (text: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  partner,
  scenario,
  targetLanguageName,
  isAiResponding,
  playingAudioMessageId,
  onPlayAudio,
  onStopAudio,
  onWordClick,
  onSaveVocabulary,
  savedWordMap,
  immersionMode,
  showRomanization,
  onOpenScenarioModal,
  onSelectSuggestedReply,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [revealedTranslations, setRevealedTranslations] = React.useState<Record<string, boolean>>({});
  const [expandedFeedback, setExpandedFeedback] = React.useState<Record<string, boolean>>({});

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  const toggleTranslation = (id: string) => {
    setRevealedTranslations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleFeedback = (id: string) => {
    setExpandedFeedback((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper to split text into clickable words while preserving punctuation
  const renderClickableWords = (text: string, fullSentence: string) => {
    const tokens = text.split(/(\s+|[.,!?:;¡¿"()]+)/);
    return tokens.map((token, index) => {
      const cleanWord = token.replace(/^[.,!?:;¡¿"()]+|[.,!?:;¡¿"()]+$/g, '').trim();
      const isWord = cleanWord.length > 0 && !/^\s+$/.test(cleanWord);

      if (!isWord) {
        return <span key={index}>{token}</span>;
      }

      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onWordClick(cleanWord, fullSentence);
          }}
          className="inline-block cursor-pointer px-0.5 rounded hover:bg-indigo-500/30 hover:text-indigo-200 transition-colors border-b border-transparent hover:border-indigo-400"
          title={`Click to analyze "${cleanWord}"`}
        >
          {token}
        </span>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Scenario Brief Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Active Mission
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">Level {scenario.level}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">{scenario.title}</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              <strong className="text-slate-200">Goal:</strong> {scenario.objective}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenScenarioModal}
          className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
        >
          Explore Scenarios
        </button>
      </div>

      {/* Messages Stream */}
      <div className="space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isPlaying = playingAudioMessageId === msg.id;
          const showTrans = !immersionMode || revealedTranslations[msg.id];
          const hasFeedback = msg.feedback && msg.feedback.hasFeedback;
          const isFeedbackOpen = expandedFeedback[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`flex items-start gap-2.5 sm:gap-3 max-w-[94%] sm:max-w-[85%] md:max-w-[78%] ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                {!isUser ? (
                  <div className="relative shrink-0 mt-1">
                    <img
                      src={partner.avatar}
                      alt={partner.name}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover ring-2 transition-all ${
                        isPlaying
                          ? 'ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105'
                          : 'ring-slate-800'
                      }`}
                    />
                    {isPlaying && (
                      <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0 mt-1">
                    You
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 shadow-md transition-all ${
                    isUser
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm border border-indigo-500/40'
                      : 'bg-slate-900/90 text-slate-100 rounded-tl-sm border border-slate-800/80 backdrop-blur-sm'
                  }`}
                >
                  {/* Speaker Name for AI */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-slate-800/60">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-indigo-300">{partner.name}</span>
                        <span className="text-[10px] text-slate-400">({partner.title})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => (isPlaying ? onStopAudio() : onPlayAudio(msg))}
                          className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                            isPlaying
                              ? 'bg-indigo-500 text-white animate-pulse'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={isPlaying ? 'Stop audio' : 'Listen with native voice'}
                        >
                          {isPlaying ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </button>
                        {msg.replyEnglish && (
                          <button
                            onClick={() => toggleTranslation(msg.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                            title={showTrans ? 'Hide translation' : 'Show translation'}
                          >
                            {showTrans ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main Target Language Text (Interactive Words) */}
                  <div className="text-sm sm:text-[15px] leading-relaxed tracking-normal select-text">
                    {renderClickableWords(msg.text, msg.text)}
                  </div>

                  {/* Romanization (Romaji / Pinyin) */}
                  {showRomanization && msg.transliteration && !isUser && (
                    <div className="mt-1.5 pt-1 text-xs font-mono text-cyan-300/80 italic border-t border-slate-800/50">
                      {msg.transliteration}
                    </div>
                  )}

                  {/* English Translation */}
                  {msg.replyEnglish && showTrans && !isUser && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300/90 italic flex items-start gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 not-italic tracking-wider shrink-0 mt-0.5">
                        EN
                      </span>
                      <span>{msg.replyEnglish}</span>
                    </div>
                  )}

                  {/* Vocabulary Highlights */}
                  {msg.vocabulary && msg.vocabulary.length > 0 && !isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-800/70">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Key Vocabulary
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.vocabulary.map((vocab, vIndex) => {
                          const isSaved = savedWordMap[vocab.word.toLowerCase()];
                          return (
                            <button
                              key={vIndex}
                              onClick={() => onSaveVocabulary(vocab, msg.text)}
                              className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                                isSaved
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                              }`}
                              title={isSaved ? 'Saved in Vocabulary Deck' : 'Save to Vocabulary Deck'}
                            >
                              <span className="font-semibold">{vocab.word}</span>
                              <span className="text-[10px] text-slate-400">({vocab.translation})</span>
                              {isSaved ? (
                                <BookmarkCheck className="w-3 h-3 text-amber-400" />
                              ) : (
                                <BookmarkPlus className="w-3 h-3 text-slate-400 hover:text-amber-300" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Pedagogical Feedback Card for User Messages */}
              {isUser && msg.feedback && (
                <div className="mt-2 w-full max-w-[94%] sm:max-w-[85%] md:max-w-[78%] animate-in fade-in slide-in-from-top-1">
                  {hasFeedback ? (
                    <div className="rounded-xl bg-slate-900/90 border border-amber-500/30 p-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              msg.feedback.quality === 'Excellent'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : msg.feedback.quality === 'Good'
                                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            Coaching Tip: {msg.feedback.quality}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleFeedback(msg.id)}
                          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {isFeedbackOpen ? 'Hide analysis' : 'View details'}
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-slate-200">
                        {msg.feedback.critique}
                      </div>

                      {msg.feedback.improvedVersion && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
                              Native Way to Say It:
                            </span>
                            <span className="text-xs font-medium text-emerald-300">
                              {msg.feedback.improvedVersion}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              onPlayAudio({
                                ...msg,
                                text: msg.feedback!.improvedVersion,
                              })
                            }
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                            title="Listen to native pronunciation"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                        </div>
                      )}

                      {isFeedbackOpen && msg.feedback.grammarPoints && msg.feedback.grammarPoints.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5">
                          {msg.feedback.grammarPoints.map((gp, gIndex) => (
                            <div key={gIndex} className="text-[11px] text-slate-300">
                              <span className="font-semibold text-indigo-300">
                                • {gp.concept}:
                              </span>{' '}
                              <span className="text-slate-400">{gp.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-400/90 font-medium px-2 py-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Natural & grammatically accurate! (+{msg.xpEarned || 25} XP)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isAiResponding && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs py-2 animate-in fade-in">
            <div className="w-9 h-9 rounded-2xl ring-2 ring-indigo-500/50 overflow-hidden shrink-0">
              <img
                src={partner.avatar}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center space-x-2">
              <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              </div>
              <span className="text-xs text-slate-300 font-medium">
                {partner.name} is listening & replying in {targetLanguageName}...
              </span>
            </div>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>
    </div>
  );
};
