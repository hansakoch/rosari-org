// ============================================================
// app.ts — Main application entry point
// ============================================================

import { getMysteryForDate, MYSTERY_SETS, PRAYERS, type MysteryType } from './rosary-data.ts';
import { RosaryEngine, type RosaryState } from './rosary-engine.ts';
import { audioManager, ambientAudio } from './audio-manager.ts';
import { savePreferences, loadPreferences } from './storage-manager.ts';
import { startLanguagePrompt, announcePrompt, type ParsedVoiceInput } from './voice-recognition.ts';
import { getBeadPositions } from './rosary-data.ts';

// ── App State ──────────────────────────────────────────────

let engine: RosaryEngine;
let currentLanguageCode = 'en-US';
let currentLanguage = 'English';
let currentVoiceDesc = 'elderly rural Piedmontese farmer, gravelly northern Italian drawl';
let isRunning = false;
let recognitionController: { stop: () => void } | null = null;

// ── DOM References ─────────────────────────────────────────

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── Theme Management ───────────────────────────────────────

function applyTheme(theme: 'night' | 'day'): void {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = el('theme-toggle');
  if (btn) btn.textContent = theme === 'night' ? '☀️ Day Mode' : '🌙 Night Mode';
}

function detectAutoTheme(): 'night' | 'day' {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7 ? 'night' : 'day';
}

function applyMysteryTheme(type: MysteryType): void {
  document.documentElement.setAttribute('data-mystery', type);
  const mysterySet = MYSTERY_SETS[type];
  document.documentElement.style.setProperty('--accent', mysterySet.color.primary);
  document.documentElement.style.setProperty('--accent2', mysterySet.color.secondary);
}

// ── Voice Prompt UI ────────────────────────────────────────

function showVoicePrompt(): void {
  const overlay = el('voice-prompt-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideVoicePrompt(): void {
  const overlay = el('voice-prompt-overlay');
  if (overlay) overlay.style.display = 'none';
}

function updateVoiceStatus(text: string, listening = false): void {
  const status = el('voice-status');
  if (status) {
    status.textContent = text;
    status.classList.toggle('listening', listening);
  }
}

// ── Bead Visualization ─────────────────────────────────────

const beadPositions = getBeadPositions(240, 190, 150, 125);

function updateBeads(activeBeadIndex: number): void {
  const beadElements = document.querySelectorAll<SVGCircleElement>('.rosary-bead');
  beadElements.forEach((bead) => {
    const idx = parseInt(bead.dataset['beadIdx'] ?? '-1');
    bead.classList.toggle('active', idx === activeBeadIndex);
    bead.classList.toggle('prayed', idx < activeBeadIndex && activeBeadIndex >= 0);
  });
}

// ── Karaoke Text ───────────────────────────────────────────

function updateKaraoke(state: RosaryState): void {
  const container = el<HTMLDivElement>('karaoke-primary');
  if (!container) return;

  const words = state.currentPrayerText.split(/\s+/);
  container.innerHTML = words.map((word, i) =>
    `<span class="karaoke-word${i === state.wordIndex ? ' active' : i < state.wordIndex ? ' prayed' : ''}" data-idx="${i}">${word}</span>`
  ).join(' ');

  // Scroll active word into view
  const activeWord = container.querySelector('.karaoke-word.active');
  activeWord?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

function updateMysteryDisplay(state: RosaryState): void {
  const name = el('mystery-name');
  const meditation = el('mystery-meditation');
  const title = el('prayer-title');

  if (name) name.textContent = state.currentMysteryName;
  if (meditation) meditation.textContent = state.currentMeditationText;
  if (title) title.textContent = state.currentPrayerTitle;
}

function updateProgress(state: RosaryState): void {
  const bar = el<HTMLDivElement>('progress-bar-inner');
  const label = el('progress-label');
  if (bar) {
    const pct = state.totalSteps > 0 ? (state.currentStepIndex / state.totalSteps) * 100 : 0;
    bar.style.width = `${pct}%`;
  }
  if (label) {
    label.textContent = `${state.currentStepIndex + 1} / ${state.totalSteps}`;
  }
}

// ── Main State Handler ─────────────────────────────────────

function onStateChange(state: RosaryState): void {
  applyMysteryTheme(state.mysteryType);
  updateBeads(state.currentBeadIndex);
  updateKaraoke(state);
  updateMysteryDisplay(state);
  updateProgress(state);

  // Update controls
  const playBtn = el('play-pause-btn');
  if (playBtn) {
    if (state.engineState === 'playing') {
      playBtn.textContent = '⏸ Pause';
      playBtn.setAttribute('aria-label', 'Pause rosary');
    } else if (state.engineState === 'paused') {
      playBtn.textContent = '▶ Resume';
      playBtn.setAttribute('aria-label', 'Resume rosary');
    } else {
      playBtn.textContent = '▶ Begin';
      playBtn.setAttribute('aria-label', 'Begin rosary');
    }
  }

  // Handle finished state
  if (state.engineState === 'finished') {
    isRunning = false;
    const finishedMsg = el('finished-message');
    if (finishedMsg) finishedMsg.style.display = 'block';
  }
}

// ── Rosary Playback Loop ───────────────────────────────────

async function playNextStep(): Promise<void> {
  if (!engine || !isRunning) return;
  const state = engine.getState();
  if (state.engineState !== 'playing') return;

  const step = state.currentStep;
  let text = state.currentPrayerText;

  if (step.prayer === 'mysteryAnnounce') {
    text = `${state.currentPrayerTitle}. ${state.currentMeditationText}`;
  } else if (step.prayer === 'goInPeace') {
    text = 'Go in peace.';
  }

  // Show loading indicator while xAI generates audio
  const loadingEl = el('audio-loading');
  if (loadingEl) loadingEl.style.display = 'block';

  try {
    await audioManager.playStep(
      text,
      {
        text,
        language: currentLanguage,
        languageCode: currentLanguageCode,
        voiceDescription: currentVoiceDesc,
        prayerKey: `${step.prayer}-${step.decadeIndex ?? 0}-${step.hailMaryIndex ?? 0}`,
      },
      (wordIdx) => { engine.setWordIndex(wordIdx); },
      () => {}
    );
  } catch (err) {
    console.error('Audio error:', err);
    isRunning = false;
    const errEl = el('audio-error');
    if (errEl) {
      errEl.textContent = `Audio error: ${(err as Error).message}`;
      errEl.style.display = 'block';
    }
    return;
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }

  // Brief pause between prayers
  const pauseDur = step.prayer === 'mysteryAnnounce' ? 1500 : 500;
  await new Promise(r => setTimeout(r, pauseDur));

  const hasNext = engine.nextStep();
  if (hasNext && isRunning) {
    playNextStep();
  }
}

// ── Language Selection ─────────────────────────────────────

async function startLanguageSelection(): Promise<void> {
  showVoicePrompt();
  ambientAudio.start(0.05);

  // Announce prompt
  setTimeout(() => {
    announcePrompt(
      'What language would you like to pray the Rosary in? You may also specify a voice, for example: Tagalog with Filipino woman, or Latin, or English with Irish man.',
      'en-US'
    );
    updateVoiceStatus('Listening for your language...', true);
  }, 500);

  recognitionController = startLanguagePrompt(
    (result: ParsedVoiceInput) => {
      handleLanguageSelected(result);
    },
    (err: string) => {
      console.warn('Voice recognition error:', err);
      updateVoiceStatus('Could not hear you — please type your language below or tap Begin in English.');
    },
    () => {
      updateVoiceStatus('Listening...', true);
    }
  );
}

function handleLanguageSelected(result: ParsedVoiceInput): void {
  currentLanguage = result.language;
  currentLanguageCode = result.languageCode;
  currentVoiceDesc = result.voiceDescription;

  updateVoiceStatus(`✓ Praying in ${result.language}${result.voiceDescription ? ` — ${result.voiceDescription}` : ''}`);
  recognitionController?.stop();

  savePreferences({
    language: currentLanguage,
    voiceDescription: currentVoiceDesc,
    theme: (document.documentElement.getAttribute('data-theme') as 'night' | 'day') || 'night',
  });

  setTimeout(() => {
    hideVoicePrompt();
    startRosary();
  }, 1200);
}

// ── Start Rosary ───────────────────────────────────────────

function startRosary(): void {
  const mysteryType = getMysteryForDate(new Date());
  engine = new RosaryEngine(mysteryType);
  engine.setLanguage(currentLanguage, currentVoiceDesc);
  engine.subscribe(onStateChange);

  isRunning = true;
  engine.start();

  // Display the mystery set immediately
  const mysterySet = MYSTERY_SETS[mysteryType];
  const mysteryBanner = el('mystery-banner');
  if (mysteryBanner) {
    mysteryBanner.textContent = mysterySet.name;
    mysteryBanner.style.display = 'block';
  }

  // Start playback
  playNextStep();
}

// ── Controls ───────────────────────────────────────────────

function setupControls(): void {
  // Play/Pause
  el('play-pause-btn')?.addEventListener('click', () => {
    audioManager.unlock(); // iOS: must create/resume AudioContext synchronously in gesture
    if (!engine) { startRosary(); return; }
    const state = engine.getState();
    if (state.engineState === 'playing') {
      engine.pause();
      audioManager.pause();
      isRunning = false;
    } else if (state.engineState === 'paused') {
      engine.resume();
      audioManager.resume();
      isRunning = true;
      playNextStep();
    } else {
      isRunning = true;
      engine.start();
      playNextStep();
    }
  });

  // Previous step
  el('prev-btn')?.addEventListener('click', () => {
    engine?.prevStep();
  });

  // Next step
  el('next-btn')?.addEventListener('click', () => {
    engine?.nextStep();
    if (isRunning) {
      audioManager.stop();
      playNextStep();
    }
  });

  // Theme toggle
  el('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'day' ? 'night' : 'day');
  });

  // Language change
  el('change-language-btn')?.addEventListener('click', () => {
    audioManager.stop();
    isRunning = false;
    startLanguageSelection();
  });

  // Manual language input
  el('language-text-submit')?.addEventListener('click', () => {
    const input = el<HTMLInputElement>('language-text-input');
    if (input?.value.trim()) {
      const { parseVoiceInput } = await import('./voice-recognition.ts').catch(() => ({ parseVoiceInput: null }));
      // Inline parse for typed input
      const text = input.value.trim();
      const parsed = { language: text, languageCode: 'en-US', voiceDescription: '', rawTranscript: text };
      handleLanguageSelected(parsed);
    }
  });

  // Download for offline
  el('download-offline-btn')?.addEventListener('click', downloadForOffline);

  // Voice commands via recognition
  setupVoiceCommands();
}

function setupVoiceCommands(): void {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const last = event.results[event.results.length - 1];
    const cmd = last[0].transcript.toLowerCase().trim();
    if (cmd.includes('day mode') || cmd.includes('switch to day')) applyTheme('day');
    if (cmd.includes('night mode') || cmd.includes('switch to night')) applyTheme('night');
    if (cmd.includes('pause')) { engine?.pause(); isRunning = false; }
    if (cmd.includes('resume') || cmd.includes('continue')) {
      engine?.resume(); isRunning = true; playNextStep();
    }
  };

  try { recognition.start(); } catch {}
}

// ── Offline Download ───────────────────────────────────────

async function downloadForOffline(): Promise<void> {
  const btn = el('download-offline-btn');
  if (btn) btn.textContent = 'Downloading...';

  // Trigger service worker to cache all pages
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CACHE_ALL' });
  }

  // Pre-generate audio for all prayers using synthesis and cache
  const mysteryType = getMysteryForDate();
  const eng = new RosaryEngine(mysteryType);
  eng.setLanguage(currentLanguage, currentVoiceDesc);
  const sequence = eng.getSequence();

  let done = 0;
  for (const step of sequence.slice(0, 10)) { // First 10 for demo
    const text = step.prayer === 'mysteryAnnounce'
      ? `${MYSTERY_SETS[mysteryType].mysteries[step.mysteryIndex ?? 0]?.name ?? ''}`
      : PRAYERS[step.prayer]?.text ?? '';

    if (text) {
      await audioManager.generateAudio({
        text,
        language: currentLanguage,
        languageCode: currentLanguageCode,
        voiceDescription: currentVoiceDesc,
        prayerKey: `${step.prayer}-${step.decadeIndex ?? 0}`,
      });
      done++;
      if (btn) btn.textContent = `Caching ${done}/${sequence.length}...`;
    }
  }

  if (btn) btn.textContent = '✓ Saved for Lent (offline ready)';
  setTimeout(() => { if (btn) btn.textContent = 'Download for Lent'; }, 4000);
}

// ── Initialization ─────────────────────────────────────────

async function init(): Promise<void> {
  // Auto theme
  const savedPrefs = await loadPreferences();
  if (savedPrefs?.theme) {
    applyTheme(savedPrefs.theme);
  } else {
    applyTheme(detectAutoTheme());
  }

  // Apply mystery theme for today
  const todayMystery = getMysteryForDate();
  applyMysteryTheme(todayMystery);

  // Mystery banner
  const banner = el('mystery-banner');
  if (banner) {
    banner.textContent = MYSTERY_SETS[todayMystery].name;
  }

  // Setup controls
  setupControls();

  // If returning user with saved language, offer to resume
  if (savedPrefs?.language) {
    currentLanguage = savedPrefs.language;
    currentLanguageCode = 'en-US'; // Will be re-detected
    currentVoiceDesc = savedPrefs.voiceDescription;

    const resume = el('resume-banner');
    if (resume) {
      resume.style.display = 'flex';
      resume.querySelector('.resume-lang')!.textContent = savedPrefs.language;
    }

    el('resume-yes-btn')?.addEventListener('click', () => {
      audioManager.unlock(); // iOS: unlock AudioContext synchronously in gesture
      resume?.remove();
      hideVoicePrompt();
      ambientAudio.start(0.05);
      startRosary();
    });

    el('resume-no-btn')?.addEventListener('click', () => {
      resume?.remove();
      startLanguageSelection();
    });
  } else {
    // First visit — start language prompt
    startLanguageSelection();
  }
}

// ── Boot ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  init().catch(console.error);
});

// Unlock AudioContext on first user gesture (iOS requires synchronous creation inside gesture)
document.addEventListener('click', () => {
  audioManager.unlock();
}, { once: true });
