import {
  AnalysisRecord,
  Baseline,
  EvaluationBenchmark,
  Machine,
  MaintenanceRecord,
} from '../types';
import {
  PRESET_MOTOR_SVG,
  PRESET_PUMP_SVG,
  PRESET_THERMAL_SVG,
  PRESET_BEARING_DEFECT_SVG,
  PRESET_GEARBOX_SVG,
  PRESET_COMPRESSOR_SVG,
  PRESET_CONVEYOR_SVG,
  PRESET_FAN_SVG,
} from './pictureLibrary';

const STORAGE_KEYS = {
  MACHINES: 'machinesentry_machines_v1',
  BASELINES: 'machinesentry_baselines_v1',
  ANALYSES: 'machinesentry_analyses_v1',
  MAINTENANCE: 'machinesentry_maintenance_v1',
  BENCHMARKS: 'machinesentry_benchmarks_v1',
  INITIALIZED: 'machinesentry_initialized_v1',
};

// Initial Seed Machines (Fictional Demo Machines clearly marked with preset pictures)
export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'mach-motor-a',
    name: 'Motor A (Induction 5.5kW)',
    category: 'Motor',
    location: 'Bay 2 — Extrusion Line #1',
    description: '400V 3-phase Squirrel-cage induction motor driving drive gear.',
    dateRegistered: '2026-08-15',
    operatingConditions: {
      rpm: 1475,
      loadPercentage: 78,
      voltage: 400,
      ambientTempC: 38,
    },
    status: 'NORMAL',
    baselineId: 'base-motor-a',
    vibrationBaselineId: 'vib-motor-a',
    latestAnomalyScore: 0.44,
    lastAnalysisTimestamp: '2026-10-23T18:30:00Z',
    maintenanceNotes: 'Baseline recorded after scheduled quarterly bearing greasing.',
    isDemoMachine: true,
    imageUrl: PRESET_MOTOR_SVG,
    photos: [
      {
        id: 'photo-m1',
        url: PRESET_MOTOR_SVG,
        caption: '5.5 kW 3-Phase Induction Motor — Stator Ribs & Terminal Box',
        category: 'overall',
        timestamp: '2026-08-15T10:00:00Z',
      },
      {
        id: 'photo-m2',
        url: PRESET_THERMAL_SVG,
        caption: 'FLIR Thermography Baseline — 38°C Drive-End Bearing Nominal',
        category: 'thermal',
        timestamp: '2026-10-23T18:30:00Z',
      },
    ],
  },
  {
    id: 'mach-pump-b',
    name: 'Water Pump B (Centrifugal Slurry)',
    category: 'Pump',
    location: 'Effluent Treatment Plant (ETP)',
    description: 'End-suction centrifugal slurry pump with rubber impeller lining.',
    dateRegistered: '2026-09-02',
    operatingConditions: {
      rpm: 2900,
      loadPercentage: 88,
      voltage: 415,
      ambientTempC: 32,
    },
    status: 'ATTENTION',
    baselineId: 'base-pump-b',
    latestAnomalyScore: 0.68,
    lastAnalysisTimestamp: '2026-10-23T21:15:00Z',
    maintenanceNotes: 'Mild acoustic shift noted during suction valve throttling.',
    isDemoMachine: true,
    imageUrl: PRESET_PUMP_SVG,
    photos: [
      {
        id: 'photo-p1',
        url: PRESET_PUMP_SVG,
        caption: 'High-Solids Slurry Pump Volute & Axial Suction Flange',
        category: 'overall',
        timestamp: '2026-09-02T14:00:00Z',
      },
      {
        id: 'photo-p2',
        url: PRESET_BEARING_DEFECT_SVG,
        caption: 'Quarterly Audit: DE Bearing 6205 Outer Raceway Micro-Spalling',
        category: 'defect',
        timestamp: '2026-10-23T21:15:00Z',
      },
    ],
  },
  {
    id: 'mach-fan-c',
    name: 'Industrial Fan C (Exhaust Blower)',
    category: 'Fan',
    location: 'Paint Shop Roof Vent #3',
    description: 'Backward-curved centrifugal exhaust ventilation blower 11kW with 7-blade aerofoil.',
    dateRegistered: '2026-09-18',
    operatingConditions: {
      rpm: 1180,
      loadPercentage: 62,
      voltage: 395,
      ambientTempC: 44,
    },
    status: 'NORMAL',
    baselineId: 'base-fan-c',
    latestAnomalyScore: 0.41,
    lastAnalysisTimestamp: '2026-10-22T14:00:00Z',
    maintenanceNotes: 'Vibration isolator mounts replaced in September.',
    isDemoMachine: true,
    imageUrl: PRESET_FAN_SVG,
    photos: [
      {
        id: 'photo-f1',
        url: PRESET_FAN_SVG,
        caption: '11 kW Axial Ventilation Blower with Bellmouth Venturi Shroud',
        category: 'overall',
        timestamp: '2026-09-18T10:00:00Z',
      },
    ],
  },
  {
    id: 'mach-comp-d',
    name: 'Compressor D (Rotary Screw 22kW)',
    category: 'Compressor',
    location: 'Central Utility Room',
    description: 'Oil-injected twin-screw air compressor providing 8.5 bar factory air.',
    dateRegistered: '2026-10-01',
    operatingConditions: {
      rpm: 3600,
      loadPercentage: 92,
      voltage: 415,
      ambientTempC: 35,
    },
    status: 'CRITICAL',
    baselineId: 'base-comp-d',
    latestAnomalyScore: 0.76,
    lastAnalysisTimestamp: '2026-10-23T22:00:00Z',
    maintenanceNotes: 'High-frequency acoustic scream detected; inspection pending.',
    isDemoMachine: true,
    imageUrl: PRESET_COMPRESSOR_SVG,
    photos: [
      {
        id: 'photo-c1',
        url: PRESET_COMPRESSOR_SVG,
        caption: '22 kW Twin-Screw Compressor Airend & Oil Separator Receiver',
        category: 'overall',
        timestamp: '2026-10-01T09:30:00Z',
      },
    ],
  },
  {
    id: 'mach-gearbox-e',
    name: 'Gearbox E (Helical Speed Reducer 30kW)',
    category: 'Gearbox',
    location: 'Raw Materials Milling Bay #4',
    description: 'Dual-shaft helical speed reduction unit with 18T pinion and 52T bull gear.',
    dateRegistered: '2026-07-12',
    operatingConditions: {
      rpm: 1450,
      loadPercentage: 84,
      voltage: 400,
      ambientTempC: 46,
    },
    status: 'ATTENTION',
    baselineId: 'base-gearbox-e',
    latestAnomalyScore: 0.65,
    lastAnalysisTimestamp: '2026-10-23T19:45:00Z',
    maintenanceNotes: 'Elevated gearmesh frequency harmonics noted during oil change inspection.',
    isDemoMachine: true,
    imageUrl: PRESET_GEARBOX_SVG,
    photos: [
      {
        id: 'photo-g1',
        url: PRESET_GEARBOX_SVG,
        caption: 'Heavy Helical Gear Reducer Housing with Oil Sight Glass & Breather',
        category: 'overall',
        timestamp: '2026-07-12T11:00:00Z',
      },
    ],
  },
  {
    id: 'mach-conveyor-f',
    name: 'Conveyor F (Belt Drive Pulley 15kW)',
    category: 'Conveyor',
    location: 'Overland Clinker Transport Line',
    description: 'Heavy-duty overland belt conveyor head drive drum pulley with rubber lagging.',
    dateRegistered: '2026-08-04',
    operatingConditions: {
      rpm: 380,
      loadPercentage: 76,
      voltage: 415,
      ambientTempC: 38,
    },
    status: 'NORMAL',
    baselineId: 'base-conveyor-f',
    latestAnomalyScore: 0.39,
    lastAnalysisTimestamp: '2026-10-24T00:30:00Z',
    maintenanceNotes: 'Rubber lagging clean, plummer block spherical roller bearings greased.',
    isDemoMachine: true,
    imageUrl: PRESET_CONVEYOR_SVG,
    photos: [
      {
        id: 'photo-cv1',
        url: PRESET_CONVEYOR_SVG,
        caption: 'Conveyor Head Pulley Drum Ø600mm & Troughing Idler Frame',
        category: 'overall',
        timestamp: '2026-08-04T15:20:00Z',
      },
    ],
  },
  {
    id: 'mach-piston-g',
    name: 'Hydraulic Piston Unit G (18.5kW)',
    category: 'Pump',
    location: 'Press Line Hydraulic Basement',
    description: 'High-pressure variable displacement axial piston pump operating at 210 bar.',
    dateRegistered: '2026-09-25',
    operatingConditions: {
      rpm: 1750,
      loadPercentage: 81,
      voltage: 400,
      ambientTempC: 42,
    },
    status: 'NORMAL',
    baselineId: 'base-piston-g',
    latestAnomalyScore: 0.45,
    lastAnalysisTimestamp: '2026-10-24T01:00:00Z',
    maintenanceNotes: 'Cylinder barrel clearance and swashplate angle calibrated.',
    isDemoMachine: true,
    imageUrl: PRESET_PUMP_SVG,
    photos: [
      {
        id: 'photo-pg1',
        url: PRESET_PUMP_SVG,
        caption: 'High-Pressure Hydraulic Plunger Pump Block & Valve Manifold',
        category: 'overall',
        timestamp: '2026-09-25T13:40:00Z',
      },
    ],
  },
];

// Seed Baselines
export const INITIAL_BASELINES: Baseline[] = [
  {
    id: 'base-motor-a',
    machineId: 'mach-motor-a',
    machineName: 'Motor A (Induction 5.5kW)',
    modelType: 'isolation_forest',
    sampleCount: 24,
    threshold: 0.58,
    featureMeans: {
      'RMS Energy': 0.142,
      'Spectral Centroid': 468.5,
      'Spectral Bandwidth': 612.3,
      'Spectral Rolloff': 920.0,
      'Zero-Crossing Rate': 0.038,
      'Spectral Flux': 0.009,
      'MFCC-0 (Power)': -2.1,
      'MFCC-1 (Tilt)': 14.2,
      'MFCC-2 (Curvature)': -8.4,
      'MFCC-3 (High Freq)': 3.1,
    },
    featureStds: {
      'RMS Energy': 0.015,
      'Spectral Centroid': 32.0,
      'Spectral Bandwidth': 48.0,
      'Spectral Rolloff': 65.0,
      'Zero-Crossing Rate': 0.006,
      'Spectral Flux': 0.002,
      'MFCC-0 (Power)': 0.4,
      'MFCC-1 (Tilt)': 1.2,
      'MFCC-2 (Curvature)': 0.9,
      'MFCC-3 (High Freq)': 0.5,
    },
    trainingObservations: generateSyntheticNormalObservations(24, 0.142, 468.5),
    version: '1.2.0-baseline',
    createdAt: '2026-08-16T10:00:00Z',
    calibratedPercentile: 95,
  },
  {
    id: 'base-pump-b',
    machineId: 'mach-pump-b',
    machineName: 'Water Pump B (Centrifugal Slurry)',
    modelType: 'isolation_forest',
    sampleCount: 18,
    threshold: 0.60,
    featureMeans: {
      'RMS Energy': 0.215,
      'Spectral Centroid': 780.2,
      'Spectral Bandwidth': 910.4,
      'Spectral Rolloff': 1420.0,
      'Zero-Crossing Rate': 0.062,
      'Spectral Flux': 0.014,
      'MFCC-0 (Power)': -1.4,
      'MFCC-1 (Tilt)': 18.0,
      'MFCC-2 (Curvature)': -5.2,
      'MFCC-3 (High Freq)': 4.8,
    },
    featureStds: {
      'RMS Energy': 0.022,
      'Spectral Centroid': 55.0,
      'Spectral Bandwidth': 70.0,
      'Spectral Rolloff': 95.0,
      'Zero-Crossing Rate': 0.008,
      'Spectral Flux': 0.003,
      'MFCC-0 (Power)': 0.5,
      'MFCC-1 (Tilt)': 1.4,
      'MFCC-2 (Curvature)': 1.1,
      'MFCC-3 (High Freq)': 0.6,
    },
    trainingObservations: generateSyntheticNormalObservations(18, 0.215, 780.2),
    version: '1.0.0-baseline',
    createdAt: '2026-09-03T11:00:00Z',
    calibratedPercentile: 95,
  },
  {
    id: 'base-fan-c',
    machineId: 'mach-fan-c',
    machineName: 'Industrial Fan C (Exhaust Blower)',
    modelType: 'isolation_forest',
    sampleCount: 20,
    threshold: 0.55,
    featureMeans: {
      'RMS Energy': 0.168,
      'Spectral Centroid': 340.5,
      'Spectral Bandwidth': 520.0,
      'Spectral Rolloff': 740.0,
      'Zero-Crossing Rate': 0.042,
      'Spectral Flux': 0.007,
      'MFCC-0 (Power)': -1.8,
      'MFCC-1 (Tilt)': 12.5,
      'MFCC-2 (Curvature)': -6.8,
      'MFCC-3 (High Freq)': 2.4,
    },
    featureStds: {
      'RMS Energy': 0.018,
      'Spectral Centroid': 28.0,
      'Spectral Bandwidth': 42.0,
      'Spectral Rolloff': 55.0,
      'Zero-Crossing Rate': 0.005,
      'Spectral Flux': 0.001,
      'MFCC-0 (Power)': 0.3,
      'MFCC-1 (Tilt)': 1.1,
      'MFCC-2 (Curvature)': 0.8,
      'MFCC-3 (High Freq)': 0.4,
    },
    trainingObservations: generateSyntheticNormalObservations(20, 0.168, 340.5),
    version: '1.1.0-baseline',
    createdAt: '2026-09-19T08:30:00Z',
    calibratedPercentile: 95,
  },
  {
    id: 'base-comp-d',
    machineId: 'mach-comp-d',
    machineName: 'Compressor D (Rotary Screw 22kW)',
    modelType: 'isolation_forest',
    sampleCount: 26,
    threshold: 0.62,
    featureMeans: {
      'RMS Energy': 0.285,
      'Spectral Centroid': 1240.0,
      'Spectral Bandwidth': 1150.0,
      'Spectral Rolloff': 1850.0,
      'Zero-Crossing Rate': 0.088,
      'Spectral Flux': 0.019,
      'MFCC-0 (Power)': -0.9,
      'MFCC-1 (Tilt)': 21.4,
      'MFCC-2 (Curvature)': -4.1,
      'MFCC-3 (High Freq)': 6.2,
    },
    featureStds: {
      'RMS Energy': 0.024,
      'Spectral Centroid': 65.0,
      'Spectral Bandwidth': 80.0,
      'Spectral Rolloff': 110.0,
      'Zero-Crossing Rate': 0.009,
      'Spectral Flux': 0.004,
      'MFCC-0 (Power)': 0.4,
      'MFCC-1 (Tilt)': 1.5,
      'MFCC-2 (Curvature)': 1.0,
      'MFCC-3 (High Freq)': 0.7,
    },
    trainingObservations: generateSyntheticNormalObservations(26, 0.285, 1240.0),
    version: '1.2.0-baseline',
    createdAt: '2026-10-02T14:15:00Z',
    calibratedPercentile: 95,
  },
  {
    id: 'base-gearbox-e',
    machineId: 'mach-gearbox-e',
    machineName: 'Gearbox E (Helical Speed Reducer 30kW)',
    modelType: 'isolation_forest',
    sampleCount: 22,
    threshold: 0.58,
    featureMeans: {
      'RMS Energy': 0.198,
      'Spectral Centroid': 620.0,
      'Spectral Bandwidth': 740.0,
      'Spectral Rolloff': 1120.0,
      'Zero-Crossing Rate': 0.051,
      'Spectral Flux': 0.011,
      'MFCC-0 (Power)': -1.6,
      'MFCC-1 (Tilt)': 15.8,
      'MFCC-2 (Curvature)': -7.1,
      'MFCC-3 (High Freq)': 3.9,
    },
    featureStds: {
      'RMS Energy': 0.019,
      'Spectral Centroid': 38.0,
      'Spectral Bandwidth': 50.0,
      'Spectral Rolloff': 72.0,
      'Zero-Crossing Rate': 0.006,
      'Spectral Flux': 0.002,
      'MFCC-0 (Power)': 0.35,
      'MFCC-1 (Tilt)': 1.2,
      'MFCC-2 (Curvature)': 0.85,
      'MFCC-3 (High Freq)': 0.5,
    },
    trainingObservations: generateSyntheticNormalObservations(22, 0.198, 620.0),
    version: '1.0.0-baseline',
    createdAt: '2026-07-15T09:00:00Z',
    calibratedPercentile: 95,
  },
  {
    id: 'base-conveyor-f',
    machineId: 'mach-conveyor-f',
    machineName: 'Conveyor F (Belt Drive Pulley 15kW)',
    modelType: 'isolation_forest',
    sampleCount: 16,
    threshold: 0.54,
    featureMeans: {
      'RMS Energy': 0.135,
      'Spectral Centroid': 290.0,
      'Spectral Bandwidth': 440.0,
      'Spectral Rolloff': 620.0,
      'Zero-Crossing Rate': 0.032,
      'Spectral Flux': 0.006,
      'MFCC-0 (Power)': -2.3,
      'MFCC-1 (Tilt)': 10.9,
      'MFCC-2 (Curvature)': -9.0,
      'MFCC-3 (High Freq)': 1.9,
    },
    featureStds: {
      'RMS Energy': 0.014,
      'Spectral Centroid': 24.0,
      'Spectral Bandwidth': 35.0,
      'Spectral Rolloff': 48.0,
      'Zero-Crossing Rate': 0.004,
      'Spectral Flux': 0.001,
      'MFCC-0 (Power)': 0.3,
      'MFCC-1 (Tilt)': 1.0,
      'MFCC-2 (Curvature)': 0.7,
      'MFCC-3 (High Freq)': 0.3,
    },
    trainingObservations: generateSyntheticNormalObservations(16, 0.135, 290.0),
    version: '1.0.0-baseline',
    createdAt: '2026-08-05T12:00:00Z',
    calibratedPercentile: 95,
  },
  {
    id: 'base-piston-g',
    machineId: 'mach-piston-g',
    machineName: 'Hydraulic Piston Unit G (18.5kW)',
    modelType: 'isolation_forest',
    sampleCount: 20,
    threshold: 0.57,
    featureMeans: {
      'RMS Energy': 0.225,
      'Spectral Centroid': 580.0,
      'Spectral Bandwidth': 690.0,
      'Spectral Rolloff': 1050.0,
      'Zero-Crossing Rate': 0.048,
      'Spectral Flux': 0.012,
      'MFCC-0 (Power)': -1.5,
      'MFCC-1 (Tilt)': 16.5,
      'MFCC-2 (Curvature)': -6.0,
      'MFCC-3 (High Freq)': 3.5,
    },
    featureStds: {
      'RMS Energy': 0.021,
      'Spectral Centroid': 35.0,
      'Spectral Bandwidth': 48.0,
      'Spectral Rolloff': 68.0,
      'Zero-Crossing Rate': 0.006,
      'Spectral Flux': 0.002,
      'MFCC-0 (Power)': 0.35,
      'MFCC-1 (Tilt)': 1.3,
      'MFCC-2 (Curvature)': 0.9,
      'MFCC-3 (High Freq)': 0.5,
    },
    trainingObservations: generateSyntheticNormalObservations(20, 0.225, 580.0),
    version: '1.0.0-baseline',
    createdAt: '2026-09-26T16:00:00Z',
    calibratedPercentile: 95,
  },
];

// Initial demo analysis records
export const INITIAL_ANALYSES: AnalysisRecord[] = [
  {
    id: 'anal-101',
    machineId: 'mach-motor-a',
    machineName: 'Motor A (Induction 5.5kW)',
    timestamp: '2026-10-23T18:30:00Z',
    inputSource: 'synthetic_bench',
    filename: 'motorA_routine_shift1.wav',
    durationSeconds: 3.5,
    features: {
      rmsEnergy: 0.145,
      spectralCentroid: 472.1,
      spectralBandwidth: 618.0,
      spectralRolloff: 930.0,
      zeroCrossingRate: 0.039,
      spectralFlux: 0.009,
      mfcc: [-2.0, 14.1, -8.3, 3.0, 1.2, -0.8, 0.4, -0.2, 0.1, 0.0, -0.1, 0.0, 0.1],
    },
    rawScore: 0.44,
    displayScore: 28,
    threshold: 0.58,
    alertLevel: 'NORMAL',
    deviations: [],
    notes: 'Shift inspection sound recording. Acoustic spectrum fully consistent with normal baseline.',
  },
  {
    id: 'anal-102',
    machineId: 'mach-pump-b',
    machineName: 'Water Pump B (Centrifugal Slurry)',
    timestamp: '2026-10-23T21:15:00Z',
    inputSource: 'synthetic_bench',
    filename: 'pumpB_suction_flow_test.wav',
    durationSeconds: 4.0,
    features: {
      rmsEnergy: 0.278,
      spectralCentroid: 995.4,
      spectralBandwidth: 1180.0,
      spectralRolloff: 1850.0,
      zeroCrossingRate: 0.088,
      spectralFlux: 0.024,
      mfcc: [-0.8, 22.4, -2.1, 8.2, 3.1, -1.9, 1.4, -0.6, 0.3, -0.2, 0.1, 0.0, 0.1],
    },
    rawScore: 0.68,
    displayScore: 74,
    threshold: 0.60,
    alertLevel: 'ANOMALY',
    deviations: [
      {
        featureKey: 'RMS Energy',
        featureName: 'RMS Energy',
        measuredValue: 0.278,
        baselineMean: 0.215,
        baselineStd: 0.022,
        deviationSigma: 2.86,
        unit: 'V rms',
        severity: 'high',
        physicalMeaning: 'Total acoustic sound energy. Elevation suggests heavy friction, unbalance, or cavitation.',
      },
      {
        featureKey: 'Spectral Centroid',
        featureName: 'Spectral Centroid',
        measuredValue: 995.4,
        baselineMean: 780.2,
        baselineStd: 55.0,
        deviationSigma: 3.91,
        unit: 'Hz',
        severity: 'high',
        physicalMeaning: 'Center of mass of frequency spectrum. Upward shift indicates metallic grinding or cavitation hiss.',
      },
    ],
    notes: 'DEMO DATA: High frequency hiss detected during slurry recirculation.',
  },
  {
    id: 'anal-103',
    machineId: 'mach-comp-d',
    machineName: 'Compressor D (Rotary Screw 22kW)',
    timestamp: '2026-10-23T22:00:00Z',
    inputSource: 'synthetic_bench',
    filename: 'compD_high_load_acoustic.wav',
    durationSeconds: 3.8,
    features: {
      rmsEnergy: 0.342,
      spectralCentroid: 1240.0,
      spectralBandwidth: 1450.0,
      spectralRolloff: 2200.0,
      zeroCrossingRate: 0.112,
      spectralFlux: 0.035,
      mfcc: [-0.2, 28.5, 0.5, 11.4, 4.8, -2.4, 1.9, -0.8, 0.5, -0.1, 0.2, 0.0, 0.1],
    },
    rawScore: 0.76,
    displayScore: 88,
    threshold: 0.60,
    alertLevel: 'ANOMALY',
    deviations: [
      {
        featureKey: 'Spectral Centroid',
        featureName: 'Spectral Centroid',
        measuredValue: 1240.0,
        baselineMean: 620.0,
        baselineStd: 45.0,
        deviationSigma: 13.78,
        unit: 'Hz',
        severity: 'high',
        physicalMeaning: 'Severe high frequency acoustic excursion.',
      },
    ],
    notes: 'DEMO DATA: Unusual high pitched metallic whine observed on screw housing.',
  },
];

// Initial maintenance tickets
export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'maint-201',
    machineId: 'mach-comp-d',
    machineName: 'Compressor D (Rotary Screw 22kW)',
    date: '2026-10-23T22:10:00Z',
    associatedAnalysisId: 'anal-103',
    status: 'Inspection Pending',
    technicianName: 'Marcus Vance',
    technicianNotes: 'Dispatched to inspect compressor oil separator and drive belt after acoustic anomaly alert #anal-103.',
    maintenanceAction: 'Visual inspection & thermal scan scheduled for shift start.',
    partsReplaced: 'None yet',
    inspectionOutcome: 'Pending on-site evaluation',
    photos: [
      {
        id: 'p-maint-1',
        url: PRESET_THERMAL_SVG,
        caption: 'Thermography Evidence: 82.4°C Hotspot Detected on Drive-End Bearing Housing',
        category: 'thermal',
        timestamp: '2026-10-23T22:15:00Z',
      },
    ],
  },
  {
    id: 'maint-202',
    machineId: 'mach-pump-b',
    machineName: 'Water Pump B (Centrifugal Slurry)',
    date: '2026-10-23T21:30:00Z',
    associatedAnalysisId: 'anal-102',
    status: 'New Alert',
    technicianName: 'Suresh Patel',
    technicianNotes: 'Suction pressure dropped 0.4 bar coinciding with acoustic centroid rise.',
    maintenanceAction: 'Check suction strainer for gravel blockage.',
    partsReplaced: '',
    inspectionOutcome: 'Strainer cleanout recommended',
    photos: [
      {
        id: 'p-maint-2',
        url: PRESET_BEARING_DEFECT_SVG,
        caption: 'Inspection Finding: SKF 6205 Outer Race Spalling Wear Audit',
        category: 'defect',
        timestamp: '2026-10-23T21:40:00Z',
      },
    ],
  },
  {
    id: 'maint-203',
    machineId: 'mach-fan-c',
    machineName: 'Industrial Fan C (Exhaust Blower)',
    date: '2026-10-21T09:00:00Z',
    status: 'Inspection Completed',
    technicianName: 'Elena Rostova',
    technicianNotes: 'Routine quarterly acoustic audit. Sound level within nominal ±3dB range.',
    maintenanceAction: 'Lubricated pillow block bearings with NLGI 2 grease.',
    partsReplaced: 'Grease charge only',
    inspectionOutcome: 'No Issue Found — running smoothly',
  },
  {
    id: 'maint-204',
    machineId: 'mach-motor-a',
    machineName: 'Motor A (Induction 5.5kW)',
    date: '2026-10-15T14:30:00Z',
    status: 'Closed',
    technicianName: 'Marcus Vance',
    technicianNotes: 'Previous slight vibration reported; turned out to be loose foundation anchor nut.',
    maintenanceAction: 'Torqued anchor bolts to 85 Nm spec.',
    partsReplaced: 'M16 Lock washers',
    inspectionOutcome: 'Maintenance Completed — vibration eliminated',
  },
];

function generateSyntheticNormalObservations(count: number, baseRms: number, baseCentroid: number): number[][] {
  const obs: number[][] = [];
  for (let i = 0; i < count; i++) {
    const rms = baseRms + (Math.random() - 0.5) * 0.02;
    const centroid = baseCentroid + (Math.random() - 0.5) * 40;
    const bandwidth = centroid * 1.3 + (Math.random() - 0.5) * 30;
    const rolloff = centroid * 2.0 + (Math.random() - 0.5) * 50;
    const zcr = 0.04 + (Math.random() - 0.5) * 0.008;
    const flux = 0.009 + (Math.random() - 0.5) * 0.002;
    const mfcc0 = -2.0 + (Math.random() - 0.5) * 0.5;
    const mfcc1 = 14.0 + (Math.random() - 0.5) * 1.5;
    const mfcc2 = -8.0 + (Math.random() - 0.5) * 1.0;
    const mfcc3 = 3.0 + (Math.random() - 0.5) * 0.7;
    const mfcc4 = 1.0 + (Math.random() - 0.5) * 0.4;
    const mfcc5 = -0.5 + (Math.random() - 0.5) * 0.3;
    const mfcc6 = 0.3 + (Math.random() - 0.5) * 0.2;
    const mfcc7 = -0.1 + (Math.random() - 0.5) * 0.2;

    obs.push([rms, centroid, bandwidth, rolloff, zcr, flux, mfcc0, mfcc1, mfcc2, mfcc3, mfcc4, mfcc5, mfcc6, mfcc7]);
  }
  return obs;
}

export function initStorage(): void {
  if (typeof window === 'undefined') return;
  const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
    localStorage.setItem(STORAGE_KEYS.BASELINES, JSON.stringify(INITIAL_BASELINES));
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(INITIAL_ANALYSES));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(INITIAL_MAINTENANCE));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

export function getMachines(): Machine[] {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MACHINES);
    const list: Machine[] = raw ? JSON.parse(raw) : INITIAL_MACHINES;
    return list.map((m) => {
      if (!m.imageUrl && !m.photos?.length) {
        const seed = INITIAL_MACHINES.find((im) => im.id === m.id);
        if (seed?.imageUrl) {
          return { ...m, imageUrl: seed.imageUrl, photos: seed.photos };
        }
      }
      return m;
    });
  } catch {
    return INITIAL_MACHINES;
  }
}

export function saveMachine(machine: Machine): void {
  const current = getMachines();
  const idx = current.findIndex((m) => m.id === machine.id);
  if (idx >= 0) {
    current[idx] = machine;
  } else {
    current.unshift(machine);
  }
  localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(current));
}

export function getBaselines(): Baseline[] {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BASELINES);
    return raw ? JSON.parse(raw) : INITIAL_BASELINES;
  } catch {
    return INITIAL_BASELINES;
  }
}

export function saveBaseline(baseline: Baseline): void {
  const current = getBaselines();
  const idx = current.findIndex((b) => b.id === baseline.id);
  if (idx >= 0) {
    current[idx] = baseline;
  } else {
    current.unshift(baseline);
  }
  localStorage.setItem(STORAGE_KEYS.BASELINES, JSON.stringify(current));

  // Also link baseline to machine
  const machines = getMachines();
  const m = machines.find((mach) => mach.id === baseline.machineId);
  if (m) {
    m.baselineId = baseline.id;
    saveMachine(m);
  }
}

export function getBaselineForMachine(machineId: string): Baseline | undefined {
  const baselines = getBaselines();
  return baselines.find((b) => b.machineId === machineId);
}

export function getAnalyses(): AnalysisRecord[] {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANALYSES);
    return raw ? JSON.parse(raw) : INITIAL_ANALYSES;
  } catch {
    return INITIAL_ANALYSES;
  }
}

export function saveAnalysis(record: AnalysisRecord): void {
  const current = getAnalyses();
  current.unshift(record);
  localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(current));

  // Update machine status & latest score
  const machines = getMachines();
  const m = machines.find((mach) => mach.id === record.machineId);
  if (m) {
    m.latestAnomalyScore = record.rawScore;
    m.lastAnalysisTimestamp = record.timestamp;
    if (record.alertLevel === 'ANOMALY') {
      m.status = 'CRITICAL';
    } else if (record.alertLevel === 'REVIEW') {
      m.status = 'ATTENTION';
    } else {
      m.status = 'NORMAL';
    }
    saveMachine(m);
  }

  // If anomalous, automatically open a maintenance ticket if requested
  if (record.alertLevel === 'ANOMALY') {
    const maintRecords = getMaintenanceRecords();
    const existingTicket = maintRecords.find((t) => t.associatedAnalysisId === record.id);
    if (!existingTicket) {
      const newTicket: MaintenanceRecord = {
        id: `maint-${Date.now().toString().slice(-5)}`,
        machineId: record.machineId,
        machineName: record.machineName,
        date: record.timestamp,
        associatedAnalysisId: record.id,
        status: 'New Alert',
        technicianName: 'Unassigned',
        technicianNotes: `Acoustic anomaly detected (score ${record.rawScore} vs threshold ${record.threshold}). Inspection advised.`,
        maintenanceAction: 'Review evidence and dispatch technician',
        inspectionOutcome: 'Pending inspection',
      };
      saveMaintenanceRecord(newTicket);
    }
  }
}

export function getMaintenanceRecords(): MaintenanceRecord[] {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    const list: MaintenanceRecord[] = raw ? JSON.parse(raw) : INITIAL_MAINTENANCE;
    return list.map((rec) => {
      if (!rec.photos?.length) {
        const seed = INITIAL_MAINTENANCE.find((im) => im.id === rec.id);
        if (seed?.photos?.length) {
          return { ...rec, photos: seed.photos };
        }
      }
      return rec;
    });
  } catch {
    return INITIAL_MAINTENANCE;
  }
}

export function saveMaintenanceRecord(record: MaintenanceRecord): void {
  const current = getMaintenanceRecords();
  const idx = current.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    current[idx] = record;
  } else {
    current.unshift(record);
  }
  localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(current));
}

export function resetDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
  localStorage.setItem(STORAGE_KEYS.BASELINES, JSON.stringify(INITIAL_BASELINES));
  localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(INITIAL_ANALYSES));
  localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(INITIAL_MAINTENANCE));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}
