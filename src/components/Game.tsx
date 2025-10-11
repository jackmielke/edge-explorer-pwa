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
import { GenerationStatus } from './GenerationStatus';
import { RealityControls } from './RealityControls';
import { ObjectPlacementModal } from './ObjectPlacementModal';
import { ObjectPlacementPreview } from './ObjectPlacementPreview';
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
  game_design_gravity_y?: number;
  game_design_time_scale?: number;
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
    setPlayerPosition
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
  
  // Get sky color and reality settings from community or use defaults
  const [skyColor, setSkyColor] = useState(community?.game_design_sky_color || '#87CEEB');
  const [gravity, setGravity] = useState(community?.game_design_gravity_y || -9.81);
  const [timeScale, setTimeScale] = useState(community?.game_design_time_scale || 1.0);
  const [physicsMode, setPhysicsMode] = useState(false);
  const [experimentalMode, setExperimentalMode] = useState(false);
  const [showRealityControls, setShowRealityControls] = useState(false);
  const [showObjectModal, setShowObjectModal] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);
  const [placementData, setPlacementData] = useState<{
    glbUrl: string;
    name: string;
    scale: { x: number; y: number; z: number };
  } | null>(null);
  
  // Chat bubbles state
  const [chatBubbles, setChatBubbles] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    isVisible: boolean;
  }>>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [worldRefreshKey, setWorldRefreshKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  
  const handleRefreshWorld = () => setWorldRefreshKey(k => k + 1);
  
  const handleGenerationStatus = (generating: boolean, status: string) => {
    setIsGenerating(generating);
    setGenerationStatus(status);
  };

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

  // Listen for real-time community updates (sky color, gravity, time scale)
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
          if (payload.new.game_design_gravity_y !== undefined) {
            setGravity(payload.new.game_design_gravity_y);
          }
          if (payload.new.game_design_time_scale !== undefined) {
            setTimeScale(payload.new.game_design_time_scale);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [community?.id]);

  // Update reality settings
  const handleRealityChange = async (newGravity: number, newTimeScale: number) => {
    if (!community?.id) return;

    setGravity(newGravity);
    setTimeScale(newTimeScale);

    try {
      const { error } = await supabase.functions.invoke('update-reality-settings', {
        body: {
          communityId: community.id,
          gravity: newGravity,
          timeScale: newTimeScale,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating reality settings:', error);
    }
  };

  const handleObjectModalConfirm = (glbUrl: string, name: string, scale: { x: number; y: number; z: number }) => {
    setPlacementData({ glbUrl, name, scale });
    setShowObjectModal(false);
    setPlacementMode(true);
  };

  const handleObjectPlace = async (position: { x: number; y: number; z: number }) => {
    if (!placementData || !community?.id) return;

    try {
      const { error } = await supabase.functions.invoke('spawn-object', {
        body: {
          communityId: community.id,
          objectType: 'custom-model',
          position,
          properties: {
            glbUrl: placementData.glbUrl,
            name: placementData.name,
            scale: placementData.scale,
            color: '#ffffff',
          },
        },
      });

      if (error) throw error;

      setPlacementMode(false);
      setPlacementData(null);
      handleRefreshWorld();
    } catch (error) {
      console.error('Error placing object:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-sky relative overflow-hidden">
      {/* Generation Status Indicator */}
      <GenerationStatus isGenerating={isGenerating} status={generationStatus} />
      
      {/* Reality Controls */}
      {showRealityControls && (
        <RealityControls
          gravity={gravity}
          timeScale={timeScale}
          onGravityChange={(g) => handleRealityChange(g, timeScale)}
          onTimeScaleChange={(ts) => handleRealityChange(gravity, ts)}
        />
      )}
      
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
        experimentalMode={experimentalMode}
        onExperimentalModeChange={setExperimentalMode}
        onGenerationStatus={handleGenerationStatus}
        showRealityControls={showRealityControls}
        onRealityControlsToggle={() => setShowRealityControls(!showRealityControls)}
        onAddObjectClick={() => setShowObjectModal(true)}
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
          <PhysicsWorld gravity={gravity} timeScale={timeScale}>
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
            {community?.id && <WorldObjects communityId={community.id} refreshKey={worldRefreshKey} experimentalMode={experimentalMode} />}
            
            {/* Vibecoins */}
            {community?.id && (
              <Vibecoins 
                communityId={community.id} 
                playerPosition={playerPosition}
                userId={internalUserId}
              />
            )}
            
            {/* Object Placement Preview */}
            {placementMode && placementData && (
              <ObjectPlacementPreview
                glbUrl={placementData.glbUrl}
                scale={placementData.scale}
                onPlace={handleObjectPlace}
                islandRadius={11}
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

      {/* Object Placement Modal */}
      <ObjectPlacementModal
        isOpen={showObjectModal}
        onClose={() => setShowObjectModal(false)}
        onConfirm={handleObjectModalConfirm}
      />

      {/* Placement Instructions */}
      {placementMode && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/30">
          <p className="text-white text-sm font-medium">
            Click anywhere on the island to place your object
          </p>
        </div>
      )}

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