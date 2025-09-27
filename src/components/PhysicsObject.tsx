import React, { useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Mesh } from 'three';

interface PhysicsObjectProps {
  id: string;
  objectType: string;
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  physics: {
    collisionType: 'solid' | 'passthrough' | 'platform' | 'bouncy';
    mass?: number;
    friction?: number;
    restitution?: number;
    isStatic?: boolean;
  };
}

export const PhysicsObject = ({ 
  id, 
  objectType, 
  position, 
  scale, 
  color, 
  physics 
}: PhysicsObjectProps) => {
  const meshRef = useRef<Mesh>(null);

  // Determine physics properties based on collision type
  const getRigidBodyType = () => {
    if (physics.isStatic) return 'fixed';
    if (physics.collisionType === 'passthrough') return 'kinematicPosition';
    return 'dynamic';
  };

  // Get material properties
  const getMaterial = () => ({
    friction: physics.friction || 0.3,
    restitution: physics.collisionType === 'bouncy' ? 0.8 : (physics.restitution || 0.3),
  });

  // Render the visual mesh
  const renderGeometry = () => {
    switch (objectType) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'cone':
        return <coneGeometry args={[0.5, 1, 32]} />;
      case 'torus':
        return <torusGeometry args={[0.5, 0.2, 16, 100]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <RigidBody
      key={id}
      type={getRigidBodyType()}
      position={position}
      mass={physics.mass || 1}
      friction={getMaterial().friction}
      restitution={getMaterial().restitution}
      colliders="hull"
    >
      <mesh
        ref={meshRef}
        scale={scale}
        castShadow
        receiveShadow
      >
        {renderGeometry()}
        <meshStandardMaterial 
          color={color}
          transparent={physics.collisionType === 'passthrough'}
          opacity={physics.collisionType === 'passthrough' ? 0.5 : 1}
        />
      </mesh>
    </RigidBody>
  );
};