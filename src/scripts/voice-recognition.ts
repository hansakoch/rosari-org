// ============================================================
// voice-recognition.ts — Web Speech API language + voice parsing
// ============================================================

export interface ParsedVoiceInput {
  language: string;
  languageCode: string;  // BCP-47 code e.g. "en-US", "tl", "la"
  voiceDescription: string;
  rawTranscript: string;
}

// Map of known language names to BCP-47 codes
const LANGUAGE_MAP: Record<string, string> = {
  'english': 'en-US', 'american english': 'en-US', 'british english': 'en-GB',
  'spanish': 'es-ES', 'español': 'es-ES', 'castilian': 'es-ES',
  'latin': 'la', 'latin church': 'la', 'ecclesiastical latin': 'la',
  'tagalog': 'tl', 'filipino': 'tl',
  'cebuano': 'ceb', 'bisaya': 'ceb', 'visayan': 'ceb',
  'italian': 'it-IT', 'italiano': 'it-IT',
  'piedmontese': 'it-IT',  // Closest available
  'french': 'fr-FR', 'français': 'fr-FR',
  'german': 'de-DE', 'deutsch': 'de-DE',
  'portuguese': 'pt-PT', 'português': 'pt-PT',
  'polish': 'pl-PL', 'polski': 'pl-PL',
  'hungarian': 'hu-HU',
  'czech': 'cs-CZ',
  'slovak': 'sk-SK',
  'romanian': 'ro-RO',
  'croatian': 'hr-HR',
  'slovenian': 'sl-SI',
  'ukrainian': 'uk-UA',
  'russian': 'ru-RU',
  'arabic': 'ar',
  'swahili': 'sw',
  'japanese': 'ja-JP',
  'chinese': 'zh-CN', 'mandarin': 'zh-CN', 'cantonese': 'zh-HK',
  'korean': 'ko-KR',
  'hindi': 'hi-IN',
  'vietnamese': 'vi-VN',
  'indonesian': 'id-ID', 'bahasa': 'id-ID',
  'malay': 'ms-MY',
  'thai': 'th-TH',
  'klingon': 'tlh',  // Experimental fallback to English
};

export function parseVoiceInput(transcript: string): ParsedVoiceInput {
  const lower = transcript.toLowerCase().trim();

  // Extract language (everything before "with" or the whole string)
  const withIndex = lower.indexOf(' with ');
  const languagePart = withIndex > -1 ? lower.substring(0, withIndex).trim() : lower;
  const voicePart = withIndex > -1 ? lower.substring(withIndex + 6).trim() : '';

  // Find best language match
  let bestLang = 'English';
  let bestCode = 'en-US';

  for (const [name, code] of Object.entries(LANGUAGE_MAP)) {
    if (languagePart.includes(name)) {
      bestLang = name.charAt(0).toUpperCase() + name.slice(1);
      bestCode = code;
      break;
    }
  }

  // Build voice description from voice part
  let voiceDescription = voicePart
    ? voicePart
    : 'elderly rural Piedmontese farmer, gravelly northern Italian drawl';

  return {
    language: bestLang,
    languageCode: bestCode,
    voiceDescription,
    rawTranscript: transcript,
  };
}

// ── Web Speech Recognition ─────────────────────────────────

type RecognitionCallback = (result: ParsedVoiceInput) => void;
type ErrorCallback = (error: string) => void;

export function startLanguagePrompt(
  onResult: RecognitionCallback,
  onError: ErrorCallback,
  onStart?: () => void
): { stop: () => void } {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('speech-recognition-unavailable');
    return { stop: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    onStart?.();
  };

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    const parsed = parseVoiceInput(transcript);
    onResult(parsed);
  };

  recognition.onerror = (event: any) => {
    if (event.error !== 'no-speech') {
      onError(event.error);
    }
  };

  try {
    recognition.start();
  } catch (e) {
    onError('recognition-failed');
  }

  return { stop: () => { try { recognition.stop(); } catch {} } };
}

// ── Web Speech Synthesis (Fallback TTS) ───────────────────

export interface SpeechOptions {
  text: string;
  lang: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onBoundary?: (wordIndex: number, charIndex: number) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

export function speakWithSynthesis(opts: SpeechOptions): { stop: () => void; pause: () => void; resume: () => void } {
  const synth = window.speechSynthesis;
  if (!synth) {
    opts.onError?.('synthesis-unavailable');
    return { stop: () => {}, pause: () => {}, resume: () => {} };
  }

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(opts.text);
  utterance.lang = opts.lang;
  utterance.rate = opts.rate ?? 0.82;   // Slower = more reverent
  utterance.pitch = opts.pitch ?? 0.9;  // Slightly deeper
  utterance.volume = opts.volume ?? 1.0;

  // Pick best voice for the language
  const voices = synth.getVoices();
  const langVoices = voices.filter(v => v.lang.startsWith(opts.lang.split('-')[0]!));
  if (langVoices.length > 0) {
    // Prefer local voices; among those pick one (prefer female for Hail Mary, male for Our Father)
    utterance.voice = langVoices[0]!;
  }

  // Track word boundaries for karaoke
  let wordIdx = 0;
  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      opts.onBoundary?.(wordIdx, event.charIndex);
      wordIdx++;
    }
  };

  utterance.onend = () => opts.onEnd?.();
  utterance.onerror = (e) => opts.onError?.(e.error);

  synth.speak(utterance);

  return {
    stop: () => synth.cancel(),
    pause: () => synth.pause(),
    resume: () => synth.resume(),
  };
}

// ── Prompt speaker ─────────────────────────────────────────

export function announcePrompt(text: string, lang = 'en-US'): void {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
