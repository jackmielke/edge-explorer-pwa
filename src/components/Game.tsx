import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls } from '@react-three/drei';
import { Island } from './Island';
import { Player } from './Player';
import { GameUI } from './GameUI';
import { WorldObjects } from './WorldObjects';
import { OtherPlayers } from './OtherPlayers';
import { EnhancedTextBubble } from './EnhancedTextBubble';
import { ThinkingBubble } from './ThinkingBubble';
import { PhysicsWorld } from './PhysicsWorld';
import { Button } from './ui/button';
import { Home } from 'lucide-react';
import { useGameControls } from '../hooks/useGameControls';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  game_design_sky_color?: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  glb_file_url: string;
  thumbnail_url: string | null;
}

interface GameProps {
  user: User | null;
  community?: Community | null;
  character?: Character | null;
  onGoHome: () => void;
}

export const Game = ({ user, community, character, onGoHome }: GameProps) => {
  const { playerPosition, playerRotation, handleKeyPress, setJoystickInput, jump, isGrounded } = useGameControls();
  
  // Multiplayer functionality
  const { otherPlayers } = useMultiplayer({
    user,
    communityId: community?.id || null,
    playerPosition,
    playerRotation,
    characterUrl: character?.glb_file_url
  });
  
  // Get sky color from community or use default
  const [skyColor, setSkyColor] = useState(community?.game_design_sky_color || '#87CEEB');
  
  // Enhanced chat bubbles state with queue management
  const [messageQueue, setMessageQueue] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
  }>>([]);
  const [currentMessage, setCurrentMessage] = useState<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
  } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const processQueue = useRef(false);

  // Enhanced function to show a chat bubble with queue management
  const showChatBubble = (text: string, sender: 'user' | 'ai') => {
    const message = {
      id: Date.now().toString() + Math.random(),
      text,
      sender,
      timestamp: Date.now()
    };
    
    setMessageQueue(prev => [...prev, message]);
  };

  // Show thinking animation
  const showThinking = () => {
    setIsThinking(true);
  };

  // Hide thinking animation  
  const hideThinking = () => {
    setIsThinking(false);
  };

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
    };

    if (!currentMessage && messageQueue.length > 0) {
      processNextMessage();
    }
  }, [messageQueue, currentMessage]);

  // Handle message completion
  const handleMessageComplete = () => {
    setCurrentMessage(null);
    processQueue.current = false;
    
    // Small delay between messages
    setTimeout(() => {
      // Next message will be processed by the useEffect
    }, 500);
  };

  // Listen for real-time sky color updates
  useEffect(() => {
    if (!community?.id) return;

    const channel = supabase
      .channel('community-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'communities',
          filter: `id=eq.${community.id}`
        },
        (payload) => {
          console.log('Community updated:', payload);
          if (payload.new.game_design_sky_color) {
            setSkyColor(payload.new.game_design_sky_color);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [community?.id]);

  return (
    <div className="w-full h-screen bg-sky relative overflow-hidden">
      {/* Game UI */}
      <GameUI 
        setJoystickInput={setJoystickInput}
        jump={jump}
        isGrounded={isGrounded}
        community={community}
        onGoHome={onGoHome}
        onChatMessage={showChatBubble}
        onShowThinking={showThinking}
        onHideThinking={hideThinking}
      />
      
      {/* 3D Scene */}
      <Canvas
        camera={{ 
          position: [0, 8, 8], 
          fov: 60,
        }}
        shadows
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = 2; // THREE.PCFSoftShadowMap
        }}
      >
        <Suspense fallback={null}>
          <PhysicsWorld>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-camera-far={50}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
            />

            {/* Sky */}
            <Sky 
              distance={1000}
              sunPosition={[10, 10, 5]}
              inclination={0.2}
              azimuth={0.25}
            />
            
            {/* Sky color overlay */}
            <mesh position={[0, 50, 0]} scale={[200, 200, 200]}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial color={skyColor} side={2} transparent opacity={0.3} />
            </mesh>

            {/* Game World */}
            <Island />
            
            {/* World Objects */}
            {community?.id && <WorldObjects communityId={community.id} />}
            
            {/* Player Character */}
            <Player 
              position={playerPosition} 
              rotation={playerRotation}
              glbUrl={character?.glb_file_url}
            />

            {/* Other Players */}
            <OtherPlayers players={otherPlayers} />

            {/* Enhanced Chat Bubbles with Queue Management */}
            {/* Thinking Animation */}
            {isThinking && !currentMessage && (
              <ThinkingBubble 
                playerPosition={playerPosition}
                isVisible={true}
              />
            )}

            {/* Current Message Bubble */}
            {currentMessage && (
              <EnhancedTextBubble
                key={currentMessage.id}
                text={currentMessage.text}
                playerPosition={playerPosition}
                isVisible={true}
                sender={currentMessage.sender}
                onComplete={handleMessageComplete}
              />
            )}

            {/* Camera controls - follow player */}
            <OrbitControls
              target={playerPosition}
              maxPolarAngle={Math.PI / 2.2}
              minDistance={5}
              maxDistance={15}
              enablePan={false}
            />
          </PhysicsWorld>
        </Suspense>
      </Canvas>

      {/* Invisible key handler */}
      <input
        type="text"
        className="absolute opacity-0 pointer-events-none"
        onKeyDown={handleKeyPress}
        onKeyUp={handleKeyPress}
        autoFocus
      />
    </div>
  );
};