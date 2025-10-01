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

  // Physics collision for central hill
  const [hillRef] = useCylinder(() => ({
    position: [0, 0.5, 0],
    args: [4, 3, 1, 32],
    type: 'Static',
  }));

  // Pre-calculate rock and boulder positions
  const rockPositions = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 8 + Math.random() * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const size = 0.3 + Math.random() * 0.4; // Varied sizes
      return { x, z, size };
    });
  }, []);

  // Larger boulders scattered around
  const boulderPositions = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const angle = (i / 5) * Math.PI * 2 + Math.PI / 5;
      const radius = 5 + Math.random() * 3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const size = 0.8 + Math.random() * 0.6;
      return { x, z, size };
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

      {/* Central hill */}
      <mesh 
        ref={hillRef as any}
        receiveShadow
        castShadow
      >
        <cylinderGeometry args={[4, 3, 1, 32]} />
        <meshLambertMaterial 
          color="hsl(110, 48%, 50%)"
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

      {/* Small decorative rocks (varied sizes) */}
      {rockPositions.map((position, i) => (
        <mesh 
          key={`rock-${i}`}
          position={[position.x, 0.1, position.z]}
          castShadow
        >
          <boxGeometry args={[position.size, position.size, position.size]} />
          <meshLambertMaterial color="hsl(0, 0%, 40%)" />
        </mesh>
      ))}

      {/* Larger boulders */}
      {boulderPositions.map((position, i) => (
        <mesh 
          key={`boulder-${i}`}
          position={[position.x, position.size / 2, position.z]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[position.size, 8, 8]} />
          <meshLambertMaterial color="hsl(30, 15%, 45%)" />
        </mesh>
      ))}
    </group>
  );
};