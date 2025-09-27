import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface ThinkingBubbleProps {
  playerPosition: [number, number, number];
  isVisible: boolean;
}

export const ThinkingBubble = ({ playerPosition, isVisible }: ThinkingBubbleProps) => {
  const groupRef = useRef<any>(null);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  if (!isVisible) return null;

  return (
    <group 
      ref={groupRef}
      position={[playerPosition[0], playerPosition[1] + 2.5, playerPosition[2]]}
    >
      {/* Background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2, 0.8]} />
        <meshBasicMaterial color="#000000" opacity={0.8} transparent />
      </mesh>
      
      {/* Thinking text with animated dots */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Regular.woff"
      >
        thinking...
      </Text>
      
      {/* Tail */}
      <mesh position={[-0.3, -0.5, -0.01]}>
        <coneGeometry args={[0.1, 0.2]} />
        <meshBasicMaterial color="#000000" opacity={0.8} transparent />
      </mesh>
    </group>
  );
};