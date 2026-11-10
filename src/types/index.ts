export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  code: string; // e.g. "es-ES"
  speechCode: string;
  romanizationName?: string; // e.g. "Romaji", "Pinyin", "Transliteration"
  popularPhrases: { text: string; english: string }[];
}

export interface PartnerPersona {
  id: string;
  name: string;
  avatar: string;
  title: string;
  personality: string;
  tone: string;
  voiceName: string; // 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon'
  accentDescription: string;
}

export interface Scenario {
  id: string;
  title: string;
  category: 'daily' | 'dining' | 'travel' | 'work' | 'culture' | 'emergency' | 'custom';
  level: CEFRLevel;
  icon: string;
  situation: string;
  partnerRole: string;
  userRole: string;
  objective: string;
  initialMessage: Record<string, string>; // languageId -> initial greeting in target language
  initialEnglish: string;
}

export interface GrammarPoint {
  concept: string;
  detail: string;
}

export interface MessageFeedback {
  hasFeedback: boolean;
  quality: 'Excellent' | 'Good' | 'Needs Attention';
  critique: string;
  improvedVersion: string;
  grammarPoints: GrammarPoint[];
}

export interface SuggestedReply {
  text: string;
  english: string;
}

export interface VocabularyWord {
  word: string;
  translation: string;
  partOfSpeech: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  replyEnglish?: string;
  transliteration?: string;
  feedback?: MessageFeedback;
  suggestedReplies?: SuggestedReply[];
  vocabulary?: VocabularyWord[];
  audioBase64?: string;
  xpEarned?: number;
}

export interface SavedWord {
  id: string;
  word: string;
  translation: string;
  languageId: string;
  partOfSpeech?: string;
  contextSentence?: string;
  dateAdded: number;
  mastered: boolean;
}

export interface WordAnalysis {
  word: string;
  lemma: string;
  ipa: string;
  partOfSpeech: string;
  definition: string;
  literalMeaning?: string;
  exampleUsage: {
    sentenceInTargetLanguage: string;
    translationInEnglish: string;
  };
  memoryTip: string;
  synonyms?: string[];
}

export interface SessionSummaryData {
  overallGrade: string;
  estimatedCefrLevel: string;
  scores: {
    fluency: number;
    grammar: number;
    vocabulary: number;
    comprehension: number;
  };
  keyStrengths: string[];
  growthAreas: string[];
  topVocabularyMastered: { word: string; meaning: string }[];
  educatorAdvice: string;
}
