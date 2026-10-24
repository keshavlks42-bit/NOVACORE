import React, { useState } from 'react';
import {
  Binary,
  Cpu,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Plus,
  ShieldCheck,
  BarChart,
  HelpCircle,
} from 'lucide-react';
import { Baseline, Machine, ModelType } from '../types';
import { FEATURE_NAMES, FEATURE_EXPLANATIONS, calculateBaselineStatistics } from '../services/anomalyModel';

interface BaselineEngineProps {
  machines: Machine[];
  baselines: Baseline[];
  onSaveBaseline: (baseline: Baseline) => void;
}

export const BaselineEngine: React.FC<BaselineEngineProps> = ({
  machines,
  baselines,
  onSaveBaseline,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    machines[0]?.id || ''
  );

  const currentMachine = machines.find((m) => m.id === selectedMachineId);
  const currentBaseline =
    baselines.find((b) => b.machineId === selectedMachineId) || baselines[0];

  const [modelType, setModelType] = useState<ModelType>(
    currentBaseline?.modelType || 'isolation_forest'
  );
  const [threshold, setThreshold] = useState<number>(
    currentBaseline?.threshold || 0.58
  );
  const [calibratedPercentile, setCalibratedPercentile] = useState<number>(
    currentBaseline?.calibratedPercentile || 95
  );
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainSuccess, setRetrainSuccess] = useState<boolean>(false);

  const handleRetrain = () => {
    if (!currentMachine || !currentBaseline) return;
    setIsRetraining(true);

    setTimeout(() => {
      // Simulate adding 5 additional normal machine sound observations
      const baseRms = currentBaseline.featureMeans['RMS Energy'] || 0.15;
      const baseCentroid = currentBaseline.featureMeans['Spectral Centroid'] || 500;

      const newObs = [...currentBaseline.trainingObservations];
      for (let i = 0; i < 5; i++) {
        newObs.push([
          baseRms + (Math.random() - 0.5) * 0.015,
          baseCentroid + (Math.random() - 0.5) * 35,
          baseCentroid * 1.3 + (Math.random() - 0.5) * 25,
          baseCentroid * 2.0 + (Math.random() - 0.5) * 45,
          0.04 + (Math.random() - 0.5) * 0.007,
          0.009 + (Math.random() - 0.5) * 0.002,
          -2.0 + (Math.random() - 0.5) * 0.4,
          14.0 + (Math.random() - 0.5) * 1.2,
          -8.0 + (Math.random() - 0.5) * 0.8,
          3.0 + (Math.random() - 0.5) * 0.5,
          1.0 + (Math.random() - 0.5) * 0.3,
          -0.5 + (Math.random() - 0.5) * 0.2,
          0.3 + (Math.random() - 0.5) * 0.1,
          -0.1 + (Math.random() - 0.5) * 0.1,
        ]);
      }

      const { means, stds } = calculateBaselineStatistics(newObs);

      const updatedBaseline: Baseline = {
        ...currentBaseline,
        machineId: currentMachine.id,
        machineName: currentMachine.name,
        modelType,
        threshold,
        calibratedPercentile,
        sampleCount: newObs.length,
        featureMeans: means,
        featureStds: stds,
        trainingObservations: newObs,
        version: `1.${parseInt(currentBaseline.version.split('.')[1] || '0') + 1}.0-baseline`,
        createdAt: new Date().toISOString(),
      };

      onSaveBaseline(updatedBaseline);
      setIsRetraining(false);
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Unsupervised Learning Architecture
            </span>
            <span className="text-xs text-slate-400">Normal-Data Driven</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Baseline & ML Anomaly Engine</h1>
          <p className="text-xs text-slate-400">
            Train baseline models strictly on confirmed normal operating data without requiring labeled fault datasets.
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

      {/* Model Configuration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Binary className="w-4 h-4 text-cyan-400" /> Model Configuration
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
              {currentBaseline?.version || 'v1.0'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Anomaly Detection Algorithm
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as ModelType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="isolation_forest">Isolation Forest (Recommended baseline)</option>
              <option value="statistical_mahalanobis">Statistical Mahalanobis / Z-Score</option>
              <option value="one_class_svm">One-Class Support Vector Boundary</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Isolation Forest isolates anomalies by randomly partitioning feature ranges. Normal instances require many partitions; anomalous instances are isolated near tree roots.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Decision Threshold Cutoff
              </span>
              <span className="font-mono text-cyan-400 font-bold">{threshold}</span>
            </div>
            <input
              type="range"
              min="0.45"
              max="0.80"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.45 (Sensitive / More Alerts)</span>
              <span>0.80 (Strict / Conservative)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Baseline Calibration Percentile
              </span>
              <span className="font-mono text-cyan-400 font-bold">{calibratedPercentile}%</span>
            </div>
            <input
              type="range"
              min="85"
              max="99"
              step="1"
              value={calibratedPercentile}
              onChange={(e) => setCalibratedPercentile(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {calibratedPercentile}% of verified normal observations are bounded within nominal status.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleRetrain}
              disabled={isRetraining}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
              {isRetraining ? 'Re-fitting Baseline Ensembles...' : 'Fit Model to New Baseline Observations'}
            </button>
            {retrainSuccess && (
              <div className="text-center text-xs text-emerald-400 font-semibold mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Baseline Updated & Calibrated!
              </div>
            )}
          </div>
        </div>

        {/* Baseline Mathematical Statistics */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-cyan-400" /> Baseline Feature Distributions
                </h2>
                <p className="text-xs text-slate-400">
                  Target: {currentMachine?.name} • Trained on {currentBaseline?.sampleCount || 0} normal observations
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Calibrated Stable
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="py-2 px-2">Acoustic Feature</th>
                    <th className="py-2 px-2">Mean Value (μ)</th>
                    <th className="py-2 px-2">Std Dev (σ)</th>
                    <th className="py-2 px-2">Physical Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {FEATURE_NAMES.slice(0, 8).map((name) => {
                    const mean = currentBaseline?.featureMeans[name] ?? '—';
                    const std = currentBaseline?.featureStds[name] ?? '—';
                    const desc = FEATURE_EXPLANATIONS[name] || 'Acoustic metric';

                    return (
                      <tr key={name} className="hover:bg-slate-950/40">
                        <td className="py-2 px-2 font-semibold text-slate-200">{name}</td>
                        <td className="py-2 px-2 text-cyan-400">{mean}</td>
                        <td className="py-2 px-2 text-slate-400">± {std}</td>
                        <td className="py-2 px-2 text-[11px] text-slate-400 font-sans truncate max-w-xs">
                          {desc}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5 mt-4">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Anti-Data Leakage Protection: </span>
              Baselines are isolated strictly by machine ID. Observations from Motor A are never mixed with Water Pump B, preventing false positive alarms triggered by natural machine acoustic differences.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
