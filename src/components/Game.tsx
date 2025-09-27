import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls } from '@react-three/drei';
import { Island } from './Island';
import { Player } from './Player';
import { GameUI } from './GameUI';
import { WorldObjects } from './WorldObjects';
import { OtherPlayers } from './OtherPlayers';
import { TextBubble } from './TextBubble';
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
  const { playerPosition, playerRotation, handleKeyPress, setJoystickInput } = useGameControls();
  
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
  
  // Chat bubbles state
  const [chatBubbles, setChatBubbles] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    isVisible: boolean;
  }>>([]);

  // Function to show a chat bubble
  const showChatBubble = (text: string, sender: 'user' | 'ai') => {
    const id = Date.now().toString();
    
    setChatBubbles(prev => [...prev, {
      id,
      text,
      sender,
      isVisible: true
    }]);
  };

  // Function to remove a chat bubble
  const removeChatBubble = (id: string) => {
    setChatBubbles(prev => prev.filter(bubble => bubble.id !== id));
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
        community={community}
        onGoHome={onGoHome}
        onChatMessage={showChatBubble}
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

          {/* Chat Bubbles */}
          {chatBubbles.map(bubble => (
            <TextBubble
              key={bubble.id}
              text={bubble.text}
              playerPosition={playerPosition}
              isVisible={bubble.isVisible}
              sender={bubble.sender}
              onComplete={() => removeChatBubble(bubble.id)}
            />
          ))}

          {/* Camera controls - follow player */}
          <OrbitControls
            target={playerPosition}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={15}
            enablePan={false}
          />
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