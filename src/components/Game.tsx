import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls } from '@react-three/drei';
import { Island } from './Island';
import { Player } from './Player';
import { PhysicsPlayer } from './PhysicsPlayer';
import { GameUI } from './GameUI';
import { WorldObjects } from './WorldObjects';
import { OtherPlayers } from './OtherPlayers';
import RetroTextBubble from './RetroTextBubble';
import { ThinkingBubble } from './ThinkingBubble';
import { PhysicsWorld } from './PhysicsWorld';
import { Vibecoins } from './Vibecoins';
import { EddieChatDialog } from './EddieChatDialog';
import { CommunityTerminal3D } from './CommunityTerminal3D';
import { TerminalUI } from './TerminalUI';
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
  const [internalUserId, setInternalUserId] = useState<string | undefined>();
  
  const { 
    playerPosition, 
    playerRotation, 
    playerVelocity,
    handleKeyPress, 
    setJoystickInput, 
    jump, 
    isGrounded,
    shouldJump,
    onJumpComplete,
    setPlayerPosition,
    jumpCount
  } = useGameControls();

  // Get internal user ID from auth user ID
  useEffect(() => {
    const fetchUserId = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (data) {
        setInternalUserId(data.id);
      }
    };
    
    fetchUserId();
  }, [user?.id]);
  
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
  const [physicsMode, setPhysicsMode] = useState(false);
  
  // Chat bubbles state
  const [chatBubbles, setChatBubbles] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    isVisible: boolean;
  }>>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [worldRefreshKey, setWorldRefreshKey] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const handleRefreshWorld = () => setWorldRefreshKey(k => k + 1);

  // Function to show a chat bubble
  const showChatBubble = (text: string, sender: 'user' | 'ai') => {
    const id = Date.now().toString();
    
    // Clear existing bubbles when a new one is added
    setChatBubbles(prev => prev.map(bubble => ({ ...bubble, isVisible: false })));
    
    // Add new bubble immediately
    setChatBubbles(prev => [
      ...prev.filter(bubble => bubble.isVisible === false), // Keep only invisible ones to clean up
      {
        id,
        text,
        sender,
        isVisible: true
      }
    ]);
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
        jump={jump}
        isGrounded={isGrounded}
        community={community}
        onGoHome={onGoHome}
        onChatMessage={showChatBubble}
        onThinkingChange={setIsThinking}
        onRefreshWorld={handleRefreshWorld}
        physicsMode={physicsMode}
        onPhysicsModeChange={setPhysicsMode}
      />

      {/* Chat with Eddie Dialog */}
      <EddieChatDialog open={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Community Terminal UI */}
      {community?.id && (
        <TerminalUI 
          open={isTerminalOpen} 
          onClose={() => setIsTerminalOpen(false)}
          communityId={community.id}
          userId={internalUserId}
        />
      )}

      {/* Click area for opening chat - center of screen */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-auto cursor-pointer rounded-full hover:bg-white/10 transition-all flex items-center justify-center z-20 group"
        onClick={() => setIsChatOpen(true)}
        title="Click to chat with Eddie"
      >
        <span className="text-5xl opacity-30 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300">💬</span>
      </div>
      
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
            <ambientLight intensity={0.8} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1.2}
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
            {community?.id && <WorldObjects communityId={community.id} refreshKey={worldRefreshKey} />}
            
            {/* Vibecoins */}
            {community?.id && (
              <Vibecoins 
                communityId={community.id} 
                playerPosition={playerPosition}
                userId={internalUserId}
              />
            )}

            {/* Community Terminal - positioned on edge of island */}
            {community?.id && (
              <CommunityTerminal3D 
                position={[4, 0.5, 4]}
                onClick={() => setIsTerminalOpen(true)}
              />
            )}
            
            {/* Player Character - Conditionally render based on physics mode */}
            {physicsMode ? (
              <PhysicsPlayer 
                velocity={playerVelocity}
                rotation={playerRotation}
                glbUrl={character?.glb_file_url}
                onPositionUpdate={setPlayerPosition}
                shouldJump={shouldJump}
                onJumpComplete={onJumpComplete}
                jumpCount={jumpCount}
                isGrounded={isGrounded}
              />
            ) : (
              <Player 
                position={playerPosition}
                rotation={playerRotation}
                glbUrl={character?.glb_file_url}
              />
            )}

            {/* Other Players */}
            <OtherPlayers players={otherPlayers} />

            {/* Thinking Bubble */}
            <ThinkingBubble
              playerPosition={[playerPosition[0], playerPosition[1], playerPosition[2]]}
              isVisible={isThinking}
            />

            {/* Chat Bubbles */}
            {chatBubbles.slice(-1).map(bubble => (
              <RetroTextBubble
                key={bubble.id}
                text={bubble.text}
                playerPosition={playerPosition}
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