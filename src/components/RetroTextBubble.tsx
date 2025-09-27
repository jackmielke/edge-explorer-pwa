import React, { useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RetroTextBubbleProps {
  text: string;
  playerPosition: THREE.Vector3;
  sender: 'user' | 'ai';
  onComplete?: () => void;
}

// A compact, retro-style 3D text bubble that self-times and faces the camera
const RetroTextBubble: React.FC<RetroTextBubbleProps> = ({ text, playerPosition, sender, onComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(0);

  // Position offsets: user lower, AI higher
  const yOffset = sender === 'user' ? 2.5 : 3.3;
  const position: [number, number, number] = [
    playerPosition.x,
    playerPosition.y + yOffset,
    playerPosition.z,
  ];

  // Word-wrap to lines
  const maxWidthUnits = 5; // max bubble width in world units
  const charsPerLine = 34;
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + (line ? ' ' : '') + w).length <= charsPerLine) {
      line = line ? line + ' ' + w : w;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);

  const displayText = lines.join('\n');
  const textMaxLen = Math.max(...lines.map(l => l.length), 1);
  const bubbleWidth = Math.min(maxWidthUnits, Math.max(2.1, textMaxLen * 0.075));
  const lineHeight = 0.28;
  const vPad = 0.16; // vertical padding
  const hPad = 0.24; // horizontal padding
  const bubbleHeight = Math.max(0.46, lines.length * lineHeight + vPad * 2);

  // Colors (approximate retro iMessage style)
  const bgColor = sender === 'user' ? '#3B82F6' : '#374151';
  const tailOffsetX = sender === 'user' ? 0.35 : -0.35;

  // Timed appearance: 2.5s for user, 10s for AI
  useEffect(() => {
    setOpacity(1);
    const duration = sender === 'user' ? 2500 : 10000;
    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => onComplete?.(), 250);
    }, duration);
    return () => clearTimeout(timer);
  }, [sender, onComplete]);

  // Face camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  if (opacity <= 0) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Background */}
      <mesh>
        <planeGeometry args={[bubbleWidth + hPad, bubbleHeight]} />
        <meshBasicMaterial color={bgColor} transparent opacity={opacity * 0.95} />
      </mesh>

      {/* Text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.11}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={bubbleWidth}
        textAlign="center"
        lineHeight={1.15}
      >
        <meshBasicMaterial transparent opacity={opacity} />
        {displayText}
      </Text>

      {/* Tail */}
      <mesh position={[tailOffsetX, -bubbleHeight / 2 + 0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.16, 0.16]} />
        <meshBasicMaterial color={bgColor} transparent opacity={opacity * 0.95} />
      </mesh>
    </group>
  );
};

export default RetroTextBubble;
