// ============================================================
// rosary-engine.ts — State machine for the rosary prayer flow
// ============================================================

import { PRAYERS, MYSTERY_SETS, buildRosarySequence, type MysteryType, type RosaryStep } from './rosary-data.ts';

export type EngineState = 'idle' | 'playing' | 'paused' | 'finished';

export interface RosaryState {
  engineState: EngineState;
  mysteryType: MysteryType;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: RosaryStep;
  currentPrayerText: string;
  currentPrayerTitle: string;
  currentBeadIndex: number;
  currentDecadeIndex: number;
  currentMysteryName: string;
  currentMeditationText: string;
  wordIndex: number;
  language: string;
  voiceDescription: string;
}

type StateChangeCallback = (state: RosaryState) => void;

export class RosaryEngine {
  private mysteryType: MysteryType;
  private sequence: RosaryStep[];
  private currentStepIndex = 0;
  private engineState: EngineState = 'idle';
  private language = 'English';
  private voiceDescription = 'elderly rural Piedmontese farmer, gravelly northern Italian drawl';
  private wordIndex = 0;
  private listeners: StateChangeCallback[] = [];

  constructor(mysteryType: MysteryType) {
    this.mysteryType = mysteryType;
    this.sequence = buildRosarySequence(mysteryType);
  }

  setLanguage(language: string, voiceDescription: string): void {
    this.language = language;
    this.voiceDescription = voiceDescription;
    this.emit();
  }

  subscribe(cb: StateChangeCallback): () => void {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private emit(): void {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  getState(): RosaryState {
    const step = this.sequence[this.currentStepIndex] ?? this.sequence[0]!;
    const mysterySet = MYSTERY_SETS[this.mysteryType];
    const mystery = step.mysteryIndex !== undefined ? mysterySet.mysteries[step.mysteryIndex] : null;

    let prayerText = '';
    let prayerTitle = '';

    if (step.prayer === 'mysteryAnnounce') {
      const m = mystery ?? mysterySet.mysteries[0]!;
      const decNum = (step.decadeIndex ?? 0) + 1;
      prayerTitle = `${decNum}. ${m.name}`;
      prayerText = m.meditation;
    } else {
      const p = PRAYERS[step.prayer];
      prayerTitle = p?.title ?? '';
      prayerText = p?.text ?? '';
    }

    const currentMysteryIndex = step.decadeIndex ?? step.mysteryIndex ?? 0;
    const currentMystery = mysterySet.mysteries[currentMysteryIndex];

    return {
      engineState: this.engineState,
      mysteryType: this.mysteryType,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.sequence.length,
      currentStep: step,
      currentPrayerText: prayerText,
      currentPrayerTitle: prayerTitle,
      currentBeadIndex: step.beadIndex ?? -1,
      currentDecadeIndex: step.decadeIndex ?? -1,
      currentMysteryName: currentMystery?.name ?? '',
      currentMeditationText: currentMystery?.meditation ?? '',
      wordIndex: this.wordIndex,
      language: this.language,
      voiceDescription: this.voiceDescription,
    };
  }

  start(): void {
    this.engineState = 'playing';
    this.currentStepIndex = 0;
    this.wordIndex = 0;
    this.emit();
  }

  pause(): void {
    this.engineState = 'paused';
    this.emit();
  }

  resume(): void {
    this.engineState = 'playing';
    this.emit();
  }

  nextStep(): boolean {
    if (this.currentStepIndex < this.sequence.length - 1) {
      this.currentStepIndex++;
      this.wordIndex = 0;
      this.emit();
      return true;
    } else {
      this.engineState = 'finished';
      this.emit();
      return false;
    }
  }

  prevStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.wordIndex = 0;
      this.emit();
    }
  }

  setWordIndex(idx: number): void {
    this.wordIndex = idx;
    this.emit();
  }

  jumpToStep(idx: number): void {
    if (idx >= 0 && idx < this.sequence.length) {
      this.currentStepIndex = idx;
      this.wordIndex = 0;
      this.emit();
    }
  }

  getMysterySet() {
    return MYSTERY_SETS[this.mysteryType];
  }

  getSequence() {
    return this.sequence;
  }
}
