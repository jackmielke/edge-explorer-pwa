import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import vibecoinTexture from '@/assets/vibecoin.png';

interface VibecoinProps {
  position: [number, number, number];
  onCollect: () => void;
  playerPosition: THREE.Vector3;
}

export const Vibecoin = ({ position, onCollect, playerPosition }: VibecoinProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, vibecoinTexture);
  const COLLECT_DISTANCE = 1.2;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Rotate the coin
    meshRef.current.rotation.y += 0.05;

    // Bob up and down
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;

    // Check collision with player
    const distance = meshRef.current.position.distanceTo(playerPosition);
    if (distance < COLLECT_DISTANCE) {
      onCollect();
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[0.8, 0.8]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        alphaTest={0.1}
      />
      {/* Glow effect */}
      <pointLight intensity={0.5} color="#ffd700" distance={3} />
    </mesh>
  );
};
