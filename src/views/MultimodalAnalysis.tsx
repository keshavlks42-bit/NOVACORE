/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Layers,
  Mic2,
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  ShieldAlert,
  Camera,
  Upload,
  Flame,
  Check,
} from 'lucide-react';
import { Machine } from '../types';
import {
  PRESET_MOTOR_SVG,
  PRESET_PUMP_SVG,
  PRESET_THERMAL_SVG,
  PRESET_BEARING_DEFECT_SVG,
  fileToOptimizedDataUrl,
} from '../services/pictureLibrary';

interface MultimodalAnalysisProps {
  machines: Machine[];
}

export const MultimodalAnalysis: React.FC<MultimodalAnalysisProps> = ({ machines }) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [audioScore, setAudioScore] = useState<number>(0.74);
  const [vibrationScore, setVibrationScore] = useState<number>(0.68);
  const [visualScore, setVisualScore] = useState<number>(0.82);

  // Sensor availability flags
  const [hasAudioSensor, setHasAudioSensor] = useState<boolean>(true);
  const [hasVibrationSensor, setHasVibrationSensor] = useState<boolean>(true);
  const [hasVisualSensor, setHasVisualSensor] = useState<boolean>(true);

  // Selected picture preset or custom upload
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>(PRESET_THERMAL_SVG);
  const [activePhotoCaption, setActivePhotoCaption] = useState<string>(
    'FLIR Thermography Scan: 82.4°C Friction Hotspot on DE Bearing Housing'
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMachine = machines.find((m) => m.id === selectedMachineId);

  // Handle custom photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const dataUrl = await fileToOptimizedDataUrl(file, 900, 0.85);
      setActivePhotoUrl(dataUrl);
      setActivePhotoCaption(`Uploaded Picture: ${file.name}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Dynamic Tri-Modal Weighted Fusion Calculation
  const activeChannels: { name: string; score: number; weight: number }[] = [];
  if (hasAudioSensor) activeChannels.push({ name: 'audio', score: audioScore, weight: 0.35 });
  if (hasVibrationSensor) activeChannels.push({ name: 'vibration', score: vibrationScore, weight: 0.35 });
  if (hasVisualSensor) activeChannels.push({ name: 'visual', score: visualScore, weight: 0.30 });

  const totalRawWeight = activeChannels.reduce((sum, c) => sum + c.weight, 0);

  let fusedScore = 0;
  let fusionMethodExplanation = '';

  if (activeChannels.length > 0 && totalRawWeight > 0) {
    const normalizedSum = activeChannels.reduce(
      (sum, c) => sum + c.score * (c.weight / totalRawWeight),
      0
    );
    fusedScore = Number(normalizedSum.toFixed(3));
    const channelNames = activeChannels.map((c) => c.name).join(' + ');
    fusionMethodExplanation = `Tri-Modal Weighted Synthesis (${channelNames}): S_fused = ∑(Score × Normalized_Weight). Threshold = 0.60.`;
  } else {
    fusedScore = 0;
    fusionMethodExplanation = 'No live, recorded, or visual inspection streams connected.';
  }

  const threshold = 0.60;
  const isCombinedAnomaly = fusedScore >= threshold;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Tri-Modal Sensor Fusion
            </span>
            <span className="text-xs text-slate-400">Audio + Vibration + Visual Thermography</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Multimodal Anomaly Synthesis</h1>
          <p className="text-xs text-slate-400">
            Cross-references acoustic spectral shifts, mechanical accelerometer crest factors, and visual thermal inspection photos to eradicate false positives.
          </p>
        </div>

        {/* Machine Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 w-full sm:w-auto">
          <Cpu className="w-4 h-4 text-cyan-400 ml-2" />
          <select
            value={selectedMachineId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedMachineId(newId);
              const m = machines.find((mach) => mach.id === newId);
              if (m?.imageUrl) {
                setActivePhotoUrl(m.imageUrl);
                setActivePhotoCaption(`${m.name} Profile Photo`);
              }
            }}
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

      {/* Sensor Stream Availability Toggles */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="text-slate-400 uppercase font-mono text-[11px]">Active Modalities:</span>
          <label className="flex items-center gap-2 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={hasAudioSensor}
              onChange={(e) => setHasAudioSensor(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
            <Mic2 className="w-4 h-4 text-cyan-400" /> Channel A (Acoustic WAV)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={hasVibrationSensor}
              onChange={(e) => setHasVibrationSensor(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
            <Activity className="w-4 h-4 text-amber-400" /> Channel B (Vibration)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={hasVisualSensor}
              onChange={(e) => setHasVisualSensor(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
            <Camera className="w-4 h-4 text-rose-400" /> Channel C (Picture / Thermal IR)
          </label>
        </div>

        <div className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
          Target: {currentMachine?.name}
        </div>
      </div>

      {/* Interactive 3-Channel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Channel A: Acoustic Audio */}
        <div
          className={`p-5 rounded-2xl bg-slate-900 border transition-all ${
            hasAudioSensor ? 'border-slate-800' : 'border-slate-800/40 opacity-40'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Mic2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Channel A: Acoustic Audio</h3>
                <span className="text-[10px] text-slate-500 font-mono">Spectral Centroid & MFCCs</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                audioScore >= 0.6
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              Score: {audioScore}
            </span>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Acoustic Score</span>
              <span className="text-cyan-400 font-bold">{audioScore}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.95"
              step="0.01"
              disabled={!hasAudioSensor}
              value={audioScore}
              onChange={(e) => setAudioScore(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.20 (Nominal)</span>
              <span>0.60 (Alert)</span>
              <span>0.95 (Severe)</span>
            </div>
          </div>
        </div>

        {/* Channel B: Accelerometer Vibration */}
        <div
          className={`p-5 rounded-2xl bg-slate-900 border transition-all ${
            hasVibrationSensor ? 'border-slate-800' : 'border-slate-800/40 opacity-40'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Channel B: Accelerometer</h3>
                <span className="text-[10px] text-slate-500 font-mono">Triaxial RMS & Crest Factor</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                vibrationScore >= 0.6
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              Score: {vibrationScore}
            </span>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Vibration Score</span>
              <span className="text-amber-400 font-bold">{vibrationScore}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.95"
              step="0.01"
              disabled={!hasVibrationSensor}
              value={vibrationScore}
              onChange={(e) => setVibrationScore(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer disabled:opacity-30"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.20 (Nominal)</span>
              <span>0.60 (Alert)</span>
              <span>0.95 (Severe)</span>
            </div>
          </div>
        </div>

        {/* Channel C: Visual & Thermal IR Photo Inspection */}
        <div
          className={`p-5 rounded-2xl bg-slate-900 border transition-all ${
            hasVisualSensor ? 'border-slate-800' : 'border-slate-800/40 opacity-40'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Channel C: Picture Inspection</h3>
                <span className="text-[10px] text-slate-500 font-mono">Thermal Infrared & Optical Scan</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                visualScore >= 0.6
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              Score: {visualScore}
            </span>
          </div>

          {/* Picture Thumbnail with Active Preview */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video mb-3 shadow-inner group">
            <img src={activePhotoUrl} alt={activePhotoCaption} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-slate-950/90 text-[10px] text-slate-300 truncate font-mono">
              {activePhotoCaption}
            </div>
          </div>

          {/* Picture Selector / Upload Controls */}
          <div className="flex items-center gap-1.5 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition-all flex items-center gap-1 btn-cyan-click"
            >
              <Upload className="w-3 h-3 text-cyan-400" />
              <span>{isUploadingPhoto ? 'Uploading...' : 'Add Picture'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePhotoUrl(PRESET_THERMAL_SVG);
                setActivePhotoCaption('FLIR Thermal Hotspot Scan (82.4°C Friction Hotspot)');
                setVisualScore(0.84);
              }}
              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-medium border border-rose-500/30 transition-all"
            >
              Thermal IR
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePhotoUrl(PRESET_BEARING_DEFECT_SVG);
                setActivePhotoCaption('SKF 6205 Outer Race Spalling Wear Audit');
                setVisualScore(0.78);
              }}
              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-medium border border-amber-500/30 transition-all"
            >
              Wear Audit
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Visual Severity Score</span>
              <span className="text-rose-400 font-bold">{visualScore}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.95"
              step="0.01"
              disabled={!hasVisualSensor}
              value={visualScore}
              onChange={(e) => setVisualScore(parseFloat(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer disabled:opacity-30"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.20 (Cool)</span>
              <span>0.60 (Alert)</span>
              <span>0.95 (Severe Hotspot)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multimodal Fusion Synthesis Output Panel */}
      <div
        className={`p-6 rounded-2xl border ${
          isCombinedAnomaly
            ? 'bg-rose-950/20 border-rose-500/40'
            : 'bg-emerald-950/20 border-emerald-500/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                isCombinedAnomaly
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  {isCombinedAnomaly
                    ? 'Multimodal Anomaly Alert Confirmed'
                    : 'Multimodal Operating Consensus: Nominal'}
                </h2>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    isCombinedAnomaly ? 'bg-rose-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {isCombinedAnomaly ? 'ACTION REQUIRED' : 'NORMAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{fusionMethodExplanation}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-500 block">Combined Fused Score</span>
              <span
                className={`text-xl font-bold font-mono ${
                  isCombinedAnomaly ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {fusedScore} <span className="text-xs text-slate-500 font-normal">/ 1.0</span>
              </span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-[10px] font-mono text-slate-500 block">Alarm Threshold</span>
              <span className="text-xl font-bold font-mono text-slate-300">{threshold}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5 mt-4">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Scientific Tri-Modal Fusion: </span>
            Acoustic sound identifies high-frequency micro-impacts, vibration measures physical shaft shock, and thermal/visual pictures confirm localized friction hotspots. Synthesizing all 3 prevents costly false alarms and pinpoint failures before catastrophic breakdown.
          </div>
        </div>
      </div>
    </div>
  );
};
