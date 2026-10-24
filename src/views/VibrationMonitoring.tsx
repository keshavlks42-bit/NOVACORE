import React, { useState, useEffect } from 'react';
import {
  Activity,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  BarChart2,
  FileSpreadsheet,
  Layers,
  Info,
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
} from 'recharts';
import { Machine, VibrationPoint, VibrationSummary } from '../types';
import { generateDemoVibrationData, parseVibrationCsv } from '../services/vibrationEngine';

interface VibrationMonitoringProps {
  machines: Machine[];
}

export const VibrationMonitoring: React.FC<VibrationMonitoringProps> = ({ machines }) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [mode, setMode] = useState<'demo' | 'import'>('demo');
  const [hasAnomaly, setHasAnomaly] = useState<boolean>(true);
  const [vibrationPoints, setVibrationPoints] = useState<VibrationPoint[]>([]);
  const [summary, setSummary] = useState<VibrationSummary>({
    rms: 0,
    peak: 0,
    crestFactor: 0,
    isSimulated: true,
  });
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [alertThreshold, setAlertThreshold] = useState<number>(1.8); // 1.8g acceleration peak

  // Load demo data whenever hasAnomaly or mode changes
  useEffect(() => {
    if (mode === 'demo') {
      const { points, summary: demoSummary } = generateDemoVibrationData(hasAnomaly, 60);
      setVibrationPoints(points);
      setSummary(demoSummary);
      setCsvErrors([]);
    }
  }, [mode, hasAnomaly]);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { points, summary: parsedSummary, errors } = parseVibrationCsv(content);
      if (errors.length > 0) {
        setCsvErrors(errors);
      } else {
        setVibrationPoints(points);
        setSummary(parsedSummary);
        setCsvErrors([]);
      }
    };
    reader.readAsText(file);
  };

  const currentMachine = machines.find((m) => m.id === selectedMachineId);
  const isAlarmTriggered = summary.peak >= alertThreshold;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Triaxial Acceleration Dynamics
            </span>
            <span className="text-xs text-slate-400">ISO 10816 Vibration Severity</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Vibration Condition Monitoring</h1>
          <p className="text-xs text-slate-400">
            Multi-axis accelerometer time-series analysis with RMS amplitude, peak shock, and Crest Factor tracking.
          </p>
        </div>

        {/* Machine Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 w-full sm:w-auto">
          <Cpu className="w-4 h-4 text-cyan-400 ml-2" />
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 pr-3 py-1 focus:outline-none cursor-pointer"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Selection Toggle */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('demo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'demo'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
            }`}
          >
            <Layers className="w-4 h-4" /> Mode A: Demonstration Telemetry
          </button>
          <button
            onClick={() => setMode('import')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'import'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
            }`}
          >
            <Upload className="w-4 h-4" /> Mode B: Import Sensor CSV
          </button>
        </div>

        {mode === 'demo' ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Simulate Transient Anomaly:</span>
            <button
              onClick={() => setHasAnomaly(!hasAnomaly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                hasAnomaly
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {hasAnomaly ? 'Fault Injected (Shock Burst)' : 'Normal Running State'}
            </button>
          </div>
        ) : (
          <div>
            <label className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shadow">
              <FileSpreadsheet className="w-4 h-4" /> Upload CSV Sensor Data
              <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {csvErrors.length > 0 && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
          {csvErrors.map((err, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Simulated Banner if Mode A */}
      {summary.isSimulated && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-200 uppercase font-mono">[DEMONSTRATION DATA]: </span>
            The vibration values below are synthetic waveforms generated with rotational motor harmonics (1X/2X) and stochastic noise. They are not readings from a physical hardware accelerometer.
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">RMS Vibration</span>
          <span className="text-2xl font-bold font-mono text-slate-100">{summary.rms}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">g (ISO Zone severity metric)</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Peak Amplitude</span>
          <span
            className={`text-2xl font-bold font-mono ${
              isAlarmTriggered ? 'text-rose-400' : 'text-slate-100'
            }`}
          >
            {summary.peak}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">g acceleration excursion</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Crest Factor</span>
          <span
            className={`text-2xl font-bold font-mono ${
              summary.crestFactor > 3.5 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {summary.crestFactor}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Ratio (Peak/RMS &gt; 3.5 indicates impacts)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Vibration Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                isAlarmTriggered
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : summary.crestFactor > 3.0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {isAlarmTriggered ? 'Threshold Exceeded' : summary.crestFactor > 3.0 ? 'Attention' : 'Normal Zone A/B'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">ISO 10816 evaluation</span>
        </div>
      </div>

      {/* Vibration Time-Series Interactive Chart */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Triaxial Acceleration Telemetry (g)
            </h2>
            <p className="text-xs text-slate-400">
              Target: {currentMachine?.name} • Resultant vector: |a| = √(x² + y² + z²)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Alarm Cutoff:</span>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(parseFloat(e.target.value) || 1.8)}
                className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-400 font-bold"
              />
              <span className="text-slate-500 text-[11px]">g</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vibrationPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                }}
              />
              <ReferenceLine
                y={alertThreshold}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: `Alert Threshold (${alertThreshold}g)`, fill: '#f43f5e', fontSize: 10, position: 'top' }}
              />
              <Line type="monotone" dataKey="resultant" stroke="#06b6d4" strokeWidth={2} dot={false} name="Resultant |a|" />
              <Line type="monotone" dataKey="accelX" stroke="#3b82f6" strokeWidth={1} dot={false} strokeOpacity={0.6} name="X-Axis" />
              <Line type="monotone" dataKey="accelY" stroke="#10b981" strokeWidth={1} dot={false} strokeOpacity={0.6} name="Y-Axis" />
              <Line type="monotone" dataKey="accelZ" stroke="#f59e0b" strokeWidth={1} dot={false} strokeOpacity={0.6} name="Z-Axis" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Resultant |a|
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" /> X-Axis (Radial)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Y-Axis (Axial)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 inline-block" /> Z-Axis (Vertical)
            </span>
          </div>
          <span className="text-slate-500 font-mono">
            Sensor sampling: 1000 Hz continuous
          </span>
        </div>
      </div>
    </div>
  );
};
