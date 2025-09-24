import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3 } from 'three';

interface PlayerProps {
  position: Vector3;
  rotation: number;
}

export const Player = ({ position, rotation }: PlayerProps) => {
  const playerRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);

  useFrame((state) => {
    // Gentle bobbing animation
    if (playerRef.current) {
      playerRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
    
    // Body rotation
    if (bodyRef.current) {
      bodyRef.current.rotation.y = rotation;
    }
  });

  return (
    <group ref={playerRef} position={[position.x, 0, position.z]}>
      {/* Main body */}
      <mesh 
        ref={bodyRef}
        castShadow
      >
        <capsuleGeometry args={[0.3, 0.8]} />
        <meshLambertMaterial color="hsl(35, 85%, 65%)" />
      </mesh>
      
      {/* Simple head */}
      <mesh 
        position={[0, 0.8, 0]}
        castShadow
      >
        <sphereGeometry args={[0.25]} />
        <meshLambertMaterial color="hsl(25, 70%, 75%)" />
      </mesh>

      {/* Simple eyes */}
      <mesh position={[0.1, 0.85, 0.2]}>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="black" />
      </mesh>
      <mesh position={[-0.1, 0.85, 0.2]}>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="black" />
      </mesh>

      {/* Arms */}
      <mesh 
        position={[0.4, 0.3, 0]}
        rotation={[0, 0, Math.PI / 6]}
        castShadow
      >
        <capsuleGeometry args={[0.1, 0.4]} />
        <meshLambertMaterial color="hsl(25, 70%, 75%)" />
      </mesh>
      <mesh 
        position={[-0.4, 0.3, 0]}
        rotation={[0, 0, -Math.PI / 6]}
        castShadow
      >
        <capsuleGeometry args={[0.1, 0.4]} />
        <meshLambertMaterial color="hsl(25, 70%, 75%)" />
      </mesh>

      {/* Legs */}
      <mesh 
        position={[0.15, -0.6, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.12, 0.5]} />
        <meshLambertMaterial color="hsl(220, 60%, 50%)" />
      </mesh>
      <mesh 
        position={[-0.15, -0.6, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.12, 0.5]} />
        <meshLambertMaterial color="hsl(220, 60%, 50%)" />
      </mesh>
    </group>
  );
};