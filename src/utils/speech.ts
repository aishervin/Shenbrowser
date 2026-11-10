/**
 * Voice & Audio Engine for LinguaFlow
 * Handles Gemini TTS audio playback, Web Speech API fallback,
 * Speech-to-Text recognition, audio recording, and real-time mic volume analysis.
 */

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export interface SpeechPlayOptions {
  text: string;
  targetLanguage: string;
  languageCode: string;
  voiceName?: string;
  playbackRate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export function stopCurrentSpeech() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    } catch (e) {
      // ignore
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Speaks text using server-side Gemini 3.8 TTS with automatic fallback to Web Speech Synthesis.
 */
export async function playPartnerSpeech(options: SpeechPlayOptions): Promise<void> {
  const {
    text,
    targetLanguage,
    languageCode,
    voiceName = 'Kore',
    playbackRate = 1.0,
    onStart,
    onEnd,
    onError,
  } = options;

  stopCurrentSpeech();

  try {
    // 1. Try Gemini 3.8 Flash Lite TTS from backend
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetLanguage,
        voiceName,
      }),
    });

    const data = await res.json();

    if (data.success && data.audioBase64) {
      const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      currentAudio = audio;
      audio.playbackRate = playbackRate;

      audio.onplay = () => onStart?.();
      audio.onended = () => {
        currentAudio = null;
        onEnd?.();
      };
      audio.onerror = (e) => {
        console.warn('Audio element error, falling back to Web Speech Synthesis', e);
        fallbackToWebSpeech(text, languageCode, playbackRate, onStart, onEnd, onError);
      };

      await audio.play();
      return;
    } else {
      // Fallback
      fallbackToWebSpeech(text, languageCode, playbackRate, onStart, onEnd, onError);
    }
  } catch (err) {
    console.warn('TTS request error, using Web Speech fallback:', err);
    fallbackToWebSpeech(text, languageCode, playbackRate, onStart, onEnd, onError);
  }
}

function fallbackToWebSpeech(
  text: string,
  languageCode: string,
  rate: number,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.(new Error('Speech synthesis not supported in this browser.'));
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode;
    utterance.rate = Math.max(0.7, Math.min(1.5, rate));

    // Try to find matching voice for target language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(languageCode.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => {
      currentUtterance = null;
      onEnd?.();
    };
    utterance.onerror = (e) => {
      console.warn('Web Speech synthesis error:', e);
      currentUtterance = null;
      onError?.(e);
      onEnd?.();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    onError?.(e);
    onEnd?.();
  }
}

// -------------------------------------------------------------
// Speech Recognition (Web Speech API)
// -------------------------------------------------------------

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export interface SpeechRecognizerHandlers {
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private languageCode = 'es-ES';

  constructor(languageCode: string, private handlers: SpeechRecognizerHandlers) {
    this.languageCode = languageCode;
    this.init();
  }

  private init() {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.languageCode;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.handlers.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        this.handlers.onInterimResult?.(interim);
      }
      if (final) {
        this.handlers.onFinalResult?.(final);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.handlers.onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.handlers.onEnd?.();
    };
  }

  setLanguage(languageCode: string) {
    this.languageCode = languageCode;
    if (this.recognition) {
      this.recognition.lang = languageCode;
    }
  }

  start() {
    if (!this.recognition) {
      this.handlers.onError?.('Speech recognition is not supported in this browser.');
      return;
    }
    if (this.isListening) return;

    try {
      this.recognition.start();
    } catch (e: any) {
      console.warn('Could not start recognition:', e);
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch (e) {
      // ignore
    }
  }
}

// -------------------------------------------------------------
// Audio Visualizer Helper (AnalyserNode for real-time mic wave)
// -------------------------------------------------------------

export class MicVisualizer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationId: number | null = null;

  async start(onVolume: (volume: number) => void) {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1, average / 128); // 0.0 to 1.0

        onVolume(normalized);
        this.animationId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Microphone visualizer unavailable:', err);
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
