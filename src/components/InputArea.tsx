import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Radio,
  Volume2,
  X,
  Languages,
} from 'lucide-react';
import { SuggestedReply } from '../types';
import { SpeechRecognizer, isSpeechRecognitionSupported, MicVisualizer } from '../utils/speech';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  suggestedReplies: SuggestedReply[];
  isAiResponding: boolean;
  languageCode: string;
  targetLanguageName: string;
  onHelpMeReply: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  suggestedReplies,
  isAiResponding,
  languageCode,
  targetLanguageName,
  onHelpMeReply,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const visualizerRef = useRef<MicVisualizer | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize SpeechRecognizer
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      recognizerRef.current = new SpeechRecognizer(languageCode, {
        onStart: () => {
          setIsListening(true);
          setSpeechError(null);
        },
        onInterimResult: (interim) => {
          setInterimTranscript(interim);
        },
        onFinalResult: (final) => {
          setInputText((prev) => (prev ? `${prev} ${final}` : final));
          setInterimTranscript('');
        },
        onError: (err) => {
          console.warn('Speech recognition error in component:', err);
          if (err === 'not-allowed') {
            setSpeechError('Microphone permission denied. Please allow microphone access.');
          } else {
            setSpeechError(`Speech error: ${err}`);
          }
          setIsListening(false);
          visualizerRef.current?.stop();
        },
        onEnd: () => {
          setIsListening(false);
          setInterimTranscript('');
          visualizerRef.current?.stop();
        },
      });
    }

    return () => {
      recognizerRef.current?.stop();
      visualizerRef.current?.stop();
    };
  }, [languageCode]);

  // Update speech recognizer language when target language changes
  useEffect(() => {
    if (recognizerRef.current) {
      recognizerRef.current.setLanguage(languageCode);
    }
  }, [languageCode]);

  const toggleListening = async () => {
    if (isListening) {
      recognizerRef.current?.stop();
      visualizerRef.current?.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      if (!isSpeechRecognitionSupported()) {
        setSpeechError('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your response.');
        return;
      }

      // Start mic visualizer
      visualizerRef.current = new MicVisualizer();
      visualizerRef.current.start((vol) => setMicVolume(vol));

      recognizerRef.current?.start();
    }
  };

  const handleSend = () => {
    const trimmed = (inputText + (interimTranscript ? ` ${interimTranscript}` : '')).trim();
    if (!trimmed || isAiResponding) return;

    if (isListening) {
      recognizerRef.current?.stop();
      visualizerRef.current?.stop();
      setIsListening(false);
    }

    onSendMessage(trimmed);
    setInputText('');
    setInterimTranscript('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 py-3 space-y-3">
      {/* Suggested Quick Replies (Hints / Smart Prompts) */}
      {suggestedReplies && suggestedReplies.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Suggested:</span>
          </div>
          {suggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(reply.text);
                textareaRef.current?.focus();
              }}
              className="group flex flex-col text-left px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition-all cursor-pointer shrink-0 max-w-xs sm:max-w-sm shadow-sm"
              title="Click to populate input with this reply"
            >
              <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                {reply.text}
              </span>
              <span className="text-[10px] text-slate-400 italic truncate w-full">
                {reply.english}
              </span>
            </button>
          ))}
          <button
            onClick={onHelpMeReply}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs shrink-0 cursor-pointer"
            title="Generate more suggestions"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>
      )}

      {/* Live Voice Recording Status & Audio Visualizer */}
      {isListening && (
        <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/40 p-2.5 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              {[40, 75, 55, 90, 65, 80, 50].map((h, i) => {
                const dynamicHeight = Math.max(15, Math.min(100, h * (micVolume * 1.8 + 0.3)));
                return (
                  <span
                    key={i}
                    style={{ height: `${dynamicHeight}%` }}
                    className="w-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full transition-all duration-75"
                  />
                );
              })}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-indigo-300">
                  Listening in {targetLanguageName}...
                </span>
              </div>
              <p className="text-xs text-slate-300 italic mt-0.5 max-w-md truncate">
                {interimTranscript || 'Speak naturally into your microphone...'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleListening}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors cursor-pointer"
          >
            Done Speaking
          </button>
        </div>
      )}

      {/* Speech Error Banner if any */}
      {speechError && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 flex items-center justify-between text-xs text-amber-300 animate-in fade-in">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="p-0.5 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Control Bar */}
      <div className="flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner">
        {/* Microphone Toggle Button */}
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-xl transition-all cursor-pointer relative shrink-0 ${
            isListening
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80'
          }`}
          title={isListening ? 'Stop listening' : `Speak in ${targetLanguageName} (Microphone)`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-indigo-400" />}
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type or speak in ${targetLanguageName}... (Press Enter to send)`}
          rows={1}
          className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none py-2 px-1 max-h-32 leading-relaxed"
          style={{ height: 'auto', minHeight: '38px' }}
        />

        {/* Clear Button */}
        {inputText && (
          <button
            onClick={() => setInputText('')}
            className="p-2 text-slate-500 hover:text-slate-300 cursor-pointer shrink-0"
            title="Clear text"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!inputText.trim() && !interimTranscript.trim()) || isAiResponding}
          className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            (inputText.trim() || interimTranscript.trim()) && !isAiResponding
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 scale-100'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
          title="Send message (Enter)"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>
          💡 <strong className="text-slate-400">Pro-tip:</strong> Click any word in conversation bubbles to see its breakdown & phonetics.
        </span>
        <span className="hidden sm:inline">
          CEFR practice with instant AI grammar coaching
        </span>
      </div>
    </div>
  );
};
