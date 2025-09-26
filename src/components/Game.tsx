import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls } from '@react-three/drei';
import { Island } from './Island';
import { Player } from './Player';
import { GameUI } from './GameUI';
import { WorldObjects } from './WorldObjects';
import { Button } from './ui/button';
import { Home } from 'lucide-react';
import { useGameControls } from '../hooks/useGameControls';
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

interface WorldObject {
  id: string;
  object_type: string;
  position: { x: number; y: number; z: number };
  properties: { 
    color: string; 
    scale?: { x: number; y: number; z: number };
  };
  created_at: string;
}

interface GameProps {
  user: User | null;
  community?: Community | null;
  character?: Character | null;
  onGoHome: () => void;
}

export const Game = ({ user, community, character, onGoHome }: GameProps) => {
  const [worldObjects, setWorldObjects] = useState<WorldObject[]>([]);
  const { playerPosition, playerRotation, handleKeyPress, setJoystickInput } = useGameControls(worldObjects);
  
  // Get sky color from community or use default
  const [skyColor, setSkyColor] = useState(community?.game_design_sky_color || '#87CEEB');

  // Fetch and manage world objects
  useEffect(() => {
    if (!community?.id) return;

    // Fetch existing objects
    const fetchObjects = async () => {
      const { data, error } = await supabase
        .from('world_objects')
        .select('*')
        .eq('community_id', community.id);

      if (error) {
        console.error('Error fetching world objects:', error);
        return;
      }

      // Type-safe conversion of the data
      const typedObjects = (data || []).map(obj => ({
        id: obj.id,
        object_type: obj.object_type,
        position: obj.position as { x: number; y: number; z: number },
        properties: obj.properties as { color: string; scale?: { x: number; y: number; z: number } },
        created_at: obj.created_at
      }));

      setWorldObjects(typedObjects);
    };

    fetchObjects();

    // Subscribe to real-time updates for world objects
    const objectsChannel = supabase
      .channel('world-objects-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'world_objects',
          filter: `community_id=eq.${community.id}`
        },
        (payload) => {
          console.log('New object spawned:', payload);
          const newObject = {
            id: payload.new.id,
            object_type: payload.new.object_type,
            position: payload.new.position as { x: number; y: number; z: number },
            properties: payload.new.properties as { color: string; scale?: { x: number; y: number; z: number } },
            created_at: payload.new.created_at
          };
          setWorldObjects(prev => [...prev, newObject]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'world_objects',
          filter: `community_id=eq.${community.id}`
        },
        (payload) => {
          console.log('Object deleted:', payload);
          setWorldObjects(prev => prev.filter(obj => obj.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'world_objects',
          filter: `community_id=eq.${community.id}`
        },
        (payload) => {
          console.log('Object updated:', payload);
          const updatedObject = {
            id: payload.new.id,
            object_type: payload.new.object_type,
            position: payload.new.position as { x: number; y: number; z: number },
            properties: payload.new.properties as { color: string; scale?: { x: number; y: number; z: number } },
            created_at: payload.new.created_at
          };
          setWorldObjects(prev => prev.map(obj => 
            obj.id === payload.new.id ? updatedObject : obj
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(objectsChannel);
    };
  }, [community?.id]);

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
          {community?.id && <WorldObjects objects={worldObjects} />}
          
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