import React from 'react';
import { X, User, Volume2, CheckCircle2, Sparkles } from 'lucide-react';
import { PartnerPersona, Language } from '../types';
import { PARTNER_PERSONAS } from '../data/constants';
import { playPartnerSpeech } from '../utils/speech';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: PartnerPersona;
  onSelectPersona: (persona: PartnerPersona) => void;
  currentLanguage: Language;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onSelectPersona,
  currentLanguage,
}) => {
  const [testingPersonaId, setTestingPersonaId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestVoice = (persona: PartnerPersona) => {
    setTestingPersonaId(persona.id);
    const sampleText =
      currentLanguage.popularPhrases?.[0]?.text ||
      `¡Hola! Me llamo ${persona.name}. ¿Practicamos juntos hoy?`;

    playPartnerSpeech({
      text: sampleText,
      targetLanguage: currentLanguage.name,
      languageCode: currentLanguage.speechCode,
      voiceName: persona.voiceName,
      playbackRate: 1.0,
      onEnd: () => setTestingPersonaId(null),
      onError: () => setTestingPersonaId(null),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Choose Your AI Conversation Partner</h2>
              <p className="text-xs text-slate-400">
                Each partner has a unique conversational style, tone, and pacing
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

        {/* Personas List */}
        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {PARTNER_PERSONAS.map((persona) => {
            const isSelected = currentPersona.id === persona.id;
            const isTesting = testingPersonaId === persona.id;

            return (
              <div
                key={persona.id}
                onClick={() => {
                  onSelectPersona(persona);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/60 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={persona.avatar}
                      alt={persona.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-800"
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white ring-2 ring-slate-950">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white">{persona.name}</h3>
                      <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        {persona.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{persona.personality}</p>
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      Tone: {persona.tone} • Voice: {persona.accentDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestVoice(persona);
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isTesting
                        ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                    }`}
                    title="Preview partner voice"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
