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
  const [pulseScale, setPulseScale] = useState(1);

  console.log(`ThinkingBubble: isVisible=${isVisible}`);

  // Animate dots
  useEffect(() => {
    if (!isVisible) {
      setDots('');
      return;
    }
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Animate subtle pulse
  useEffect(() => {
    if (!isVisible) {
      setPulseScale(1);
      return;
    }
    
    const interval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.05 : 1);
    }, 800);

    return () => clearInterval(interval);
  }, [isVisible]);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
      // Apply pulse scale
      groupRef.current.scale.setScalar(pulseScale);
    }
  });

  if (!isVisible) return null;

  return (
    <group 
      ref={groupRef}
      position={[playerPosition[0], playerPosition[1] + 2.5, playerPosition[2]]}
    >
      {/* Background with subtle glow */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.2, 0.8]} />
        <meshBasicMaterial color="#4F46E5" opacity={0.9} transparent />
      </mesh>
      
      {/* Subtle glow effect */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.6, 1.2]} />
        <meshBasicMaterial color="#4F46E5" opacity={0.2} transparent />
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
        <meshBasicMaterial color="#4F46E5" opacity={0.9} transparent />
      </mesh>
    </group>
  );
};