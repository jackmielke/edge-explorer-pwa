import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls } from '@react-three/drei';
import { Island } from './Island';
import { Player } from './Player';
import { GameUI } from './GameUI';
import { Button } from './ui/button';
import { Home } from 'lucide-react';
import { useGameControls } from '../hooks/useGameControls';
import { User } from '@supabase/supabase-js';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
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

  return (
    <div className="w-full h-screen bg-sky relative overflow-hidden">
      {/* Game UI */}
      <GameUI 
        setJoystickInput={setJoystickInput} 
        community={community}
        onGoHome={onGoHome}
        playerPosition={playerPosition}
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

          {/* Game World */}
          <Island />
          
          {/* Player Character */}
          <Player 
            position={playerPosition} 
            rotation={playerRotation}
            glbUrl={character?.glb_file_url}
          />

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