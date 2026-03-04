import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useAnimations, useFBX } from '@react-three/drei';
import * as THREE from 'three';

interface GolferBounds {
  footY: number;
  centerX: number;
  centerZ: number;
}

function GolferModel({ onBounds }: { onBounds: (b: GolferBounds) => void }) {
  const fbx = useFBX('/assets/golfer.fbx');
  const group = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(fbx.animations, group);
  const boundsReported = useRef(false);

  useEffect(() => {
    const action = actions[names[0]];
    if (action) {
      action.reset().play();
      action.timeScale = 0.6;
    }
  }, [actions, names]);

  useEffect(() => {
    if (!boundsReported.current && group.current) {
      const timeout = setTimeout(() => {
        if (!group.current) return;
        const box = new THREE.Box3().setFromObject(group.current);
        const center = box.getCenter(new THREE.Vector3());
        // Log so we can see actual bounds
        console.log('Golfer bounds:', {
          min: box.min,
          max: box.max,
          center,
        });
        onBounds({
          footY: box.min.y,
          centerX: center.x,
          centerZ: center.z,
        });
        boundsReported.current = true;
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [onBounds]);

  return (
    <primitive
      ref={group}
      object={fbx}
      scale={0.01}
      position={[0.75, -1, 0]}
    />
  );
}

function SceneProps({ bounds, showCameraMarkers }: { bounds: GolferBounds | null; showCameraMarkers?: boolean }) {
  if (!bounds) return null;

  const { footY, centerX, centerZ } = bounds;
  const groundY = footY + 0.01;
  const ballX = centerX - 0.9;
  const ballZ = centerZ;
  const teeHeight = 0.07;
  const ballRadius = 0.028;

  return (
    <>
      {/* Alignment stick — along Z axis (target line direction) */}
      <mesh position={[centerX, groundY, centerZ]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 5, 8]} />
        <meshStandardMaterial color="#ff6b35" />
      </mesh>

      {/* Tee */}
      <mesh position={[ballX, groundY + teeHeight / 2, ballZ]}>
        <cylinderGeometry args={[0.015, 0.004, teeHeight, 8]} />
        <meshStandardMaterial color="#f5deb3" />
      </mesh>

      {/* Ball */}
      <mesh position={[ballX, groundY + teeHeight + ballRadius, ballZ]}>
        <sphereGeometry args={[ballRadius, 16, 16]} />
        <meshStandardMaterial color="white" roughness={0.3} />
      </mesh>

      {/* Camera markers — aerial view only */}
      {showCameraMarkers && (
        <>
          {/*
            Coordinate system (no rotation on golfer):
            - DTL camera is at Z=-4 (behind golfer's back)
            - Face-On camera is at X=-4 (to the golfer's side)
            So DTL marker goes at centerZ - 3.5 (behind back)
            Face-On marker goes at centerX - 3.5 (to the side)
          */}

          {/* DTL camera marker — GREEN, behind the ball */}
          <group position={[ballX, groundY, centerZ - 3.5]}>
            <mesh>
              <boxGeometry args={[0.3, 0.55, 0.08]} />
              <meshStandardMaterial color="#3fb950" />
            </mesh>
            {/* Lens */}
            <mesh position={[0, 0.15, 0.05]}>
              <circleGeometry args={[0.07, 12]} />
              <meshStandardMaterial color="#000" />
            </mesh>
            {/* Pole */}
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
              <meshStandardMaterial color="#3fb950" opacity={0.5} transparent />
            </mesh>
          </group>

          {/* Line from DTL camera to ball */}
          <mesh position={[ballX, groundY, centerZ - 1.75]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 3.5, 6]} />
            <meshStandardMaterial color="#3fb950" opacity={0.25} transparent />
          </mesh>

          {/* Face-On camera marker — BLUE, to the side */}
          <group position={[centerX - 3.5, groundY, centerZ]}>
            <mesh>
              <boxGeometry args={[0.08, 0.55, 0.3]} />
              <meshStandardMaterial color="#58a6ff" />
            </mesh>
            {/* Lens */}
            <mesh position={[0.05, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.07, 12]} />
              <meshStandardMaterial color="#000" />
            </mesh>
            {/* Pole */}
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
              <meshStandardMaterial color="#58a6ff" opacity={0.5} transparent />
            </mesh>
          </group>

          {/* Line from Face-On camera to golfer */}
          <mesh position={[centerX - 1.75, groundY, centerZ]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 3.5, 6]} />
            <meshStandardMaterial color="#58a6ff" opacity={0.25} transparent />
          </mesh>
        </>
      )}
    </>
  );
}

function CameraRig({ position, lookAt, up }: { position: [number, number, number]; lookAt: [number, number, number]; up?: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.up.set(...(up ?? [0, 1, 0]));
    camera.position.set(...position);
    camera.lookAt(...lookAt);
  }, [camera, position, lookAt, up]);
  return null;
}

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#58a6ff" wireframe />
    </mesh>
  );
}

const VIEWS: {
  label: string; emoji: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  up?: [number, number, number];
  desc: string; aerial?: boolean;
  viewfinderColor?: string;
  viewfinderLabel?: string;
}[] = [
  {
    label: 'Down the Line', emoji: '🎯',
    position: [0, 1, -4], lookAt: [0.75, 0, 0],
    desc: 'Camera behind the golfer — place your phone here',
    viewfinderColor: '#3fb950',
    viewfinderLabel: 'DTL CAM',
  },
  {
    label: 'Face On', emoji: '👤',
    position: [-4, 1, 0], lookAt: [0.75, 0, 0],
    desc: 'Camera to the side — place your phone here',
    viewfinderColor: '#58a6ff',
    viewfinderLabel: 'FACE ON CAM',
  },
  {
    label: 'Aerial Map', emoji: '🗺️',
    position: [0.75, 9, -2], lookAt: [0.75, -1, -2],
    up: [0, 0, 1],
    desc: 'Top-down — green = behind (DTL), blue = side (Face On)',
    aerial: true,
  },
];

export default function SwingModel() {
  const [activeView, setActiveView] = useState(0);
  const [bounds, setBounds] = useState<GolferBounds | null>(null);
  const view = VIEWS[activeView];

  const handleViewChange = (i: number) => {
    setActiveView(i);
    if (i === 0) localStorage.setItem('swingType', 'dtl');
    if (i === 1) localStorage.setItem('swingType', 'faceOn');
  };

  return (
    <div style={{ width: '100%', background: '#0d1117', borderRadius: '12px', overflow: 'hidden' }}>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 12px 0' }}>
        {VIEWS.map((v, i) => (
          <button
            key={v.label}
            onClick={() => handleViewChange(i)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: activeView === i ? '#58a6ff' : '#21262d',
              color: activeView === i ? '#000' : '#8b949e',
              transition: 'all 0.2s',
            }}
          >
            {v.emoji} {v.label}
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#8b949e', fontSize: '12px', margin: '8px 0 4px', padding: '0 12px' }}>
        {view.desc}
      </p>

      <div style={{ height: '480px', position: 'relative' }}>
        {/* Viewfinder overlay */}
        {view.viewfinderColor && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
            boxSizing: 'border-box',
          }}>
            {/* Corner brackets */}
            {[
              { top: 12, left: 12, borderTop: '3px solid', borderLeft: '3px solid' },
              { top: 12, right: 12, borderTop: '3px solid', borderRight: '3px solid' },
              { bottom: 12, left: 12, borderBottom: '3px solid', borderLeft: '3px solid' },
              { bottom: 12, right: 12, borderBottom: '3px solid', borderRight: '3px solid' },
            ].map((style, i) => (
              <div key={i} style={{
                position: 'absolute', width: 28, height: 28,
                borderColor: view.viewfinderColor,
                opacity: 0.9,
                ...style,
              }} />
            ))}

            {/* REC dot + label — top left */}
            <div style={{
              position: 'absolute', top: 18, left: 48,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: view.viewfinderColor,
                boxShadow: `0 0 6px ${view.viewfinderColor}`,
                animation: 'pulse 1.5s infinite',
              }} />
              <span style={{
                color: view.viewfinderColor, fontSize: 11,
                fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2,
                opacity: 0.9,
              }}>
                {view.viewfinderLabel}
              </span>
            </div>

            {/* Center crosshair */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
              <div style={{ width: 20, height: 1, background: view.viewfinderColor, opacity: 0.5, position: 'absolute', top: 0, left: -10 }} />
              <div style={{ width: 1, height: 20, background: view.viewfinderColor, opacity: 0.5, position: 'absolute', top: -10, left: 0 }} />
            </div>
          </div>
        )}

        <Canvas camera={{ position: view.position, fov: 50 }}>
          <CameraRig position={view.position} lookAt={view.lookAt} up={view.up} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
          <Suspense fallback={<Loader />}>
            <GolferModel onBounds={setBounds} />
          </Suspense>
          <SceneProps bounds={bounds} showCameraMarkers={view.aerial} />
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={12}
            minPolarAngle={view.aerial ? 0 : Math.PI / 8}
            maxPolarAngle={view.aerial ? Math.PI / 2 : Math.PI / 1.8}
            autoRotate={false}
          />
          <gridHelper args={[8, 16, '#21262d', '#21262d']} position={[0.75, -1, 0]} />
        </Canvas>
      </div>

      <p style={{ textAlign: 'center', color: '#58a6ff', fontSize: '11px', margin: '6px 0 10px', opacity: 0.6 }}>
        💣 The Bomb &nbsp;•&nbsp; Drag to rotate • Scroll to zoom
      </p>
    </div>
  );
}
