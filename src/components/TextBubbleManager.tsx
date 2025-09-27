import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TextBubble } from './TextBubble';
import * as THREE from 'three';

interface QueuedMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

interface TextBubbleManagerProps {
  playerPosition: THREE.Vector3;
  onChatMessage?: (text: string, sender: 'user' | 'ai') => void;
}

export const TextBubbleManager = ({ playerPosition, onChatMessage }: TextBubbleManagerProps) => {
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<QueuedMessage | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const processQueue = useRef(false);

  // Queue management
  const addMessage = useCallback((text: string, sender: 'user' | 'ai') => {
    const message: QueuedMessage = {
      id: Date.now().toString() + Math.random(),
      text,
      sender,
      timestamp: Date.now()
    };

    setMessageQueue(prev => [...prev, message]);
  }, []);

  // Show thinking animation
  const showThinking = useCallback(() => {
    setIsThinking(true);
  }, []);

  const hideThinking = useCallback(() => {
    setIsThinking(false);
  }, []);

  // Process message queue
  useEffect(() => {
    const processNextMessage = async () => {
      if (processQueue.current || messageQueue.length === 0) return;
      
      processQueue.current = true;
      const nextMessage = messageQueue[0];
      
      // Remove message from queue
      setMessageQueue(prev => prev.slice(1));
      
      // Show current message
      setCurrentMessage(nextMessage);
      
      // Wait for message completion (bubble handles its own timing)
      // The bubble will call onComplete when it's done
    };

    if (!currentMessage && messageQueue.length > 0) {
      processNextMessage();
    }
  }, [messageQueue, currentMessage]);

  // Handle message completion
  const handleMessageComplete = useCallback(() => {
    setCurrentMessage(null);
    processQueue.current = false;
    
    // Small delay between messages to prevent overwhelming
    setTimeout(() => {
      // Process next message if any
    }, 300);
  }, []);

  // Expose methods to parent components
  useEffect(() => {
    if (onChatMessage) {
      // Override the onChatMessage to use our queue system
      const originalOnChatMessage = onChatMessage;
      // We'll handle this through props instead
    }
  }, [onChatMessage]);

  return (
    <>
      {/* Thinking Animation */}
      {isThinking && !currentMessage && (
        <ThinkingBubble 
          playerPosition={playerPosition}
          isVisible={true}
        />
      )}

      {/* Current Message Bubble */}
      {currentMessage && (
        <TextBubble
          key={currentMessage.id}
          text={currentMessage.text}
          playerPosition={playerPosition}
          isVisible={true}
          sender={currentMessage.sender}
          onComplete={handleMessageComplete}
        />
      )}
    </>
  );
};

// Thinking animation component
const ThinkingBubble = ({ playerPosition, isVisible }: {
  playerPosition: THREE.Vector3;
  isVisible: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [dotOpacity, setDotOpacity] = useState([1, 0.5, 0.3]);

  // Animate thinking dots
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDotOpacity(prev => [
        prev[2], // Move last to first
        prev[0], // Move first to second  
        prev[1]  // Move second to third
      ]);
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  const yOffset = 3.5;
  const position: [number, number, number] = [
    playerPosition.x, 
    playerPosition.y + yOffset, 
    playerPosition.z
  ];

  if (!isVisible) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Background */}
      <mesh>
        <planeGeometry args={[1.5, 0.8]} />
        <meshBasicMaterial 
          color="#10B981" 
          transparent 
          opacity={0.95}
        />
      </mesh>
      
      {/* Thinking dots */}
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
      <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.15, 0.15]} />
        <meshBasicMaterial 
          color="#10B981" 
          transparent 
          opacity={0.95}
        />
      </mesh>
    </group>
  );
};