import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface AudioWaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  audioBlob?: Blob | null;
  title?: string;
  isSimulated?: boolean;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  audioBuffer,
  audioBlob,
  title = 'Acoustic Waveform',
  isSimulated = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
    }
  }, [audioBlob]);

  // Render waveform onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark grid background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (!audioBuffer) {
      ctx.fillStyle = '#475569';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No audio waveform loaded', width / 2, height / 2 + 4);
      return;
    }

    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2.2;

    // Draw waveform bars
    ctx.fillStyle = '#06b6d4'; // Cyan-500
    for (let x = 0; x < width; x++) {
      let min = 1.0;
      let max = -1.0;
      const start = x * step;
      const end = Math.min(start + step, channelData.length);

      for (let j = start; j < end; j++) {
        const val = channelData[j];
        if (val < min) min = val;
        if (val > max) max = val;
      }

      if (min === 1.0) min = 0;
      if (max === -1.0) max = 0;

      const y1 = height / 2 + min * amp;
      const y2 = height / 2 + max * amp;
      const barHeight = Math.max(2, y2 - y1);

      // Playback progress coloring
      const progress = currentTime / (audioBuffer.duration || 1);
      const isPast = x / width <= progress;

      ctx.fillStyle = isPast ? '#38bdf8' : '#0e7490';
      ctx.fillRect(x, y1, 1, barHeight);
    }

    // Playhead line
    if (audioBuffer && audioBuffer.duration > 0) {
      const playheadX = (currentTime / audioBuffer.duration) * width;
      ctx.strokeStyle = '#f43f5e'; // Rose
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [audioBuffer, currentTime]);

  const togglePlay = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play().catch((e) => console.error('Audio play error', e));
    }
  };

  const restartPlay = () => {
    if (!audioElementRef.current) return;
    audioElementRef.current.currentTime = 0;
    setCurrentTime(0);
    audioElementRef.current.play().catch((e) => console.error('Audio restart error', e));
  };

  const handleTimeUpdate = () => {
    if (audioElementRef.current) {
      setCurrentTime(audioElementRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const duration = audioBuffer?.duration || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 truncate max-w-[180px] sm:max-w-none">
            {title}
          </span>
          {isSimulated && (
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              Demo
            </span>
          )}
        </div>
        <div className="text-[11px] sm:text-xs font-mono text-slate-400 shrink-0">
          {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-slate-800/80 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={720}
          height={120}
          className="w-full h-28 block cursor-pointer"
          onClick={(e) => {
            if (!audioBuffer || !audioElementRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const targetTime = clickPos * audioBuffer.duration;
            audioElementRef.current.currentTime = targetTime;
            setCurrentTime(targetTime);
          }}
        />
      </div>

      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          className="hidden"
        />
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!audioUrl}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              audioUrl
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Play Audio
              </>
            )}
          </button>
          <button
            type="button"
            onClick={restartPlay}
            disabled={!audioUrl}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Restart playback"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Click waveform to scrub playhead
        </span>
      </div>
    </div>
  );
};
