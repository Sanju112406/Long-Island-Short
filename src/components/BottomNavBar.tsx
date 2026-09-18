import React from 'react';
import { Compass, Navigation, Mic, Share2, Settings } from 'lucide-react';

export type NavTab = 'plan' | 'travel' | 'voice' | 'share' | 'settings';

interface BottomNavBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isPowerSaving?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  isPowerSaving = false,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'plan', label: 'Plan', icon: <Compass className="w-4 h-4" /> },
    { id: 'travel', label: 'Travel', icon: <Navigation className="w-4 h-4" /> },
    { id: 'voice', label: 'Companion', icon: <Mic className="w-4 h-4" /> },
    { id: 'share', label: 'Share ETA', icon: <Share2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 border-t backdrop-blur-md transition-colors ${
        isPowerSaving
          ? 'bg-black/95 border-neutral-900 text-neutral-400'
          : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-neutral-400'
      }`}
    >
      <div className="flex items-center justify-around py-1.5 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
