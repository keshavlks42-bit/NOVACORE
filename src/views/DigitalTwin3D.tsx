import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Flame,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { Machine } from '../types';
import { Machine3DViewer } from '../components/Machine3DViewer';
import { generateSyntheticWav } from '../services/audioEngine';

interface DigitalTwin3DProps {
  machines: Machine[];
  onNavigateTab: (tab: any) => void;
}

export const DigitalTwin3D: React.FC<DigitalTwin3DProps> = ({
  machines,
  onNavigateTab,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [isSimulatedFault, setIsSimulatedFault] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const currentMachine = machines.find((m) => m.id === selectedMachineId);

  // Toggle synchronized mechanical audio
  const toggleSound = () => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
    } else {
      const type = isSimulatedFault ? 'bearing_fault' : 'normal_hum';
      const blob = generateSyntheticWav(type, 5.0, 22050);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.loop = true;
      audio.play().catch(() => {});
      setAudioElement(audio);
      setIsPlayingAudio(true);
    }
  };

  const handleFaultToggle = () => {
    const nextFault = !isSimulatedFault;
    setIsSimulatedFault(nextFault);
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      const type = nextFault ? 'bearing_fault' : 'normal_hum';
      const blob = generateSyntheticWav(type, 5.0, 22050);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.loop = true;
      audio.play().catch(() => {});
      setAudioElement(audio);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Procedural WebGL Engine
            </span>
            <span className="text-xs text-slate-400">4 Industrial Models • 5 Visual Layouts</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">
            3D Machinery Digital Twins & Visual Layouts
          </h1>
          <p className="text-xs text-slate-400">
            Interactive kinematic digital twins for Motor/Pump, Axial Blower, Helical Gearbox, and Conveyor Pulley. Switch between PBR, FLIR Thermal Heatmap, Cyber X-Ray, Factory Cell, and Exploded Blueprint layouts.
          </p>
        </div>

        {/* Machine Selector & Audio Sync */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
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

          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              isPlayingAudio
                ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            } btn-cyan-click`}
          >
            {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>{isPlayingAudio ? 'Acoustics Active' : 'Listen 3D Audio'}</span>
          </button>
        </div>
      </div>

      {/* Realistic 3D Canvas Viewer */}
      <Machine3DViewer
        machineName={currentMachine?.name || 'Motor A & Pump Unit'}
        hasFault={isSimulatedFault}
      />

      {/* Telemetry & Sub-Assembly Inspection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Bearing Assembly */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Drive-End (DE) Bearing 6205
            </div>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border uppercase ${
                isSimulatedFault
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {isSimulatedFault ? 'Friction Anomaly' : 'Nominal Baseline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Positioned at X=0.95. Features 8 hardened chrome steel balls within an inner and outer ground raceway.
          </p>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Acoustic Centroid:</span>
              <span className={isSimulatedFault ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {isSimulatedFault ? '995 Hz (+3.91σ)' : '468 Hz (Normal)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Crest Factor:</span>
              <span className={isSimulatedFault ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                {isSimulatedFault ? '4.82 (High Impacts)' : '2.14 (Smooth)'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Stator & Cooling Fins */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              Cast Stator & 16 Ribs
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
              Normal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Heavy cast-iron frame with 16 aerodynamic longitudinal cooling ribs dissipating motor thermal losses.
          </p>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Coil Temperature:</span>
              <span className="text-slate-300">48°C (Insulation Class F)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Grid Frequency:</span>
              <span className="text-slate-300">60 Hz (1475 RPM 4-Pole)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Centrifugal Pump Volute */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Slurry Pump Volute Unit
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
              Normal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Coupled via flexible jaw dampener. High-solids slurry volute casing with axial suction and top discharge.
          </p>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Cavitation Status:</span>
              <span className="text-emerald-400 font-bold">Zero Bubble Collapse</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Coupling Alignment:</span>
              <span className="text-slate-300">0.03 mm Radial Runout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Banner to Acoustic Pipeline */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">Perform Acoustic Signal Analysis</div>
            <div className="text-xs text-slate-400">
              Analyze the real-time audio and extract 14-dimensional DSP features from this motor.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('audio_analysis')}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95 btn-cyan-click shrink-0 flex items-center gap-1.5"
        >
          Open Acoustic Pipeline <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
