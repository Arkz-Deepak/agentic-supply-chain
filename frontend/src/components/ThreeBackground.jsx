import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Subtle interactive 3D particle constellation reacting to mouse coordinates
function ParticleField({ mousePosition }) {
  const pointsRef = useRef();
  const count = 350;

  // Generate random 3D points
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorA = new THREE.Color('#00F0FF'); // Cyan
    const colorB = new THREE.Color('#0055FF'); // Deep Blue
    const colorC = new THREE.Color('#A855F7'); // Cyber Purple

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 20;
      pos[i3 + 1] = (Math.random() - 0.5) * 14;
      pos[i3 + 2] = (Math.random() - 0.5) * 12;

      // Gradient selection
      const mixed = colorA.clone().lerp(Math.random() > 0.5 ? colorB : colorC, Math.random());
      col[i3] = mixed.r;
      col[i3 + 1] = mixed.g;
      col[i3 + 2] = mixed.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    // Gentle constant rotation
    pointsRef.current.rotation.y += delta * 0.04;
    pointsRef.current.rotation.x += delta * 0.015;

    // React smoothly to mouse position
    const targetX = (mousePosition.current.x * 0.3);
    const targetY = (mousePosition.current.y * 0.3);
    pointsRef.current.rotation.y += (targetX - pointsRef.current.rotation.y) * 0.05;
    pointsRef.current.rotation.x += (targetY - pointsRef.current.rotation.x) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Glowing cyber grid plane in the background
function CyberGrid() {
  const gridRef = useRef();

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z = (gridRef.current.position.z + delta * 0.4) % 2;
    }
  });

  return (
    <group position={[0, -4, -4]} rotation={[-Math.PI / 2.3, 0, 0]}>
      <gridHelper ref={gridRef} args={[35, 35, '#00F0FF', '#0D2137']} />
    </group>
  );
}

export default function ThreeBackground() {
  const mousePosition = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    // Normalized coordinates (-1 to 1)
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mousePosition.current = { x, y };
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-75"
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <ParticleField mousePosition={mousePosition} />
        <CyberGrid />
      </Canvas>
    </div>
  );
}
