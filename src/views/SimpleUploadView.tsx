import React, { useState, useRef } from 'react';
import {
  Upload,
  Mic2,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Play,
  Camera,
  Film,
  Sparkles,
  FileAudio,
  Plus,
  RefreshCw,
  Cpu,
  ChevronRight,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Wrench,
  Layers,
  Box,
} from 'lucide-react';
import { Machine, MachinePhoto, MachineVideo, Baseline, AnalysisRecord, AudioFeatures } from '../types';
import { fileToOptimizedDataUrl, PRESET_MOTOR_SVG, PRESET_PUMP_SVG, PRESET_THERMAL_SVG, PRESET_BEARING_DEFECT_SVG } from '../services/pictureLibrary';
import { extractAudioFromMedia, captureVideoFrame, generateSampleMachineVideo, detectMediaType } from '../services/mediaEngine';
import { extractAcousticFeatures, generateSyntheticWav, decodeAudioBlob } from '../services/audioEngine';
import { evaluateAnomaly } from '../services/anomalyModel';
import { MicRecorder } from '../components/MicRecorder';

interface SimpleUploadViewProps {
  machines: Machine[];
  baselines: Baseline[];
  onSaveMachinePhoto: (machineId: string, photo: MachinePhoto) => void;
  onSaveMachineVideo?: (machineId: string, video: MachineVideo) => void;
  onSaveAnalysis: (record: AnalysisRecord) => void;
  onNavigateTab: (tab: any) => void;
  onSelectMachine: (m: Machine) => void;
}

export const SimpleUploadView: React.FC<SimpleUploadViewProps> = ({
  machines,
  baselines,
  onSaveMachinePhoto,
  onSaveMachineVideo,
  onSaveAnalysis,
  onNavigateTab,
  onSelectMachine,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [mediaType, setMediaType] = useState<'audio' | 'video' | 'image' | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Analysis result
  const [result, setResult] = useState<{
    status: 'NORMAL' | 'REVIEW' | 'ANOMALY';
    score: number;
    title: string;
    description: string;
    recommendedAction: string;
    duration: number;
    features: AudioFeatures;
    rawScore: number;
    threshold: number;
  } | null>(null);

  // Photo caption
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [photoCategory, setPhotoCategory] = useState<MachinePhoto['category']>('overall');

  // Video element
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Mic state
  const [showMic, setShowMic] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const currentMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];
  const currentBaseline = baselines.find((b) => b.machineId === selectedMachineId) || baselines[0];

  const resetAll = () => {
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaType(null);
    setMediaPreviewUrl(null);
    setUploadedFileName('');
    setUploadedFile(null);
    setResult(null);
    setErrorMessage(null);
    setFeedbackMessage(null);
    setShowMic(false);
  };

  const processFile = async (file: File) => {
    resetAll();
    setUploadedFileName(file.name);
    setUploadedFile(file);

    const detected = detectMediaType(file);
    if (detected === 'unknown') {
      setErrorMessage('Unsupported file. Please upload a sound (.mp3, .wav), video (.mp4, .webm), or photo (.jpg, .png).');
      return;
    }

    setMediaType(detected);
    setIsProcessing(true);

    try {
      if (detected === 'image') {
        setStatusText('Preparing photo preview...');
        const optimizedUrl = await fileToOptimizedDataUrl(file);
        setMediaPreviewUrl(optimizedUrl);
        setPhotoCaption(file.name.replace(/\.[^/.]+$/, ''));
        setFeedbackMessage('Photo ready! Click "Add to Machine Gallery" below to save.');
      } else if (detected === 'video') {
        setStatusText('Loading video & extracting machine sound track...');
        const url = URL.createObjectURL(file);
        setMediaPreviewUrl(url);

        try {
          const { buffer } = await extractAudioFromMedia(file);
          const features = await extractAcousticFeatures(buffer);
          const evalResult = evaluateAnomaly(features, currentBaseline);

          const status = evalResult.alertLevel;
          setResult({
            status,
            score: evalResult.displayScore,
            title:
              status === 'NORMAL'
                ? 'Machine Sound & Motion Healthy'
                : status === 'REVIEW'
                ? 'Minor Acoustic Warning'
                : 'Defect Vibration & Sound Alert',
            description:
              status === 'NORMAL'
                ? 'Acoustic harmonics match normal operating frequency. No abnormal rattles or squeals detected.'
                : status === 'REVIEW'
                ? 'Sound spectrum shows moderate elevation in high frequencies. Check lubrication soon.'
                : 'High-frequency acoustic energy exceeds safety baseline. Likely bearing wear or loose rotor components!',
            recommendedAction:
              status === 'NORMAL'
                ? 'No maintenance needed. Next routine inspection scheduled in 30 days.'
                : status === 'REVIEW'
                ? 'Listen closely during next shift and verify bearing temperature.'
                : 'Schedule maintenance inspection immediately to avoid machine breakdown.',
            duration: buffer.duration,
            features,
            rawScore: evalResult.rawScore,
            threshold: evalResult.threshold,
          });
        } catch {
          setFeedbackMessage('Video preview loaded. You can watch playback and capture photo snapshots.');
        }
      } else if (detected === 'audio') {
        setStatusText('Analyzing audio frequencies against machine baseline...');
        const url = URL.createObjectURL(file);
        setMediaPreviewUrl(url);

        const { buffer } = await extractAudioFromMedia(file);
        const features = await extractAcousticFeatures(buffer);
        const evalResult = evaluateAnomaly(features, currentBaseline);

        const status = evalResult.alertLevel;
        setResult({
          status,
          score: evalResult.displayScore,
          title:
            status === 'NORMAL'
              ? 'Healthy Machine Acoustics'
              : status === 'REVIEW'
              ? 'Acoustic Inspection Recommended'
              : 'Abnormal Acoustic Anomaly Detected',
          description:
            status === 'NORMAL'
              ? 'Sound pattern is smooth and identical to nominal factory baseline.'
              : status === 'REVIEW'
              ? 'Mild acoustic shift noted. Frequencies suggest minor mechanical friction.'
              : 'Severe spectral anomaly. Acoustic fingerprint shows high unbalance or bearing spalling.',
          recommendedAction:
            status === 'NORMAL'
              ? 'All parameters nominal. Record saved.'
              : status === 'REVIEW'
              ? 'Perform physical check within 48 hours.'
              : 'Shut down and inspect machine bearings and drive shaft immediately.',
          duration: buffer.duration,
          features,
          rawScore: evalResult.rawScore,
          threshold: evalResult.threshold,
        });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not analyze file.');
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleSavePhoto = () => {
    if (!mediaPreviewUrl || mediaType !== 'image') return;
    const photo: MachinePhoto = {
      id: `photo-${Date.now()}`,
      url: mediaPreviewUrl,
      caption: photoCaption.trim() || `${currentMachine?.name} photo`,
      category: photoCategory,
      timestamp: new Date().toISOString(),
    };
    onSaveMachinePhoto(selectedMachineId, photo);
    setFeedbackMessage(`Photo added to ${currentMachine?.name} gallery successfully!`);
  };

  const handleCaptureVideoPhoto = () => {
    if (videoRef.current) {
      const snapUrl = captureVideoFrame(videoRef.current);
      if (snapUrl) {
        const photo: MachinePhoto = {
          id: `photo-snap-${Date.now()}`,
          url: snapUrl,
          caption: `Inspection snapshot from video - ${currentMachine?.name}`,
          category: 'defect',
          timestamp: new Date().toISOString(),
        };
        onSaveMachinePhoto(selectedMachineId, photo);
        setFeedbackMessage(`Snapshot captured from video and saved to ${currentMachine?.name} gallery!`);
      }
    }
  };

  const handleSaveAnalysis = () => {
    if (!result) return;
    const record: AnalysisRecord = {
      id: `rec-quick-${Date.now()}`,
      machineId: selectedMachineId,
      machineName: currentMachine?.name || 'Machine',
      timestamp: new Date().toISOString(),
      inputSource: 'uploaded_audio',
      filename: uploadedFileName || 'quick_check.wav',
      durationSeconds: result.duration,
      features: result.features,
      rawScore: result.rawScore,
      displayScore: result.score,
      threshold: result.threshold,
      alertLevel: result.status,
      deviations: [],
      notes: `Easy Upload Check: ${result.title}. Action: ${result.recommendedAction}`,
    };
    onSaveAnalysis(record);
    setFeedbackMessage('Analysis logged into machine maintenance history!');
  };

  const testWithSample = async (type: 'motor_video' | 'pump_video' | 'bearing_photo' | 'thermal_photo' | 'healthy_sound' | 'fault_sound') => {
    resetAll();
    setIsProcessing(true);

    try {
      if (type === 'motor_video') {
        setStatusText('Generating healthy motor video sample with sound...');
        const blob = await generateSampleMachineVideo('motor_healthy', 3.5);
        const file = new File([blob], 'sample_healthy_motor.webm', { type: 'video/webm' });
        await processFile(file);
      } else if (type === 'pump_video') {
        setStatusText('Generating pump vibration anomaly video sample with sound...');
        const blob = await generateSampleMachineVideo('pump_anomaly', 3.5);
        const file = new File([blob], 'sample_vibration_pump.webm', { type: 'video/webm' });
        await processFile(file);
      } else if (type === 'bearing_photo') {
        setMediaType('image');
        setMediaPreviewUrl(PRESET_BEARING_DEFECT_SVG);
        setUploadedFileName('bearing_defect_closeup.svg');
        setPhotoCaption('Bearing 6205 Outer Raceway Micro-Spalling');
        setPhotoCategory('defect');
        setFeedbackMessage('Sample Defect Photo loaded. Click "Save to Gallery" to attach it.');
      } else if (type === 'thermal_photo') {
        setMediaType('image');
        setMediaPreviewUrl(PRESET_THERMAL_SVG);
        setUploadedFileName('flir_thermal_baseline.svg');
        setPhotoCaption('FLIR Thermography Baseline (38°C Bearing Nominal)');
        setPhotoCategory('thermal');
        setFeedbackMessage('Sample FLIR Thermal Photo loaded. Click "Save to Gallery" to attach it.');
      } else if (type === 'healthy_sound') {
        setStatusText('Synthesizing normal running sound...');
        const blob = generateSyntheticWav('normal_hum', 3.0, 22050);
        const file = new File([blob], 'motor_normal_hum.wav', { type: 'audio/wav' });
        await processFile(file);
      } else if (type === 'fault_sound') {
        setStatusText('Synthesizing bearing fault sound...');
        const blob = generateSyntheticWav('bearing_fault', 3.0, 22050);
        const file = new File([blob], 'pump_bearing_fault_rattle.wav', { type: 'audio/wav' });
        await processFile(file);
      }
    } catch (err) {
      setErrorMessage('Failed to load sample: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Friendly Page Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                Simple & Accessible
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Easy 3-Step Machine Check</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Easy Media Upload & Health Check
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Upload any sound, video, or picture to instantly check if your machine is running normally or needs attention.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('overview')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shrink-0"
          >
            <span>Switch to Advanced ML Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step 1 & 2: Machine Selection & Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Machine Picker */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
              Select Machine
            </h2>
            <span className="text-[11px] text-slate-400">{machines.length} active</span>
          </div>

          <div className="space-y-2">
            {machines.map((m) => {
              const isSelected = m.id === selectedMachineId;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMachineId(m.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <Cpu className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white truncate">{m.name}</h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          m.status === 'NORMAL'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : m.status === 'ATTENTION'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{m.category} • {m.location}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('digital_twin_3d')}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
            >
              <Box className="w-3.5 h-3.5" /> View in 3D Machinery Twin
            </button>
          </div>
        </div>

        {/* Right Columns: Upload Dropzone & Action Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
                Upload or Record (Audio, Video, or Photo)
              </h2>
              {mediaPreviewUrl && (
                <button onClick={resetAll} className="text-xs text-rose-400 hover:underline">
                  Clear / Change File
                </button>
              )}
            </div>

            {/* Error or Feedback */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {feedbackMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Drop Zone */}
            {!mediaPreviewUrl && !showMic && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                onClick={() => document.getElementById('easy-file-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                    : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  id="easy-file-input"
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*,.wav,.mp3,.mp4,.webm,.jpg,.png,.webp,.svg,.m4a"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFile(file);
                  }}
                />

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shadow-sm">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-sm">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-sm">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  Click here or Drag & Drop Any File
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Accepts audio recordings (.wav, .mp3), machinery videos (.mp4, .webm), or inspection photos (.jpg, .png).
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-all">
                    Choose from Computer or Phone
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMic(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                  >
                    <Mic2 className="w-3.5 h-3.5 text-cyan-400" /> Record Live Microphone
                  </button>
                </div>
              </div>
            )}

            {/* Microphone View */}
            {showMic && !mediaPreviewUrl && (
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Mic2 className="w-4 h-4 text-cyan-400" /> Live Microphone Recorder
                  </span>
                  <button
                    onClick={() => setShowMic(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <MicRecorder
                  onRecordingComplete={async (blob, buffer, duration) => {
                    const file = new File([blob], `mic_recording_${Date.now()}.webm`, { type: 'audio/webm' });
                    await processFile(file);
                  }}
                  onCancel={() => setShowMic(false)}
                />
              </div>
            )}

            {/* Quick 1-Click Samples for Testing */}
            {!mediaPreviewUrl && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Try with 1-Click Sample Media:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => testWithSample('motor_video')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Video className="w-3.5 h-3.5" /> Healthy Motor
                    </div>
                    <p className="text-[10px] text-slate-400">Video with sound</p>
                  </button>
                  <button
                    onClick={() => testWithSample('pump_video')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                      <Video className="w-3.5 h-3.5" /> Defect Pump
                    </div>
                    <p className="text-[10px] text-slate-400">Vibration video</p>
                  </button>
                  <button
                    onClick={() => testWithSample('thermal_photo')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                      <ImageIcon className="w-3.5 h-3.5" /> Thermal IR
                    </div>
                    <p className="text-[10px] text-slate-400">FLIR camera photo</p>
                  </button>
                  <button
                    onClick={() => testWithSample('bearing_photo')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <ImageIcon className="w-3.5 h-3.5" /> Bearing Defect
                    </div>
                    <p className="text-[10px] text-slate-400">Spalling photo</p>
                  </button>
                  <button
                    onClick={() => testWithSample('healthy_sound')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <FileAudio className="w-3.5 h-3.5" /> Normal Sound
                    </div>
                    <p className="text-[10px] text-slate-400">WAV audio file</p>
                  </button>
                  <button
                    onClick={() => testWithSample('fault_sound')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                      <FileAudio className="w-3.5 h-3.5" /> Rattle Sound
                    </div>
                    <p className="text-[10px] text-slate-400">WAV defect rattle</p>
                  </button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                <span className="text-xs text-cyan-200 font-semibold">{statusText}</span>
              </div>
            )}

            {/* Media Preview & Controls */}
            {mediaPreviewUrl && (
              <div className="space-y-4">
                {/* 1. Image View */}
                {mediaType === 'image' && (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-72">
                      <img src={mediaPreviewUrl} alt="Inspection" className="max-h-72 w-auto object-contain" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold">Photo Label / Caption</label>
                        <input
                          type="text"
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                          placeholder="e.g. Bearing raceway closeup"
                          className="w-full mt-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold">Photo Type</label>
                        <select
                          value={photoCategory}
                          onChange={(e) => setPhotoCategory(e.target.value as any)}
                          className="w-full mt-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="overall">Overall Machine View</option>
                          <option value="bearing">Bearing / Shaft Area</option>
                          <option value="thermal">Thermal IR Heat View</option>
                          <option value="defect">Observed Defect / Crack</option>
                          <option value="nameplate">Specification Plate</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleSavePhoto}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      Attach Photo to {currentMachine.name}
                    </button>
                  </div>
                )}

                {/* 2. Video View */}
                {mediaType === 'video' && (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                      <video
                        ref={videoRef}
                        src={mediaPreviewUrl}
                        controls
                        playsInline
                        className="w-full max-h-64 object-contain bg-black"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleCaptureVideoPhoto}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span>Take Photo from Video</span>
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Soundtrack extracted and analyzed automatically below
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Audio View */}
                {mediaType === 'audio' && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <audio src={mediaPreviewUrl} controls className="w-full h-10" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Simple Instant Health Check Card */}
          {result && (
            <div
              className={`p-6 rounded-2xl border transition-all ${
                result.status === 'NORMAL'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  : result.status === 'REVIEW'
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      result.status === 'NORMAL'
                        ? 'bg-emerald-500 text-slate-950'
                        : result.status === 'REVIEW'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {result.status === 'NORMAL' ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <AlertTriangle className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          result.status === 'NORMAL'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : result.status === 'REVIEW'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        Status: {result.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Health Score: {result.score}/100
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{result.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-lg">{result.description}</p>
                  </div>
                </div>
              </div>

              {/* Action Recommendation */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Recommended Action for Operator:
                </div>
                <div className="text-xs text-white font-medium">{result.recommendedAction}</div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleSaveAnalysis}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Save Result to Machine History
                </button>
                <button
                  onClick={() => onNavigateTab('maintenance')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                >
                  Create Maintenance Ticket
                </button>
                <button
                  onClick={() => onNavigateTab('audio_analysis')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1"
                >
                  View Full FFT Spectrum <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
