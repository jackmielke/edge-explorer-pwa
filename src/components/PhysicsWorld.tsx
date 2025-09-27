import React from 'react';
import { Physics } from '@react-three/cannon';

interface PhysicsWorldProps {
  children: React.ReactNode;
}

export const PhysicsWorld = ({ children }: PhysicsWorldProps) => {
  return (
    <Physics 
      gravity={[0, -9.81, 0]}
      defaultContactMaterial={{
        friction: 0.4,
        restitution: 0.3,
      }}
    >
      {children}
    </Physics>
  );
};