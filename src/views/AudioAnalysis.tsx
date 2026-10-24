import React, { useState, useEffect } from 'react';
import {
  Mic2,
  Upload,
  Play,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Wrench,
  HelpCircle,
  Cpu,
  Layers,
  ChevronRight,
  ShieldAlert,
  Save,
  BarChart2,
  Video,
} from 'lucide-react';
import {
  AudioFeatures,
  Baseline,
  FeatureDeviation,
  Machine,
  AnalysisRecord,
} from '../types';
import {
  decodeAudioBlob,
  extractAcousticFeatures,
  generateSyntheticWav,
} from '../services/audioEngine';
import {
  evaluateAnomaly,
  FEATURE_EXPLANATIONS,
} from '../services/anomalyModel';
import { AudioWaveformVisualizer } from '../components/AudioWaveformVisualizer';
import { MicRecorder } from '../components/MicRecorder';

interface AudioAnalysisProps {
  machines: Machine[];
  baselines: Baseline[];
  selectedMachineId?: string;
  onSaveAnalysis: (record: AnalysisRecord) => void;
  onNavigateToMaintenance: () => void;
}

export const AudioAnalysis: React.FC<AudioAnalysisProps> = ({
  machines,
  baselines,
  selectedMachineId,
  onSaveAnalysis,
  onNavigateToMaintenance,
}) => {
  const [activeMachineId, setActiveMachineId] = useState<string>(
    selectedMachineId || machines[0]?.id || ''
  );

  // Audio & Video State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string>('');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [inputMode, setInputMode] = useState<'presets' | 'upload' | 'mic'>('presets');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extracted Features & Evaluation State
  const [extractedFeatures, setExtractedFeatures] = useState<AudioFeatures | null>(null);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [anomalyResult, setAnomalyResult] = useState<{
    rawScore: number;
    displayScore: number;
    threshold: number;
    alertLevel: 'NORMAL' | 'REVIEW' | 'ANOMALY';
    deviations: FeatureDeviation[];
  } | null>(null);

  // AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<{
    summary: string;
    acousticInsight: string;
    inspectionChecklist: string[];
    disclaimer: string;
    provider?: string;
  } | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // Saved status
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const currentMachine = machines.find((m) => m.id === activeMachineId);
  const currentBaseline = baselines.find((b) => b.machineId === activeMachineId) || baselines[0];

  // Auto load initial demo preset when component mounts
  useEffect(() => {
    if (!audioBlob && inputMode === 'presets') {
      loadPresetSample('normal_hum', 'motorA_normal_baseline.wav');
    }
  }, []);

  const loadPresetSample = async (
    type: 'normal_hum' | 'bearing_fault' | 'rotor_unbalance' | 'pump_cavitation' | 'fan_rub',
    filename: string
  ) => {
    setErrorMsg(null);
    setAnomalyResult(null);
    setAiExplanation(null);
    setSavedSuccess(false);
    setIsProcessing(true);

    try {
      setVideoUrl(null);
      const blob = generateSyntheticWav(type, 3.5, 22050);
      const buffer = await decodeAudioBlob(blob);
      setAudioBlob(blob);
      setAudioBuffer(buffer);
      setAudioFilename(filename);
      setAudioDuration(buffer.duration);

      // Automatically extract features
      const features = await extractAcousticFeatures(buffer);
      setExtractedFeatures(features);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate audio preset');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(wav|mp3|ogg|m4a|webm|mp4|mov|aac|flac)$/i) && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      setErrorMsg('Unsupported format. Please upload an audio (.wav, .mp3, .ogg, .m4a) or video (.mp4, .webm) recording.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50 MB size limit.');
      return;
    }

    setErrorMsg(null);
    setAnomalyResult(null);
    setAiExplanation(null);
    setSavedSuccess(false);
    setIsProcessing(true);

    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i);
    if (isVideo) {
      setVideoUrl(URL.createObjectURL(file));
    } else {
      setVideoUrl(null);
    }

    try {
      const buffer = await decodeAudioBlob(file);
      setAudioBlob(file);
      setAudioBuffer(buffer);
      setAudioFilename(file.name);
      setAudioDuration(buffer.duration);

      const features = await extractAcousticFeatures(buffer);
      setExtractedFeatures(features);
    } catch (err) {
      setErrorMsg(
        isVideo
          ? 'Unable to decode audio track from video. Please ensure the video was recorded with microphone audio enabled.'
          : `Could not read audio file: ${err instanceof Error ? err.message : 'Decoding error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicComplete = async (blob: Blob, buffer: AudioBuffer, duration: number) => {
    setVideoUrl(null);
    setAudioBlob(blob);
    setAudioBuffer(buffer);
    setAudioFilename(`mic_capture_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`);
    setAudioDuration(duration);
    setInputMode('presets'); // Return to player view

    try {
      setIsProcessing(true);
      const features = await extractAcousticFeatures(buffer);
      setExtractedFeatures(features);
    } catch (err) {
      setErrorMsg('Feature extraction failed on mic recording.');
    } finally {
      setIsProcessing(false);
    }
  };

  const runAnomalyDetection = () => {
    if (!extractedFeatures || !currentBaseline) {
      setErrorMsg('Extract acoustic features first and ensure a baseline is available.');
      return;
    }

    const result = evaluateAnomaly(extractedFeatures, currentBaseline, sensitivity);
    setAnomalyResult(result);
    setSavedSuccess(false);
  };

  const requestAiExplanation = async () => {
    if (!anomalyResult || !currentMachine) return;
    setIsExplaining(true);

    try {
      const payload = {
        machineName: currentMachine.name,
        machineCategory: currentMachine.category,
        anomalyScore: anomalyResult.rawScore,
        threshold: anomalyResult.threshold,
        alertLevel: anomalyResult.alertLevel,
        featureDeviations: anomalyResult.deviations.slice(0, 5),
        baselineCount: currentBaseline.sampleCount,
      };

      const res = await fetch('/api/explain-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setAiExplanation(data);
    } catch (err) {
      // Deterministic client fallback if server unavailable
      setAiExplanation({
        provider: 'client-rule-engine',
        summary: `Machine ${currentMachine.name} generated an anomaly score of ${anomalyResult.rawScore} exceeding threshold ${anomalyResult.threshold}.`,
        acousticInsight: 'Observed significant deviations in energy and spectral characteristics compared to calibrated normal operating baseline.',
        inspectionChecklist: [
          'Verify motor mounting and anchor tightness.',
          'Check bearing temperature using an infrared thermometer.',
          'Verify lubrication levels according to standard schedule.',
          'Inspect impeller / fan blades for foreign accumulation.',
        ],
        disclaimer: 'MachineSentry identifies unusual operating patterns. An alert is not proof of mechanical failure.',
      });
    } finally {
      setIsExplaining(false);
    }
  };

  const saveToHistory = () => {
    if (!anomalyResult || !extractedFeatures || !currentMachine) return;

    const record: AnalysisRecord = {
      id: `anal-${Date.now().toString().slice(-6)}`,
      machineId: currentMachine.id,
      machineName: currentMachine.name,
      timestamp: new Date().toISOString(),
      inputSource: inputMode === 'mic' ? 'live_microphone' : inputMode === 'upload' ? 'uploaded_audio' : 'synthetic_bench',
      filename: audioFilename || 'recording.wav',
      durationSeconds: Number(audioDuration.toFixed(2)),
      features: extractedFeatures,
      rawScore: anomalyResult.rawScore,
      displayScore: anomalyResult.displayScore,
      threshold: anomalyResult.threshold,
      alertLevel: anomalyResult.alertLevel,
      deviations: anomalyResult.deviations,
      aiExplanation: aiExplanation || undefined,
      notes: `Acoustic analysis processed with Isolation Forest (${sensitivity} sensitivity).`,
    };

    onSaveAnalysis(record);
    setSavedSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Acoustic Signal Pipeline
            </span>
            <span className="text-xs text-slate-400">Sample-Rate Aware Web Audio DSP</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Audio Ingestion & Feature Analysis</h1>
          <p className="text-xs text-slate-400">
            Upload machinery recordings, use synthesized mechanical sound presets, or record live clips.
          </p>
        </div>

        {/* Machine Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 w-full sm:w-auto">
          <Cpu className="w-4 h-4 text-cyan-400 ml-2" />
          <select
            value={activeMachineId}
            onChange={(e) => {
              setActiveMachineId(e.target.value);
              setAnomalyResult(null);
              setAiExplanation(null);
            }}
            className="bg-transparent text-xs font-semibold text-slate-200 pr-3 py-1 focus:outline-none cursor-pointer"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                {m.name} ({m.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setInputMode('presets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            inputMode === 'presets'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Preset Sound Library
        </button>
        <button
          onClick={() => setInputMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            inputMode === 'upload'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload WAV File
        </button>
        <button
          onClick={() => setInputMode('mic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            inputMode === 'mic'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Mic2 className="w-4 h-4 text-rose-400" /> Live Microphone Mode
        </button>
      </div>

      {/* Input Panels */}
      {inputMode === 'presets' && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Select Physical Machinery Sound Preset:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <button
              onClick={() => loadPresetSample('normal_hum', 'motorA_normal_baseline.wav')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Normal Motor Hum
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-2">
                Pure 60Hz + 120Hz harmonics, low noise floor.
              </div>
            </button>

            <button
              onClick={() => loadPresetSample('bearing_fault', 'bearing_bpfi_impact.wav')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Bearing Impact
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-2">
                2.4 kHz ring transients + 14Hz cage impacts.
              </div>
            </button>

            <button
              onClick={() => loadPresetSample('rotor_unbalance', 'rotor_unbalance_29hz.wav')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                <Activity className="w-3.5 h-3.5" /> Rotor Unbalance
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-2">
                Heavy 29.5 Hz modulated rotational rumble.
              </div>
            </button>

            <button
              onClick={() => loadPresetSample('pump_cavitation', 'pump_cavitation_bubble.wav')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Cavitation Hiss
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-2">
                Random sharp collapsing bubble crackles.
              </div>
            </button>

            <button
              onClick={() => loadPresetSample('fan_rub', 'fan_casing_squeal.wav')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                <Activity className="w-3.5 h-3.5" /> Blade Rub / Chirp
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-2">
                Mechanical scraping chirp at blade pass rate.
              </div>
            </button>
          </div>
        </div>
      )}

      {inputMode === 'upload' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center">
          <Upload className="w-8 h-8 text-cyan-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-200">Upload Machinery Audio or Video File</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Supports Audio (WAV, MP3, OGG, M4A) and Video (MP4, WebM) with auto soundtrack extraction.
          </p>
          <label className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shadow">
            Browse Audio or Video File
            <input
              type="file"
              accept=".wav,.mp3,.ogg,.m4a,.webm,.mp4,.mov,audio/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {inputMode === 'mic' && (
        <MicRecorder
          onRecordingComplete={handleMicComplete}
          onCancel={() => setInputMode('presets')}
        />
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Video Preview If Video File Uploaded */}
      {videoUrl && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>Machine Video Inspection Preview</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Sound Track Extracted for Acoustic FFT
            </span>
          </div>
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full max-h-60 rounded-lg bg-black object-contain"
          />
        </div>
      )}

      {/* Audio Waveform & Player */}
      <AudioWaveformVisualizer
        audioBuffer={audioBuffer}
        audioBlob={audioBlob}
        title={audioFilename || 'Equipment Recording'}
        isSimulated={inputMode === 'presets'}
      />

      {/* Features Extraction & Anomaly Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Anomaly Sensitivity</span>
            <div className="flex items-center gap-1 mt-0.5">
              {(['low', 'medium', 'high'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSensitivity(s)}
                  className={`px-2.5 py-1 rounded text-xs font-mono uppercase font-bold transition-colors ${
                    sensitivity === s
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs border-l border-slate-800 pl-3">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Calibrated Baseline</span>
            <span className="text-slate-200 font-mono font-semibold">
              {currentBaseline?.modelType === 'isolation_forest' ? 'Isolation Forest (60 Trees)' : 'Statistical'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runAnomalyDetection}
            disabled={!extractedFeatures || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Activity className="w-4 h-4" /> Run Anomaly Detection
          </button>
        </div>
      </div>

      {/* Extracted Features Table / Grid */}
      {extractedFeatures && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" /> Extracted Acoustic Features
              </h3>
              <p className="text-xs text-slate-400">
                DSP parameters extracted via Discrete Fourier Transform and Mel-filterbank analysis
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              14 Numerical Dimensions
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">RMS Energy</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {extractedFeatures.rmsEnergy}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">V avg amplitude</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Spectral Centroid</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {extractedFeatures.spectralCentroid} <span className="text-xs font-normal">Hz</span>
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Spectral center mass</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Bandwidth</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {extractedFeatures.spectralBandwidth} <span className="text-xs font-normal">Hz</span>
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Frequency spread</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Spectral Rolloff</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {extractedFeatures.spectralRolloff} <span className="text-xs font-normal">Hz</span>
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">85% power cutoff</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Zero-Crossing</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {extractedFeatures.zeroCrossingRate}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Sign-inversions/s</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Spectral Flux</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {extractedFeatures.spectralFlux}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Inter-frame shift</span>
            </div>
          </div>

          {/* MFCC Coefficients Visual Bar */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
              <span>Mel-Frequency Cepstral Coefficients (MFCC 0–12)</span>
              <span className="text-slate-500">Spectral envelope timbre vectors</span>
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="gap-1 min-w-[500px]" style={{ display: 'grid', gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                {extractedFeatures.mfcc.map((c, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-full bg-slate-900 h-16 rounded overflow-hidden flex flex-col justify-end p-0.5">
                      <div
                        className={`w-full rounded-sm ${c >= 0 ? 'bg-cyan-500' : 'bg-blue-400'}`}
                        style={{
                          height: `${Math.min(100, Math.max(10, Math.abs(c) * 4))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1">c{idx}</span>
                    <span className="text-[8px] font-mono text-slate-400">{c.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Anomaly Detection Results & Evidence-Based Explanation Card */}
      {anomalyResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`p-6 rounded-2xl border ${
              anomalyResult.alertLevel === 'ANOMALY'
                ? 'bg-rose-950/30 border-rose-500/40'
                : anomalyResult.alertLevel === 'REVIEW'
                ? 'bg-amber-950/30 border-amber-500/40'
                : 'bg-emerald-950/30 border-emerald-500/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    anomalyResult.alertLevel === 'ANOMALY'
                      ? 'bg-rose-500/20 text-rose-400'
                      : anomalyResult.alertLevel === 'REVIEW'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {anomalyResult.alertLevel === 'ANOMALY' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : anomalyResult.alertLevel === 'REVIEW' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-100">
                      {anomalyResult.alertLevel === 'ANOMALY'
                        ? 'Significant Acoustic Anomaly Flagged'
                        : anomalyResult.alertLevel === 'REVIEW'
                        ? 'Review Recommended — Mild Deviation'
                        : 'Normal Operating Pattern'}
                    </h2>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        anomalyResult.alertLevel === 'ANOMALY'
                          ? 'bg-rose-500 text-slate-950'
                          : anomalyResult.alertLevel === 'REVIEW'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {anomalyResult.alertLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluated against baseline of {currentMachine?.name} ({currentBaseline?.sampleCount} normal recordings)
                  </p>
                </div>
              </div>

              {/* Anomaly Gauge & Threshold */}
              <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Model Decision Score</span>
                  <span className="text-lg font-bold font-mono text-slate-200">
                    {anomalyResult.rawScore}{' '}
                    <span className="text-xs text-slate-500 font-normal">/ 1.0</span>
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-mono text-slate-500 block">Calibrated Threshold</span>
                  <span className="text-lg font-bold font-mono text-rose-400">
                    {anomalyResult.threshold}
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-mono text-slate-500 block">Anomaly Index</span>
                  <span className="text-lg font-bold font-mono text-cyan-400">
                    {anomalyResult.displayScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence Breakdown Section */}
            <div className="my-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Observed Mathematical Evidence & Feature Deviations:
              </h4>

              {anomalyResult.deviations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {anomalyResult.deviations.slice(0, 4).map((dev) => (
                    <div
                      key={dev.featureKey}
                      className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{dev.featureName}</span>
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.2 rounded font-bold ${
                            dev.severity === 'high'
                              ? 'bg-rose-500/20 text-rose-300'
                              : dev.severity === 'moderate'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {dev.deviationSigma > 0 ? `+${dev.deviationSigma}σ` : `${dev.deviationSigma}σ`} deviation
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Measured: <strong className="text-slate-200">{dev.measuredValue} {dev.unit}</strong> (Baseline: {dev.baselineMean} ± {dev.baselineStd})
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        {dev.physicalMeaning}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  All extracted acoustic dimensions sit comfortably within 1.5 standard deviations of normal operating baseline.
                </p>
              )}
            </div>

            {/* Scientific Disclaimer as required by specification */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5 mb-5">
              <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Scientific Operating Boundary: </span>
                MachineSentry identifies unusual operating sound patterns. An alert is not proof of mechanical failure. Inspect equipment and follow appropriate plant safety procedures.
              </div>
            </div>

            {/* AI Assistant Explanation Box */}
            {aiExplanation && (
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/50 mb-5 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Predictive Maintenance Engineering Brief
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                    {aiExplanation.provider || 'AI Assistant'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {aiExplanation.summary}
                </p>
                {aiExplanation.acousticInsight && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-cyan-400">Physical Acoustic Insight: </strong>
                    {aiExplanation.acousticInsight}
                  </p>
                )}
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Recommended Mechanical Inspection Actions:
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {aiExplanation.inspectionChecklist?.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                {!aiExplanation && (
                  <button
                    onClick={requestAiExplanation}
                    disabled={isExplaining}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    {isExplaining ? 'Consulting Assistant...' : 'Explain Alert with Gemini AI'}
                  </button>
                )}
                {savedSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved to History
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveToHistory}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save Analysis Record
                </button>
                {anomalyResult.alertLevel !== 'NORMAL' && (
                  <button
                    onClick={() => {
                      saveToHistory();
                      onNavigateToMaintenance();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Log Physical Inspection
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
