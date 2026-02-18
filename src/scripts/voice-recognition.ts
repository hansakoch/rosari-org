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

// No browser speech synthesis — all TTS goes through xAI Voice Agent API
