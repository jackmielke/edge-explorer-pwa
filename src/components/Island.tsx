import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useCylinder, useBox } from '@react-three/cannon';

export const Island = () => {
  const waterRef = useRef<Mesh>(null);
  
  // Physics collision for main island (2x bigger)
  const [islandRef] = useCylinder(() => ({
    position: [0, -0.5, 0],
    args: [12, 12, 1, 32],
    type: 'Static',
  }));
  
  // Physics collision for grass layer (2x bigger)
  const [grassRef] = useCylinder(() => ({
    position: [0, 0, 0],
    args: [11.6, 11.6, 0.2, 32],
    type: 'Static',
  }));

  // Physics collision for beach ring
  const [beachRef] = useCylinder(() => ({
    position: [0, -0.1, 0],
    args: [11.9, 11.9, 0.15, 32],
    type: 'Static',
  }));

  // Pre-calculate rock positions to prevent glitching (2x radius)
  const rockPositions = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 8 + Math.random() * 2;
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
      {/* Main Island (2x size) */}
      <mesh 
        ref={islandRef as any}
        receiveShadow
      >
        <cylinderGeometry args={[12, 12, 1, 32]} />
        <meshLambertMaterial 
          color="hsl(120, 45%, 35%)"
        />
      </mesh>

      {/* Grass layer (2x size) */}
      <mesh 
        ref={grassRef as any}
        receiveShadow
      >
        <cylinderGeometry args={[11.6, 11.6, 0.2, 32]} />
        <meshLambertMaterial 
          color="hsl(100, 50%, 65%)"
        />
      </mesh>

      {/* Sandy beach ring */}
      <mesh 
        ref={beachRef as any}
        receiveShadow
      >
        <cylinderGeometry args={[11.9, 11.9, 0.15, 32]} />
        <meshLambertMaterial 
          color="hsl(40, 60%, 75%)"
        />
      </mesh>

      {/* Water around island (larger) */}
      <mesh 
        ref={waterRef}
        position={[0, -1.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[100, 100]} />
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