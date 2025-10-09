import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import type { Triplet } from '@react-three/cannon';
import * as THREE from 'three';

interface PhysicsGLBObjectProps {
  id: string;
  glbUrl: string;
  position: [number, number, number];
  scale?: [number, number, number];
  physics?: {
    collisionType: 'solid' | 'passthrough' | 'platform' | 'bouncy';
    mass?: number;
    friction?: number;
    restitution?: number;
    isStatic?: boolean;
  };
}

export const PhysicsGLBObject = ({ 
  id, 
  glbUrl, 
  position, 
  scale = [1, 1, 1],
  physics = { collisionType: 'solid' }
}: PhysicsGLBObjectProps) => {
  
  // Load the GLB model
  const { scene } = useGLTF(glbUrl);
  
  // Calculate bounding box for physics
  const boundingBox = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  
  // Scale the collision box based on model size and scale prop
  const collisionSize: Triplet = [
    size.x * scale[0],
    size.y * scale[1],
    size.z * scale[2]
  ];

  // Get physics properties
  const getPhysicsProps = () => ({
    mass: physics.isStatic ? 0 : (physics.mass || 1),
    position,
    args: collisionSize,
    material: {
      friction: physics.friction || 0.3,
      restitution: physics.collisionType === 'bouncy' ? 0.8 : (physics.restitution || 0.3),
    },
    type: physics.isStatic ? 'Static' : (physics.collisionType === 'passthrough' ? 'Kinematic' : 'Dynamic') as 'Dynamic' | 'Kinematic' | 'Static',
  });

  const [ref] = useBox(() => getPhysicsProps());

  // Clone the scene to avoid issues with reusing the same object
  const clonedScene = scene.clone();

  return (
    <primitive 
      ref={ref as any}
      object={clonedScene}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
};
