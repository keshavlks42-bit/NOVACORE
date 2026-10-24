/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MachinePhoto } from '../types';

/**
 * Procedural SVG data URLs for realistic industrial equipment pictures.
 * Self-contained, zero-latency, no external network requests or 404s.
 */

// 1. Heavy 3-Phase Induction Motor Photo
export const PRESET_MOTOR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="castIron" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="steelShaft" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="40%" stop-color="#f8fafc"/>
      <stop offset="70%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="terminalBox" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>

  <!-- Industrial backdrop -->
  <rect width="600" height="400" fill="url(#bgGrad)"/>
  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="0.8"/>
  </pattern>
  <rect width="600" height="400" fill="url(#grid)" opacity="0.6"/>

  <!-- Heavy Machine Mounting Base -->
  <rect x="120" y="270" width="360" height="35" rx="6" fill="#0f172a" stroke="#334155" stroke-width="2"/>
  <circle cx="160" cy="287" r="7" fill="#64748b"/>
  <circle cx="440" cy="287" r="7" fill="#64748b"/>

  <!-- Rotating Drive Shaft (Drive End) -->
  <rect x="420" y="185" width="120" height="32" rx="3" fill="url(#steelShaft)" stroke="#64748b"/>
  <rect x="460" y="195" width="40" height="6" rx="1" fill="#475569"/>

  <!-- Motor Stator Body -->
  <rect x="170" y="130" width="260" height="145" rx="14" fill="url(#castIron)" stroke="#64748b" stroke-width="2"/>

  <!-- Cooling Fins (12 ribs) -->
  ${Array.from({ length: 12 })
    .map(
      (_, i) => `
    <line x1="${200 + i * 18}" y1="125" x2="${200 + i * 18}" y2="280" stroke="#38bdf8" stroke-width="2.5" opacity="0.35"/>
    <line x1="${199 + i * 18}" y1="127" x2="${199 + i * 18}" y2="278" stroke="#0f172a" stroke-width="1.5"/>
  `
    )
    .join('')}

  <!-- Front Bearing End-Shield (DE) -->
  <path d="M 430 135 C 455 155, 455 245, 430 270 Z" fill="#334155" stroke="#64748b" stroke-width="2"/>
  <circle cx="440" cy="201" r="24" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>

  <!-- Triaxial Accelerometer Sensor Stud on DE Bearing -->
  <rect x="432" y="152" width="16" height="18" rx="2" fill="#0284c7" stroke="#38bdf8"/>
  <circle cx="440" cy="161" r="3.5" fill="#10b981"/>

  <!-- Rear Non-Drive End (NDE) & Cowling -->
  <path d="M 170 130 C 145 140, 145 260, 170 275 Z" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <rect x="135" y="145" width="35" height="115" rx="4" fill="#1e293b" stroke="#475569"/>
  <!-- Cowl Grill Slits -->
  ${Array.from({ length: 6 })
    .map(
      (_, j) => `
    <line x1="145" y1="${160 + j * 15}" x2="160" y2="${160 + j * 15}" stroke="#0f172a" stroke-width="3"/>
  `
    )
    .join('')}

  <!-- Terminal Connection Box -->
  <rect x="250" y="80" width="100" height="52" rx="4" fill="url(#terminalBox)" stroke="#64748b" stroke-width="1.8"/>
  <!-- Cable Gland -->
  <rect x="335" y="96" width="22" height="20" rx="2" fill="#d97706" stroke="#b45309"/>
  <circle cx="346" cy="106" r="4" fill="#0f172a"/>

  <!-- Spec Plate / Nameplate -->
  <rect x="255" y="190" width="70" height="35" rx="2" fill="#cbd5e1" stroke="#94a3b8"/>
  <line x1="260" y1="198" x2="315" y2="198" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="260" y1="205" x2="310" y2="205" stroke="#475569" stroke-width="1"/>
  <line x1="260" y1="212" x2="295" y2="212" stroke="#475569" stroke-width="1"/>

  <!-- Telemetry Badge Overlay -->
  <g transform="translate(20, 20)">
    <rect width="180" height="42" rx="8" fill="#090d16" fill-opacity="0.85" stroke="#0e7490" stroke-width="1.2"/>
    <circle cx="18" cy="21" r="5" fill="#10b981"/>
    <text x="32" y="19" fill="#f8fafc" font-size="11" font-weight="bold" font-family="sans-serif">3-PHASE INDUCTION</text>
    <text x="32" y="32" fill="#38bdf8" font-size="9" font-family="monospace">5.5 kW • 1475 RPM</text>
  </g>
</svg>
`)}`;

// 2. Centrifugal Slurry Pump Photo
export const PRESET_PUMP_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
    <linearGradient id="metalFlange" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>

  <rect width="600" height="400" fill="#090d16"/>
  <!-- Heavy Bedplate -->
  <rect x="80" y="290" width="440" height="35" rx="6" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>

  <!-- Spiral Volute Casing -->
  <path d="M 280 280 C 160 280, 140 160, 240 100 C 350 50, 420 120, 420 220 C 420 280, 360 280, 280 280 Z" fill="url(#pumpGrad)" stroke="#38bdf8" stroke-width="2"/>

  <!-- Discharge Pipe (Top Vertical) -->
  <rect x="340" y="50" width="60" height="80" fill="url(#pumpGrad)" stroke="#0284c7"/>
  <!-- Top Flange -->
  <rect x="325" y="40" width="90" height="18" rx="4" fill="url(#metalFlange)" stroke="#475569"/>
  <!-- Flange Bolt Holes -->
  <circle cx="340" cy="49" r="3.5" fill="#0f172a"/>
  <circle cx="370" cy="49" r="3.5" fill="#0f172a"/>
  <circle cx="400" cy="49" r="3.5" fill="#0f172a"/>

  <!-- Axial Suction Pipe (Center Horizontal) -->
  <circle cx="280" cy="190" r="65" fill="#0369a1" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="280" cy="190" r="45" fill="#0f172a" stroke="#64748b" stroke-width="2"/>
  <!-- Impeller Eye -->
  <circle cx="280" cy="190" r="18" fill="#d97706"/>

  <!-- Bearing Housing Bracket -->
  <rect x="130" y="195" width="100" height="85" rx="6" fill="#1e293b" stroke="#334155"/>
  <rect x="80" y="225" width="60" height="25" fill="#cbd5e1" stroke="#64748b"/>

  <!-- Telemetry Badge -->
  <g transform="translate(20, 20)">
    <rect width="180" height="42" rx="8" fill="#090d16" fill-opacity="0.85" stroke="#0284c7" stroke-width="1.2"/>
    <circle cx="18" cy="21" r="5" fill="#38bdf8"/>
    <text x="32" y="19" fill="#f8fafc" font-size="11" font-weight="bold" font-family="sans-serif">CENTRIFUGAL PUMP</text>
    <text x="32" y="32" fill="#38bdf8" font-size="9" font-family="monospace">Slurry Volute • 2900 RPM</text>
  </g>
</svg>
`)}`;

// 3. Thermal Infrared Hotspot Scan Photo (FLIR-style ironbow palette)
export const PRESET_THERMAL_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <radialGradient id="hotspotGrad" cx="68%" cy="52%" r="35%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#fef08a"/>
      <stop offset="45%" stop-color="#f97316"/>
      <stop offset="70%" stop-color="#dc2626"/>
      <stop offset="90%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>
  </defs>

  <rect width="600" height="400" fill="#070b14"/>

  <!-- Machine Thermal Outline -->
  <rect x="160" y="130" width="280" height="150" rx="16" fill="#1e1b4b" opacity="0.8"/>
  <rect x="420" y="180" width="90" height="40" fill="#312e81"/>

  <!-- Intense Hotspot on DE Bearing -->
  <circle cx="410" cy="205" r="95" fill="url(#hotspotGrad)"/>

  <!-- Thermal Crosshair Target -->
  <circle cx="410" cy="205" r="28" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="410" y1="170" x2="410" y2="240" stroke="#ffffff" stroke-width="1.5"/>
  <line x1="375" y1="205" x2="445" y2="205" stroke="#ffffff" stroke-width="1.5"/>
  <rect x="420" y="175" width="80" height="22" rx="4" fill="#000000" fill-opacity="0.85"/>
  <text x="426" y="190" fill="#f43f5e" font-size="12" font-family="monospace" font-weight="bold">82.4°C [!]</text>

  <!-- Cold ambient area -->
  <rect x="180" y="150" width="70" height="20" rx="4" fill="#000000" fill-opacity="0.85"/>
  <text x="186" y="164" fill="#38bdf8" font-size="10" font-family="monospace">38.2°C</text>

  <!-- FLIR Color Scale Bar (Right Edge) -->
  <g transform="translate(560, 60)">
    <defs>
      <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="25%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#f97316"/>
        <stop offset="75%" stop-color="#dc2626"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
    </defs>
    <rect width="18" height="280" rx="4" fill="url(#barGrad)"/>
    <text x="-40" y="15" fill="#ffffff" font-size="10" font-family="monospace">90°C</text>
    <text x="-40" y="145" fill="#f97316" font-size="10" font-family="monospace">60°C</text>
    <text x="-40" y="275" fill="#38bdf8" font-size="10" font-family="monospace">25°C</text>
  </g>

  <!-- Badge -->
  <g transform="translate(20, 20)">
    <rect width="210" height="42" rx="8" fill="#090d16" fill-opacity="0.9" stroke="#f43f5e" stroke-width="1.2"/>
    <circle cx="18" cy="21" r="5" fill="#f43f5e"/>
    <text x="32" y="19" fill="#f8fafc" font-size="11" font-weight="bold" font-family="sans-serif">THERMOGRAPHY INSPECTION</text>
    <text x="32" y="32" fill="#f43f5e" font-size="9" font-family="monospace">Drive-End Friction Hotspot</text>
  </g>
</svg>
`)}`;

// 4. Ball Bearing Disassembly & Spalling Defect Photo
export const PRESET_BEARING_DEFECT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <radialGradient id="metalRing" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="85%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#334155"/>
    </radialGradient>
  </defs>

  <rect width="600" height="400" fill="#0b0f19"/>
  <!-- Inspection bench surface -->
  <rect x="50" y="330" width="500" height="40" rx="4" fill="#1e293b" stroke="#334155"/>

  <!-- Outer Raceway -->
  <circle cx="300" cy="200" r="140" fill="none" stroke="url(#metalRing)" stroke-width="36"/>
  <!-- Inner Raceway -->
  <circle cx="300" cy="200" r="70" fill="none" stroke="url(#metalRing)" stroke-width="28"/>

  <!-- Steel Ball Bearings -->
  ${[0, 45, 90, 135, 180, 225, 270, 315]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x = 300 + Math.cos(rad) * 105;
      const y = 200 + Math.sin(rad) * 105;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>`;
    })
    .join('')}

  <!-- Defect Spalling Callout at Top Ball -->
  <circle cx="300" cy="95" r="26" fill="none" stroke="#f43f5e" stroke-width="3" stroke-dasharray="4 2"/>
  <path d="M 292 90 Q 300 98 308 92 Q 305 102 295 101 Z" fill="#991b1b"/>
  <!-- Annotation pointer -->
  <line x1="325" y1="80" x2="430" y2="50" stroke="#f43f5e" stroke-width="2"/>
  <rect x="425" y="35" width="150" height="32" rx="6" fill="#090d16" stroke="#f43f5e" stroke-width="1.2"/>
  <text x="435" y="49" fill="#f8fafc" font-size="10" font-weight="bold" font-family="sans-serif">Outer Race Spalling</text>
  <text x="435" y="61" fill="#f43f5e" font-size="9" font-family="monospace">Micro-crack fatigue</text>

  <!-- Badge -->
  <g transform="translate(20, 20)">
    <rect width="180" height="42" rx="8" fill="#090d16" fill-opacity="0.9" stroke="#f43f5e" stroke-width="1.2"/>
    <circle cx="18" cy="21" r="5" fill="#f43f5e"/>
    <text x="32" y="19" fill="#f8fafc" font-size="11" font-weight="bold" font-family="sans-serif">DEFECT AUDIT PHOTO</text>
    <text x="32" y="32" fill="#fda4af" font-size="9" font-family="monospace">SKF 6205 Ball Bearing</text>
  </g>
</svg>
`)}`;

// 5. Helical Speed-Reduction Gearbox Photo
export const PRESET_GEARBOX_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="gearboxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="60%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="metalPinion" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="#090d16"/>
  <!-- Baseplate & mounting feet -->
  <rect x="80" y="300" width="440" height="28" rx="4" fill="#0f172a" stroke="#334155" stroke-width="2"/>
  <!-- Cast iron casing with stiffener ribs -->
  <rect x="120" y="140" width="360" height="160" rx="12" fill="url(#gearboxGrad)" stroke="#3b82f6" stroke-width="1.5"/>
  <rect x="180" y="140" width="16" height="160" fill="#172554"/>
  <rect x="280" y="140" width="16" height="160" fill="#172554"/>
  <rect x="380" y="140" width="16" height="160" fill="#172554"/>
  <!-- Oil sight glass -->
  <circle cx="210" cy="240" r="18" fill="#38bdf8" fill-opacity="0.6" stroke="#d97706" stroke-width="3"/>
  <circle cx="210" cy="240" r="10" fill="#f59e0b" fill-opacity="0.8"/>
  <line x1="195" y1="240" x2="225" y2="240" stroke="#b45309" stroke-width="1.5"/>
  <!-- High-speed shaft & Low-speed shaft -->
  <rect x="50" y="180" width="70" height="32" rx="3" fill="url(#metalPinion)"/>
  <rect x="480" y="220" width="80" height="44" rx="4" fill="url(#metalPinion)"/>
  <!-- Inspection Hatch -->
  <rect x="230" y="115" width="140" height="25" rx="3" fill="#1e293b" stroke="#64748b"/>
  <circle cx="250" cy="127" r="3.5" fill="#94a3b8"/>
  <circle cx="350" cy="127" r="3.5" fill="#94a3b8"/>
  <!-- Badge -->
  <g transform="translate(20, 20)">
    <rect width="220" height="42" rx="8" fill="#090d16" fill-opacity="0.9" stroke="#3b82f6" stroke-width="1.2"/>
    <circle cx="18" cy="21" r="5" fill="#3b82f6"/>
    <text x="32" y="19" fill="#f8fafc" font-size="11" font-weight="bold" font-family="sans-serif">HELICAL SPEED GEARBOX</text>
    <text x="32" y="32" fill="#93c5fd" font-size="9" font-family="monospace">Ratio 3.5:1 • 30 kW Nominal</text>
  </g>
</svg>
`)}`;

// 6. Rotary Screw Compressor Photo
export const PRESET_COMPRESSOR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="60%" stop-color="#075985"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="#090d16"/>
  <!-- Base Skid -->
  <rect x="70" y="310" width="460" height="30" rx="4" fill="#0f172a" stroke="#334155" stroke-width="2"/>
  <!-- Compressor Main Airend -->
  <rect x="110" y="160" width="230" height="150" rx="10" fill="url(#compGrad)" stroke="#38bdf8" stroke-width="1.5"/>
  <!-- Intermeshing Screw Rotor Visual Ribs -->
  ${Array.from({ length: 8 })
    .map(
      (_, i) => `
    <path d="M ${140 + i * 24} 175 Q ${150 + i * 24} 230 ${140 + i * 24} 290" fill="none" stroke="#38bdf8" stroke-width="2.5" opacity="0.4"/>
  `
    )
    .join('')}
  <!-- Oil Separator Accumulator Vessel (Vertical Cylinder) -->
  <rect x="370" y="120" width="130" height="190" rx="20" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.8"/>
  <circle cx="435" cy="180" r="16" fill="#0f172a" stroke="#f59e0b" stroke-width="2"/>
  <line x1="435" y1="180" x2="445" y2="175" stroke="#ef4444" stroke-width="2"/>
  <!-- Interconnecting Braided Hose -->
  <path d="M 340 210 C 370 210, 350 250, 370 250" fill="none" stroke="#94a3b8" stroke-width="6" stroke-dasharray="3 2"/>
  <!-- Intake Air Filter Canister -->
  <rect x="170" y="90" width="75" height="70" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <!-- Badge -->
  <g transform="translate(20, 20)">
    <rect width="230" height="42" rx="8" fill="#090d16" fill-opacity="0.9" stroke="#0284c7" stroke-width="1.2"/>
    <circle cx="18" cy="21" r="5" fill="#0284c7"/>
    <text x="32" y="19" fill="#f8fafc" font-size="11" font-weight="bold" font-family="sans-serif">ROTARY SCREW COMPRESSOR</text>
    <text x="32" y="32" fill="#7dd3fc" font-size="9" font-family="monospace">22 kW • 8.5 Bar Continuous</text>
  </g>
</svg>
`)}`;

// 7. Industrial Heavy Belt Conveyor Drive Photo
export const PRESET_CONVEYOR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#090d16"/>
  <!-- Structural Steel Truss -->
  <rect x="60" y="270" width="480" height="24" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
  <!-- Head Pulley Drum (Large Cylinder) -->
  <circle cx="180" cy="220" r="75" fill="#111827" stroke="#64748b" stroke-width="3"/>
  <circle cx="180" cy="220" r="30" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
  <circle cx="180" cy="220" r="10" fill="#cbd5e1"/>
  <!-- Diamond Rubber Lagging Texture on Drum -->
  <path d="M 125 190 L 150 250 M 145 170 L 190 260 M 170 160 L 210 255 M 195 160 L 235 240" stroke="#f59e0b" stroke-width="1.5" opacity="0.4"/>
  <!-- Continuous Vulcanized Conveyor Belt -->
  <path d="M 180 145 L 530 145 M 180 295 L 530 295" stroke="#111827" stroke-width="14" stroke-linecap="round"/>
  <!-- Pillow Block Bearings with Grease Zerk -->
  <rect x="150" y="240" width="60" height="50" rx="6" fill="#0369a1" stroke="#38bdf8" stroke-width="1.5"/>
  <circle cx="180" cy="235" r="4" fill="#d97706"/>
  <!-- Troughing Idler Sets -->
  <line x1="330" y1="155" x2="330" y2="285" stroke="#475569" stroke-width="8"/>
  <circle cx="330" cy="170" r="14" fill="#94a3b8"/>
  <line x1="450" y1="155" x2="450" y2="285" stroke="#475569" stroke-width="8"/>
  <circle cx="450" cy="170" r="14" fill="#94a3b8"/>
  <!-- Badge -->
  <g transform="translate(20, 20)">
    <rect width="220" height="42" rx="8" fill="#090d16" fill-opacity="0.9" stroke="#f59e0b" stroke-width="1.2"/>
    <circle cx="18" cy="21" r="5" fill="#f59e0b"/>
    <text x="32" y="19" fill="#f8fafc" font-size="11" font-weight="bold" font-family="sans-serif">BELT CONVEYOR DRIVE</text>
    <text x="32" y="32" fill="#fde68a" font-size="9" font-family="monospace">15 kW • Ø600mm Drum Pulley</text>
  </g>
</svg>
`)}`;

// 8. Industrial Axial Ventilation Blower Photo
export const PRESET_FAN_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#090d16"/>
  <!-- Heavy mounting base with springs -->
  <rect x="140" y="320" width="320" height="24" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.8"/>
  <circle cx="190" cy="310" r="12" fill="#94a3b8"/>
  <circle cx="410" cy="310" r="12" fill="#94a3b8"/>
  <!-- Duct Cowl / Shroud Cylinder -->
  <circle cx="300" cy="190" r="120" fill="#1e293b" stroke="#ea580c" stroke-width="4"/>
  <!-- Center Bullet Hub -->
  <circle cx="300" cy="190" r="38" fill="#d1d5db" stroke="#64748b" stroke-width="2"/>
  <!-- 7 Aerofoil Twisted Blades -->
  ${[0, 51.4, 102.8, 154.2, 205.7, 257.1, 308.5]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x2 = 300 + Math.cos(rad) * 115;
      const y2 = 190 + Math.sin(rad) * 115;
      return `<path d="M 300 190 Q ${300 + Math.cos(rad + 0.3) * 60} ${190 + Math.sin(rad + 0.3) * 60} ${x2} ${y2}" stroke="#cbd5e1" stroke-width="12" stroke-linecap="round"/>`;
    })
    .join('')}
  <!-- Wire safety basket grill rings -->
  <circle cx="300" cy="190" r="60" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="300" cy="190" r="90" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="4 3"/>
  <!-- Badge -->
  <g transform="translate(20, 20)">
    <rect width="220" height="42" rx="8" fill="#090d16" fill-opacity="0.9" stroke="#ea580c" stroke-width="1.2"/>
    <circle cx="18" cy="21" r="5" fill="#ea580c"/>
    <text x="32" y="19" fill="#f8fafc" font-size="11" font-weight="bold" font-family="sans-serif">AXIAL EXHAUST BLOWER</text>
    <text x="32" y="32" fill="#fdba74" font-size="9" font-family="monospace">11 kW • 7-Blade Aerofoil</text>
  </g>
</svg>
`)}`;

/**
 * Standard Presets Catalog for Fast Selection
 */
export const INDUSTRIAL_PHOTO_PRESETS = [
  {
    id: 'preset-motor',
    name: 'Electric Induction Motor 5.5kW',
    category: 'overall' as const,
    url: PRESET_MOTOR_SVG,
    caption: 'Front drive-end profile with 16 cooling ribs and junction box.',
  },
  {
    id: 'preset-pump',
    name: 'Centrifugal Slurry Volute Pump',
    category: 'overall' as const,
    url: PRESET_PUMP_SVG,
    caption: 'Heavy slurry pump volute with axial suction inlet.',
  },
  {
    id: 'preset-gearbox',
    name: 'Helical Speed-Reduction Gearbox 30kW',
    category: 'overall' as const,
    url: PRESET_GEARBOX_SVG,
    caption: 'Split-case helical gear reducer with oil level sight glass.',
  },
  {
    id: 'preset-compressor',
    name: 'Twin-Screw Rotary Compressor 22kW',
    category: 'overall' as const,
    url: PRESET_COMPRESSOR_SVG,
    caption: 'Oil-injected twin-screw compressor airend and separator vessel.',
  },
  {
    id: 'preset-conveyor',
    name: 'Heavy-Duty Conveyor Head Pulley 15kW',
    category: 'overall' as const,
    url: PRESET_CONVEYOR_SVG,
    caption: 'Rubber-lagged Ø600mm drive drum with plummer block bearings.',
  },
  {
    id: 'preset-fan',
    name: 'Axial Ventilation Blower 11kW',
    category: 'overall' as const,
    url: PRESET_FAN_SVG,
    caption: '7-blade aerofoil impeller in aerodynamic bellmouth duct.',
  },
  {
    id: 'preset-thermal',
    name: 'FLIR Thermal Hotspot Scan (82°C)',
    category: 'thermal' as const,
    url: PRESET_THERMAL_SVG,
    caption: 'Thermography scan showing bearing friction heat at Drive-End.',
  },
  {
    id: 'preset-defect',
    name: 'Bearing Race Spalling Wear Audit',
    category: 'defect' as const,
    url: PRESET_BEARING_DEFECT_SVG,
    caption: 'Disassembled 6205 bearing showing outer raceway spalling and pit marks.',
  },
];

/**
 * Client-side image compressor & Data URL converter
 * Automatically downscales large phone camera pictures so they store cleanly in localStorage.
 */
export async function fileToOptimizedDataUrl(
  file: File,
  maxWidth = 900,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // Fallback to raw data url if canvas rendering fails
        resolve(readerEvent.target?.result as string);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
