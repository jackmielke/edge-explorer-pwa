import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

export const Island = () => {
  const islandRef = useRef<Mesh>(null);
  const waterRef = useRef<Mesh>(null);

  // Pre-calculate rock positions to prevent glitching
  const rockPositions = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 4 + Math.random() * 1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return { x, z };
    });
  }, []);

  useFrame((state) => {
    // Gentle water animation
    if (waterRef.current) {
      waterRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
    }
  });

  return (
    <group>
      {/* Main Island */}
      <mesh 
        ref={islandRef}
        position={[0, -0.5, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[6, 6, 1, 32]} />
        <meshLambertMaterial 
          color="hsl(120, 45%, 35%)"
        />
      </mesh>

      {/* Grass layer */}
      <mesh 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5.8, 5.8, 0.2, 32]} />
        <meshLambertMaterial 
          color="hsl(100, 50%, 65%)"
        />
      </mesh>

      {/* Water around island */}
      <mesh 
        ref={waterRef}
        position={[0, -1.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[50, 50]} />
        <meshPhongMaterial 
          color="hsl(200, 80%, 70%)"
          transparent
          opacity={0.8}
          shininess={100}
        />
      </mesh>

      {/* Small decorative rocks */}
      {rockPositions.map((position, i) => (
        <mesh 
          key={i}
          position={[position.x, 0.1, position.z]}
          castShadow
        >
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshLambertMaterial color="hsl(0, 0%, 40%)" />
        </mesh>
      ))}
    </group>
  );
};