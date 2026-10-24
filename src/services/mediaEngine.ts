/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { decodeAudioBlob } from './audioEngine';

/**
 * Detect media category from File or mime type
 */
export function detectMediaType(file: File): 'audio' | 'video' | 'image' | 'unknown' {
  if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|svg|bmp)$/i)) {
    return 'image';
  }
  if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
    return 'video';
  }
  if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|ogg|m4a|aac|flac)$/i)) {
    return 'audio';
  }
  return 'unknown';
}

/**
 * Extract an AudioBuffer from an uploaded video or audio file.
 */
export async function extractAudioFromMedia(
  blob: Blob
): Promise<{ buffer: AudioBuffer; hasAudio: boolean }> {
  try {
    const buffer = await decodeAudioBlob(blob);
    return { buffer, hasAudio: true };
  } catch (err) {
    // If decoding failed, check if it's a silent video or unsupported codec
    console.warn('Direct decodeAudioData could not decode audio track:', err);
    throw new Error(
      'Unable to extract acoustic audio track from this file. Ensure the video or audio file has an active soundtrack (e.g., AAC, MP3, WAV or Opus).'
    );
  }
}

/**
 * Capture a freeze-frame snapshot photo from a running video element.
 */
export function captureVideoFrame(video: HTMLVideoElement, quality = 0.85): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  }
  return '';
}

/**
 * Generate a procedural WebM video clip of a running industrial machine with an audible acoustic soundtrack.
 * Self-contained, works 100% client-side without external dependencies.
 */
export async function generateSampleMachineVideo(
  type: 'motor_healthy' | 'pump_anomaly',
  durationSec = 4
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Check MediaRecorder support
      if (typeof window === 'undefined' || !window.MediaRecorder || !canvas.captureStream) {
        throw new Error('MediaRecorder or canvas.captureStream not supported in this browser');
      }

      // Web Audio setup for synthetic soundtrack
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const dest = audioCtx.createMediaStreamDestination();

      // Audio oscillators for machine sound
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'motor_healthy') {
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(120, audioCtx.currentTime); // 120 Hz fundamental
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(240, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      } else {
        // pump anomaly: harsh harmonic rattle
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(145, audioCtx.currentTime);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(320, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      }

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start();
      osc2.start();

      // Combine video stream and audio stream
      const videoStream = canvas.captureStream(30); // 30 fps
      const audioTracks = dest.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        videoStream.addTrack(audioTracks[0]);
      }

      // MediaRecorder
      const mimeTypes = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(videoStream, selectedMime ? { mimeType: selectedMime } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          osc1.stop();
          osc2.stop();
          audioCtx.close();
        } catch {
          // ignore cleanup errors
        }
        const finalBlob = new Blob(chunks, { type: selectedMime || 'video/webm' });
        resolve(finalBlob);
      };

      recorder.start();

      let startTime = performance.now();
      let frame = 0;

      const render = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        frame++;

        // Render animation frame
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Title and HUD overlay
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`MACHINE VIDEO INSPECTION - ${type === 'motor_healthy' ? 'MOTOR A (NORMAL)' : 'PUMP B (VIBRATION ANOMALY)'}`, 20, 30);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.fillText(`REC TIME: ${elapsed.toFixed(1)}s / ${durationSec}s | 30 FPS | LIVE SENSOR STREAM`, 20, 50);

        // Machine body
        const cx = 320;
        const cy = 200;
        const vibrationX = type === 'pump_anomaly' ? (Math.random() - 0.5) * 6 : (Math.random() - 0.5) * 1;
        const vibrationY = type === 'pump_anomaly' ? (Math.random() - 0.5) * 4 : 0;

        ctx.save();
        ctx.translate(cx + vibrationX, cy + vibrationY);

        // Mounting base
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-180, 80, 360, 24);

        // Stator housing
        ctx.fillStyle = type === 'pump_anomaly' ? '#7f1d1d' : '#0f766e';
        ctx.fillRect(-120, -60, 240, 140);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(-120, -60, 240, 140);

        // Cooling fins
        ctx.fillStyle = '#334155';
        for (let i = -100; i < 110; i += 20) {
          ctx.fillRect(i, -70, 8, 10);
        }

        // Rotating rotor/shaft end
        const rotAngle = (frame * (type === 'pump_anomaly' ? 0.35 : 0.2)) % (2 * Math.PI);
        ctx.save();
        ctx.translate(140, 10);
        ctx.rotate(rotAngle);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-16, -16, 32, 32);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, -3, 14, 6); // Keyway indicator
        ctx.restore();

        // Vibration alert indicator
        if (type === 'pump_anomaly') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('⚠ HIGH VIBRATION SHIFT DETECTED', -130, 120);
        } else {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('✓ NOMINAL ROTATION & ACOUSTICS', -130, 120);
        }

        ctx.restore();

        if (elapsed < durationSec) {
          requestAnimationFrame(render);
        } else {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      };

      requestAnimationFrame(render);
    } catch (err) {
      reject(err);
    }
  });
}
