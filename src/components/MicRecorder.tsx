import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { decodeAudioBlob } from '../services/audioEngine';

interface MicRecorderProps {
  onRecordingComplete: (blob: Blob, audioBuffer: AudioBuffer, durationSeconds: number) => void;
  onCancel: () => void;
}

export const MicRecorder: React.FC<MicRecorderProps> = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    setRecordedBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      // Real-time VU meter
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // MediaRecorder for clip creation
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setRecordedBlob(fullBlob);
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            // Auto cap at 15 seconds for clip
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setMicError(err instanceof Error ? err.message : 'Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const discardRecording = () => {
    stopRecording();
    setRecordedBlob(null);
    setRecordingSeconds(0);
    setAudioLevel(0);
  };

  const submitRecording = async () => {
    if (!recordedBlob) return;
    try {
      const buffer = await decodeAudioBlob(recordedBlob);
      onRecordingComplete(recordedBlob, buffer, recordingSeconds || buffer.duration);
    } catch (err) {
      setMicError('Failed to decode recorded clip: ' + (err instanceof Error ? err.message : 'Audio format error'));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg max-w-xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-300'}`}>
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Live Microphone Clip Mode</h3>
            <p className="text-xs text-slate-400">Capture 3–15 second audio directly from machinery</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded"
        >
          Cancel
        </button>
      </div>

      <div className="my-5 flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border border-slate-800/80">
        {isRecording ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center animate-ping absolute inset-0" />
              <div className="w-20 h-20 rounded-full bg-rose-500/30 border-2 border-rose-500 flex items-center justify-center relative z-10">
                <span className="font-mono text-xl font-bold text-rose-200">
                  {recordingSeconds}s
                </span>
              </div>
            </div>

            {/* Live VU Meter */}
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Microphone Level</span>
                <span>{audioLevel}%</span>
              </div>
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    audioLevel > 80 ? 'bg-rose-500' : audioLevel > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>

            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md active:scale-95 transition-all"
            >
              <Square className="w-4 h-4 fill-current" /> Stop Recording
            </button>
          </div>
        ) : recordedBlob ? (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <span className="font-mono text-sm text-slate-200 font-semibold">
              Recording Captured ({recordingSeconds}s)
            </span>
            <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full max-w-sm mt-1" />

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={discardRecording}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Discard
              </button>
              <button
                onClick={submitRecording}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
              >
                Use For Anomaly Detection
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-7 h-7" />
            </button>
            <p className="text-xs text-slate-300 font-medium">Click to begin acoustic clip recording</p>
            <p className="text-[11px] text-slate-500 font-mono">Recommended duration: 3 to 10 seconds</p>
          </div>
        )}
      </div>

      {micError && (
        <div className="p-3 mb-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{micError}</div>
        </div>
      )}

      {/* Environmental noise notice */}
      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Acoustic Notice: </span>
          Environmental background chatter, echoing factory acoustics, or variable phone mic distance can alter high-frequency centroid readings. Hold the microphone 10–20 cm from the bearing/casing for consistent results.
        </div>
      </div>
    </div>
  );
};
