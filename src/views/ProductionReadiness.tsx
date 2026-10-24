import React from 'react';
import {
  BookOpen,
  ShieldAlert,
  Cpu,
  Radio,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Flame,
} from 'lucide-react';

export const ProductionReadiness: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
            Engineering Documentation
          </span>
          <span className="text-xs text-slate-400">Industrial IoT Deployment Guide</span>
        </div>
        <h1 className="text-xl font-bold text-slate-100">Production-Readiness & Real-World Notes</h1>
        <p className="text-xs text-slate-400">
          What is required before transitioning MachineSentry from this working demonstration prototype to harsh factory floor environments.
        </p>
      </div>

      {/* Mandatory Safety Notice */}
      <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-xs text-rose-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-200">
          <ShieldAlert className="w-4 h-4 text-rose-400" /> Statutory Safety Disclaimer:
        </div>
        <p className="leading-relaxed">
          MachineSentry AI is an acoustic anomaly detection and technician decision-support tool. It is <strong>NOT</strong> an ISO certified functional safety emergency trip system (SIL 2/3) or a certified diagnostic instrument. Personnel must follow all standard Lockout-Tagout (LOTO) protocols and mechanical safety practices during machine inspections.
        </p>
      </div>

      {/* Technical Deployment Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
            <Radio className="w-4 h-4" /> 1. Acoustic Noise & Sensor Placement
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In busy factories with forklifts and neighbouring machinery, ambient noise can contaminate acoustic recordings.
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Mount directional electret or MEMS acoustic sensors within 10–25 cm of bearing housings.</li>
            <li>Use 3D-printed acoustic horn cones or parabolic shields to attenuate background factory noise.</li>
            <li>Apply adaptive spectral subtraction targeting constant background hums.</li>
          </ul>
        </div>

        {/* Pillar 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
            <Sliders className="w-4 h-4" /> 2. Variable Operating Conditions & VFDs
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Machines rarely run at fixed speeds. Variable Frequency Drives (VFDs) change rotational harmonics with workload.
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Condition-binning: Maintain separate baseline sub-models for Low, Medium, and High load tiers.</li>
            <li>Order tracking: Normalize frequency axes to multiples of rotational speed (1X, 2X, 3X RPM).</li>
            <li>Feed electrical inverter frequency into the model as conditioning context.</li>
          </ul>
        </div>

        {/* Pillar 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
            <Cpu className="w-4 h-4" /> 3. Embedded Edge Hardware Integration
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Streaming raw 44.1kHz 16-bit audio to the cloud 24/7 is bandwidth-prohibitive for large plants.
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Deploy edge compute (Raspberry Pi 4, STM32H7, or ESP32-S3 microcontroller).</li>
            <li>Run DSP feature extraction (RMS, FFT, MFCC) on edge, transmitting only lightweight feature vectors.</li>
            <li>Trigger high-resolution audio buffer upload only when an anomaly score exceeds threshold.</li>
          </ul>
        </div>

        {/* Pillar 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
            <HardDrive className="w-4 h-4" /> 4. Model Drift & Mechanical Overhauls
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When a bearing is replaced or grease replenished, the machine acoustic signature intentionally alters.
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Establish maintenance-triggered baseline re-calibration workflows.</li>
            <li>Maintain historical baseline version logs (v1.0, v1.1) to audit long-term equipment wear.</li>
            <li>Incorporate seasonal ambient temperature compensation for viscosity drift.</li>
          </ul>
        </div>
      </div>

      {/* Hazardous Zone Compliance */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Flame className="w-4 h-4" /> Hazardous Environment & ATEX / IECEx Considerations
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Chemical processing plants, grain mills, and oil refineries require intrinsically safe equipment (ATEX Zone 0/1/2 or Class I Div 1). Any physical microphone enclosure, accelerometer probe, or wireless transmitter must adhere to spark-free, non-incendive physical construction standards.
        </p>
      </div>
    </div>
  );
};
