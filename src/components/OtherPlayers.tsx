import React from 'react';
import { SimplePlayer } from './SimplePlayer';
import { Vector3 } from 'three';

interface PlayerData {
  id: string;
  userId: string;
  userName: string;
  position: Vector3;
  rotation: number;
  characterUrl?: string;
  lastSeen: Date;
}

interface OtherPlayersProps {
  players: PlayerData[];
}

export const OtherPlayers = ({ players }: OtherPlayersProps) => {
  console.log('Rendering other players:', players);
  
  return (
    <>
      {players.map(player => (
        <group key={player.id}>
          <SimplePlayer
            position={player.position}
            rotation={player.rotation}
            glbUrl={player.characterUrl}
          />
          {/* Player name tag */}
          <mesh position={[player.position.x, player.position.y + 2.5, player.position.z]}>
            <planeGeometry args={[1.5, 0.3]} />
            <meshBasicMaterial color="rgba(0,0,0,0.7)" transparent />
          </mesh>
          {/* TODO: Add text rendering for player names when text rendering is available */}
        </group>
      ))}
    </>
  );
};