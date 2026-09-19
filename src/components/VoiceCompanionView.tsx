import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CornerDownLeft, MessageSquare, Send, RefreshCw } from 'lucide-react';
import { CompanionMessage, JourneyStep, FamiliarityLevel } from '../types';

interface VoiceCompanionViewProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  onToggleListen: () => void;
  messages: CompanionMessage[];
  onSendMessage: (text: string) => void;
  onReplayAudio: (text: string) => void;
  currentStep: JourneyStep;
  familiarity: FamiliarityLevel;
  isPowerSaving?: boolean;
}

export const VoiceCompanionView: React.FC<VoiceCompanionViewProps> = ({
  isListening,
  isSpeaking,
  isThinking,
  onToggleListen,
  messages,
  onSendMessage,
  onReplayAudio,
  currentStep,
  familiarity,
  isPowerSaving = false,
}) => {
  const [inputText, setInputText] = useState('');

  const quickQuestions = [
    "I'm panicking, I missed my stop!",
    "I can't find my way, where am I?",
    'Am I going the right way?',
    'Do I turn here?',
    'Am I going to be late?',
    'Where is the sheltered linkway?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div id="voice-companion-screen-view" className="p-4 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[11px] font-bold mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Eyes-Up AI Companion</span>
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Hands-Free Voice Guidance
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Put your phone away. Ask questions naturally about landmarks & directions.
          </p>
        </div>
      </div>

      {/* Main Centered Voice Orb */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
        <div className="relative">
          {/* Animated Glow Rings when Listening / Speaking */}
          {(isListening || isSpeaking || isThinking) && (
            <div className="absolute -inset-3 rounded-full bg-red-500/20 animate-ping duration-1000" />
          )}

          <button
            id="voice-screen-mic-orb-button"
            type="button"
            onClick={onToggleListen}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white scale-110 ring-4 ring-rose-300 dark:ring-rose-900'
                : isSpeaking
                ? 'bg-red-600 text-white scale-105 ring-4 ring-red-300 dark:ring-red-900'
                : isThinking
                ? 'bg-amber-500 text-white animate-spin'
                : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : isThinking ? (
              <RefreshCw className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Live Status Text */}
        <div className="space-y-0.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
            {isListening
              ? 'Listening... Ask Eyes-Up'
              : isSpeaking
              ? 'Speaking Landmark Guidance...'
              : isThinking
              ? 'Thinking...'
              : 'Tap to Speak or Ask Below'}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Active Landmark: {currentStep.landmark}
          </p>
        </div>

        {/* Animated Waveform Visualizer */}
        <div className="flex items-center gap-1 h-6">
          <div className={`w-1 rounded-full bg-red-500 ${isListening || isSpeaking ? 'animate-wave-bar-1' : 'h-1.5'}`} />
          <div className={`w-1 rounded-full bg-red-500 ${isListening || isSpeaking ? 'animate-wave-bar-2' : 'h-3'}`} />
          <div className={`w-1 rounded-full bg-red-500 ${isListening || isSpeaking ? 'animate-wave-bar-3' : 'h-5'}`} />
          <div className={`w-1 rounded-full bg-red-500 ${isListening || isSpeaking ? 'animate-wave-bar-4' : 'h-2'}`} />
          <div className={`w-1 rounded-full bg-red-500 ${isListening || isSpeaking ? 'animate-wave-bar-2' : 'h-4'}`} />
          <div className={`w-1 rounded-full bg-red-500 ${isListening || isSpeaking ? 'animate-wave-bar-1' : 'h-1.5'}`} />
        </div>
      </div>

      {/* Conversation History */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          Recent Reassurances
        </span>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {messages.slice(-4).map((msg) => (
            <div
              key={msg.id}
              className={`p-2.5 rounded-2xl text-xs space-y-1 ${
                msg.sender === 'user'
                  ? 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-200 ml-6'
                  : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-6'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold">{msg.sender === 'user' ? 'You' : 'Eyes Up'}</span>
                <span>{msg.timestamp}</span>
              </div>
              <p className="leading-relaxed font-medium">{msg.text}</p>
              {msg.sender === 'companion' && (
                <button
                  type="button"
                  onClick={() => onReplayAudio(msg.text)}
                  className="inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer pt-0.5"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Replay voice</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Text Input Option */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="companion-text-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type question to companion..."
          className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Quick Prompt Chips (Placed below the actual chat) */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Quick Ask Chips:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSendMessage(q)}
              className="p-2 text-left rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-red-500 transition-all cursor-pointer leading-tight shadow-2xs"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
