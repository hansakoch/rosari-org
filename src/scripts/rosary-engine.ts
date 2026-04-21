import { PRAYERS, MYSTERY_SETS, buildRosarySequence, type MysteryType } from './rosary-data.ts';

export type EngineState = 'idle' | 'playing' | 'paused' | 'finished';

export interface RosaryState {
  engineState: EngineState;
  mysteryType: MysteryType;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: any;
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

export class RosaryEngine {
  private mysteryType: MysteryType;
  private sequence: any[] = [];
  private currentStepIndex = 0;
  private engineState: EngineState = 'idle';
  private language = 'English';
  private voiceDescription = 'aged Catholic priest, deep gravelly male voice, slow and reverent';
  private wordIndex = 0;
  private listeners: ((state: RosaryState) => void)[] = [];

  constructor(mysteryType: MysteryType) {
    this.mysteryType = mysteryType;
    this.sequence = buildRosarySequence(mysteryType);
  }

  setLanguage(language: string, voiceDescription: string): void {
    this.language = language;
    this.voiceDescription = voiceDescription;
    this.emit();
  }

  subscribe(cb: (state: RosaryState) => void): () => void {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private emit(): void {
    this.listeners.forEach(l => l(this.getState()));
  }

  getState(): RosaryState {
    const step = this.sequence[this.currentStepIndex];
    const mysterySet = MYSTERY_SETS[this.mysteryType];
    return {
      engineState: this.engineState,
      mysteryType: this.mysteryType,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.sequence.length,
      currentStep: step,
      currentPrayerText: '',
      currentPrayerTitle: '',
      currentBeadIndex: -1,
      currentDecadeIndex: -1,
      currentMysteryName: '',
      currentMeditationText: '',
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

  getSequence() {
    return this.sequence;
  }
}