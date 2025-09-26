import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3, Box3 } from 'three';
import { useGLTF } from '@react-three/drei';

interface PlayerProps {
  position: Vector3;
  rotation: number;
  glbUrl?: string | null;
}

export const Player = ({ position, rotation, glbUrl }: PlayerProps) => {
  const playerRef = useRef<Group>(null);
  const modelGroupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);

  // Load GLB model if provided and valid, with error handling
  let gltf: any = null;
  try {
    gltf = (glbUrl && glbUrl.trim() !== '') ? useGLTF(glbUrl) : null;
  } catch (error) {
    console.warn('Failed to load GLB model:', glbUrl, error);
    gltf = null;
  }

  useEffect(() => {
    if (!modelGroupRef.current) return;

    // Clear previous model children when URL changes
    modelGroupRef.current.clear();

    if (gltf?.scene) {
      const model = gltf.scene.clone(true);
      model.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          // Fix common GLB lighting issues
          if (obj.material) {
            obj.material.needsUpdate = true;
            // Ensure proper lighting response
            if (obj.material.metalness !== undefined) obj.material.metalness = 0.1;
            if (obj.material.roughness !== undefined) obj.material.roughness = 0.8;
          }
        }
      });

      // Temporarily add to group to measure
      modelGroupRef.current.add(model);

      // Fit model to ~1.6 units height and place on ground
      const box = new Box3().setFromObject(modelGroupRef.current);
      const size = new Vector3();
      const center = new Vector3();
      box.getSize(size);
      box.getCenter(center);

      const desiredHeight = 1.6;
      const scale = size.y > 0 ? desiredHeight / size.y : 1;
      modelGroupRef.current.scale.setScalar(scale);

      // After scaling, recompute box to offset to ground
      const scaledBox = new Box3().setFromObject(modelGroupRef.current);
      const minY = scaledBox.min.y;
      modelGroupRef.current.position.y -= minY; // lift to ground level
    }
  }, [glbUrl, gltf]);

  useFrame((state) => {
    // Gentle bobbing animation
    if (playerRef.current) {
      playerRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      // Apply facing rotation to the whole player (model or placeholder)
      playerRef.current.rotation.y = rotation;
    }
  });

  return (
    <group ref={playerRef} position={[position.x, 0, position.z]}>
      {glbUrl && gltf?.scene ? (
        <group ref={modelGroupRef} />
      ) : (
        <>
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
        </>
      )}
    </group>
  );
};