import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  RotateCcw,
  Layers,
  Flame,
  Volume2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Eye,
  Activity,
  Play,
  Pause,
  Info,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Wind,
  Cog,
  Workflow,
  Sparkles,
  Camera,
  Boxes,
  Compass,
} from 'lucide-react';
import {
  MachineModelId,
  VisualLayoutMode,
  PartDiagnosticInfo,
  buildMotorPumpModel,
  buildAxialFanModel,
  buildGearboxModel,
  buildConveyorPulleyModel,
  buildFactoryCellEnvironment,
  applyVisualLayoutToGroup,
} from '../services/procedural3DModels';

interface Machine3DViewerProps {
  machineName?: string;
  hasFault?: boolean;
}

const AVAILABLE_MODELS: {
  id: MachineModelId;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}[] = [
  {
    id: 'motor_pump',
    label: 'Motor & Slurry Pump',
    category: 'Induction Drive + Centrifugal Volute',
    icon: Cpu,
    tag: '5.5 kW Unit',
  },
  {
    id: 'axial_fan',
    label: 'Industrial Axial Blower',
    category: 'High-Flow Aerodynamic Ventilation',
    icon: Wind,
    tag: '7-Blade Aerofoil',
  },
  {
    id: 'gearbox',
    label: 'Helical Speed Gearbox',
    category: 'Twin-Shaft Speed Reduction Box',
    icon: Cog,
    tag: '18T/52T Mesh',
  },
  {
    id: 'conveyor_pulley',
    label: 'Belt Conveyor Drive',
    category: 'Heavy Material Transport Pulley',
    icon: Workflow,
    tag: 'Ø600 Drum',
  },
];

const VISUAL_LAYOUTS: {
  id: VisualLayoutMode;
  label: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: 'pbr_realistic',
    label: 'PBR Realistic',
    desc: 'Metallic cast-iron, powder coat, & studio lighting',
    badge: 'Standard PBR',
  },
  {
    id: 'thermal_flir',
    label: 'FLIR Thermography',
    desc: 'Acoustic friction heatmap gradient (20°C - 95°C)',
    badge: 'Thermal Heatmap',
  },
  {
    id: 'xray_hologram',
    label: 'Cyber X-Ray',
    desc: 'Transparent casing & neon wireframe internals',
    badge: 'Holographic',
  },
  {
    id: 'factory_cell',
    label: 'Factory Floor Cell',
    desc: 'Safety perimeter, drive cabinet, & IoT sensor pucks',
    badge: 'Spatial Layout',
  },
  {
    id: 'exploded_view',
    label: 'Exploded Blueprint',
    desc: 'Precision maintenance disassembly breakdown',
    badge: 'Assembly Guide',
  },
];

export const Machine3DViewer: React.FC<Machine3DViewerProps> = ({
  machineName = 'Industrial Machinery Digital Twin',
  hasFault = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Active Model & Layout selection
  const [selectedModelId, setSelectedModelId] = useState<MachineModelId>('motor_pump');
  const [activeLayout, setActiveLayout] = useState<VisualLayoutMode>('pbr_realistic');

  // Interactive controls
  const [explodedAmount, setExplodedAmount] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [rpm, setRpm] = useState<number>(1475);
  const [isFaultActive, setIsFaultActive] = useState<boolean>(hasFault);
  const [selectedPart, setSelectedPart] = useState<PartDiagnosticInfo | null>(null);
  const [availableComponents, setAvailableComponents] = useState<PartDiagnosticInfo[]>([]);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [activeCameraView, setActiveCameraView] = useState<'iso' | 'front' | 'top' | 'close'>(
    'iso'
  );

  // References for Three.js engine
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Model-specific active nodes
  const currentModelGroupRef = useRef<THREE.Group | null>(null);
  const rotatingPartsRef = useRef<THREE.Object3D[]>([]);
  const secondaryRotatingPartsRef = useRef<{ obj: THREE.Object3D; ratio: number }[]>([]);
  const explodedPartsRef = useRef<
    { obj: THREE.Object3D; originalPos: THREE.Vector3; offsetDir: THREE.Vector3 }[]
  >([]);
  const factoryCellGroupRef = useRef<THREE.Group | null>(null);
  const acousticRippleRef = useRef<THREE.Mesh | null>(null);

  // Dynamic values in refs for animation loop
  const explodedTargetRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(true);
  const rpmRef = useRef<number>(1475);
  const isFaultActiveRef = useRef<boolean>(hasFault);
  const activeLayoutRef = useRef<VisualLayoutMode>(activeLayout);

  useEffect(() => {
    explodedTargetRef.current = explodedAmount;
  }, [explodedAmount]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    rpmRef.current = rpm;
  }, [rpm]);

  useEffect(() => {
    isFaultActiveRef.current = isFaultActive;
  }, [isFaultActive]);

  useEffect(() => {
    activeLayoutRef.current = activeLayout;
    if (activeLayout === 'exploded_view') {
      setExplodedAmount(0.85);
    } else if (explodedAmount > 0.8) {
      setExplodedAmount(0);
    }
    // Update materials and factory cell visibility
    if (currentModelGroupRef.current) {
      applyVisualLayoutToGroup(currentModelGroupRef.current, activeLayout, isFaultActive);
    }
    if (factoryCellGroupRef.current) {
      factoryCellGroupRef.current.visible = activeLayout === 'factory_cell';
    }
  }, [activeLayout, isFaultActive]);

  useEffect(() => {
    setIsFaultActive(hasFault);
  }, [hasFault]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene, Camera, Renderer
    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.04);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.8, 3.2, 5.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 2.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controlsRef.current = controls;

    // 4. Procedural Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    keyLight.position.set(5, 7, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 2.0);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // 6. Ground Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(28, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.76;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(20, 40, 0x0e7490, 0x1e293b);
    gridHelper.position.y = -0.75;
    scene.add(gridHelper);

    // 7. Factory Cell Spatial Context Layer
    const factoryCell = buildFactoryCellEnvironment(scene, isSoftwareGl);
    factoryCell.visible = activeLayoutRef.current === 'factory_cell';
    factoryCellGroupRef.current = factoryCell;

    // 8. Acoustic Anomaly Hotspot Pulse Wave (Visual shockwave effect)
    const rippleGeo = new THREE.RingGeometry(0.35, 0.42, 32);
    rippleGeo.rotateX(-Math.PI / 2);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    ripple.position.set(1.0, 0, 0);
    scene.add(ripple);
    acousticRippleRef.current = ripple;

    // Load initial model
    loadModel(selectedModelId, isSoftwareGl);

    // 9. Animation Frame Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let currentExploded = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Exploded interpolation
      currentExploded += (explodedTargetRef.current - currentExploded) * 0.08;
      explodedPartsRef.current.forEach((part) => {
        part.obj.position.copy(part.originalPos).addScaledVector(part.offsetDir, currentExploded * 1.5);
      });

      // Kinematic Rotation
      if (isRunningRef.current) {
        const radPerSec = (rpmRef.current / 60) * Math.PI * 2;
        const angleDelta = radPerSec * delta;

        // Primary rotating parts
        rotatingPartsRef.current.forEach((part) => {
          // Check axis orientation (axial fan rotates around z or x depending on model)
          if (selectedModelId === 'axial_fan') {
            part.rotation.z += angleDelta;
          } else {
            part.rotation.x += angleDelta;
          }
        });

        // Secondary rotating parts with gear ratios
        secondaryRotatingPartsRef.current.forEach(({ obj, ratio }) => {
          obj.rotation.x += angleDelta * ratio;
        });
      }

      // Anomaly Acoustic Ripple Pulse
      if (isFaultActiveRef.current && rippleMat) {
        const cycle = (time * 2.5) % 1.0;
        rippleMat.opacity = Math.max(0, (1 - cycle) * 0.85);
        ripple.scale.set(1 + cycle * 3.5, 1 + cycle * 3.5, 1 + cycle * 3.5);
      } else if (rippleMat) {
        rippleMat.opacity = 0;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 10. Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      rippleGeo.dispose();
      rippleMat.dispose();
    };
  }, []);

  // Helper to load or swap model cleanly
  const loadModel = (modelId: MachineModelId, isSoftwareGl: boolean) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous model
    if (currentModelGroupRef.current) {
      scene.remove(currentModelGroupRef.current);
      currentModelGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }

    rotatingPartsRef.current = [];
    secondaryRotatingPartsRef.current = [];
    explodedPartsRef.current = [];

    let result;
    if (modelId === 'motor_pump') {
      result = buildMotorPumpModel(isSoftwareGl, isFaultActive);
    } else if (modelId === 'axial_fan') {
      result = buildAxialFanModel(isSoftwareGl, isFaultActive);
    } else if (modelId === 'gearbox') {
      result = buildGearboxModel(isSoftwareGl, isFaultActive);
    } else {
      result = buildConveyorPulleyModel(isSoftwareGl, isFaultActive);
    }

    currentModelGroupRef.current = result.root;
    rotatingPartsRef.current = result.rotatingParts;
    if (result.secondaryRotatingParts) {
      secondaryRotatingPartsRef.current = result.secondaryRotatingParts;
    }
    explodedPartsRef.current = result.explodedParts;

    applyVisualLayoutToGroup(result.root, activeLayoutRef.current, isFaultActive);
    scene.add(result.root);

    // Update telemetry state
    setAvailableComponents(result.components);
    setSelectedPart(result.defaultSelectedPart);

    // Position acoustic ripple near model hotspot
    if (acousticRippleRef.current && result.hotspotMesh) {
      const worldPos = new THREE.Vector3();
      result.hotspotMesh.getWorldPosition(worldPos);
      acousticRippleRef.current.position.set(worldPos.x, worldPos.y, worldPos.z);
    }
  };

  // Switch model handler
  const handleSelectModel = (modelId: MachineModelId) => {
    setSelectedModelId(modelId);
    setExplodedAmount(0);
    loadModel(modelId, false);
  };

  // Camera preset positions
  const setCameraView = (view: 'iso' | 'front' | 'top' | 'close') => {
    setActiveCameraView(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    controls.target.set(0, 0, 0);

    if (view === 'iso') {
      camera.position.set(4.8, 3.2, 5.2);
    } else if (view === 'front') {
      camera.position.set(0, 0.4, 6.5);
    } else if (view === 'top') {
      camera.position.set(0.01, 8.0, 0.01);
    } else if (view === 'close') {
      if (selectedModelId === 'axial_fan') {
        camera.position.set(0, 0.5, 2.4);
      } else if (selectedModelId === 'gearbox') {
        camera.position.set(-0.6, 0.8, 2.2);
      } else if (selectedModelId === 'conveyor_pulley') {
        camera.position.set(-1.4, 0.6, 2.6);
      } else {
        camera.position.set(1.1, 0.4, 2.4);
      }
    }
    controls.update();
  };

  const currentModelMeta = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

  return (
    <div className="space-y-4">
      {/* 1. Model Selector Header Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                Multi-Model 3D Engine
              </span>
              <span className="text-xs font-bold text-white tracking-tight">Select Machinery Asset</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch between 4 high-fidelity industrial kinematic models with physics and acoustic hotspots.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Current Model:</span>
            <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
              {currentModelMeta?.label}
            </span>
          </div>
        </div>

        {/* 4 Models Selector Pills */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {AVAILABLE_MODELS.map((model) => {
            const Icon = model.icon;
            const isSelected = selectedModelId === model.id;
            return (
              <button
                key={model.id}
                onClick={() => handleSelectModel(model.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-white ring-1 ring-cyan-500/40 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700">
                    {model.tag}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold truncate">{model.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{model.category}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Layout Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Layout:
          </span>
          {VISUAL_LAYOUTS.map((layout) => {
            const isActive = activeLayout === layout.id;
            return (
              <button
                key={layout.id}
                onClick={() => setActiveLayout(layout.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-bold'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }`}
                title={layout.desc}
              >
                {layout.label}
              </button>
            );
          })}
        </div>

        {/* FLIR Legend Bar if Thermal Layout active */}
        {activeLayout === 'thermal_flir' && (
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono">
            <span className="text-violet-400">20°C</span>
            <div className="w-20 h-2 rounded-full bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-500" />
            <span className="text-rose-400 font-bold">95°C Max</span>
          </div>
        )}
      </div>

      {/* 3. Main 3D Viewport Canvas */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Left Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{currentModelMeta?.label}</span>
              <span className="font-mono text-cyan-400 text-[11px] font-bold">
                {isRunning ? `${rpm} RPM` : 'STOPPED'}
              </span>
            </div>

            {isFaultActive && (
              <div className="px-2.5 py-1 rounded-lg bg-rose-500/90 backdrop-blur-md border border-rose-400 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-lg animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>ACOUSTIC ANOMALY HOTSPOT</span>
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-800 w-fit">
            Layout: <span className="text-cyan-300 font-bold">{VISUAL_LAYOUTS.find((l) => l.id === activeLayout)?.badge}</span>
          </div>
        </div>

        {/* Top Right Camera Angle Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-lg z-10">
          <Camera className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          <button
            onClick={() => setCameraView('iso')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all ${
              activeCameraView === 'iso' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Iso
          </button>
          <button
            onClick={() => setCameraView('front')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all ${
              activeCameraView === 'front' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setCameraView('top')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all ${
              activeCameraView === 'top' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setCameraView('close')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all ${
              activeCameraView === 'close' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hotspot
          </button>
        </div>

        {/* Bottom Interactive Control Panel Drawer */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl z-10">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Left Controls: Run/Pause, Fault Inject, Reset View */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isRunning ? 'Running' : 'Paused'}</span>
              </button>

              <button
                onClick={() => {
                  const next = !isFaultActive;
                  setIsFaultActive(next);
                  if (selectedPart) {
                    setSelectedPart({
                      ...selectedPart,
                      status: next ? 'CRITICAL' : 'NORMAL',
                      tempC: next ? 84 : 42,
                      vibrationRMS: next ? '3.82g (Shock Defect)' : '0.45g (Nominal)',
                    });
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isFaultActive
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{isFaultActive ? 'Defect Active' : 'Inject Anomaly'}</span>
              </button>

              <button
                onClick={() => setCameraView('iso')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                title="Reset Camera"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Middle Sliders: Exploded View & Operational Speed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-xl text-xs">
              <div>
                <div className="flex justify-between font-mono mb-1 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" /> Exploded View
                  </span>
                  <span className="text-cyan-400 font-bold">{Math.round(explodedAmount * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedAmount}
                  onChange={(e) => setExplodedAmount(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono mb-1 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" /> Speed (RPM)
                  </span>
                  <span className="text-cyan-400 font-bold">{rpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="50"
                  value={rpm}
                  onChange={(e) => setRpm(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Component Telemetry & Acoustic Breakdown for Selected Machine */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Component Selector List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            Inspectable Assembly Parts
          </span>
          <div className="space-y-1.5">
            {availableComponents.map((comp) => {
              const isSelected = selectedPart?.id === comp.id;
              const isCrit = isFaultActive && comp.id.includes('bearing') || (isFaultActive && comp.status === 'CRITICAL');
              return (
                <button
                  key={comp.id}
                  onClick={() => setSelectedPart(comp)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{comp.name}</div>
                    <div className="text-[10px] text-slate-400">{comp.category}</div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isCrit ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isCrit ? 'ANOMALY' : 'NOMINAL'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Part Diagnostics Card */}
        {selectedPart && (
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Active Telemetry Inspection
                </span>
                <h3 className="text-base font-bold text-white">{selectedPart.name}</h3>
                <p className="text-xs text-slate-400">{selectedPart.category}</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                  isFaultActive && selectedPart.status === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isFaultActive && selectedPart.status === 'CRITICAL' ? 'CRITICAL DEFECT DETECTED' : 'OPERATING WITHIN TOLERANCE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Estimated Core Temp</div>
                <div className={`text-lg font-mono font-bold mt-0.5 ${isFaultActive && selectedPart.status === 'CRITICAL' ? 'text-rose-400' : 'text-slate-100'}`}>
                  {isFaultActive && selectedPart.status === 'CRITICAL' ? '82.4°C' : `${selectedPart.tempC}°C`}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Vibration Peak (RMS)</div>
                <div className={`text-lg font-mono font-bold mt-0.5 ${isFaultActive && selectedPart.status === 'CRITICAL' ? 'text-rose-400' : 'text-slate-100'}`}>
                  {isFaultActive && selectedPart.status === 'CRITICAL' ? '3.86g' : selectedPart.vibrationRMS.split(' ')[0]}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Acoustic Condition</div>
                <div className="text-xs font-bold text-cyan-400 mt-1">
                  {isFaultActive && selectedPart.status === 'CRITICAL' ? 'High Frequency Shock' : 'Laminar Flow / Stable'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Physical Acoustic Interpretation:
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {isFaultActive && selectedPart.status === 'CRITICAL'
                  ? 'Centroid shifted to high-frequency band with periodic sharp impulse clicks matching rotational cage harmonics. Prompt bearing greasing or alignment inspection advised.'
                  : selectedPart.acousticNote}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
