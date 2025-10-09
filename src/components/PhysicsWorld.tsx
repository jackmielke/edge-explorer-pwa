import React from 'react';
import { Physics } from '@react-three/cannon';

interface PhysicsWorldProps {
  children: React.ReactNode;
  gravity?: number;
  timeScale?: number;
}

export const PhysicsWorld = ({ 
  children, 
  gravity = -9.81,
  timeScale = 1
}: PhysicsWorldProps) => {
  return (
    <Physics 
      gravity={[0, gravity, 0]}
      defaultContactMaterial={{
        friction: 0.4,
        restitution: 0.3,
      }}
    >
      {children}
    </Physics>
  );
};