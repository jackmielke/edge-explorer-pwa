import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface CommunityTerminal3DProps {
  position: [number, number, number];
  onClick: () => void;
}

export const CommunityTerminal3D = ({ position, onClick }: CommunityTerminal3DProps) => {
  const terminalRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Gentle floating animation
  useFrame((state) => {
    if (terminalRef.current) {
      terminalRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group
      ref={terminalRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Base/Pedestal */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.6, 8]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Main Terminal Body */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 0.3]} />
        <meshStandardMaterial 
          color={hovered ? "#1a4d2e" : "#0f3a21"}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 0.2, 0.16]}>
        <boxGeometry args={[0.85, 0.6, 0.05]} />
        <meshStandardMaterial 
          color={hovered ? "#00ff88" : "#00cc66"}
          emissive={hovered ? "#00ff88" : "#00cc66"}
          emissiveIntensity={hovered ? 0.8 : 0.5}
          toneMapped={false}
        />
      </mesh>

      {/* Screen Text */}
      <Text
        position={[0, 0.35, 0.19]}
        fontSize={0.1}
        color="#001a0d"
        anchorX="center"
        anchorY="middle"
        font="/fonts/monospace.woff"
      >
        COMMUNITY
      </Text>
      
      <Text
        position={[0, 0.2, 0.19]}
        fontSize={0.15}
        color="#001a0d"
        anchorX="center"
        anchorY="middle"
        font="/fonts/monospace.woff"
      >
        TERMINAL
      </Text>

      <Text
        position={[0, 0.05, 0.19]}
        fontSize={0.06}
        color="#003322"
        anchorX="center"
        anchorY="middle"
        font="/fonts/monospace.woff"
      >
        {hovered ? '&gt; CLICK TO ACCESS' : '&gt; READY'}
      </Text>

      {/* Keyboard/Control Panel */}
      <mesh position={[0, -0.2, 0.1]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Side panels for aesthetic */}
      <mesh position={[-0.52, 0.2, 0]} castShadow>
        <boxGeometry args={[0.04, 0.8, 0.3]} />
        <meshStandardMaterial color="#0a2616" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.52, 0.2, 0]} castShadow>
        <boxGeometry args={[0.04, 0.8, 0.3]} />
        <meshStandardMaterial color="#0a2616" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Glow effect when hovered */}
      {hovered && (
        <pointLight
          position={[0, 0.2, 0.3]}
          color="#00ff88"
          intensity={1}
          distance={3}
        />
      )}
    </group>
  );
};
