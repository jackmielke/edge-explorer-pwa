import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface ThinkingBubbleProps {
  playerPosition: [number, number, number];
  isVisible: boolean;
}

export const ThinkingBubble = ({ playerPosition, isVisible }: ThinkingBubbleProps) => {
  const groupRef = useRef<any>(null);
  const [dots, setDots] = useState('');

  // Animate dots
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

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
        <planeGeometry args={[2.2, 0.8]} />
        <meshBasicMaterial color="#6B7280" opacity={0.9} transparent />
      </mesh>
      
      {/* Thinking text with animated dots */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        thinking{dots}
      </Text>
      
      {/* Tail */}
      <mesh position={[0, -0.5, -0.01]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.12, 0.12]} />
        <meshBasicMaterial color="#6B7280" opacity={0.9} transparent />
      </mesh>
    </group>
  );
};