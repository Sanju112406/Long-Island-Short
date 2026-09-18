// Speech and audio feedback service for Eyes Up

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private isMuted: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (this.isMuted || !this.synth) {
      options?.onEnd?.();
      return;
    }

    try {
      this.synth.cancel(); // Stop prior speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96; // Calm, conversational pace
      utterance.pitch = 1.02; // Warm, friendly tone

      // Pick Singapore or British / Australian / English voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.includes('en-SG') ||
          v.name.includes('Singapore') ||
          v.lang.includes('en-GB') ||
          v.lang.includes('en-AU') ||
          v.lang.includes('en-US')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('TTS utterance event:', e);
        options?.onEnd?.();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      options?.onEnd?.();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public playSubtleChime() {
    if (this.isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.3);

      // Trigger subtle phone vibration if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 30, 20]);
      }
    } catch (e) {
      // AudioContext might require user interaction first
    }
  }
}

export const speechService = new SpeechService();
