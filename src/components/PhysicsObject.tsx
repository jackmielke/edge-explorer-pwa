import React from 'react';
import { useBox, useSphere, useCylinder } from '@react-three/cannon';
import type { Triplet } from '@react-three/cannon';

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

  // Get physics properties
  const getPhysicsProps = () => ({
    mass: physics.isStatic ? 0 : (physics.mass || 1),
    position,
    material: {
      friction: physics.friction || 0.3,
      restitution: physics.collisionType === 'bouncy' ? 0.8 : (physics.restitution || 0.3),
    },
    type: (physics.collisionType === 'passthrough' ? 'Kinematic' : 'Dynamic') as 'Dynamic' | 'Kinematic' | 'Static',
  });

  // Use appropriate physics hook
  const usePhysicsHook = () => {
    const props = getPhysicsProps();
    
    switch (objectType) {
      case 'sphere':
        return useSphere(() => ({ ...props, args: [0.5] as const }));
      case 'cylinder':
        return useCylinder(() => ({ ...props, args: [0.5, 0.5, 1, 8] as const }));
      default:
        return useBox(() => ({ ...props, args: scale as Triplet }));
    }
  };

  const [ref] = usePhysicsHook();

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
    <mesh
      ref={ref as any}
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
  );
};