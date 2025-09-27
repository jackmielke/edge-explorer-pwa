import React, { useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TextBubbleProps {
  text: string;
  playerPosition: THREE.Vector3;
  isVisible: boolean;
  sender: 'user' | 'ai';
  onComplete?: () => void;
}

export const TextBubble = ({ text, playerPosition, isVisible, sender, onComplete }: TextBubbleProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(0);
  
  // Calculate dynamic position based on player position and sender
  const bubbleHeight = sender === 'user' ? 2.5 : 4;
  const dynamicPosition: [number, number, number] = [
    playerPosition.x, 
    playerPosition.y + bubbleHeight, 
    playerPosition.z
  ];
  
  // Auto-hide after 4 seconds
  useEffect(() => {
    if (isVisible) {
      setOpacity(1);
      const timer = setTimeout(() => {
        setOpacity(0);
        setTimeout(() => {
          onComplete?.();
        }, 500); // Wait for fade out
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
    }
  }, [isVisible, onComplete]);

  // Make bubble always face the camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  if (!isVisible) return null;

  // Calculate text width for bubble sizing - no truncation for full message display
  const textLength = text.length;
  const maxWidth = Math.max(3, Math.min(textLength * 0.08, 8)); // Dynamic width based on text length
  const wrappedText = text; // Show full text
  const bubbleColor = sender === 'user' ? '#4F46E5' : '#10B981';
  const textColor = '#FFFFFF';

  return (
    <group ref={groupRef} position={dynamicPosition}>
      {/* Speech bubble background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[maxWidth, Math.max(0.8, Math.ceil(textLength / 40) * 0.4)]} />
        <meshBasicMaterial 
          color={bubbleColor} 
          transparent 
          opacity={opacity * 0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Speech bubble border */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[maxWidth + 0.1, Math.max(0.9, Math.ceil(textLength / 40) * 0.4 + 0.1)]} />
        <meshBasicMaterial 
          color={'#FFFFFF'} 
          transparent 
          opacity={opacity * 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Text */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.12}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={maxWidth - 0.4}
        textAlign="center"
        lineHeight={1.2}
      >
        <meshBasicMaterial transparent opacity={opacity} />
        {wrappedText}
      </Text>

      {/* Speech bubble tail */}
      <mesh position={[0, -0.5, -0.01]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial 
          color={bubbleColor} 
          transparent 
          opacity={opacity * 0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};