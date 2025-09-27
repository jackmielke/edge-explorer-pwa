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
  
  // Position bubble above character
  const yOffset = sender === 'user' ? 2.5 : 3.5;
  const position: [number, number, number] = [
    playerPosition.x, 
    playerPosition.y + yOffset, 
    playerPosition.z
  ];
  
  // Fade in/out effect with different durations for user vs AI
  useEffect(() => {
    console.log(`TextBubble: ${sender} message "${text.substring(0, 20)}..." visible=${isVisible}`);
    
    if (isVisible) {
      setOpacity(1);
      const duration = sender === 'user' ? 2500 : 10000; // User: 2.5s, AI: 10s
      console.log(`TextBubble: Setting ${duration}ms timer for ${sender} message`);
      
      const timer = setTimeout(() => {
        console.log(`TextBubble: ${duration}ms timer expired, fading out ${sender} message`);
        setOpacity(0);
        setTimeout(() => {
          console.log(`TextBubble: Calling onComplete for ${sender} message`);
          onComplete?.();
        }, 500); // Longer fade for visibility
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      setTimeout(() => onComplete?.(), 500);
    }
  }, [isVisible, sender, onComplete, text]);

  // Face camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  if (!isVisible || opacity === 0) return null;

  // Multi-line bubble sizing - compact version
  const maxWidth = 5;
  const charsPerLine = 35;
  const lines = [];
  const words = text.split(' ');
  let currentLine = '';
  
  // Break text into lines
  for (const word of words) {
    if ((currentLine + word).length <= charsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  const displayText = lines.join('\n');
  const bubbleWidth = Math.min(maxWidth, Math.max(2, Math.max(...lines.map(line => line.length)) * 0.08));
  const bubbleHeight = Math.max(0.5, lines.length * 0.3 + 0.15); // Reduced padding
  
  return (
    <group ref={groupRef} position={position}>
      {/* Background */}
      <mesh>
        <planeGeometry args={[bubbleWidth, bubbleHeight]} />
        <meshBasicMaterial 
          color={sender === 'user' ? '#3B82F6' : '#10B981'} 
          transparent 
          opacity={opacity * 0.95}
        />
      </mesh>
      
      {/* Text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.11}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={bubbleWidth - 0.3}
        textAlign="center"
        lineHeight={1.2}
      >
        <meshBasicMaterial transparent opacity={opacity} />
        {displayText}
      </Text>
      
      {/* Tail */}
      <mesh position={[0, -bubbleHeight/2 - 0.1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.15, 0.15]} />
        <meshBasicMaterial 
          color={sender === 'user' ? '#3B82F6' : '#10B981'} 
          transparent 
          opacity={opacity * 0.95}
        />
      </mesh>
    </group>
  );
};