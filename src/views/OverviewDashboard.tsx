import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  ArrowRight,
  Sparkles,
  Plus,
  Mic2,
  FileText,
  Box,
  Upload,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AnalysisRecord, Machine, MaintenanceRecord } from '../types';

interface OverviewDashboardProps {
  machines: Machine[];
  analyses: AnalysisRecord[];
  maintenance: MaintenanceRecord[];
  onNavigateTab: (tab: any) => void;
  onSelectMachine: (machine: Machine) => void;
  onOpenMachineModal: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  machines,
  analyses,
  maintenance,
  onNavigateTab,
  onSelectMachine,
  onOpenMachineModal,
}) => {
  // Derived metrics directly from application data
  const totalMachines = machines.length;
  const normalMachines = machines.filter((m) => m.status === 'NORMAL').length;
  const attentionMachines = machines.filter((m) => m.status === 'ATTENTION' || m.status === 'CRITICAL').length;
  const unresolvedAlerts = maintenance.filter(
    (m) => m.status === 'New Alert' || m.status === 'Inspection Pending'
  ).length;
  const totalInspections = maintenance.filter(
    (m) => m.status === 'Inspection Completed' || m.status === 'Closed'
  ).length;

  const latestAnalysis = analyses[0];
  const latestTimestampStr = latestAnalysis
    ? new Date(latestAnalysis.timestamp).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No analyses yet';

  // Prepare chart data for anomaly history
  const chartData = analyses
    .slice(0, 15)
    .reverse()
    .map((a, i) => ({
      index: `#${i + 1}`,
      name: a.machineName.split(' ')[0],
      score: a.rawScore,
      threshold: a.threshold,
      displayScore: a.displayScore,
      alert: a.alertLevel,
      time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

  // Status distribution
  const statusPieData = [
    { name: 'Normal', value: normalMachines, color: '#10b981' },
    { name: 'Attention', value: machines.filter((m) => m.status === 'ATTENTION').length, color: '#f59e0b' },
    { name: 'Critical', value: machines.filter((m) => m.status === 'CRITICAL').length, color: '#f43f5e' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Demo Data Disclaimer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Baseline Machine Learning
            </span>
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
              DEMO DATA SEEDED
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Factory Condition Monitoring Hub</h1>
          <p className="text-xs text-slate-400">
            Acoustic anomaly detection using unsupervised Isolation Forest baselines. No expensive vibration sensors or pre-labeled faults required.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('simple_upload')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 btn-cyan-click"
          >
            <Upload className="w-3.5 h-3.5" /> Upload (Audio/Video/Photo)
          </button>
          <button
            onClick={() => onNavigateTab('digital_twin_3d')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 btn-cyan-click"
          >
            <Box className="w-3.5 h-3.5" /> 3D Digital Twin
          </button>
          <button
            onClick={() => onNavigateTab('audio_analysis')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-all shadow-md active:scale-95 btn-cyan-click"
          >
            <Mic2 className="w-3.5 h-3.5 text-cyan-400" /> Analyse Recording
          </button>
          <button
            onClick={onOpenMachineModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all btn-cyan-click"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" /> Add Machine
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Demo Machines</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{totalMachines}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Registered fleet units</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Normal State</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{normalMachines}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Operating on baseline</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Needs Attention</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{attentionMachines}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Mild or critical excursion</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Unresolved Alerts</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{unresolvedAlerts}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Open inspection tickets</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-cyan-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Inspections Done</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">{totalInspections}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Completed technician audits</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Latest Analysis</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-semibold font-mono text-slate-200 truncate mt-1">
            {latestTimestampStr}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Last acoustic run</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Score Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Anomaly Score History
              </h2>
              <p className="text-xs text-slate-400">
                Isolation Forest decision score vs calibrated anomaly threshold (0.58–0.60)
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Last {chartData.length} Analyses
            </span>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="index" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0.2, 0.9]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine
                    y={0.60}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: 'Alert Threshold (0.60)', fill: '#f43f5e', fontSize: 10, position: 'top' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#06b6d4' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No analyses recorded yet
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              Raw Isolation Forest Score (0.0 to 1.0)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
              Anomaly Alert Threshold
            </span>
          </div>
        </div>

        {/* Machine Status Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-cyan-400" /> Fleet Condition Health
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown of {totalMachines} monitored machine units
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            {statusPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name} Condition
                </span>
                <span className="font-mono font-semibold text-slate-200">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Anomaly Alerts & Quick Fleet Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Recent Anomaly Alerts
              </h2>
              <p className="text-xs text-slate-400">Deviations requiring technician physical inspection</p>
            </div>
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {maintenance
              .filter((m) => m.status === 'New Alert' || m.status === 'Inspection Pending')
              .slice(0, 3)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-slate-200">{alert.machineName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">{alert.technicianNotes}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                    <span>Assigned: {alert.technicianName}</span>
                    <button
                      onClick={() => onNavigateTab('maintenance')}
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      Audit Record →
                    </button>
                  </div>
                </div>
              ))}

            {maintenance.filter((m) => m.status === 'New Alert' || m.status === 'Inspection Pending').length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No unresolved anomaly alerts. All machinery within normal acoustic envelopes.
              </div>
            )}
          </div>
        </div>

        {/* Monitored Machines Fleet Quick Access */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Monitored Fleet
              </h2>
              <p className="text-xs text-slate-400">Select any machine to view baselines or analyse audio</p>
            </div>
            <button
              onClick={() => onNavigateTab('machines')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              Fleet Directory <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {machines.slice(0, 4).map((m) => {
              const statusBadge =
                m.status === 'NORMAL'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : m.status === 'ATTENTION'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectMachine(m);
                    onNavigateTab('audio_analysis');
                  }}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="truncate pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {m.name}
                      </span>
                      {m.isDemoMachine && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {m.category} • {m.location} • {m.operatingConditions.rpm} RPM
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-mono">Score</div>
                      <div className="font-mono text-xs font-bold text-slate-200">
                        {m.latestAnomalyScore?.toFixed(2) || '—'}
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${statusBadge}`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3D Machinery Digital Twin Feature Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <Box className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                Interactive 3D WebGL
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">PBR Industrial Graphics</span>
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Machinery 3D Digital Twin & Exploded Bearing View
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Inspect real-time 3D models of the motor & slurry pump assembly: orbit 360°, slide exploded views to reveal internal bearings, rotate shafts, and inject acoustic hotspot faults.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('digital_twin_3d')}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 btn-cyan-click shrink-0"
        >
          <Box className="w-4 h-4" /> Open 3D Twin Studio <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hackathon Callout */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">Engineering Demonstration Scenario</div>
            <div className="text-xs text-slate-400">
              Run the deterministic 8-step walk-through: Motor A normal baseline → Fault injection → Anomaly detection → Plain language explanation → Logged maintenance.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('model_representation')}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-colors"
          >
            Model Architecture
          </button>
          <button
            onClick={() => onNavigateTab('demo_scenario')}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow transition-colors"
          >
            Launch Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};
