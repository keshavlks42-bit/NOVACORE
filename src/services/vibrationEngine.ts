import { VibrationPoint, VibrationSummary } from '../types';

/**
 * Generate synthetic tri-axial vibration readings for Demo Mode A.
 * Clearly labeled as SIMULATED DEMONSTRATION DATA.
 */
export function generateDemoVibrationData(
  hasAnomaly = false,
  numPoints = 60
): { points: VibrationPoint[]; summary: VibrationSummary } {
  const points: VibrationPoint[] = [];
  const baseFreq = 29.5; // ~1770 RPM motor
  let sumSq = 0;
  let peakVal = 0;

  const now = Date.now();
  const sampleIntervalMs = 50; // 20 Hz display rate

  for (let i = 0; i < numPoints; i++) {
    const t = (i * sampleIntervalMs) / 1000;
    const timeStr = new Date(now - (numPoints - i) * sampleIntervalMs).toLocaleTimeString();

    // Baseline vibration: 1X + 2X harmonics + mechanical noise floor
    let ax = 0.45 * Math.sin(2 * Math.PI * baseFreq * t) + (Math.random() - 0.5) * 0.15;
    let ay = 0.38 * Math.cos(2 * Math.PI * baseFreq * t) + (Math.random() - 0.5) * 0.12;
    let az = 0.25 * Math.sin(2 * Math.PI * (baseFreq * 2) * t) + (Math.random() - 0.5) * 0.10;

    // Inject transient anomaly spikes if enabled
    if (hasAnomaly && i > numPoints * 0.65 && i < numPoints * 0.85) {
      const shock = Math.sin((i - numPoints * 0.65) * 0.9) * 2.8;
      ax += shock * 1.8;
      ay += shock * 1.4;
      az += shock * 0.9;
    }

    const resultant = Math.sqrt(ax * ax + ay * ay + az * az);
    sumSq += resultant * resultant;
    if (resultant > peakVal) peakVal = resultant;

    points.push({
      timestamp: timeStr,
      accelX: Number(ax.toFixed(3)),
      accelY: Number(ay.toFixed(3)),
      accelZ: Number(az.toFixed(3)),
      resultant: Number(resultant.toFixed(3)),
    });
  }

  const rms = Math.sqrt(sumSq / numPoints);
  const crestFactor = peakVal / Math.max(0.01, rms);

  return {
    points,
    summary: {
      rms: Number(rms.toFixed(3)),
      peak: Number(peakVal.toFixed(3)),
      crestFactor: Number(crestFactor.toFixed(2)),
      sampleRateHz: 1000,
      isSimulated: true,
      notes: hasAnomaly
        ? 'DEMO DATA: High Crest Factor and amplitude excursion detected (Bearing / Impact transient signature).'
        : 'DEMO DATA: Normal vibration baseline within ISO 10816 Zone A/B smooth running limits.',
    },
  };
}

/**
 * Parse and validate an uploaded CSV file containing vibration sensor measurements.
 */
export function parseVibrationCsv(csvContent: string): {
  points: VibrationPoint[];
  summary: VibrationSummary;
  errors: string[];
} {
  const lines = csvContent.trim().split(/\r?\n/);
  const errors: string[] = [];

  if (lines.length < 5) {
    errors.push('CSV contains fewer than 5 rows. A meaningful vibration analysis requires at least 10 observations.');
    return { points: [], summary: { rms: 0, peak: 0, crestFactor: 0, isSimulated: false }, errors };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim().replace(/['"]/g, ''));

  // Detect column indices
  let timeIdx = headers.findIndex((h) => h.includes('time') || h.includes('date') || h.includes('timestamp'));
  let xIdx = headers.findIndex((h) => h === 'x' || h === 'accel_x' || h === 'ax' || h.includes('accel_x'));
  let yIdx = headers.findIndex((h) => h === 'y' || h === 'accel_y' || h === 'ay' || h.includes('accel_y'));
  let zIdx = headers.findIndex((h) => h === 'z' || h === 'accel_z' || h === 'az' || h.includes('accel_z'));
  let singleVibIdx = headers.findIndex((h) => h.includes('vib') || h.includes('velocity') || h.includes('amplitude'));

  if (xIdx === -1 && singleVibIdx === -1) {
    // Try simple positional assumptions if 2-4 numeric columns
    if (headers.length >= 2) {
      timeIdx = 0;
      xIdx = 1;
      if (headers.length >= 3) yIdx = 2;
      if (headers.length >= 4) zIdx = 3;
    } else {
      errors.push('CSV header must contain acceleration columns (e.g. timestamp, accel_x, accel_y, accel_z or vibration_mm_s).');
      return { points: [], summary: { rms: 0, peak: 0, crestFactor: 0, isSimulated: false }, errors };
    }
  }

  const points: VibrationPoint[] = [];
  let sumSq = 0;
  let peakVal = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;
    const parts = row.split(',').map((p) => p.trim());

    const timeStr = timeIdx >= 0 && parts[timeIdx] ? parts[timeIdx] : `Sample #${i}`;
    let ax = 0;
    let ay = 0;
    let az = 0;

    if (xIdx >= 0 && parts[xIdx]) {
      const parsedX = parseFloat(parts[xIdx]);
      if (!isNaN(parsedX)) ax = parsedX;
    }
    if (yIdx >= 0 && parts[yIdx]) {
      const parsedY = parseFloat(parts[yIdx]);
      if (!isNaN(parsedY)) ay = parsedY;
    }
    if (zIdx >= 0 && parts[zIdx]) {
      const parsedZ = parseFloat(parts[zIdx]);
      if (!isNaN(parsedZ)) az = parsedZ;
    }
    if (singleVibIdx >= 0 && parts[singleVibIdx]) {
      const parsedVib = parseFloat(parts[singleVibIdx]);
      if (!isNaN(parsedVib)) ax = parsedVib;
    }

    const resultant = Math.sqrt(ax * ax + ay * ay + az * az);
    sumSq += resultant * resultant;
    if (resultant > peakVal) peakVal = resultant;

    points.push({
      timestamp: timeStr,
      accelX: Number(ax.toFixed(4)),
      accelY: Number(ay.toFixed(4)),
      accelZ: Number(az.toFixed(4)),
      resultant: Number(resultant.toFixed(4)),
    });
  }

  if (points.length === 0) {
    errors.push('No valid numeric vibration readings were found in the uploaded CSV.');
    return { points: [], summary: { rms: 0, peak: 0, crestFactor: 0, isSimulated: false }, errors };
  }

  const rms = Math.sqrt(sumSq / points.length);
  const crestFactor = peakVal / Math.max(0.001, rms);

  return {
    points: points.slice(0, 300), // Limit display points for fast interactive charting
    summary: {
      rms: Number(rms.toFixed(3)),
      peak: Number(peakVal.toFixed(3)),
      crestFactor: Number(crestFactor.toFixed(2)),
      isSimulated: false,
      notes: `Imported ${points.length} genuine sensor readings. Physical interpretation depends on sensor sensitivity (mV/g), mounting rigidity, and RPM.`,
    },
    errors,
  };
}
