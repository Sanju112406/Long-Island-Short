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

  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/[*_#`~]/g, '') // remove markdown symbols
      .replace(/\bMRT\b/g, 'M R T')
      .replace(/\bLTA\b/g, 'L T A')
      .replace(/\bSMRT\b/g, 'S M R T')
      .replace(/\bSGH\b/g, 'Singapore General Hospital')
      .replace(/\bBlk\b/g, 'Block')
      .replace(/\bAve\b/g, 'Avenue')
      .replace(/\bSt\b/g, 'Street')
      .replace(/\bRd\b/g, 'Road')
      .replace(/\bCtrl\b/g, 'Central')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private selectBestHumanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    // Filter out known legacy robotic / novelty synthesizers
    const roboticNames = [
      'albert', 'bad news', 'bahh', 'bells', 'boing', 'cellos', 'deranged',
      'good news', 'hysterical', 'pipe organ', 'trinoids', 'whisper', 'zarvox',
      'fred', 'junior', 'ralph', 'kathy', 'vicki', 'bruce', 'agnes'
    ];

    const eligibleVoices = voices.filter(
      (v) => !roboticNames.some((r) => v.name.toLowerCase().includes(r))
    );

    // Tier 1: Premium / Natural / Enhanced Neural voices (ChatGPT-style warmth)
    const tier1 = eligibleVoices.find((v) => {
      const n = v.name.toLowerCase();
      return (
        (n.includes('natural') || n.includes('premium') || n.includes('enhanced') || n.includes('neural')) &&
        (v.lang.startsWith('en') || n.includes('english'))
      );
    });
    if (tier1) return tier1;

    // Tier 2: Apple Siri / Samantha Enhanced / Ava / Serena / Zoe
    const tier2 = eligibleVoices.find((v) => {
      const n = v.name.toLowerCase();
      return (
        n.includes('samantha') ||
        n.includes('siri') ||
        n.includes('ava') ||
        n.includes('serena') ||
        n.includes('zoe') ||
        n.includes('karen') ||
        n.includes('daniel')
      );
    });
    if (tier2) return tier2;

    // Tier 3: Google Chrome Natural Neural (Google UK English Female / Google US English)
    const tier3 = eligibleVoices.find((v) => {
      const n = v.name.toLowerCase();
      return (
        (n.includes('google uk english female') || n.includes('google us english') || n.includes('google english')) &&
        v.lang.startsWith('en')
      );
    });
    if (tier3) return tier3;

    // Tier 4: Singapore English or UK/US English
    const tier4 = eligibleVoices.find(
      (v) =>
        v.lang.includes('en-SG') ||
        v.name.includes('Singapore') ||
        v.lang.includes('en-GB') ||
        v.lang.includes('en-US') ||
        v.lang.startsWith('en')
    );
    if (tier4) return tier4;

    return eligibleVoices[0] || null;
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

      const cleanText = this.cleanTextForSpeech(text);
      if (!cleanText) {
        options?.onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      // ChatGPT-like natural conversational rate & pitch
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = this.synth.getVoices();
      const humanVoice = this.selectBestHumanVoice(voices);
      if (humanVoice) {
        utterance.voice = humanVoice;
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

  public isRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  public startListening(
    onResult: (text: string) => void,
    onError?: (err: any) => void
  ): any {
    if (!this.isRecognitionSupported()) {
      onError?.(new Error('Speech recognition not supported in this browser.'));
      return null;
    }

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-SG';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        onError?.(e);
      };

      recognition.start();
      return recognition;
    } catch (err) {
      onError?.(err);
      return null;
    }
  }
}

export const speechService = new SpeechService();
