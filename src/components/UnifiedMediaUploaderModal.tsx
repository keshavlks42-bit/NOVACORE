import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Mic2,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Camera,
  Film,
  Sparkles,
  FileAudio,
  Plus,
  RefreshCw,
  Cpu,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Machine, MachinePhoto, MachineVideo, Baseline, AnalysisRecord, AudioFeatures } from '../types';
import { fileToOptimizedDataUrl, PRESET_MOTOR_SVG, PRESET_PUMP_SVG, PRESET_THERMAL_SVG, PRESET_BEARING_DEFECT_SVG } from '../services/pictureLibrary';
import { extractAudioFromMedia, captureVideoFrame, generateSampleMachineVideo, detectMediaType } from '../services/mediaEngine';
import { extractAcousticFeatures } from '../services/audioEngine';
import { evaluateAnomaly } from '../services/anomalyModel';
import { MicRecorder } from './MicRecorder';

interface UnifiedMediaUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: Machine[];
  baselines: Baseline[];
  defaultMachineId?: string;
  onSaveMachinePhoto: (machineId: string, photo: MachinePhoto) => void;
  onSaveMachineVideo?: (machineId: string, video: MachineVideo) => void;
  onSaveAnalysis?: (record: AnalysisRecord) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const UnifiedMediaUploaderModal: React.FC<UnifiedMediaUploaderModalProps> = ({
  isOpen,
  onClose,
  machines,
  baselines,
  defaultMachineId,
  onSaveMachinePhoto,
  onSaveMachineVideo,
  onSaveAnalysis,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'audio' | 'video' | 'photo'>('all');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    defaultMachineId || machines[0]?.id || ''
  );

  // Uploaded media state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'audio' | 'video' | 'image' | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Analysis result for audio/video
  const [analysisResult, setAnalysisResult] = useState<{
    displayScore: number;
    rawScore: number;
    threshold: number;
    alertLevel: 'NORMAL' | 'REVIEW' | 'ANOMALY';
    duration: number;
    features: AudioFeatures;
  } | null>(null);

  // Photo details
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [photoCategory, setPhotoCategory] = useState<MachinePhoto['category']>('overall');

  // Video details & player ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Mic state
  const [isMicMode, setIsMicMode] = useState(false);

  useEffect(() => {
    if (defaultMachineId) {
      setSelectedMachineId(defaultMachineId);
    } else if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
  }, [defaultMachineId, machines]);

  if (!isOpen) return null;

  const currentMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];
  const currentBaseline = baselines.find((b) => b.machineId === selectedMachineId) || baselines[0];

  const resetState = () => {
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setUploadedFile(null);
    setMediaType(null);
    setMediaPreviewUrl(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setAnalysisResult(null);
    setIsMicMode(false);
  };

  const handleFileSelection = async (file: File) => {
    resetState();
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploadedFile(file);

    const detected = detectMediaType(file);
    if (detected === 'unknown') {
      setErrorMsg('Unsupported format. Please upload an image (.jpg, .png), video (.mp4, .webm), or sound (.wav, .mp3, .ogg).');
      return;
    }

    setMediaType(detected);
    setIsProcessing(true);

    try {
      if (detected === 'image') {
        setProcessingStatus('Optimizing image preview...');
        const optimizedUrl = await fileToOptimizedDataUrl(file);
        setMediaPreviewUrl(optimizedUrl);
        setPhotoCaption(file.name.replace(/\.[^/.]+$/, ''));
      } else if (detected === 'video') {
        setProcessingStatus('Loading video preview...');
        const blobUrl = URL.createObjectURL(file);
        setMediaPreviewUrl(blobUrl);

        // Try extracting audio from the video automatically for health analysis
        try {
          setProcessingStatus('Extracting sound track from video for machine health check...');
          const { buffer } = await extractAudioFromMedia(file);
          const features = await extractAcousticFeatures(buffer);
          const evalResult = evaluateAnomaly(features, currentBaseline);

          setAnalysisResult({
            displayScore: evalResult.displayScore,
            rawScore: evalResult.rawScore,
            threshold: evalResult.threshold,
            alertLevel: evalResult.alertLevel,
            duration: buffer.duration,
            features,
          });
        } catch {
          // Video may be silent or codec without audio track
          setProcessingStatus('');
        }
      } else if (detected === 'audio') {
        setProcessingStatus('Reading audio waveform...');
        const blobUrl = URL.createObjectURL(file);
        setMediaPreviewUrl(blobUrl);

        setProcessingStatus('Analyzing acoustic frequencies and baseline deviation...');
        const { buffer } = await extractAudioFromMedia(file);
        const features = await extractAcousticFeatures(buffer);
        const evalResult = evaluateAnomaly(features, currentBaseline);

        setAnalysisResult({
          displayScore: evalResult.displayScore,
          rawScore: evalResult.rawScore,
          threshold: evalResult.threshold,
          alertLevel: evalResult.alertLevel,
          duration: buffer.duration,
          features,
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error processing media file.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleCaptureFrame = () => {
    if (videoRef.current) {
      const frameUrl = captureVideoFrame(videoRef.current);
      if (frameUrl) {
        const photo: MachinePhoto = {
          id: `photo-vid-${Date.now()}`,
          url: frameUrl,
          caption: `Video frame snapshot - ${currentMachine?.name || 'Machine'}`,
          category: 'defect',
          timestamp: new Date().toISOString(),
        };
        onSaveMachinePhoto(selectedMachineId, photo);
        setSuccessMsg('Snapshot captured from video and saved to Machine Photo Gallery!');
      }
    }
  };

  const handleSavePhotoToGallery = () => {
    if (!mediaPreviewUrl || mediaType !== 'image') return;
    const photo: MachinePhoto = {
      id: `photo-${Date.now()}`,
      url: mediaPreviewUrl,
      caption: photoCaption.trim() || `${currentMachine?.name || 'Machine'} inspection photo`,
      category: photoCategory,
      timestamp: new Date().toISOString(),
    };
    onSaveMachinePhoto(selectedMachineId, photo);
    setSuccessMsg(`Photo successfully added to ${currentMachine?.name || 'machine'} gallery!`);
  };

  const handleSaveVideoToProfile = () => {
    if (!mediaPreviewUrl || mediaType !== 'video') return;
    if (onSaveMachineVideo) {
      const vid: MachineVideo = {
        id: `vid-${Date.now()}`,
        url: mediaPreviewUrl,
        title: uploadedFile?.name || 'Machine inspection video',
        timestamp: new Date().toISOString(),
        durationSeconds: analysisResult?.duration,
        notes: analysisResult ? `Acoustic Health Status: ${analysisResult.alertLevel}` : undefined,
      };
      onSaveMachineVideo(selectedMachineId, vid);
      setSuccessMsg(`Video saved to ${currentMachine?.name || 'machine'} profile!`);
    } else {
      setSuccessMsg(`Video inspection verified for ${currentMachine?.name || 'machine'}.`);
    }
  };

  const handleSaveAnalysisRecord = () => {
    if (!analysisResult || !onSaveAnalysis) return;
    const record: AnalysisRecord = {
      id: `rec-${Date.now()}`,
      machineId: selectedMachineId,
      machineName: currentMachine?.name || 'Unknown Machine',
      timestamp: new Date().toISOString(),
      inputSource: mediaType === 'video' ? 'uploaded_audio' : 'uploaded_audio',
      filename: uploadedFile?.name || 'quick_upload.wav',
      durationSeconds: analysisResult.duration,
      features: analysisResult.features,
      rawScore: analysisResult.rawScore,
      displayScore: analysisResult.displayScore,
      threshold: analysisResult.threshold,
      alertLevel: analysisResult.alertLevel,
      deviations: [],
      notes: `Uploaded via Unified Media Center (${mediaType?.toUpperCase()}).`,
    };
    onSaveAnalysis(record);
    setSuccessMsg('Acoustic health report recorded into inspection history!');
  };

  const handleLoadDemoVideo = async (type: 'motor_healthy' | 'pump_anomaly') => {
    resetState();
    setIsProcessing(true);
    setProcessingStatus(`Generating sample industrial ${type === 'motor_healthy' ? 'motor' : 'pump'} video with sound...`);
    try {
      const blob = await generateSampleMachineVideo(type, 3.5);
      const file = new File([blob], `${type}_inspection_sample.webm`, { type: 'video/webm' });
      await handleFileSelection(file);
    } catch (err) {
      setErrorMsg('Demo video generator error: ' + (err instanceof Error ? err.message : String(err)));
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Quick Media Upload
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Audio • Video • Photo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simple 1-step upload for anyone. Upload or record any sound, video, or photo to inspect machinery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Target Machine Selection Bar */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <label htmlFor="machine-select" className="text-xs font-semibold text-slate-300">Target Machine:</label>
            </div>
            <select
              id="machine-select"
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category} - {m.status})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Format Type Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'all', label: 'All-in-One Drop', icon: Upload },
              { id: 'audio', label: 'Audio / Mic', icon: FileAudio },
              { id: 'video', label: 'Video Clip', icon: Video },
              { id: 'photo', label: 'Photo / Thermal', icon: ImageIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'audio') setIsMicMode(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Upload Dropzone (if no file is currently uploaded or if activeTab changes) */}
          {!mediaPreviewUrl && !isMicMode && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
              }`}
              onClick={() => document.getElementById('unified-file-input')?.click()}
            >
              <input
                id="unified-file-input"
                type="file"
                className="hidden"
                accept={
                  activeTab === 'audio'
                    ? 'audio/*,.wav,.mp3,.ogg,.m4a'
                    : activeTab === 'video'
                    ? 'video/*,.mp4,.webm,.mov'
                    : activeTab === 'photo'
                    ? 'image/*,.jpg,.jpeg,.png,.webp,.svg'
                    : 'image/*,video/*,audio/*,.wav,.mp3,.mp4,.webm,.jpg,.png'
                }
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelection(file);
                }}
              />

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Video className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <ImageIcon className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                Drop any Audio, Video, or Photo here
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Drag and drop your file, or click anywhere to browse from your phone or computer.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md">
                  Choose File
                </span>
                {activeTab === 'audio' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMicMode(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    <Mic2 className="w-3.5 h-3.5 text-cyan-400" /> Use Microphone
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Microphone Capture Mode */}
          {isMicMode && !mediaPreviewUrl && (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Mic2 className="w-4 h-4 text-cyan-400" /> Live Microphone Recording
                </span>
                <button
                  onClick={() => setIsMicMode(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <MicRecorder
                onRecordingComplete={async (blob, buffer, duration) => {
                  const file = new File([blob], `mic_record_${Date.now()}.webm`, { type: 'audio/webm' });
                  await handleFileSelection(file);
                }}
                onCancel={() => setIsMicMode(false)}
              />
            </div>
          )}

          {/* Quick Preset Buttons (if user has no file ready) */}
          {!mediaPreviewUrl && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Don't have a file right now? Try a test machine sample:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadDemoVideo('motor_healthy')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700/80 transition-all group"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-300">
                    <Video className="w-3 h-3" /> Motor Video
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Healthy running clip</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoVideo('pump_anomaly')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700/80 transition-all group"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-rose-300">
                    <Video className="w-3 h-3" /> Pump Video
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Vibration defect</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const samplePhoto: MachinePhoto = {
                      id: `photo-preset-${Date.now()}`,
                      url: PRESET_THERMAL_SVG,
                      caption: 'Thermal IR inspection baseline',
                      category: 'thermal',
                      timestamp: new Date().toISOString(),
                    };
                    onSaveMachinePhoto(selectedMachineId, samplePhoto);
                    setSuccessMsg('Sample FLIR Thermal IR photo added to machine gallery!');
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700/80 transition-all group"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-purple-300">
                    <ImageIcon className="w-3 h-3" /> Thermal Photo
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">FLIR IR camera preset</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sampleDefect: MachinePhoto = {
                      id: `photo-defect-${Date.now()}`,
                      url: PRESET_BEARING_DEFECT_SVG,
                      caption: 'Bearing defect close-up spalling',
                      category: 'defect',
                      timestamp: new Date().toISOString(),
                    };
                    onSaveMachinePhoto(selectedMachineId, sampleDefect);
                    setSuccessMsg('Sample Bearing Defect photo added to machine gallery!');
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700/80 transition-all group"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                    <ImageIcon className="w-3 h-3" /> Defect Photo
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Spalling raceway preset</p>
                </button>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-xs text-cyan-300 font-semibold">{processingStatus || 'Processing media...'}</span>
            </div>
          )}

          {/* Active Upload Preview Section */}
          {mediaPreviewUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  {mediaType === 'image' && <ImageIcon className="w-4 h-4 text-purple-400" />}
                  {mediaType === 'video' && <Video className="w-4 h-4 text-blue-400" />}
                  {mediaType === 'audio' && <FileAudio className="w-4 h-4 text-cyan-400" />}
                  Uploaded: <span className="text-white">{uploadedFile?.name || 'Media item'}</span>
                </span>
                <button
                  onClick={resetState}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Upload different file
                </button>
              </div>

              {/* 1. Image Preview & Action Controls */}
              {mediaType === 'image' && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-64">
                    <img
                      src={mediaPreviewUrl}
                      alt="Uploaded machine inspection"
                      className="max-h-64 w-auto object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold">Photo Caption / Note</label>
                      <input
                        type="text"
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        placeholder="e.g., DE Bearing closeup, nameplate"
                        className="w-full mt-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold">Category</label>
                      <select
                        value={photoCategory}
                        onChange={(e) => setPhotoCategory(e.target.value as any)}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="overall">Overall Machine View</option>
                        <option value="bearing">Drive-End Bearing</option>
                        <option value="thermal">FLIR Thermal / Infrared</option>
                        <option value="nameplate">Specification Nameplate</option>
                        <option value="defect">Observed Defect / Crack</option>
                        <option value="other">Other Inspection</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSavePhotoToGallery}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                  >
                    Save Photo to {currentMachine?.name || 'Machine'} Gallery
                  </button>
                </div>
              )}

              {/* 2. Video Preview & Sound Extraction Controls */}
              {mediaType === 'video' && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <video
                      ref={videoRef}
                      src={mediaPreviewUrl}
                      controls
                      playsInline
                      className="w-full max-h-64 object-contain bg-black"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={handleCaptureFrame}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" /> Extract Snapshot Photo
                    </button>
                    <button
                      onClick={handleSaveVideoToProfile}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95"
                    >
                      <Film className="w-3.5 h-3.5" /> Save Video Clip
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Audio Preview Player */}
              {mediaType === 'audio' && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <audio src={mediaPreviewUrl} controls className="w-full h-10" />
                </div>
              )}

              {/* Instant Health Evaluation Card (for Audio & Video) */}
              {analysisResult && (
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    analysisResult.alertLevel === 'NORMAL'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : analysisResult.alertLevel === 'REVIEW'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {analysisResult.alertLevel === 'NORMAL' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      )}
                      <div>
                        <span className="text-xs uppercase font-mono font-bold tracking-wider">
                          Health Check: {analysisResult.alertLevel}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {analysisResult.alertLevel === 'NORMAL'
                            ? 'Acoustic pattern matches healthy machine baseline.'
                            : analysisResult.alertLevel === 'REVIEW'
                            ? 'Moderate acoustic shift observed. Monitoring suggested.'
                            : 'Unusual harmonic vibration detected. Inspection recommended.'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono">
                        Score: {analysisResult.displayScore}/100
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Duration: {analysisResult.duration.toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  {/* Actions for analysis */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={handleSaveAnalysisRecord}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all active:scale-95"
                    >
                      Save to Machine History
                    </button>
                    {onNavigateToTab && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToTab('audio_analysis');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                      >
                        Open Detailed Spectral View <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Files are processed safely in your browser.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
