import { AudioFeatures, Baseline, FeatureDeviation, ModelType } from '../types';

/**
 * Node in an Isolation Tree.
 */
interface IsolationTreeNode {
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
  size?: number; // Size of leaf
  isLeaf: boolean;
}

/**
 * Recursive Isolation Tree builder.
 */
function buildIsolationTree(data: number[][], currentDepth: number, maxDepth: number): IsolationTreeNode {
  const n = data.length;
  if (n <= 1 || currentDepth >= maxDepth) {
    return { isLeaf: true, size: n };
  }

  const numFeatures = data[0].length;
  // Pick random feature
  const featureIdx = Math.floor(Math.random() * numFeatures);

  // Find min and max for this feature in current subset
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < n; i++) {
    const val = data[i][featureIdx];
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }

  // If all values are identical, cannot split further
  if (maxVal <= minVal + 1e-9) {
    return { isLeaf: true, size: n };
  }

  // Pick random split point strictly between min and max
  const splitValue = minVal + Math.random() * (maxVal - minVal);

  const leftData: number[][] = [];
  const rightData: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (data[i][featureIdx] < splitValue) {
      leftData.push(data[i]);
    } else {
      rightData.push(data[i]);
    }
  }

  // Prevent degenerate splits
  if (leftData.length === 0 || rightData.length === 0) {
    return { isLeaf: true, size: n };
  }

  return {
    isLeaf: false,
    splitFeature: featureIdx,
    splitValue,
    left: buildIsolationTree(leftData, currentDepth + 1, maxDepth),
    right: buildIsolationTree(rightData, currentDepth + 1, maxDepth),
  };
}

/**
 * Average path length c(n) for an isolation tree leaf of size n.
 * Euler's constant: 0.5772156649
 */
function averagePathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const euler = 0.5772156649;
  return 2 * (Math.log(n - 1) + euler) - (2 * (n - 1)) / n;
}

/**
 * Path length of a sample x in a single Isolation Tree.
 */
function pathLength(x: number[], node: IsolationTreeNode, currentDepth: number): number {
  if (node.isLeaf) {
    return currentDepth + averagePathLength(node.size || 1);
  }
  const feature = node.splitFeature!;
  if (x[feature] < node.splitValue!) {
    return pathLength(x, node.left!, currentDepth + 1);
  } else {
    return pathLength(x, node.right!, currentDepth + 1);
  }
}

/**
 * Complete Isolation Forest model.
 */
export class IsolationForest {
  private trees: IsolationTreeNode[] = [];
  private numTrees: number;
  private sampleSize: number;
  private maxDepth: number;

  constructor(numTrees = 60) {
    this.numTrees = numTrees;
    this.sampleSize = 0;
    this.maxDepth = 0;
  }

  fit(data: number[][]): void {
    if (data.length === 0) throw new Error('Cannot fit on empty dataset');
    this.sampleSize = data.length;
    this.maxDepth = Math.ceil(Math.log2(Math.max(2, this.sampleSize)));
    this.trees = [];

    for (let t = 0; t < this.numTrees; t++) {
      // Subsampling with replacement / bootstrap
      const subSampleCount = Math.min(this.sampleSize, 128);
      const subSample: number[][] = [];
      for (let s = 0; s < subSampleCount; s++) {
        const randIdx = Math.floor(Math.random() * this.sampleSize);
        subSample.push(data[randIdx]);
      }
      this.trees.push(buildIsolationTree(subSample, 0, this.maxDepth));
    }
  }

  score(x: number[]): number {
    if (this.trees.length === 0) return 0.5;
    let totalPath = 0;
    for (const tree of this.trees) {
      totalPath += pathLength(x, tree, 0);
    }
    const avgPath = totalPath / this.trees.length;
    const cN = averagePathLength(Math.min(this.sampleSize, 128));
    if (cN === 0) return 0.5;

    // Isolation score formula: s = 2 ^ (-E(h(x)) / c(n))
    return Math.pow(2, -avgPath / cN);
  }
}

/**
 * Convert AudioFeatures object to a dense numerical vector for model consumption.
 */
export function featureVectorFromAudio(features: AudioFeatures): number[] {
  return [
    features.rmsEnergy,
    features.spectralCentroid,
    features.spectralBandwidth,
    features.spectralRolloff,
    features.zeroCrossingRate,
    features.spectralFlux,
    ...features.mfcc.slice(0, 8), // First 8 MFCC coefficients
  ];
}

export const FEATURE_NAMES = [
  'RMS Energy',
  'Spectral Centroid',
  'Spectral Bandwidth',
  'Spectral Rolloff',
  'Zero-Crossing Rate',
  'Spectral Flux',
  'MFCC-0 (Power)',
  'MFCC-1 (Tilt)',
  'MFCC-2 (Curvature)',
  'MFCC-3 (High Freq)',
  'MFCC-4 (Resonance)',
  'MFCC-5 (Texture)',
  'MFCC-6 (Roughness)',
  'MFCC-7 (Fine Harmonic)',
];

export const FEATURE_UNITS = [
  'V rms',
  'Hz',
  'Hz',
  'Hz',
  'cross/s',
  'flux',
  'dB',
  'coeff',
  'coeff',
  'coeff',
  'coeff',
  'coeff',
  'coeff',
  'coeff',
];

export const FEATURE_EXPLANATIONS: Record<string, string> = {
  'RMS Energy': 'Total acoustic sound energy. Sharp rises suggest heavy friction, unbalance, or motor overload.',
  'Spectral Centroid': 'Center of mass of the frequency spectrum. Upward shifts indicate grinding, friction, or ultrasonic cavitation; downward shifts indicate low-frequency mechanical thumping.',
  'Spectral Bandwidth': 'Spectral spread around the centroid. Higher values point to turbulent noise, rattle, or widespread harmonics.',
  'Spectral Rolloff': 'Upper frequency boundary containing 85% of power. Sharp expansions reflect metallic impact transients.',
  'Zero-Crossing Rate': 'Rate of waveform sign-inversions. Spikes reflect high-frequency chatter or intermittent scraping.',
  'Spectral Flux': 'Rate of frame-to-frame spectral variation. High flux reveals erratic stuttering or intermittent impacts.',
  'MFCC-0 (Power)': 'Low-frequency baseline loudness envelope.',
  'MFCC-1 (Tilt)': 'Broadband spectral slope. Shifts reflect heating or changing acoustic impedance.',
  'MFCC-2 (Curvature)': 'Spectral curvature capturing motor structural resonances.',
  'MFCC-3 (High Freq)': 'High-frequency harmonic concentration characteristic of bearing cage contact.',
};

/**
 * Calculate statistical mean and std dev across baseline training vectors.
 */
export function calculateBaselineStatistics(observations: number[][]): {
  means: Record<string, number>;
  stds: Record<string, number>;
} {
  const numFeatures = observations[0].length;
  const numSamples = observations.length;
  const means: Record<string, number> = {};
  const stds: Record<string, number> = {};

  for (let f = 0; f < numFeatures; f++) {
    const key = FEATURE_NAMES[f] || `feature_${f}`;
    let sum = 0;
    for (let i = 0; i < numSamples; i++) {
      sum += observations[i][f];
    }
    const mean = sum / numSamples;
    means[key] = Number(mean.toFixed(4));

    let varSum = 0;
    for (let i = 0; i < numSamples; i++) {
      const diff = observations[i][f] - mean;
      varSum += diff * diff;
    }
    const std = Math.sqrt(varSum / Math.max(1, numSamples - 1));
    // Enforce small positive std to prevent division by zero
    stds[key] = Number(Math.max(std, 1e-4).toFixed(4));
  }

  return { means, stds };
}

/**
 * Calculate exact feature deviations from baseline with standard deviations and physical explanations.
 */
export function computeFeatureDeviations(
  features: AudioFeatures,
  baseline: Baseline
): FeatureDeviation[] {
  const vector = featureVectorFromAudio(features);
  const deviations: FeatureDeviation[] = [];

  for (let f = 0; f < vector.length; f++) {
    const name = FEATURE_NAMES[f];
    const unit = FEATURE_UNITS[f] || '';
    const measured = vector[f];
    const mean = baseline.featureMeans[name] ?? measured;
    const std = baseline.featureStds[name] ?? 0.01;

    const diff = measured - mean;
    const sigma = Math.abs(diff / std);

    let severity: 'normal' | 'moderate' | 'high' = 'normal';
    if (sigma >= 2.8) {
      severity = 'high';
    } else if (sigma >= 1.6) {
      severity = 'moderate';
    }

    deviations.push({
      featureKey: name,
      featureName: name,
      measuredValue: Number(measured.toFixed(3)),
      baselineMean: Number(mean.toFixed(3)),
      baselineStd: Number(std.toFixed(3)),
      deviationSigma: Number(sigma.toFixed(2)),
      unit,
      severity,
      physicalMeaning: FEATURE_EXPLANATIONS[name] || 'Acoustic spectral distribution parameter.',
    });
  }

  // Sort by highest deviation sigma first
  return deviations.sort((a, b) => b.deviationSigma - a.deviationSigma);
}

/**
 * Score a feature vector against a trained baseline using the chosen model.
 */
export function evaluateAnomaly(
  features: AudioFeatures,
  baseline: Baseline,
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): {
  rawScore: number;
  displayScore: number;
  threshold: number;
  alertLevel: 'NORMAL' | 'REVIEW' | 'ANOMALY';
  deviations: FeatureDeviation[];
} {
  const x = featureVectorFromAudio(features);
  let rawScore = 0.5;

  if (baseline.modelType === 'isolation_forest') {
    const forest = new IsolationForest(60);
    forest.fit(baseline.trainingObservations);
    rawScore = forest.score(x);
  } else if (baseline.modelType === 'statistical_mahalanobis') {
    // Standardized Euclidean distance normalized
    let distSq = 0;
    for (let f = 0; f < x.length; f++) {
      const name = FEATURE_NAMES[f];
      const mean = baseline.featureMeans[name] ?? x[f];
      const std = baseline.featureStds[name] ?? 1.0;
      const z = (x[f] - mean) / std;
      distSq += z * z;
    }
    const chiAvg = Math.sqrt(distSq / x.length);
    // Logistic map to [0, 1]
    rawScore = 1 / (1 + Math.exp(-(chiAvg - 2.0)));
  } else {
    // One-class boundary approximation
    let minDistance = Infinity;
    for (const obs of baseline.trainingObservations) {
      let d = 0;
      for (let f = 0; f < x.length; f++) {
        const diff = x[f] - obs[f];
        d += diff * diff;
      }
      if (d < minDistance) minDistance = d;
    }
    const distNorm = Math.sqrt(minDistance);
    rawScore = Math.min(0.99, Math.max(0.1, 1 - Math.exp(-distNorm / 500)));
  }

  // Sensitivity multiplier on threshold
  let sensitivityFactor = 1.0;
  if (sensitivity === 'high') sensitivityFactor = 0.90; // Alerts triggered earlier
  if (sensitivity === 'low') sensitivityFactor = 1.12;  // Higher threshold required

  const effectiveThreshold = baseline.threshold * sensitivityFactor;

  // Normalized display index (0 to 100 anomaly indicator)
  // Maps 0.40 -> 20, threshold (e.g. 0.60) -> 65, 0.80 -> 95
  const normalizedDisplayScore = Math.min(
    100,
    Math.max(5, Math.round(((rawScore - 0.35) / 0.50) * 100))
  );

  let alertLevel: 'NORMAL' | 'REVIEW' | 'ANOMALY' = 'NORMAL';
  if (rawScore >= effectiveThreshold) {
    alertLevel = 'ANOMALY';
  } else if (rawScore >= effectiveThreshold * 0.88) {
    alertLevel = 'REVIEW';
  }

  const deviations = computeFeatureDeviations(features, baseline);

  return {
    rawScore: Number(rawScore.toFixed(4)),
    displayScore: normalizedDisplayScore,
    threshold: Number(effectiveThreshold.toFixed(4)),
    alertLevel,
    deviations,
  };
}
