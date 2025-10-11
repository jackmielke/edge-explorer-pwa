import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ObjectPlacementPreviewProps {
  glbUrl: string;
  scale: { x: number; y: number; z: number };
  onPlace: (position: { x: number; y: number; z: number }) => void;
  islandRadius: number;
}

export const ObjectPlacementPreview = ({ 
  glbUrl, 
  scale, 
  onPlace,
  islandRadius 
}: ObjectPlacementPreviewProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(glbUrl);
  const { camera, raycaster, mouse } = useThree();
  const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 1, 0));

  useFrame(() => {
    if (!meshRef.current) return;

    // Cast ray from camera through mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Create a plane at y=0 to intersect with
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Constrain to island
    const distance = Math.sqrt(intersection.x ** 2 + intersection.z ** 2);
    if (distance > islandRadius) {
      const scaleFactor = islandRadius / distance;
      intersection.x *= scaleFactor;
      intersection.z *= scaleFactor;
    }

    setPosition(intersection);
    meshRef.current.position.copy(intersection);
  });

  const handleClick = () => {
    onPlace({ x: position.x, y: position.y, z: position.z });
  };

  return (
    <group
      ref={meshRef}
      onClick={handleClick}
      scale={[scale.x, scale.y, scale.z]}
    >
      <primitive object={scene.clone()} />
      {/* Semi-transparent indicator circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};