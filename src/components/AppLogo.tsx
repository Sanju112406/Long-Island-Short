import React from 'react';
import logoImage from '../assets/logo.jpg';

interface AppLogoProps {
  className?: string;
  size?: number;
}

/**
 * AppLogo component rendering the user's Eyes-Up logo design
 */
export const AppLogo: React.FC<AppLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-slate-700/80 p-0.5 shadow-2xs overflow-hidden shrink-0 ${className}`}
    >
      <img
        src={logoImage}
        alt="Eyes Up Logo"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

