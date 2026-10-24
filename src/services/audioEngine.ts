import { AudioFeatures } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Decode an uploaded File or Blob into an AudioBuffer using the browser's Web Audio API.
 */
export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } catch (err) {
    throw new Error(`Failed to decode audio file: ${err instanceof Error ? err.message : 'Invalid WAV format'}`);
  }
}

/**
 * Perform a Fast Fourier Transform on a float array of length N (power of 2).
 * Returns real and imaginary components.
 */
function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      const tempR = real[i];
      real[i] = real[j];
      real[j] = tempR;
      const tempI = imag[i];
      imag[i] = imag[j];
      imag[j] = tempI;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wR = 1;
      let wI = 0;
      for (let k = 0; k < half; k++) {
        const uR = real[i + k];
        const uI = imag[i + k];
        const vR = real[i + k + half] * wR - imag[i + k + half] * wI;
        const vI = real[i + k + half] * wI + imag[i + k + half] * wR;

        real[i + k] = uR + vR;
        imag[i + k] = uI + vI;
        real[i + k + half] = uR - vR;
        imag[i + k + half] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        wI = wR * wStepI + wI * wStepR;
        wR = nextWR;
      }
    }
  }
}

/**
 * Convert Hertz frequency to Mel scale.
 */
function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}

/**
 * Convert Mel scale back to Hertz frequency.
 */
function melToHz(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1);
}

/**
 * Construct 26 triangular Mel filterbanks from 20 Hz to nyquist.
 */
function buildMelFilterbank(numFilters: number, fftSize: number, sampleRate: number): Float64Array[] {
  const numBins = Math.floor(fftSize / 2) + 1;
  const minMel = hzToMel(20);
  const maxMel = hzToMel(sampleRate / 2);
  const melPoints = new Float64Array(numFilters + 2);
  const binPoints = new Int32Array(numFilters + 2);

  for (let i = 0; i < numFilters + 2; i++) {
    melPoints[i] = minMel + (i / (numFilters + 1)) * (maxMel - minMel);
    const hz = melToHz(melPoints[i]);
    binPoints[i] = Math.floor(((fftSize + 1) * hz) / sampleRate);
  }

  const filters: Float64Array[] = [];
  for (let m = 1; m <= numFilters; m++) {
    const filter = new Float64Array(numBins);
    const prevBin = binPoints[m - 1];
    const centerBin = binPoints[m];
    const nextBin = binPoints[m + 1];

    for (let k = prevBin; k < centerBin; k++) {
      if (k < numBins && centerBin !== prevBin) {
        filter[k] = (k - prevBin) / (centerBin - prevBin);
      }
    }
    for (let k = centerBin; k < nextBin; k++) {
      if (k < numBins && nextBin !== centerBin) {
        filter[k] = (nextBin - k) / (nextBin - centerBin);
      }
    }
    filters.push(filter);
  }
  return filters;
}

/**
 * Extract physical acoustic features from an AudioBuffer using standard DSP equations.
 */
export async function extractAcousticFeatures(audioBuffer: AudioBuffer): Promise<AudioFeatures> {
  const channelData = audioBuffer.getChannelData(0); // Primary channel (mono or left)
  const sampleRate = audioBuffer.sampleRate;
  const totalSamples = channelData.length;

  if (totalSamples === 0) {
    throw new Error('Audio sample buffer is empty');
  }

  // 1. RMS Energy
  let sumSq = 0;
  for (let i = 0; i < totalSamples; i++) {
    sumSq += channelData[i] * channelData[i];
  }
  const rmsEnergy = Math.sqrt(sumSq / totalSamples);

  // 2. Zero-Crossing Rate (ZCR)
  let zeroCrossings = 0;
  for (let i = 1; i < totalSamples; i++) {
    if ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }
  const zeroCrossingRate = zeroCrossings / (totalSamples - 1);

  // 3. Short-Time Framing & Spectral Features
  const frameSize = 1024;
  const hopSize = 512;
  const numFrames = Math.floor((totalSamples - frameSize) / hopSize);
  const actualFrames = Math.max(1, numFrames);

  const numBins = Math.floor(frameSize / 2) + 1;
  const freqPerBin = sampleRate / frameSize;

  // Pre-calculate Hanning window
  const window = new Float64Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameSize - 1)));
  }

  const melFilters = buildMelFilterbank(26, frameSize, sampleRate);

  let totalCentroid = 0;
  let totalBandwidth = 0;
  let totalRolloff = 0;
  let totalFlux = 0;
  const sumMfcc = new Float64Array(13);

  let prevMagNorm = new Float64Array(numBins);

  const real = new Float64Array(frameSize);
  const imag = new Float64Array(frameSize);
  const mag = new Float64Array(numBins);

  for (let f = 0; f < actualFrames; f++) {
    const offset = f * hopSize;

    // Windowed frame
    for (let i = 0; i < frameSize; i++) {
      const idx = offset + i;
      real[i] = (idx < totalSamples ? channelData[idx] : 0) * window[i];
      imag[i] = 0;
    }

    fft(real, imag);

    let frameEnergy = 0;
    for (let k = 0; k < numBins; k++) {
      mag[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
      frameEnergy += mag[k];
    }

    // Avoid zero division on silence
    if (frameEnergy < 1e-6) frameEnergy = 1e-6;

    // Normalized frame magnitudes
    const magNorm = new Float64Array(numBins);
    for (let k = 0; k < numBins; k++) {
      magNorm[k] = mag[k] / frameEnergy;
    }

    // Spectral Centroid: sum(k * freqPerBin * mag[k]) / sum(mag[k])
    let weightedFreq = 0;
    for (let k = 0; k < numBins; k++) {
      weightedFreq += k * freqPerBin * mag[k];
    }
    const frameCentroid = weightedFreq / frameEnergy;
    totalCentroid += frameCentroid;

    // Spectral Bandwidth: sqrt(sum((f - centroid)^2 * mag[k]) / sum(mag[k]))
    let bandwidthSum = 0;
    for (let k = 0; k < numBins; k++) {
      const diff = k * freqPerBin - frameCentroid;
      bandwidthSum += diff * diff * mag[k];
    }
    const frameBandwidth = Math.sqrt(bandwidthSum / frameEnergy);
    totalBandwidth += frameBandwidth;

    // Spectral Rolloff: frequency where 85% of total power lies
    const rolloffThreshold = 0.85 * frameEnergy;
    let cumEnergy = 0;
    let frameRolloff = sampleRate / 2;
    for (let k = 0; k < numBins; k++) {
      cumEnergy += mag[k];
      if (cumEnergy >= rolloffThreshold) {
        frameRolloff = k * freqPerBin;
        break;
      }
    }
    totalRolloff += frameRolloff;

    // Spectral Flux: Euclidean distance between normalized spectra of adjacent frames
    if (f > 0) {
      let fluxSum = 0;
      for (let k = 0; k < numBins; k++) {
        const diff = magNorm[k] - prevMagNorm[k];
        fluxSum += diff * diff;
      }
      totalFlux += Math.sqrt(fluxSum);
    }
    prevMagNorm = magNorm;

    // Mel-Filterbank Energies & Discrete Cosine Transform (MFCC)
    const logMelEnergies = new Float64Array(26);
    for (let m = 0; m < 26; m++) {
      let filterEnergy = 0;
      const filter = melFilters[m];
      for (let k = 0; k < numBins; k++) {
        filterEnergy += mag[k] * filter[k];
      }
      logMelEnergies[m] = Math.log(Math.max(filterEnergy, 1e-5));
    }

    // DCT-II for 13 coefficients
    for (let c = 0; c < 13; c++) {
      let dctVal = 0;
      for (let m = 0; m < 26; m++) {
        dctVal += logMelEnergies[m] * Math.cos((Math.PI * c * (m + 0.5)) / 26);
      }
      sumMfcc[c] += dctVal;
    }
  }

  const mfcc: number[] = [];
  for (let c = 0; c < 13; c++) {
    mfcc.push(Number((sumMfcc[c] / actualFrames).toFixed(4)));
  }

  return {
    rmsEnergy: Number(rmsEnergy.toFixed(5)),
    spectralCentroid: Number((totalCentroid / actualFrames).toFixed(1)),
    spectralBandwidth: Number((totalBandwidth / actualFrames).toFixed(1)),
    spectralRolloff: Number((totalRolloff / actualFrames).toFixed(1)),
    zeroCrossingRate: Number(zeroCrossingRate.toFixed(4)),
    spectralFlux: Number((totalFlux / Math.max(1, actualFrames - 1)).toFixed(5)),
    mfcc,
  };
}

/**
 * Generate a WAV file in memory with specified duration and audio generator function.
 * Used for deterministic acoustic synthesis (Normal hum, Bearing rub, Cavitation, etc.).
 */
export function generateSyntheticWav(
  type: 'normal_hum' | 'bearing_fault' | 'rotor_unbalance' | 'pump_cavitation' | 'fan_rub',
  durationSeconds = 3.5,
  sampleRate = 22050
): Blob {
  const totalSamples = Math.floor(durationSeconds * sampleRate);
  const buffer = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (type === 'normal_hum') {
      // Clean 60Hz fundamental + 120Hz/180Hz motor hum + subtle smooth pink noise
      const f60 = Math.sin(2 * Math.PI * 60 * t);
      const f120 = 0.35 * Math.sin(2 * Math.PI * 120 * t);
      const f180 = 0.15 * Math.sin(2 * Math.PI * 180 * t);
      const noise = (Math.random() * 2 - 1) * 0.04;
      sample = (f60 + f120 + f180 + noise) * 0.3;
    } else if (type === 'bearing_fault') {
      // Normal motor base + 2400Hz resonant ringing spikes at 14.2 Hz cage fault frequency
      const baseHum = 0.2 * Math.sin(2 * Math.PI * 60 * t);
      const impactPhase = (t * 14.2) % 1; // 14.2 impacts per second
      let impact = 0;
      if (impactPhase < 0.15) {
        const decay = Math.exp(-impactPhase * 45);
        impact = decay * Math.sin(2 * Math.PI * 2400 * t) * 0.85;
      }
      const frictionHiss = (Math.random() * 2 - 1) * 0.09;
      sample = baseHum + impact + frictionHiss;
    } else if (type === 'rotor_unbalance') {
      // Heavy 29.5 Hz rotational unbalance vibration rumble with modulated amplitude
      const unbalance = Math.sin(2 * Math.PI * 29.5 * t);
      const harmonic = 0.4 * Math.sin(2 * Math.PI * 59.0 * t);
      const mod = 0.6 + 0.4 * Math.sin(2 * Math.PI * 2.2 * t);
      sample = (unbalance + harmonic) * mod * 0.55;
    } else if (type === 'pump_cavitation') {
      // Cavitation: fluid flow + random high-energy collapsing vapor bubble crackles
      const baseFlow = 0.2 * Math.sin(2 * Math.PI * 85 * t);
      const bubbleCrackles = Math.random() > 0.88 ? (Math.random() * 2 - 1) * 0.9 : 0;
      const turbulence = (Math.random() * 2 - 1) * 0.25;
      sample = baseFlow + bubbleCrackles + turbulence;
    } else if (type === 'fan_rub') {
      // Fan blade mechanical casing rub: 350Hz squeal burst
      const airNoise = (Math.random() * 2 - 1) * 0.15;
      const bladePass = Math.sin(2 * Math.PI * 140 * t) * 0.25;
      const rub = Math.sin(2 * Math.PI * 880 * t) * (Math.sin(2 * Math.PI * 15 * t) > 0.4 ? 0.6 : 0.05);
      sample = airNoise + bladePass + rub;
    }

    // Hard clip between -1.0 and 1.0
    buffer[i] = Math.max(-0.99, Math.min(0.99, sample));
  }

  // Encode Float32Array to 16-bit PCM WAV container
  return encodePcmWav(buffer, sampleRate);
}

/**
 * Encode raw PCM samples to a RIFF WAV Blob.
 */
export function encodePcmWav(samples: Float32Array, sampleRate: number): Blob {
  const byteRate = sampleRate * 2; // 16-bit mono = 2 bytes per sample
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);          // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);           // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true);           // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true);  // SampleRate
  view.setUint32(28, byteRate, true);    // ByteRate
  view.setUint16(32, 2, true);           // BlockAlign (2 bytes)
  view.setUint16(34, 16, true);          // BitsPerSample (16 bits)

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write 16-bit signed PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
