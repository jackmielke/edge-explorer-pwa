import { useRef } from 'react';
import { Mesh, Color } from 'three';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface CloudProps {
  position: [number, number, number];
  scale?: number;
  driftSpeed?: number;
}

const SingleCloud = ({ position, scale = 1, driftSpeed = 0.01 }: CloudProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle floating motion
      timeRef.current += delta * driftSpeed;
      groupRef.current.position.y = position[1] + Math.sin(timeRef.current) * 0.3;
      
      // Slow rotation
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main cloud body made of overlapping spheres */}
      <mesh position={[0, 0, 0]} scale={[1.5 * scale, 1 * scale, 1 * scale]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.85}
          roughness={1}
          metalness={0}
        />
      </mesh>
      
      <mesh position={[0.8 * scale, 0.2 * scale, 0]} scale={[1.2 * scale, 0.9 * scale, 0.9 * scale]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.8}
          roughness={1}
          metalness={0}
        />
      </mesh>
      
      <mesh position={[-0.8 * scale, 0.1 * scale, 0]} scale={[1 * scale, 0.8 * scale, 0.8 * scale]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.8}
          roughness={1}
          metalness={0}
        />
      </mesh>
      
      <mesh position={[0, 0.5 * scale, 0.3 * scale]} scale={[1.1 * scale, 0.7 * scale, 0.7 * scale]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.75}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
};

export const Clouds = () => {
  // Create clouds in a ring around the island
  const CLOUD_DISTANCE = 8; // Distance from center
  const CLOUD_COUNT = 12;
  const CLOUD_HEIGHT_MIN = 3;
  const CLOUD_HEIGHT_MAX = 6;

  const clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => {
    const angle = (i / CLOUD_COUNT) * Math.PI * 2;
    const radius = CLOUD_DISTANCE + (Math.random() - 0.5) * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = CLOUD_HEIGHT_MIN + Math.random() * (CLOUD_HEIGHT_MAX - CLOUD_HEIGHT_MIN);
    const scale = 0.8 + Math.random() * 0.6;
    const driftSpeed = 0.005 + Math.random() * 0.01;

    return {
      key: i,
      position: [x, y, z] as [number, number, number],
      scale,
      driftSpeed
    };
  });

  return (
    <group>
      {clouds.map(cloud => (
        <SingleCloud
          key={cloud.key}
          position={cloud.position}
          scale={cloud.scale}
          driftSpeed={cloud.driftSpeed}
        />
      ))}
    </group>
  );
};
