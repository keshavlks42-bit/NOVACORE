export type MachineCategory = 'Motor' | 'Pump' | 'Fan' | 'Compressor' | 'Conveyor' | 'Gearbox';
export type MachineStatus = 'NORMAL' | 'ATTENTION' | 'CRITICAL';
export type AlertSeverity = 'NORMAL' | 'REVIEW' | 'ANOMALY';
export type ModelType = 'isolation_forest' | 'statistical_mahalanobis' | 'one_class_svm';

export interface OperatingConditions {
  rpm: number;
  loadPercentage: number;
  voltage?: number;
  ambientTempC?: number;
}

export interface MachinePhoto {
  id: string;
  url: string;
  caption: string;
  category: 'overall' | 'bearing' | 'thermal' | 'nameplate' | 'defect' | 'other';
  timestamp: string;
}

export interface MachineVideo {
  id: string;
  url: string;
  title: string;
  durationSeconds?: number;
  timestamp: string;
  notes?: string;
}

export interface Machine {
  id: string;
  name: string;
  category: MachineCategory;
  location: string;
  description: string;
  dateRegistered: string;
  operatingConditions: OperatingConditions;
  status: MachineStatus;
  baselineId?: string;
  vibrationBaselineId?: string;
  latestAnomalyScore?: number;
  lastAnalysisTimestamp?: string;
  maintenanceNotes?: string;
  isDemoMachine?: boolean;
  archived?: boolean;
  imageUrl?: string;
  photos?: MachinePhoto[];
  videos?: MachineVideo[];
}

export interface AudioFeatures {
  rmsEnergy: number;            // 0 to 1 average energy
  spectralCentroid: number;     // Center of mass of spectrum in Hz
  spectralBandwidth: number;    // Spectral spread around centroid in Hz
  spectralRolloff: number;      // 85% energy frequency cutoff in Hz
  zeroCrossingRate: number;     // Rate of sign-changes in time domain
  spectralFlux: number;         // Frame-to-frame spectral distance
  mfcc: number[];               // 13 Mel-frequency cepstral coefficients
}

export interface FeatureDeviation {
  featureKey: string;
  featureName: string;
  measuredValue: number;
  baselineMean: number;
  baselineStd: number;
  deviationSigma: number;      // (value - mean) / std
  unit: string;
  severity: 'normal' | 'moderate' | 'high';
  physicalMeaning: string;
}

export interface Baseline {
  id: string;
  machineId: string;
  machineName: string;
  modelType: ModelType;
  sampleCount: number;
  threshold: number;            // e.g. 0.62 for Isolation Forest
  featureMeans: Record<string, number>;
  featureStds: Record<string, number>;
  trainingObservations: number[][]; // Extracted feature vectors
  version: string;
  createdAt: string;
  calibratedPercentile: number; // e.g. 95th percentile
}

export interface VibrationPoint {
  timestamp: string;
  accelX: number;
  accelY: number;
  accelZ: number;
  resultant: number;
}

export interface VibrationSummary {
  rms: number;
  peak: number;
  crestFactor: number;
  sampleRateHz?: number;
  isSimulated: boolean;
  notes?: string;
}

export interface AnalysisRecord {
  id: string;
  machineId: string;
  machineName: string;
  timestamp: string;
  inputSource: 'uploaded_audio' | 'live_microphone' | 'synthetic_bench' | 'mimii_benchmark';
  filename: string;
  durationSeconds: number;
  features: AudioFeatures;
  rawScore: number;             // Model score (e.g. 0.4 - 0.8)
  displayScore: number;         // Normalized index (0 - 100)
  threshold: number;
  alertLevel: AlertSeverity;
  deviations: FeatureDeviation[];
  vibrationData?: VibrationSummary;
  aiExplanation?: {
    summary: string;
    acousticInsight: string;
    inspectionChecklist: string[];
    disclaimer: string;
    provider?: string;
  };
  notes?: string;
}

export type MaintenanceStatus =
  | 'New Alert'
  | 'Inspection Pending'
  | 'Inspection Completed'
  | 'Maintenance Required'
  | 'No Issue Found'
  | 'Closed';

export interface MaintenanceRecord {
  id: string;
  machineId: string;
  machineName: string;
  date: string;
  associatedAnalysisId?: string;
  status: MaintenanceStatus;
  technicianName: string;
  technicianNotes: string;
  maintenanceAction: string;
  partsReplaced?: string;
  inspectionOutcome: string;
  photos?: MachinePhoto[];
  videos?: MachineVideo[];
}

export interface EvaluationBenchmark {
  datasetName: string;
  machineCategory: string;
  baselineRecordingsCount: number;
  evaluationRecordingsCount: number;
  trueNormal: number;
  falsePositive: number;
  trueAnomaly: number;
  missedAnomaly: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  threshold: number;
  executedAt: string;
}

export type UserRole =
  | 'Plant Operator'
  | 'Maintenance Technician'
  | 'Reliability Engineer'
  | 'Plant Manager'
  | 'Quality Inspector';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plantLocation: string;
  department: string;
  verified: boolean;
  avatarUrl?: string;
  initials?: string;
  registeredAt: string;
  lastLoginAt: string;
  badgeNumber?: string;
}

export interface UserAccount extends UserProfile {
  passwordHash: string;
  verificationCode?: string;
  verificationCodeSentAt?: string;
}
