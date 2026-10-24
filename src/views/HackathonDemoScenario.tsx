import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Cpu,
  ArrowRight,
  RotateCcw,
  Activity,
  AlertTriangle,
  Wrench,
  Binary,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { Machine, MaintenanceRecord } from '../types';

interface HackathonDemoScenarioProps {
  onCompleteDemo: (record: MaintenanceRecord) => void;
  onNavigateTab: (tab: any) => void;
}

export const HackathonDemoScenario: React.FC<HackathonDemoScenarioProps> = ({
  onCompleteDemo,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [technicianNotes, setTechnicianNotes] = useState<string>(
    'Technician checked drive-end 6205 bearing: grease oxidation discovered. Cleaned and replenished with synthetic grease.'
  );

  const nextStep = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep((prev) => Math.min(8, prev + 1));
    }, 400);
  };

  const resetWalkthrough = () => {
    setCurrentStep(1);
    setIsProcessing(false);
  };

  const handleFinishInspection = () => {
    const newRecord: MaintenanceRecord = {
      id: `maint-demo-${Date.now().toString().slice(-4)}`,
      machineId: 'mach-motor-a',
      machineName: 'Motor A (Induction 5.5kW)',
      date: new Date().toISOString(),
      associatedAnalysisId: 'anal-demo-step4',
      status: 'Inspection Completed',
      technicianName: 'Marcus Vance (Lead Tech)',
      technicianNotes,
      maintenanceAction: 'Replenished bearing grease and torqued foundation bolts',
      partsReplaced: 'Grease charge',
      inspectionOutcome: 'Bearing saved from thermal seizure; noise returned to nominal baseline',
    };

    onCompleteDemo(newRecord);
    setCurrentStep(8);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-800/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Interactive Hackathon Scenario
            </span>
            <span className="text-xs text-slate-400 font-mono">Step {currentStep} of 8</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">
            "Can MachineSentry Detect a Change in Machine Behaviour?"
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Deterministic, end-to-end demonstration walking through baseline training, anomaly isolation, explainable evidence, and closed-loop maintenance.
          </p>
        </div>

        <button
          onClick={resetWalkthrough}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Walkthrough
        </button>
      </div>

      {/* Step Progress Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="grid grid-cols-8 gap-1.5 mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s < currentStep
                  ? 'bg-emerald-500'
                  : s === currentStep
                  ? 'bg-cyan-400 ring-2 ring-cyan-500/40 animate-pulse'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>1. Select Machine</span>
          <span>4. Ingest Audio</span>
          <span>6. Evidence Alert</span>
          <span>8. Ledger Audit</span>
        </div>
      </div>

      {/* Step Content Container */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg min-h-[360px] flex flex-col justify-between">
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
              <Cpu className="w-5 h-5" /> Step 1: Select Fictional Machine (Motor A)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              We select a standard 5.5 kW three-phase induction motor installed on Extrusion Line #1. Under healthy conditions, it rotates at 1475 RPM with smooth 50Hz/100Hz electromagnetic sound and low bearing noise.
            </p>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Machine Identity:</span>
                <span className="font-mono text-cyan-400 font-bold">Motor A (Induction 5.5kW)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operating Bay:</span>
                <span className="text-slate-200">Bay 2 — Extrusion Line #1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nominal Load & RPM:</span>
                <span className="text-slate-200">78% Load • 1475 RPM • 400V 3-phase</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Initial Fleet Health:</span>
                <span className="text-emerald-400 font-mono font-bold">NORMAL (Active)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
              <Layers className="w-5 h-5" /> Step 2: Load Normal Baseline Feature Observations
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              We ingest 24 representative acoustic recordings captured during verified normal operating shifts. Features (RMS energy, spectral centroid, rolloff, zero-crossing rate, MFCCs) are extracted to form the healthy reference manifold.
            </p>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Baseline Sample Count:</span>
                <span className="font-mono text-emerald-400 font-bold">24 Validated Shift Observations</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Normal RMS Energy (μ ± σ):</span>
                <span className="font-mono text-slate-200">0.142 ± 0.015 V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Normal Spectral Centroid:</span>
                <span className="font-mono text-slate-200">468.5 ± 32.0 Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Acoustic Consistency:</span>
                <span className="text-emerald-400 font-mono">Manifold Clustered (No Faults)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
              <Binary className="w-5 h-5" /> Step 3: Train Isolation Forest Baseline Model
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The Isolation Forest algorithm constructs an ensemble of 60 random isolation trees across the 14 acoustic dimensions. The decision threshold is calibrated to 0.58 (95th percentile of normal data).
            </p>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ensemble Size:</span>
                <span className="font-mono text-cyan-400 font-bold">60 Isolation Trees</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calibrated Anomaly Threshold:</span>
                <span className="font-mono text-rose-400 font-bold">0.58</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Baseline Model Version:</span>
                <span className="font-mono text-slate-200">v1.2.0-baseline-motorA</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <Activity className="w-5 h-5" /> Step 4: Analyse Held-Out New Observation
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Now we introduce a new acoustic test recording. Unknown to the model, this observation contains early bearing friction transients and mechanical clicking.
            </p>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Test File:</span>
                <span className="text-slate-200">motorA_shift3_bearing_rub.wav</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Measured RMS Energy:</span>
                <span className="text-rose-400 font-bold">0.278 V (+2.86σ above mean)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Measured Spectral Centroid:</span>
                <span className="text-rose-400 font-bold">995.4 Hz (+3.91σ above mean)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" /> Step 5: Anomaly Score & Mathematical Excursion
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The sample isolates rapidly near tree roots. The calculated score is 0.68, decisively exceeding the 0.58 threshold.
            </p>
            <div className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Raw Isolation Forest Score:</span>
                <span className="font-mono text-xl font-bold text-rose-400">0.68 / 1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Normalized Anomaly Index:</span>
                <span className="font-mono text-cyan-400 font-bold">74%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alert Classification:</span>
                <span className="font-mono text-rose-400 uppercase font-bold">
                  SIGNIFICANT ANOMALY
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 6 */}
        {currentStep === 6 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
              <Sparkles className="w-5 h-5" /> Step 6: Evidence-Based Plain Language Alert
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-100">
                ALERT: Unusual high-frequency sound pattern detected.
              </div>
              <div className="text-slate-300">
                <strong className="text-cyan-400">Observed Evidence: </strong>
                RMS energy shifted +2.86σ and spectral centroid shifted +3.91σ into the 1 kHz range.
              </div>
              <div className="text-slate-300">
                <strong className="text-amber-400">Next Action: </strong>
                Inspect drive-end bearing lubrication and motor mounting bolt tightness.
              </div>
            </div>
            <div className="p-3 bg-slate-950 text-[11px] text-slate-400 rounded-lg border border-slate-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                "MachineSentry identifies unusual operating patterns. An alert is not proof of mechanical failure. Inspect equipment and follow appropriate safety procedures."
              </span>
            </div>
          </div>
        )}

        {/* Step 7 */}
        {currentStep === 7 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Wrench className="w-5 h-5" /> Step 7: Record Technician Physical Inspection Result
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A technician was dispatched to Motor A. Enter their real physical audit findings to close the loop:
            </p>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Technician Inspection Notes:
              </label>
              <textarea
                rows={3}
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Step 8 */}
        {currentStep === 8 && (
          <div className="space-y-4 animate-in fade-in text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              End-to-End Walkthrough Completed!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              You proved the core thesis of MachineSentry: Learning normal baseline sounds allowed early detection of an acoustic anomaly, translated into actionable technician evidence, and recorded in maintenance history without requiring pre-labeled failure datasets.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('maintenance')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow transition-colors"
              >
                View Maintenance History Ledger →
              </button>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-800 mt-6">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || currentStep === 8}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30"
          >
            ← Previous Step
          </button>

          {currentStep < 7 && (
            <button
              onClick={nextStep}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Next Step ({currentStep + 1}/8) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 7 && (
            <button
              onClick={handleFinishInspection}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Commit Physical Inspection Record <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {currentStep === 8 && (
            <button
              onClick={resetWalkthrough}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Run Scenario Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
