import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Mic2,
  Binary,
  Activity,
  Layers,
  Database,
  Wrench,
  BarChart3,
  Sparkles,
  BookOpen,
  Sliders,
  Workflow,
  X,
  Box,
  Upload,
  CheckCircle2,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';

export type NavTab =
  | 'simple_upload'
  | 'overview'
  | 'machines'
  | 'digital_twin_3d'
  | 'audio_analysis'
  | 'baseline_engine'
  | 'model_representation'
  | 'vibration'
  | 'multimodal'
  | 'few_shot'
  | 'benchmark'
  | 'maintenance'
  | 'reports'
  | 'auth'
  | 'demo_scenario'
  | 'production_notes';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unresolvedAlertsCount: number;
  totalMachinesCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isSimpleMode: boolean;
  onToggleSimpleMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unresolvedAlertsCount,
  totalMachinesCount,
  mobileOpen,
  onCloseMobile,
  isSimpleMode,
  onToggleSimpleMode,
}) => {
  // Simplified Navigation Items for non-technical users
  const simpleNavItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    description: string;
  }[] = [
    {
      id: 'simple_upload',
      label: 'Easy Media Upload',
      icon: Upload,
      badge: 'Sound • Video • Photo',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
      description: 'Upload any sound, video, or photo for instant health check',
    },
    {
      id: 'machines',
      label: 'My Machine Fleet',
      icon: Cpu,
      badge: totalMachinesCount,
      description: 'View machinery equipment with photos and specs',
    },
    {
      id: 'digital_twin_3d',
      label: '3D Machinery Twin',
      icon: Box,
      badge: '3D View',
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
      description: 'Rotate and inspect realistic 3D motor and pump',
    },
    {
      id: 'maintenance',
      label: 'Maintenance & Alerts',
      icon: Wrench,
      badge: unresolvedAlertsCount > 0 ? unresolvedAlertsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
      description: 'Check issues, tasks, and maintenance history',
    },
    {
      id: 'auth',
      label: 'Operator Login & Verify',
      icon: UserCheck,
      badge: 'Account',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
      description: 'Register, verify 6-digit code, and manage plant credentials',
    },
  ];

  // Full Engineering Nav Items
  const fullNavItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    section?: string;
  }[] = [
    {
      id: 'simple_upload',
      label: 'Easy Upload (Audio/Video/Photo)',
      icon: Upload,
      badge: 'Simple',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      section: 'ACCESSIBLE MEDIA TOOLS',
    },
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'machines', label: 'Machine Fleet', icon: Cpu, badge: totalMachinesCount },
    {
      id: 'digital_twin_3d',
      label: '3D Machinery Twin',
      icon: Box,
      badge: 'Interactive 3D',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
      section: '3D DIGITAL TWIN',
    },
    {
      id: 'audio_analysis',
      label: 'Audio Analysis & FFT',
      icon: Mic2,
      section: 'ACOUSTIC MONITORING',
    },
    { id: 'baseline_engine', label: 'Baseline & ML Models', icon: Binary },
    {
      id: 'model_representation',
      label: 'Model Architecture',
      icon: Workflow,
      badge: '7 Steps',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'vibration',
      label: 'Vibration Monitoring',
      icon: Activity,
      section: 'MULTI-SENSOR SENSING',
    },
    { id: 'multimodal', label: 'Multimodal Fusion', icon: Layers },
    {
      id: 'few_shot',
      label: 'Few-Shot Experiment',
      icon: Sliders,
      section: 'RESEARCH & BENCHMARKS',
    },
    { id: 'benchmark', label: 'MIMII Public Benchmark', icon: Database },
    {
      id: 'maintenance',
      label: 'Maintenance History',
      icon: Wrench,
      badge: unresolvedAlertsCount > 0 ? unresolvedAlertsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
      section: 'OPERATIONS & AUDIT',
    },
    { id: 'reports', label: 'Reports & CSV Export', icon: BarChart3 },
    {
      id: 'auth',
      label: 'Login & Verification',
      icon: UserCheck,
      section: 'SECURITY & OPERATOR ACCESS',
      badge: 'Verified',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'demo_scenario',
      label: 'Hackathon Scenario',
      icon: Sparkles,
      section: 'DEMO & DOCUMENTATION',
      badge: 'Step 1-8',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    { id: 'production_notes', label: 'Production Notes', icon: BookOpen },
  ];

  const renderNavContent = () => (
    <>
      {isSimpleMode ? (
        <div className="p-3 space-y-3">
          <div className="px-2 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Simple Mode Enabled
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Streamlined for field operators and everyday users.
            </p>
          </div>

          <div className="space-y-1.5">
            {simpleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md ring-1 ring-cyan-500/20'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs text-white">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight pl-6">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={onToggleSimpleMode}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Switch to Advanced ML Mode</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-1">
          {fullNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <React.Fragment key={item.id}>
                {item.section && (
                  <div
                    className={`px-3 pt-4 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold ${
                      idx !== 0 ? 'mt-1' : ''
                    }`}
                  >
                    {item.section}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}

          <div className="pt-3 border-t border-slate-800/80 mt-2">
            <button
              onClick={onToggleSimpleMode}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Switch to Simple Mode</span>
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 uppercase">
            <span>Model Engine</span>
            <span className="text-emerald-400">Isolation Forest</span>
          </div>
          <div className="text-slate-400 leading-tight">
            Learns normal baseline acoustics. Scores deviations without labeled fault datasets.
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (md and up) */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto">
        {renderNavContent()}
      </aside>

      {/* Mobile Slide-Out Drawer Overlay (< md) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-10 overflow-y-auto select-none">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Navigation Menu
              </span>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
