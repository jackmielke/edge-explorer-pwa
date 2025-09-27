import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ThinkingBubbleProps {
  playerPosition: THREE.Vector3;
  isVisible: boolean;
}

export const ThinkingBubble = ({ playerPosition, isVisible }: ThinkingBubbleProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [dotOpacity, setDotOpacity] = useState([1, 0.6, 0.3]);
  const [scale, setScale] = useState(0);

  // Animate thinking dots
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDotOpacity(prev => [
        prev[2], // Move last to first
        prev[0], // Move first to second  
        prev[1]  // Move second to third
      ]);
    }, 600);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Scale animation
  useEffect(() => {
    if (isVisible) {
      let startTime = Date.now();
      const duration = 300;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setScale(0.8 + (0.2 * easeOut));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setScale(0);
    }
  }, [isVisible]);

  // Face camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      const targetRotation = new THREE.Euler().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          groupRef.current.position,
          camera.position,
          new THREE.Vector3(0, 1, 0)
        )
      );
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.y,
        0.1
      );
    }
  });

  const yOffset = 3.5;
  const position: [number, number, number] = [
    playerPosition.x, 
    playerPosition.y + yOffset, 
    playerPosition.z
  ];

  if (!isVisible || scale === 0) return null;

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Subtle glow */}
      <mesh>
        <planeGeometry args={[1.7, 1.0]} />
        <meshBasicMaterial 
          color="#10B981" 
          transparent 
          opacity={0.1}
        />
      </mesh>
      
      {/* Background */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[1.5, 0.8]} />
        <meshBasicMaterial 
          color="#10B981" 
          transparent 
          opacity={0.95}
        />
      </mesh>
      
      {/* Thinking dots with pulsing animation */}
      {[-0.3, 0, 0.3].map((xPos, index) => (
        <mesh key={index} position={[xPos, 0, 0.01]}>
          <circleGeometry args={[0.08]} />
          <meshBasicMaterial 
            color="#FFFFFF" 
            transparent 
            opacity={dotOpacity[index]}
          />
        </mesh>
      ))}
      
      {/* Tail */}
      <mesh position={[0, -0.5, 0.001]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.15, 0.15]} />
        <meshBasicMaterial 
          color="#10B981" 
          transparent 
          opacity={0.95}
        />
      </mesh>
      
      {/* Subtle floating animation */}
      <mesh position={[0, Math.sin(Date.now() * 0.003) * 0.1, 0]}>
        <planeGeometry args={[0, 0]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};