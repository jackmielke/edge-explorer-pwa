import React, { useEffect } from 'react';

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

interface WorldObjectsProps {
  objects: WorldObject[];
}

export const WorldObjects = ({ objects }: WorldObjectsProps) => {
  const renderObject = (obj: WorldObject) => {
    const position: [number, number, number] = [obj.position.x, obj.position.y, obj.position.z];
    const scale: [number, number, number] = obj.properties.scale 
      ? [obj.properties.scale.x, obj.properties.scale.y, obj.properties.scale.z] 
      : [1, 1, 1];

    switch (obj.object_type) {
      case 'box':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      case 'sphere':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      case 'cylinder':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      case 'cone':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <coneGeometry args={[0.5, 1, 32]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      case 'torus':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <torusGeometry args={[0.5, 0.2, 16, 100]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {objects.map(renderObject)}
    </>
  );
};