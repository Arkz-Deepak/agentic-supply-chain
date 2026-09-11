import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Subtle interactive 3D particle constellation in sky blue & soft white
function ParticleField({ mousePosition }) {
  const pointsRef = useRef();
  const count = 300;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorSky = new THREE.Color('#38BDF8'); // Sky 400
    const colorBlue = new THREE.Color('#0284C7'); // Sky 600
    const colorTeal = new THREE.Color('#06B6D4'); // Cyan 500

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 22;
      pos[i3 + 1] = (Math.random() - 0.5) * 15;
      pos[i3 + 2] = (Math.random() - 0.5) * 12;

      const mixed = colorSky.clone().lerp(Math.random() > 0.5 ? colorBlue : colorTeal, Math.random());
      col[i3] = mixed.r;
      col[i3 + 1] = mixed.g;
      col[i3 + 2] = mixed.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.03;
    pointsRef.current.rotation.x += delta * 0.01;

    const targetX = mousePosition.current.x * 0.25;
    const targetY = mousePosition.current.y * 0.25;
    pointsRef.current.rotation.y += (targetX - pointsRef.current.rotation.y) * 0.04;
    pointsRef.current.rotation.x += (targetY - pointsRef.current.rotation.x) * 0.04;
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
        size={0.065}
        vertexColors
        transparent
        opacity={0.5}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

// Light geometric plane grid
function SkyGrid() {
  const gridRef = useRef();

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z = (gridRef.current.position.z + delta * 0.25) % 2;
    }
  });

  return (
    <group position={[0, -4.5, -4]} rotation={[-Math.PI / 2.3, 0, 0]}>
      <gridHelper ref={gridRef} args={[35, 35, '#BAE6FD', '#E0F2FE']} />
    </group>
  );
}

export default function ThreeBackground() {
  const mousePosition = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mousePosition.current = { x, y };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60"
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <ParticleField mousePosition={mousePosition} />
        <SkyGrid />
      </Canvas>
    </div>
  );
}
