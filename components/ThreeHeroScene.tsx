"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

function SpinningCube() {
  return (
    <mesh rotation={[0.4, 0.6, 0]}>
      <boxGeometry args={[1.8, 1.8, 1.8]} />
      <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.2} />
    </mesh>
  );
}

export default function ThreeHeroScene() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [3, 3, 3], fov: 45 }}>
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} />
        <Suspense fallback={null}>
          <SpinningCube />
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.2} />
        </Suspense>
      </Canvas>
    </div>
  );
}
