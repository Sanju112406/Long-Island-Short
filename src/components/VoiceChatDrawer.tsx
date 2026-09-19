import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, X, CornerDownLeft, MessageSquare } from 'lucide-react';
import { CompanionMessage, JourneyStep, FamiliarityLevel } from '../types';

interface VoiceChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: CompanionMessage[];
  onSendMessage: (text: string) => void;
  isListening: boolean;
  onToggleListen: () => void;
  isSpeaking: boolean;
  onReplayAudio: (text: string) => void;
  currentStep: JourneyStep;
  familiarity: FamiliarityLevel;
}

export const VoiceChatDrawer: React.FC<VoiceChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isListening,
  onToggleListen,
  isSpeaking,
  onReplayAudio,
  currentStep,
  familiarity,
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "I'm panicking, I missed my stop!",
    "I can't find my way, where am I?",
    'Am I going the right way?',
    'Do I turn here?',
    'Am I going to be late?',
    'Where is the sheltered linkway?',
  ];

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-chat-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end sm:items-center animate-in fade-in duration-200"
    >
      <div
        id="voice-chat-drawer-container"
        className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] h-[580px] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Eyes Up Voice Companion
                <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold px-1.5 py-0.5 rounded uppercase">
                  {familiarity}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-neutral-400 truncate max-w-[240px]">
                Active Landmark: {currentStep.landmark}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick-Prompt Question Chips */}
        <div className="p-2.5 bg-slate-100/70 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 mb-1.5 px-1">
            Quick Ask by Voice or Tap:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                id={`quick-question-chip-${idx}`}
                type="button"
                onClick={() => onSendMessage(q)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-2xs cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-red-600 text-white rounded-br-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <p>{msg.text}</p>

                  {!isUser && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => onReplayAudio(msg.text)}
                        className="p-1 text-slate-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        title="Replay speech"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          {/* Microphone toggle */}
          <button
            id="drawer-mic-toggle-button"
            type="button"
            onClick={onToggleListen}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100'
            }`}
            title={isListening ? 'Stop listening' : 'Start speaking'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening... speak now' : 'Ask companion or tap a chip above...'}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <button
            id="drawer-send-message-button"
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
