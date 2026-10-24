import * as THREE from 'three';

export type MachineModelId =
  | 'motor_pump'
  | 'axial_fan'
  | 'gearbox'
  | 'conveyor_pulley'
  | 'rotary_compressor'
  | 'reciprocating_piston';
export type VisualLayoutMode = 'pbr_realistic' | 'thermal_flir' | 'xray_hologram' | 'factory_cell' | 'exploded_view';

export interface PartDiagnosticInfo {
  id: string;
  name: string;
  category: string;
  status: 'NORMAL' | 'ATTENTION' | 'CRITICAL';
  tempC: number;
  vibrationRMS: string;
  acousticNote: string;
}

export interface ModelBuildResult {
  root: THREE.Group;
  rotatingParts: THREE.Object3D[];
  secondaryRotatingParts?: { obj: THREE.Object3D; ratio: number }[]; // For gear ratios or idlers
  explodedParts: { obj: THREE.Object3D; originalPos: THREE.Vector3; offsetDir: THREE.Vector3 }[];
  hotspotMesh?: THREE.Mesh;
  components: PartDiagnosticInfo[];
  defaultSelectedPart: PartDiagnosticInfo;
}

// Helper to create thermal or x-ray variants of materials
export function applyVisualLayoutToGroup(
  group: THREE.Group,
  layout: VisualLayoutMode,
  hasFault: boolean
) {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Store original material if not stored
      if (!child.userData.originalMaterial) {
        child.userData.originalMaterial = child.material;
      }

      const origMat = child.userData.originalMaterial as THREE.MeshStandardMaterial;
      const isCritical = child.userData.isCritical;
      const isBearing = child.userData.isBearing;
      const isRotating = child.userData.isRotating;

      if (layout === 'pbr_realistic') {
        child.material = origMat;
      } else if (layout === 'thermal_flir') {
        // FLIR Thermography heatmap colors
        let thermalColor = 0x2e1065; // Deep violet (cool 25-35°C)
        if (hasFault && (isCritical || isBearing)) {
          thermalColor = 0xff0033; // Intense red/magenta hot (85-95°C)
        } else if (isRotating || isBearing) {
          thermalColor = 0xf59e0b; // Warm amber (50-60°C)
        } else if (child.userData.isMotor) {
          thermalColor = 0xd946ef; // Mild warm purple (42°C)
        }

        child.material = new THREE.MeshStandardMaterial({
          color: thermalColor,
          roughness: 0.35,
          metalness: 0.2,
          emissive: hasFault && (isCritical || isBearing) ? 0x990011 : 0x110522,
          emissiveIntensity: hasFault && (isCritical || isBearing) ? 0.6 : 0.2,
        });
      } else if (layout === 'xray_hologram') {
        // Cyber translucent wireframe & glass x-ray
        const isCore = isRotating || isBearing;
        child.material = new THREE.MeshStandardMaterial({
          color: isCore ? (hasFault && isCritical ? 0xff0055 : 0x00f0ff) : 0x0284c7,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: isCore ? 0.85 : 0.25,
          wireframe: !isCore,
          emissive: isCore ? (hasFault && isCritical ? 0x660022 : 0x003344) : 0x001122,
        });
      } else if (layout === 'factory_cell' || layout === 'exploded_view') {
        // High-contrast clean PBR with subtle edge highlight
        child.material = origMat;
      }
    }
  });
}

// =========================================================================
// 1. MODEL: INDUCTION MOTOR & SLURRY PUMP
// =========================================================================
export function buildMotorPumpModel(isSoftwareGl: boolean, hasFault: boolean): ModelBuildResult {
  const root = new THREE.Group();
  const rotatingParts: THREE.Object3D[] = [];
  const explodedParts: { obj: THREE.Object3D; originalPos: THREE.Vector3; offsetDir: THREE.Vector3 }[] = [];

  // Materials
  const castIron = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.35 });
  const machinedSteel = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.92 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.45, metalness: 0.75 });
  const pumpCyan = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.55, metalness: 0.45 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 });
  const cowlMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5 });

  // Baseplate
  const baseplate = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 1.8), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.5 }));
  baseplate.position.set(0, -0.68, 0);
  baseplate.receiveShadow = !isSoftwareGl;
  root.add(baseplate);

  // Stator Housing
  const statorGroup = new THREE.Group();
  statorGroup.position.set(0, 0, 0);
  root.add(statorGroup);
  explodedParts.push({ obj: statorGroup, originalPos: statorGroup.position.clone(), offsetDir: new THREE.Vector3(0, 0, 0) });

  const statorGeo = new THREE.CylinderGeometry(0.75, 0.75, 1.8, 32);
  statorGeo.rotateZ(Math.PI / 2);
  const statorMesh = new THREE.Mesh(statorGeo, castIron);
  statorMesh.userData = { isMotor: true };
  statorGroup.add(statorMesh);

  // Fins
  const finGeo = new THREE.BoxGeometry(1.75, 0.04, 0.18);
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const fin = new THREE.Mesh(finGeo, castIron);
    fin.position.set(0, Math.cos(angle) * 0.78, Math.sin(angle) * 0.78);
    fin.rotation.x = angle;
    statorGroup.add(fin);
  }

  // Terminal box
  const tbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), castIron);
  tbox.position.set(0, 0.95, 0);
  statorGroup.add(tbox);

  // Copper coils
  const coilGeo = new THREE.TorusGeometry(0.62, 0.08, 12, 24);
  coilGeo.rotateY(Math.PI / 2);
  const coilFront = new THREE.Mesh(coilGeo, copper);
  coilFront.position.set(0.8, 0, 0);
  statorGroup.add(coilFront);

  // Front Endshield
  const frontShield = new THREE.Group();
  frontShield.position.set(0.95, 0, 0);
  root.add(frontShield);
  explodedParts.push({ obj: frontShield, originalPos: frontShield.position.clone(), offsetDir: new THREE.Vector3(0.9, 0, 0) });
  const fshieldMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.12, 24).rotateZ(Math.PI / 2), castIron);
  frontShield.add(fshieldMesh);

  // Rear Endshield & Cowl
  const rearShield = new THREE.Group();
  rearShield.position.set(-0.95, 0, 0);
  root.add(rearShield);
  explodedParts.push({ obj: rearShield, originalPos: rearShield.position.clone(), offsetDir: new THREE.Vector3(-0.9, 0, 0) });
  const rshieldMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.12, 24).rotateZ(Math.PI / 2), castIron);
  rearShield.add(rshieldMesh);

  const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.55, 24).rotateZ(Math.PI / 2), cowlMat);
  cowl.position.set(-0.35, 0, 0);
  rearShield.add(cowl);

  // Rotor & Continuous Shaft
  const shaftGroup = new THREE.Group();
  root.add(shaftGroup);
  rotatingParts.push(shaftGroup);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.4, 24).rotateZ(Math.PI / 2), machinedSteel);
  shaft.userData = { isRotating: true };
  shaftGroup.add(shaft);

  const rotorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.4, 24).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.8 }));
  rotorCore.userData = { isRotating: true };
  shaftGroup.add(rotorCore);

  // Drive-End Bearing (Critical Hotspot)
  const deBearing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 16, 24).rotateY(Math.PI / 2), bronze);
  deBearing.position.set(1.0, 0, 0);
  deBearing.userData = { isBearing: true, isCritical: true };
  shaftGroup.add(deBearing);

  // Fan Impeller on rear shaft
  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16).rotateZ(Math.PI / 2), cowlMat);
  fanHub.position.set(-1.45, 0, 0);
  fanHub.userData = { isRotating: true };
  shaftGroup.add(fanHub);
  for (let b = 0; b < 8; b++) {
    const bAngle = (b / 8) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.06), cowlMat);
    blade.position.set(-1.45, Math.cos(bAngle) * 0.42, Math.sin(bAngle) * 0.42);
    blade.rotation.x = bAngle + 0.35;
    blade.userData = { isRotating: true };
    shaftGroup.add(blade);
  }

  // Coupling
  const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.28, 20).rotateZ(Math.PI / 2), machinedSteel);
  coupling.position.set(1.4, 0, 0);
  coupling.userData = { isRotating: true };
  shaftGroup.add(coupling);

  // Pump Volute & Impeller
  const pumpGroup = new THREE.Group();
  pumpGroup.position.set(2.4, 0.05, 0);
  root.add(pumpGroup);
  explodedParts.push({ obj: pumpGroup, originalPos: pumpGroup.position.clone(), offsetDir: new THREE.Vector3(1.6, 0, 0) });

  const voluteGeo = new THREE.CylinderGeometry(0.85, 0.72, 0.5, 32).rotateZ(Math.PI / 2);
  const volute = new THREE.Mesh(voluteGeo, pumpCyan);
  volute.castShadow = !isSoftwareGl;
  pumpGroup.add(volute);

  // Discharge Flange (Top)
  const discharge = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.45, 18), pumpCyan);
  discharge.position.set(0, 0.95, 0);
  pumpGroup.add(discharge);

  // Suction Flange (Axial End)
  const suction = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 18).rotateZ(Math.PI / 2), pumpCyan);
  suction.position.set(0.42, 0, 0);
  pumpGroup.add(suction);

  // Components diagnostics metadata
  const components: PartDiagnosticInfo[] = [
    {
      id: 'de_bearing',
      name: 'Drive-End (DE) 6205 Bearing',
      category: 'Deep-Groove Ball Bearing',
      status: hasFault ? 'CRITICAL' : 'NORMAL',
      tempC: hasFault ? 78 : 42,
      vibrationRMS: hasFault ? '2.86g (Shock Pulses)' : '0.45g (Nominal)',
      acousticNote: hasFault ? 'Cage impact clicks at 995 Hz; localized race micro-spalling.' : 'Uniform acoustic hum with nominal friction profile.',
    },
    {
      id: 'pump_volute',
      name: 'Slurry Volute & Impeller',
      category: 'Centrifugal Hydraulic Assembly',
      status: 'NORMAL',
      tempC: 38,
      vibrationRMS: '0.62g (Flow Turbulence)',
      acousticNote: 'Continuous fluid flow signature; blade-pass harmonics nominal.',
    },
    {
      id: 'stator_fins',
      name: 'Cast Iron Stator Housing',
      category: 'Induction Frame & Windings',
      status: 'NORMAL',
      tempC: 45,
      vibrationRMS: '0.31g',
      acousticNote: 'Nominal 100/120Hz electrical magnetostriction humming.',
    },
    {
      id: 'jaw_coupling',
      name: 'Flexible Jaw Shaft Coupling',
      category: 'Mechanical Power Transmission',
      status: 'NORMAL',
      tempC: 41,
      vibrationRMS: '0.48g',
      acousticNote: 'Parallel and angular alignment within 0.05 mm tolerance.',
    },
  ];

  return {
    root,
    rotatingParts,
    explodedParts,
    hotspotMesh: deBearing,
    components,
    defaultSelectedPart: components[0],
  };
}

// =========================================================================
// 2. MODEL: INDUSTRIAL AXIAL VENTILATION BLOWER / HIGH-FLOW FAN
// =========================================================================
export function buildAxialFanModel(isSoftwareGl: boolean, hasFault: boolean): ModelBuildResult {
  const root = new THREE.Group();
  const rotatingParts: THREE.Object3D[] = [];
  const explodedParts: { obj: THREE.Object3D; originalPos: THREE.Vector3; offsetDir: THREE.Vector3 }[] = [];

  const housingOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5, metalness: 0.4 });
  const bladeAlloy = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.25, metalness: 0.88 });
  const wireSafety = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.7 });
  const motorDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.4 });

  // Base Mounting Stand with vibration dampener springs
  const baseGroup = new THREE.Group();
  root.add(baseGroup);

  const mountPlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.8), motorDark);
  mountPlate.position.set(0, -1.2, 0);
  baseGroup.add(mountPlate);

  // 4 Vibration Damper Spring Pucks
  for (let x = -0.9; x <= 0.9; x += 1.8) {
    for (let z = -0.6; z <= 0.6; z += 1.2) {
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12), bladeAlloy);
      spring.position.set(x, -1.05, z);
      baseGroup.add(spring);
    }
  }

  // Aerodynamic Venturi Bellmouth Outer Cowl (Cylindrical Shroud)
  const shroudGroup = new THREE.Group();
  root.add(shroudGroup);
  explodedParts.push({ obj: shroudGroup, originalPos: shroudGroup.position.clone(), offsetDir: new THREE.Vector3(0, 0, 1.2) });

  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.35, 0.8, 32, 1, true), housingOrange);
  shroud.rotation.x = Math.PI / 2;
  shroudGroup.add(shroud);

  // Inlet Flange & Outlet Flange Rings
  const flangeInlet = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 12, 32), housingOrange);
  flangeInlet.position.set(0, 0, 0.4);
  shroudGroup.add(flangeInlet);

  const flangeOutlet = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.08, 12, 32), housingOrange);
  flangeOutlet.position.set(0, 0, -0.4);
  shroudGroup.add(flangeOutlet);

  // Protective Wire Basket Safety Grill (Inlet)
  const grillGroup = new THREE.Group();
  grillGroup.position.set(0, 0, 0.42);
  shroudGroup.add(grillGroup);
  for (let r = 0.3; r <= 1.3; r += 0.3) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.015, 8, 24), wireSafety);
    grillGroup.add(ring);
  }
  for (let s = 0; s < 12; s++) {
    const angle = (s / 12) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.35, 0.02), wireSafety);
    spoke.position.set(Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0);
    spoke.rotation.z = angle + Math.PI / 2;
    grillGroup.add(spoke);
  }

  // Central Electric Drive Motor (Suspended inside duct)
  const motorGroup = new THREE.Group();
  motorGroup.position.set(0, 0, -0.2);
  root.add(motorGroup);
  explodedParts.push({ obj: motorGroup, originalPos: motorGroup.position.clone(), offsetDir: new THREE.Vector3(0, 0, -1.2) });

  const driveMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 24), motorDark);
  driveMotor.rotation.x = Math.PI / 2;
  driveMotor.userData = { isMotor: true };
  motorGroup.add(driveMotor);

  // 4 Rigid Struts suspending motor to shroud
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.12), motorDark);
    strut.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.85, 0);
    strut.rotation.z = angle + Math.PI / 2;
    motorGroup.add(strut);
  }

  // Rotating Assembly: Aerofoil Blades + Streamlined Nose Cone
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, 0, 0.15);
  root.add(rotorGroup);
  rotatingParts.push(rotorGroup);

  // Central Hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 24), bladeAlloy);
  hub.rotation.x = Math.PI / 2;
  hub.userData = { isRotating: true };
  rotorGroup.add(hub);

  // Aerodynamic Bullet Nose Cone
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 24), bladeAlloy);
  cone.position.set(0, 0, 0.35);
  cone.rotation.x = Math.PI / 2;
  cone.userData = { isRotating: true };
  rotorGroup.add(cone);

  // 7 Aerodynamic Curved Fan Blades
  for (let b = 0; b < 7; b++) {
    const bAngle = (b / 7) * Math.PI * 2;
    const bladeGroup = new THREE.Group();
    bladeGroup.rotation.z = bAngle;

    // Curved twisted aerofoil blade shape
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.82, 0.05), bladeAlloy);
    blade.position.set(0, 0.8, 0);
    blade.rotation.x = 0.45; // Pitch angle
    blade.userData = { isRotating: true, isCritical: hasFault && b === 0 };
    bladeGroup.add(blade);

    rotorGroup.add(bladeGroup);
  }

  // Hotspot / Critical Bearing indicator
  const fanBearing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 12, 20), bladeAlloy);
  fanBearing.position.set(0, 0, -0.05);
  fanBearing.userData = { isBearing: true, isCritical: true };
  rotorGroup.add(fanBearing);

  const components: PartDiagnosticInfo[] = [
    {
      id: 'aerofoil_blades',
      name: '7-Blade Aerofoil Impeller Array',
      category: 'Aerodynamic Cast Aluminum Blade Array',
      status: hasFault ? 'CRITICAL' : 'NORMAL',
      tempC: hasFault ? 64 : 34,
      vibrationRMS: hasFault ? '3.42g (Dynamic Unbalance)' : '0.38g (Nominal)',
      acousticNote: hasFault ? 'Severe 1X RPM blade-pass subharmonic rumble; unbalance or blade accumulation.' : 'Clean low-turbulence laminar airflow whistle.',
    },
    {
      id: 'drive_motor',
      name: 'Flange-Mounted TEFC Motor',
      category: 'In-Duct Induction Motor',
      status: 'NORMAL',
      tempC: 48,
      vibrationRMS: '0.45g',
      acousticNote: 'Motor core operating inside thermal design specs.',
    },
    {
      id: 'venturi_shroud',
      name: 'Heavy Aerodynamic Duct Bellmouth',
      category: 'Powder-Coated Steel Shroud',
      status: 'NORMAL',
      tempC: 30,
      vibrationRMS: '0.22g',
      acousticNote: 'Acoustic attenuation liner intact.',
    },
  ];

  return {
    root,
    rotatingParts,
    explodedParts,
    hotspotMesh: fanBearing,
    components,
    defaultSelectedPart: components[0],
  };
}

// =========================================================================
// 3. MODEL: HELICAL SPEED-REDUCTION INDUSTRIAL GEARBOX
// =========================================================================
export function buildGearboxModel(isSoftwareGl: boolean, hasFault: boolean): ModelBuildResult {
  const root = new THREE.Group();
  const rotatingParts: THREE.Object3D[] = [];
  const secondaryRotatingParts: { obj: THREE.Object3D; ratio: number }[] = [];
  const explodedParts: { obj: THREE.Object3D; originalPos: THREE.Vector3; offsetDir: THREE.Vector3 }[] = [];

  const castBlue = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.65, metalness: 0.45 });
  const steelGears = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.18, metalness: 0.95 });
  const brassParts = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.5 });

  // Lower Sump Housing (Bottom Half)
  const lowerHousing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 1.9), castBlue);
  lowerHousing.position.set(0, -0.55, 0);
  lowerHousing.receiveShadow = !isSoftwareGl;
  root.add(lowerHousing);

  // Stiffening Ribs on Lower Sump
  for (let r = -1.0; r <= 1.0; r += 0.5) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 2.05), castBlue);
    rib.position.set(r, -0.55, 0);
    root.add(rib);
  }

  // Upper Gearbox Cover (Top Half) - Exploded Target!
  const upperCover = new THREE.Group();
  upperCover.position.set(0, 0.45, 0);
  root.add(upperCover);
  explodedParts.push({ obj: upperCover, originalPos: upperCover.position.clone(), offsetDir: new THREE.Vector3(0, 1.4, 0) });

  const coverMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.9), castBlue);
  coverMesh.castShadow = !isSoftwareGl;
  upperCover.add(coverMesh);

  // Inspection Hatch Cover on Top
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 20), castBlue);
  hatch.position.set(0, 0.5, 0);
  upperCover.add(hatch);

  // Oil Level Sight Glass on Front Face
  const sightGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16).rotateX(Math.PI / 2), glassMat);
  sightGlass.position.set(0.6, -0.4, 0.96);
  root.add(sightGlass);

  const sightRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 10, 20), brassParts);
  sightRing.position.set(0.6, -0.4, 0.98);
  root.add(sightRing);

  // 1. High-Speed Pinion Shaft Assembly (Input)
  const pinionGroup = new THREE.Group();
  pinionGroup.position.set(-0.65, 0, 0);
  root.add(pinionGroup);
  rotatingParts.push(pinionGroup);

  const inputShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.7, 20).rotateX(Math.PI / 2), steelGears);
  inputShaft.userData = { isRotating: true };
  pinionGroup.add(inputShaft);

  // High-Speed Pinion Gear (Small 18-tooth gear)
  const pinionGear = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.7, 24).rotateX(Math.PI / 2), steelGears);
  pinionGear.userData = { isRotating: true, isCritical: hasFault };
  pinionGroup.add(pinionGear);

  // Helical tooth ridges on pinion
  for (let t = 0; t < 16; t++) {
    const angle = (t / 16) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.7), steelGears);
    tooth.position.set(Math.cos(angle) * 0.49, Math.sin(angle) * 0.49, 0);
    tooth.rotation.z = angle;
    tooth.rotation.y = 0.22; // Helical skew angle
    pinionGear.add(tooth);
  }

  // 2. Low-Speed Bull Gear Assembly (Output) - Meshes with Pinion!
  // Distance between shafts = 0.48 + 0.95 = 1.43
  const bullGroup = new THREE.Group();
  bullGroup.position.set(0.78, 0, 0);
  root.add(bullGroup);
  // Gear ratio is -0.35 (counter-rotates at 35% speed)
  secondaryRotatingParts.push({ obj: bullGroup, ratio: -0.35 });

  const outputShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.8, 24).rotateX(Math.PI / 2), steelGears);
  outputShaft.userData = { isRotating: true };
  bullGroup.add(outputShaft);

  // Large Bull Gear (Large 52-tooth gear)
  const bullGear = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.65, 32).rotateX(Math.PI / 2), steelGears);
  bullGear.userData = { isRotating: true };
  bullGroup.add(bullGear);

  for (let t = 0; t < 28; t++) {
    const angle = (t / 28) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.65), steelGears);
    tooth.position.set(Math.cos(angle) * 0.96, Math.sin(angle) * 0.96, 0);
    tooth.rotation.z = angle;
    tooth.rotation.y = -0.22; // Matching opposite helical skew angle
    bullGear.add(tooth);
  }

  // Bearing cartridge supports
  const bearingIn = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 12, 20), brassParts);
  bearingIn.position.set(-0.65, 0, 0.98);
  bearingIn.userData = { isBearing: true };
  root.add(bearingIn);

  const bearingOut = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.09, 12, 20), brassParts);
  bearingOut.position.set(0.78, 0, 0.98);
  bearingOut.userData = { isBearing: true };
  root.add(bearingOut);

  const components: PartDiagnosticInfo[] = [
    {
      id: 'pinion_gear',
      name: 'High-Speed Helical Drive Pinion',
      category: 'Carburized Alloy Steel Pinion (18T)',
      status: hasFault ? 'CRITICAL' : 'NORMAL',
      tempC: hasFault ? 82 : 46,
      vibrationRMS: hasFault ? '3.89g (Gearmesh Sidebands)' : '0.52g (Nominal)',
      acousticNote: hasFault ? 'Elevated Gearmesh Frequency (GMF) at 442 Hz with 1X modulation sidebands indicating tooth spalling.' : 'Crisp steady gear meshing hum with smooth oil dampening.',
    },
    {
      id: 'bull_gear',
      name: 'Precision Output Bull Gear',
      category: 'Forged Heavy Helical Wheel (52T)',
      status: 'NORMAL',
      tempC: 44,
      vibrationRMS: '0.46g',
      acousticNote: 'Tooth profile wear nominal, backlash measured within 0.12mm.',
    },
    {
      id: 'oil_sump',
      name: 'ISO VG 320 Oil Sump & Casing',
      category: 'Splash Lubrication Sump',
      status: 'NORMAL',
      tempC: 48,
      vibrationRMS: '0.24g',
      acousticNote: 'Oil level at nominal midpoint sight-glass mark.',
    },
  ];

  return {
    root,
    rotatingParts,
    secondaryRotatingParts,
    explodedParts,
    hotspotMesh: pinionGear,
    components,
    defaultSelectedPart: components[0],
  };
}

// =========================================================================
// 4. MODEL: CONTINUOUS HEAVY-DUTY BELT CONVEYOR DRIVE PULLEY
// =========================================================================
export function buildConveyorPulleyModel(isSoftwareGl: boolean, hasFault: boolean): ModelBuildResult {
  const root = new THREE.Group();
  const rotatingParts: THREE.Object3D[] = [];
  const secondaryRotatingParts: { obj: THREE.Object3D; ratio: number }[] = [];
  const explodedParts: { obj: THREE.Object3D; originalPos: THREE.Vector3; offsetDir: THREE.Vector3 }[] = [];

  const steelDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.4 });
  const rubberBelt = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, metalness: 0.05 });
  const machinedSteel = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.92 });
  const pillowBlockMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.6, metalness: 0.5 });
  const brassFitting = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.8 });

  // Structural Bed & Frame Rails
  const frameGroup = new THREE.Group();
  root.add(frameGroup);

  const leftChannel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.12), steelDark);
  leftChannel.position.set(0, -0.65, 1.1);
  frameGroup.add(leftChannel);

  const rightChannel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.12), steelDark);
  rightChannel.position.set(0, -0.65, -1.1);
  frameGroup.add(rightChannel);

  // Cross members
  for (let c = -2.0; c <= 2.0; c += 1.0) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 2.2), steelDark);
    cross.position.set(c, -0.7, 0);
    frameGroup.add(cross);
  }

  // 1. Main Head Drive Drum Pulley (Primary Rotating Assembly)
  const headPulleyGroup = new THREE.Group();
  headPulleyGroup.position.set(-1.4, 0, 0);
  root.add(headPulleyGroup);
  rotatingParts.push(headPulleyGroup);

  const driveShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.8, 24).rotateX(Math.PI / 2), machinedSteel);
  driveShaft.userData = { isRotating: true };
  headPulleyGroup.add(driveShaft);

  // Drum Cylinder with diamond rubber lagging texture
  const drumPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.9, 32).rotateX(Math.PI / 2), rubberBelt);
  drumPulley.userData = { isRotating: true, isCritical: hasFault };
  drumPulley.castShadow = !isSoftwareGl;
  headPulleyGroup.add(drumPulley);

  // Heavy Duty Pillow Block Spherical Roller Bearing Units (Left & Right)
  const pillowLeft = new THREE.Group();
  pillowLeft.position.set(-1.4, -0.15, 1.15);
  root.add(pillowLeft);
  explodedParts.push({ obj: pillowLeft, originalPos: pillowLeft.position.clone(), offsetDir: new THREE.Vector3(0, 0, 0.9) });

  const pbLeftMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.35), pillowBlockMat);
  pillowLeft.add(pbLeftMesh);
  const zerkLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1), brassFitting);
  zerkLeft.position.set(0, 0.3, 0);
  pillowLeft.add(zerkLeft);

  const pillowRight = new THREE.Group();
  pillowRight.position.set(-1.4, -0.15, -1.15);
  root.add(pillowRight);
  explodedParts.push({ obj: pillowRight, originalPos: pillowRight.position.clone(), offsetDir: new THREE.Vector3(0, 0, -0.9) });

  const pbRightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.35), pillowBlockMat);
  pillowRight.add(pbRightMesh);

  // 2. Troughing Idler Roller Sets (Train of 3 rollers)
  const idlerGroup = new THREE.Group();
  idlerGroup.position.set(0.6, 0.15, 0);
  root.add(idlerGroup);
  secondaryRotatingParts.push({ obj: idlerGroup, ratio: 1.8 });

  const centerIdler = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.0, 16).rotateX(Math.PI / 2), machinedSteel);
  idlerGroup.add(centerIdler);

  // Wing rollers (angled at 35 degrees)
  const wingLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16).rotateX(Math.PI / 2), machinedSteel);
  wingLeft.position.set(0, 0.15, 0.7);
  wingLeft.rotation.x = -0.35;
  idlerGroup.add(wingLeft);

  const wingRight = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16).rotateX(Math.PI / 2), machinedSteel);
  wingRight.position.set(0, 0.15, -0.7);
  wingRight.rotation.x = 0.35;
  idlerGroup.add(wingRight);

  // 3. Simulated Moving Conveyor Belt Loop
  const beltTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 1.8), rubberBelt);
  beltTop.position.set(0.4, 0.75, 0);
  root.add(beltTop);

  const beltBottom = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 1.8), rubberBelt);
  beltBottom.position.set(0.4, -0.75, 0);
  root.add(beltBottom);

  const beltWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.77, 1.85, 24, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), rubberBelt);
  beltWrap.position.set(-1.4, 0, 0);
  root.add(beltWrap);

  const components: PartDiagnosticInfo[] = [
    {
      id: 'head_pulley',
      name: 'Rubber Lagged Head Drive Drum',
      category: 'Diamond Rubber Lagging Pulley (Ø600mm)',
      status: hasFault ? 'CRITICAL' : 'NORMAL',
      tempC: hasFault ? 72 : 36,
      vibrationRMS: hasFault ? '2.95g (Belt Slip & Impact)' : '0.42g (Nominal)',
      acousticNote: hasFault ? 'High-frequency rubber squeal and stick-slip friction indicating drive drum tension loss.' : 'Even continuous rubber contact rumble.',
    },
    {
      id: 'pillow_bearing',
      name: 'Spherical Roller Pillow Block',
      category: 'Split Plummer Block Housing 22218',
      status: 'NORMAL',
      tempC: 42,
      vibrationRMS: '0.38g',
      acousticNote: 'Grease lubrication pressure positive, zero acoustic defect pulses.',
    },
    {
      id: 'troughing_idlers',
      name: '35° Troughing Idler Rollers',
      category: 'Triple Troughing Carry Set',
      status: 'NORMAL',
      tempC: 34,
      vibrationRMS: '0.30g',
      acousticNote: 'Smooth continuous rotation with balanced belt tracking.',
    },
  ];

  return {
    root,
    rotatingParts,
    secondaryRotatingParts,
    explodedParts,
    hotspotMesh: drumPulley,
    components,
    defaultSelectedPart: components[0],
  };
}

// =========================================================================
// FACTORY CELL SPATIAL CONTEXT BUILDER (For Layout 4)
// =========================================================================
export function buildFactoryCellEnvironment(scene: THREE.Scene, isSoftwareGl: boolean): THREE.Group {
  const cellGroup = new THREE.Group();
  cellGroup.name = 'FactoryCellEnvironment';

  // 1. Safety Boundary Striping (Yellow/Black Caution Line on Floor)
  const stripeCanvas = document.createElement('canvas');
  stripeCanvas.width = 256;
  stripeCanvas.height = 32;
  const sctx = stripeCanvas.getContext('2d')!;
  sctx.fillStyle = '#eab308'; // Warning yellow
  sctx.fillRect(0, 0, 256, 32);
  sctx.fillStyle = '#0f172a'; // Black/navy stripe
  for (let x = -32; x < 288; x += 32) {
    sctx.beginPath();
    sctx.moveTo(x, 0);
    sctx.lineTo(x + 20, 32);
    sctx.lineTo(x + 36, 32);
    sctx.lineTo(x + 16, 0);
    sctx.fill();
  }
  const stripeTex = new THREE.CanvasTexture(stripeCanvas);
  stripeTex.wrapS = THREE.RepeatWrapping;
  stripeTex.repeat.set(4, 1);

  const borderMat = new THREE.MeshBasicMaterial({ map: stripeTex });

  // Border lines around machine work area
  const borderFront = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.22), borderMat);
  borderFront.rotation.x = -Math.PI / 2;
  borderFront.position.set(0, -0.73, 2.2);
  cellGroup.add(borderFront);

  const borderBack = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.22), borderMat);
  borderBack.rotation.x = -Math.PI / 2;
  borderBack.position.set(0, -0.73, -2.2);
  cellGroup.add(borderBack);

  const borderLeft = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.22), borderMat);
  borderLeft.rotation.x = -Math.PI / 2;
  borderLeft.rotation.z = Math.PI / 2;
  borderLeft.position.set(-3.2, -0.73, 0);
  cellGroup.add(borderLeft);

  const borderRight = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.22), borderMat);
  borderRight.rotation.x = -Math.PI / 2;
  borderRight.rotation.z = Math.PI / 2;
  borderRight.position.set(3.2, -0.73, 0);
  cellGroup.add(borderRight);

  // 2. Electrical Inverter Drive Cabinet & Status Beacon
  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5 });
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.5), cabinetMat);
  cabinet.position.set(-3.6, 0.4, -1.2);
  cabinet.castShadow = !isSoftwareGl;
  cellGroup.add(cabinet);

  // Cabinet status screen
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), screenMat);
  screen.position.set(-3.19, 0.9, -1.2);
  screen.rotation.y = Math.PI / 2;
  cellGroup.add(screen);

  // Top Light Stack Beacon (Green Normal / Red Alarm)
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), cabinetMat);
  beaconBase.position.set(-3.6, 1.7, -1.2);
  cellGroup.add(beaconBase);

  const beaconGreen = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  beaconGreen.position.set(-3.6, 1.95, -1.2);
  cellGroup.add(beaconGreen);

  // 3. IoT Acoustic Sensor Puck with Animated Concentric Signal Ring
  const puckMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.8 });
  const sensorPuck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), puckMat);
  sensorPuck.position.set(1.2, 0.45, 0.4);
  cellGroup.add(sensorPuck);

  const ledDot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  ledDot.position.set(1.2, 0.5, 0.4);
  cellGroup.add(ledDot);

  // Cable conduit running to cabinet
  const conduitMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.8, 12).rotateZ(Math.PI / 2), conduitMat);
  conduit.position.set(-1.2, -0.72, -1.4);
  cellGroup.add(conduit);

  scene.add(cellGroup);
  return cellGroup;
}
