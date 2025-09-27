import React, { useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnhancedTextBubbleProps {
  text: string;
  playerPosition: THREE.Vector3;
  isVisible: boolean;
  sender: 'user' | 'ai';
  onComplete?: () => void;
  queuePosition?: number; // For staggered positioning
}

export const EnhancedTextBubble = ({ 
  text, 
  playerPosition, 
  isVisible, 
  sender, 
  onComplete,
  queuePosition = 0
}: EnhancedTextBubbleProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Enhanced positioning with queue support
  const baseYOffset = sender === 'user' ? 2.5 : 3.5;
  const stackOffset = queuePosition * 0.8; // Stack bubbles vertically
  const yOffset = baseYOffset + stackOffset;
  
  // Add slight randomization to prevent perfect overlap
  const xVariation = (Math.random() - 0.5) * 0.3;
  const zVariation = (Math.random() - 0.5) * 0.3;
  
  const position: [number, number, number] = [
    playerPosition.x + xVariation, 
    playerPosition.y + yOffset, 
    playerPosition.z + zVariation
  ];

  // Typewriter effect for AI messages
  useEffect(() => {
    if (!isVisible) return;

    if (sender === 'ai') {
      setIsTyping(true);
      setDisplayedText('');
      
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 30); // Typing speed

      return () => clearInterval(typeInterval);
    } else {
      setDisplayedText(text);
    }
  }, [isVisible, text, sender]);

  // Enhanced fade in/out with scale animation
  useEffect(() => {
    if (isVisible) {
      // Fade and scale in
      setOpacity(0);
      setScale(0.8);
      
      const fadeIn = () => {
        let startTime = Date.now();
        const duration = 300;
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          setOpacity(easeOut);
          setScale(0.8 + (0.2 * easeOut));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      };

      fadeIn();

      // Auto fade out after reading time
      const readingTime = Math.max(3000, text.length * 50); // Dynamic timing
      const timer = setTimeout(() => {
        // Fade and scale out
        let startTime = Date.now();
        const duration = 400;
        
        const fadeOut = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          const easeIn = Math.pow(progress, 2);
          
          setOpacity(1 - easeIn);
          setScale(1 - (0.1 * easeIn));
          
          if (progress < 1) {
            requestAnimationFrame(fadeOut);
          } else {
            setTimeout(() => onComplete?.(), 100);
          }
        };
        
        requestAnimationFrame(fadeOut);
      }, readingTime);
      
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      setScale(0.8);
    }
  }, [isVisible, text.length, onComplete]);

  // Face camera with smooth rotation
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

  if (!isVisible || opacity === 0) return null;

  // Enhanced bubble sizing
  const maxChars = 80;
  const truncatedText = displayedText.length > maxChars 
    ? displayedText.substring(0, maxChars - 3) + '...' 
    : displayedText;
    
  const bubbleWidth = Math.max(2.5, Math.min(truncatedText.length * 0.1, 8));
  const lines = Math.ceil(truncatedText.length / 35);
  const bubbleHeight = Math.max(0.8, lines * 0.5);

  // Enhanced colors with gradients
  const bubbleColor = sender === 'user' 
    ? new THREE.Color('#3B82F6') 
    : new THREE.Color('#10B981');
    
  // Add subtle glow effect
  const glowIntensity = isTyping ? 0.3 : 0.1;

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Glow effect */}
      <mesh>
        <planeGeometry args={[bubbleWidth + 0.2, bubbleHeight + 0.2]} />
        <meshBasicMaterial 
          color={bubbleColor}
          transparent 
          opacity={opacity * glowIntensity}
        />
      </mesh>
      
      {/* Main bubble background */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[bubbleWidth, bubbleHeight]} />
        <meshBasicMaterial 
          color={bubbleColor}
          transparent 
          opacity={opacity * 0.95}
        />
      </mesh>
      
      {/* Text with enhanced readability */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.14}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={bubbleWidth - 0.4}
        textAlign="center"
        lineHeight={1.2}
      >
        <meshBasicMaterial transparent opacity={opacity} />
        {truncatedText}
        {isTyping && (
          <meshBasicMaterial transparent opacity={opacity * (Math.sin(Date.now() * 0.01) * 0.5 + 0.5)} />
        )}
      </Text>
      
      {/* Enhanced tail with better positioning */}
      <mesh 
        position={[0, -bubbleHeight/2 - 0.15, 0.001]} 
        rotation={[0, 0, Math.PI / 4]}
      >
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial 
          color={bubbleColor}
          transparent 
          opacity={opacity * 0.95}
        />
      </mesh>
      
      {/* Typing indicator cursor for AI messages */}
      {isTyping && sender === 'ai' && (
        <mesh position={[bubbleWidth/4, 0, 0.03]}>
          <planeGeometry args={[0.05, 0.3]} />
          <meshBasicMaterial 
            color="#FFFFFF"
            transparent 
            opacity={opacity * (Math.sin(Date.now() * 0.01) * 0.5 + 0.5)}
          />
        </mesh>
      )}
    </group>
  );
};