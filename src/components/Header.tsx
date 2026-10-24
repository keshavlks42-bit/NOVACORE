import React from 'react';
import { Activity, Sparkles, RefreshCw, Radio, Menu, X, Upload, SlidersHorizontal, LogIn, BadgeCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  onOpenHackathonDemo: () => void;
  onResetData: () => void;
  onOpenUnifiedUploader: () => void;
  activeAlertsCount: number;
  mobileOpen: boolean;
  onToggleMobileMenu: () => void;
  isSimpleMode: boolean;
  onToggleSimpleMode: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHackathonDemo,
  onResetData,
  onOpenUnifiedUploader,
  activeAlertsCount,
  mobileOpen,
  onToggleMobileMenu,
  isSimpleMode,
  onToggleSimpleMode,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 active:scale-95 transition-all"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 shrink-0">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-sm sm:text-base tracking-tight text-white">MachineSentry</span>
            <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              AI/IoT
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Edge Node
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
            Detect Anomalies Early. Maintain Machines Smarter.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Prominent Quick Media Uploader Button (Audio, Video, Photo) */}
        <button
          onClick={onOpenUnifiedUploader}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          title="Upload or record Audio, Video, or Photos"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Media</span>
          <span className="sm:hidden">Upload</span>
        </button>

        {/* Simple vs Advanced Mode Toggle */}
        <button
          onClick={onToggleSimpleMode}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isSimpleMode
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title={isSimpleMode ? 'Switch to Advanced ML Mode' : 'Switch to Simple Mode'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {isSimpleMode ? 'Simple View: ON' : 'Advanced Mode'}
          </span>
        </button>

        <button
          onClick={onOpenHackathonDemo}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-cyan-500/15 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo</span>
        </button>

        <button
          onClick={onResetData}
          title="Reset demonstration data to initial seed state"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* User Authentication / Operator Badge */}
        {currentUser ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 transition-all text-left group"
            title={`Signed in as ${currentUser.name} (${currentUser.role}). Click to view or switch profile.`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm shadow-cyan-500/20">
              {currentUser.initials || 'MS'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[11px] font-bold text-white flex items-center gap-1 leading-tight">
                <span className="truncate max-w-[85px]">{currentUser.name.split(' ')[0]}</span>
                <BadgeCheck className="w-3 h-3 text-cyan-400 shrink-0" />
              </div>
              <div className="text-[9px] text-slate-400 truncate max-w-[85px]">
                {currentUser.role.replace('Plant ', '')}
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Sign in or Register and Verify account"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {activeAlertsCount > 0 && (
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] sm:text-xs font-mono">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{activeAlertsCount} Alert{activeAlertsCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </header>
  );
};
