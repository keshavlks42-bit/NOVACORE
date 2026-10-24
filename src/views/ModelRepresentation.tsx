import React, { useState } from 'react';
import {
  Workflow,
  Radio,
  Cpu,
  Binary,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Code2,
  FileCode,
  Gauge,
  HelpCircle,
  Maximize2,
} from 'lucide-react';

interface StageDetail {
  id: number;
  name: string;
  shortLabel: string;
  category: string;
  mathFormula: string;
  description: string;
  codeSnippet: string;
  inputs: string[];
  outputs: string[];
  scientificPrinciple: string;
}

const MODEL_STAGES: StageDetail[] = [
  {
    id: 1,
    name: '1. Acoustic & Sensor Signal Ingestion',
    shortLabel: 'Signal Ingestion',
    category: 'INPUT SENSING',
    mathFormula: 'x_w(n) = x(n) \\cdot w(n), \\quad w(n) = 0.5 \\left(1 - \\cos\\left(\\frac{2\\pi n}{N-1}\\right)\\right)',
    description:
      'Continuous acoustic audio (22.05 kHz or 44.1 kHz PCM) or triaxial accelerometer data (X, Y, Z at 1000 Hz) is windowed into short-time frames (N=1024 samples) with 50% hop size (512 samples) using a Hanning window to prevent spectral leakage.',
    codeSnippet: `// 1. Framing and Hanning windowing
const frameSize = 1024;
const hopSize = 512;
const window = new Float64Array(frameSize);
for (let i = 0; i < frameSize; i++) {
  window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameSize - 1)));
}`,
    inputs: ['Raw WAV PCM (Float32Array)', 'Sample Rate (Hz)', 'Vibration CSV (accel_x, y, z)'],
    outputs: ['Windowed temporal frames (1024 samples/frame)'],
    scientificPrinciple:
      'Industrial machinery emits continuous non-stationary acoustic waveforms. Windowing isolates local stationary intervals of rotating components.',
  },
  {
    id: 2,
    name: '2. Fast Fourier Transform & Spectral Decomposition',
    shortLabel: 'FFT & Spectrum',
    category: 'DIGITAL SIGNAL PROCESSING',
    mathFormula: 'X(k) = \\sum_{n=0}^{N-1} x_w(n) e^{-j\\frac{2\\pi k n}{N}}, \\quad |X(k)| = \\sqrt{\\text{Re}^2 + \\text{Im}^2}',
    description:
      'Each windowed frame is mapped from the time domain to the frequency domain via Fast Fourier Transform (FFT). Power spectral densities are calculated across 513 discrete frequency bins spanning 0 Hz to the Nyquist cutoff.',
    codeSnippet: `// 2. Radix-2 Real FFT
fft(real, imag);
for (let k = 0; k < numBins; k++) {
  mag[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
  frameEnergy += mag[k];
}`,
    inputs: ['Windowed frame x_w(n)'],
    outputs: ['Magnitude spectrum |X(k)|', 'Frequency bin array (Hz)'],
    scientificPrinciple:
      'Physical mechanical faults manifest as distinct frequency peaks: unbalance at 1X RPM, gear meshing at gear-tooth frequency, and bearing spalling at ball pass frequencies.',
  },
  {
    id: 3,
    name: '3. 14-Dimensional Acoustic Feature Extraction',
    shortLabel: 'Feature Vector',
    category: 'FEATURE ENGINEERING',
    mathFormula: '\\text{Centroid} = \\frac{\\sum f_k |X(k)|}{\\sum |X(k)|}, \\quad \\text{RMS} = \\sqrt{\\frac{1}{N}\\sum x_n^2}, \\quad c_m = \\text{DCT}(\\log(\\text{Mel}_{\\text{filters}}))',
    description:
      'Compresses thousands of raw audio samples into a deterministic 14-dimensional vector: RMS Energy, Spectral Centroid, Bandwidth, 85% Rolloff, Zero-Crossing Rate, Spectral Flux, and 8 Mel-Frequency Cepstral Coefficients (MFCCs).',
    codeSnippet: `// 3. Feature Vector Generation
const features = [
  rmsEnergy,           // Total acoustic energy
  spectralCentroid,    // Center of mass frequency
  spectralBandwidth,   // Frequency spread around centroid
  spectralRolloff,     // 85% cumulative energy cutoff
  zeroCrossingRate,    // Waveform sign inversions
  spectralFlux,        // Frame-to-frame distance
  ...mfcc.slice(0, 8)  // 8 Mel cepstral timbre coefficients
];`,
    inputs: ['Magnitude spectrum |X(k)|', 'Time-domain samples'],
    outputs: ['14-dimensional normalized feature vector x ∈ ℝ¹⁴'],
    scientificPrinciple:
      'Feature extraction eliminates phase noise and dimensionality curse while retaining physical indicators of mechanical friction, turbulence, and shock.',
  },
  {
    id: 4,
    name: '4. Machine-Isolated Normal Baseline Fitting',
    shortLabel: 'Baseline Manifold',
    category: 'UNSUPERVISED LEARNING',
    mathFormula: '\\mu_j = \\frac{1}{M}\\sum_{i=1}^M x_{i,j}, \\quad \\sigma_j = \\sqrt{\\frac{1}{M-1}\\sum_{i=1}^M (x_{i,j} - \\mu_j)^2}',
    description:
      'The model is fitted strictly on 20–60 confirmed healthy operating recordings. It calculates empirical feature means and standard deviations without exposing the model to faulty data.',
    codeSnippet: `// 4. Baseline Manifold Calibration
const { means, stds } = calculateBaselineStatistics(normalRecordings);
// Enforce strict machine isolation to prevent data leakage:
const baselineKey = \`baseline_\${machineId}\`;`,
    inputs: ['20–60 Normal recordings for specific machine'],
    outputs: ['Baseline reference vector μ', 'Standard deviation vector σ', 'Calibration bounds'],
    scientificPrinciple:
      'Small factories rarely possess labeled failure recordings. Learning the boundary of normal operation eliminates the need for expensive historical fault labels.',
  },
  {
    id: 5,
    name: '5. Isolation Forest Random Partitioning & Tree Traversal',
    shortLabel: 'Isolation Forest',
    category: 'ENSEMBLE ALGORITHM',
    mathFormula: 's(x, n) = 2^{-\\frac{E(h(x))}{c(n)}}, \\quad c(n) = 2(\\ln(n - 1) + 0.5772156649) - \\frac{2(n - 1)}{n}',
    description:
      'An ensemble of 60 Isolation Trees recursively partitions the 14D feature space by selecting random dimensions and split values. Anomalous observations are isolated rapidly near tree roots (small path length h), while normal points require deep splits.',
    codeSnippet: `// 5. Isolation Forest Score Calculation
class IsolationForest {
  score(x: number[]): number {
    const avgPath = totalPathLength(x) / this.numTrees;
    const cN = averagePathLength(this.sampleSize);
    return Math.pow(2, -avgPath / cN); // Score ∈ [0, 1]
  }
}`,
    inputs: ['Feature vector x', '60 Trained Isolation Trees'],
    outputs: ['Average path length E(h(x))', 'Model Decision Score s ∈ [0.0, 1.0]'],
    scientificPrinciple:
      'Anomalies are "few and different", meaning they occupy sparse regions of the feature space and are isolated with significantly fewer random hyperplanes.',
  },
  {
    id: 6,
    name: '6. Calibrated Threshold & Sensitivity Tuning',
    shortLabel: 'Decision Threshold',
    category: 'CLASSIFICATION BOUNDARY',
    mathFormula: '\\text{Status} = \\begin{cases} \\text{ANOMALY} & s \\ge \\tau \\cdot k_{\\text{sens}} \\\\ \\text{REVIEW} & s \\ge 0.88 \\cdot \\tau \\cdot k_{\\text{sens}} \\\\ \\text{NORMAL} & \\text{otherwise} \\end{cases}',
    description:
      'The raw isolation score is evaluated against the calibrated baseline cutoff (τ = 0.58). User sensitivity tuning scales the threshold (0.90 for high sensitivity, 1.12 for low sensitivity) to match factory noise tolerance.',
    codeSnippet: `// 6. Thresholding & Sensitivity Scaling
const effectiveThreshold = baseline.threshold * sensitivityFactor;
if (rawScore >= effectiveThreshold) {
  alertLevel = 'ANOMALY'; // Red flag
} else if (rawScore >= effectiveThreshold * 0.88) {
  alertLevel = 'REVIEW';  // Amber flag
} else {
  alertLevel = 'NORMAL';  // Green flag
}`,
    inputs: ['Model score s', 'Calibrated threshold τ', 'Sensitivity factor'],
    outputs: ['Alert level (NORMAL / REVIEW / ANOMALY)', 'Normalized Anomaly Index (0-100)'],
    scientificPrinciple:
      'Thresholding must account for environmental variance. Anomaly severity indicates statistical distance from baseline, not failure probability.',
  },
  {
    id: 7,
    name: '7. Root-Cause Evidence Mapping & Technician Briefing',
    shortLabel: 'Explainable Alert',
    category: 'OPERATIONAL DECISION SUPPORT',
    mathFormula: 'z_j = \\frac{|x_j - \\mu_j|}{\\sigma_j}, \\quad S_{\\text{fused}} = w_a S_{\\text{audio}} + w_v S_{\\text{vib}}',
    description:
      'Translates mathematical feature deviations (e.g. +3.91σ Centroid, +2.86σ RMS) into plain-English root causes (bearing friction, cavitation hiss, unbalance) and pairs with multimodal vibration and closed-loop maintenance tickets.',
    codeSnippet: `// 7. Evidence-based explanation
const deviations = computeFeatureDeviations(features, baseline);
// Sort by highest deviation sigma:
const primaryDriver = deviations[0]; // e.g. "Spectral Centroid +3.91σ"
// Generate technician checklist:
// "Inspect drive belt tension and bearing lubrication"`,
    inputs: ['Feature deviations (σ)', 'Vibration resultant', 'Technician inspection outcome'],
    outputs: ['Evidence breakdown card', 'AI Engineering Brief', 'Maintenance ticket status'],
    scientificPrinciple:
      'Factory technicians require actionable mechanical hypotheses, not black-box scores. Explaining which physical features shifted empowers rapid physical inspection.',
  },
];

export const ModelRepresentation: React.FC = () => {
  const [selectedStageId, setSelectedStageId] = useState<number>(5); // Default to Isolation Forest
  const [simulationPreset, setSimulationPreset] = useState<'normal' | 'bearing_fault' | 'rotor_unbalance'>('bearing_fault');

  const selectedStage = MODEL_STAGES.find((s) => s.id === selectedStageId) || MODEL_STAGES[0];

  // Simulation values depending on preset
  const simData = {
    normal: {
      title: 'Sample A: Healthy 60Hz Induction Motor',
      sourceType: 'Normal baseline operation',
      rms: '0.142 V',
      rmsSigma: '+0.12σ (Normal)',
      centroid: '468 Hz',
      centroidSigma: '+0.18σ (Normal)',
      zcr: '0.038',
      avgPathLength: '7.42 edges (Deep in trees)',
      rawScore: '0.41',
      displayIndex: '24%',
      alertLevel: 'NORMAL',
      statusColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      evidence: 'All 14 acoustic dimensions cluster within ±1.5σ of baseline center.',
      checklist: 'No action required. Machine operating on standard acoustic baseline.',
    },
    bearing_fault: {
      title: 'Sample B: Drive-End Bearing Friction / Spalling',
      sourceType: 'High-frequency friction transient',
      rms: '0.278 V',
      rmsSigma: '+2.86σ (Elevated Energy)',
      centroid: '995 Hz',
      centroidSigma: '+3.91σ (High-Freq Excursion)',
      zcr: '0.088',
      avgPathLength: '2.84 edges (Isolated near roots)',
      rawScore: '0.68',
      displayIndex: '74%',
      alertLevel: 'SIGNIFICANT ANOMALY',
      statusColor: 'text-rose-400',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      evidence: 'Spectral Centroid shifted +3.91σ (995 Hz vs 468 Hz normal); RMS Energy shifted +2.86σ.',
      checklist: 'Inspect drive-end bearing housing temperature; check lubrication for grease discoloration.',
    },
    rotor_unbalance: {
      title: 'Sample C: 29.5Hz Rotational Rotor Unbalance',
      sourceType: 'Heavy 1X harmonic mechanical rumble',
      rms: '0.342 V',
      rmsSigma: '+3.15σ (Heavy Vibration Energy)',
      centroid: '312 Hz',
      centroidSigma: '-2.42σ (Downward Frequency Shift)',
      zcr: '0.021',
      avgPathLength: '2.51 edges (Rapidly isolated)',
      rawScore: '0.73',
      displayIndex: '82%',
      alertLevel: 'SIGNIFICANT ANOMALY',
      statusColor: 'text-rose-400',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      evidence: 'Low-frequency power surge; Spectral Centroid dropped to 312 Hz; High 1X vibration resultant.',
      checklist: 'Inspect foundation anchor bolts; verify coupling alignment and rotor dynamic balance.',
    },
  }[simulationPreset];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Complete Model Architecture
            </span>
            <span className="text-xs text-slate-400">7-Stage End-to-End Representation</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">
            MachineSentry Model Architecture & Pipeline Steps
          </h1>
          <p className="text-xs text-slate-400">
            Interactive representation explaining how raw mechanical acoustics are captured, transformed into DSP features, and isolated without labeled fault datasets.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 w-full sm:w-auto">
          <Activity className="w-4 h-4 text-cyan-400 ml-2" />
          <span className="text-xs text-slate-400 hidden sm:inline">Simulate Data Flow:</span>
          <select
            value={simulationPreset}
            onChange={(e) => setSimulationPreset(e.target.value as any)}
            className="bg-transparent text-xs font-semibold text-slate-200 pr-3 py-1 focus:outline-none cursor-pointer"
          >
            <option value="normal" className="bg-slate-900 text-slate-100">
              Preset A: Normal Motor Sound
            </option>
            <option value="bearing_fault" className="bg-slate-900 text-slate-100">
              Preset B: Bearing Impact Fault
            </option>
            <option value="rotor_unbalance" className="bg-slate-900 text-slate-100">
              Preset C: Rotor Unbalance Rumble
            </option>
          </select>
        </div>
      </div>

      {/* Interactive Horizontal Pipeline Flow Stepper */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Workflow className="w-4 h-4 text-cyan-400" /> Interactive Model Pipeline (Click any stage to inspect mathematics)
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            Selected: Stage {selectedStage.id}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {MODEL_STAGES.map((stage) => {
            const isSelected = stage.id === selectedStageId;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-2 ring-cyan-500/30 shadow-md'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">
                      0{stage.id}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">
                      {stage.category.split(' ')[0]}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-200 line-clamp-1">
                    {stage.shortLabel}
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-slate-500 font-mono">
                  {stage.id === 5 ? 's(x, n) Isolation' : stage.id === 3 ? '14D Vector' : stage.id === 7 ? 'Plain English' : 'DSP Transform'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Data Simulation Flow Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                Live Data Flow
              </span>
              <h3 className="font-bold text-sm text-slate-100">{simData.title}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{simData.sourceType}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono font-bold uppercase px-2.5 py-1 rounded border ${simData.badgeColor}`}>
              {simData.alertLevel}
            </span>
          </div>
        </div>

        {/* Step-by-Step Data Telemetry Across the Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">1. Ingestion</span>
            <span className="font-mono font-bold text-slate-200">1024 Samples</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Hanning Windowed</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">2. Spectral Centroid</span>
            <span className="font-mono font-bold text-cyan-400">{simData.centroid}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{simData.centroidSigma}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">3. RMS Energy</span>
            <span className="font-mono font-bold text-cyan-400">{simData.rms}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{simData.rmsSigma}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">4. Tree Traversal</span>
            <span className="font-mono font-bold text-amber-400">{simData.avgPathLength}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">E(h) over 60 trees</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">5. Anomaly Score</span>
            <span className={`font-mono text-base font-bold ${simData.statusColor}`}>
              {simData.rawScore} <span className="text-xs text-slate-500">/ 1.0</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Index: {simData.displayIndex}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">6. Decision Cutoff</span>
            <span className="font-mono font-bold text-slate-200">0.58 Threshold</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {parseFloat(simData.rawScore) >= 0.58 ? 'Exceeded Alert' : 'Within Bounds'}
            </span>
          </div>
        </div>

        {/* Explanation output of the simulation */}
        <div className="mt-3.5 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <strong className="text-cyan-400">Physical Evidence: </strong>
            <span className="text-slate-300">{simData.evidence}</span>
          </div>
          <div className="shrink-0 text-slate-400">
            <strong className="text-amber-400">Suggested Action: </strong>
            <span>{simData.checklist}</span>
          </div>
        </div>
      </div>

      {/* Selected Stage Deep-Dive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Mathematical Formulation & Explanation */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                Stage {selectedStage.id} In-Depth Specification
              </span>
              <h2 className="text-base font-bold text-slate-100">{selectedStage.name}</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {selectedStage.category}
            </span>
          </div>

          {/* Mathematical Formula Box */}
          <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/20 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block font-semibold">
              Governing Mathematical Formula:
            </span>
            <div className="font-mono text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded border border-slate-800 overflow-x-auto">
              {selectedStage.mathFormula}
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              How This Step Operates:
            </h4>
            <p>{selectedStage.description}</p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-semibold shrink-0">Stage Inputs:</span>
              <span className="text-slate-400">{selectedStage.inputs.join(' • ')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-semibold shrink-0">Stage Outputs:</span>
              <span className="text-slate-300 font-mono text-[11px]">{selectedStage.outputs.join(' • ')}</span>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40 text-xs text-cyan-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-200">Scientific Foundation: </strong>
              {selectedStage.scientificPrinciple}
            </div>
          </div>
        </div>

        {/* Right: Code Implementation & Algorithm Structure */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <Code2 className="w-4 h-4 text-cyan-400" /> TypeScript Engine Implementation
              </div>
              <span className="text-[10px] font-mono text-slate-500">Client/Server Verified</span>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
              <pre className="font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto">
                <code>{selectedStage.codeSnippet}</code>
              </pre>
            </div>
          </div>

          {/* Quick Stage Switcher */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setSelectedStageId((prev) => Math.max(1, prev - 1))}
              disabled={selectedStageId === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              ← Previous Stage
            </button>
            <span className="text-xs font-mono text-slate-500">
              Stage {selectedStageId} of {MODEL_STAGES.length}
            </span>
            <button
              onClick={() => setSelectedStageId((prev) => Math.min(MODEL_STAGES.length, prev + 1))}
              disabled={selectedStageId === MODEL_STAGES.length}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-30 flex items-center gap-1"
            >
              Next Stage →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
