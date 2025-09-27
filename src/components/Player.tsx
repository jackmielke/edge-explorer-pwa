import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3, Box3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { useCylinder } from '@react-three/cannon';

interface PlayerProps {
  position: Vector3;
  rotation: number;
  glbUrl?: string | null;
  onApiReady?: (api: any) => void;
}

export const Player = ({ position, rotation, glbUrl, onApiReady }: PlayerProps) => {
  const modelGroupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  
  // Physics body for collision detection
  const [playerRef, playerApi] = useCylinder(() => ({
    mass: 1,
    position: [position.x, position.y + 0.8, position.z],
    args: [0.3, 0.3, 1.6, 8],
    type: 'Dynamic',
    material: {
      friction: 0.1,
      restitution: 0.3,
    },
    fixedRotation: true, // Prevent physics body from rotating
    linearDamping: 0.4, // Add some movement damping
    angularDamping: 0.4,
  }));

  // Notify parent component when API is ready
  useEffect(() => {
    if (playerApi && onApiReady) {
      onApiReady(playerApi);
    }
  }, [playerApi, onApiReady]);

  // Update physics body position when position prop changes
  useEffect(() => {
    if (playerApi) {
      playerApi.position.set(position.x, position.y + 0.8, position.z);
    }
  }, [position.x, position.y, position.z, playerApi]);

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
    // Apply rotation to the visual group (not the physics body)
    if (playerRef.current) {
      playerRef.current.rotation.y = rotation;
    }
  });

  return (
    <group ref={playerRef as any}>
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