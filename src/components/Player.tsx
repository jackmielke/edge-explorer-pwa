import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3, Box3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { useCylinder } from '@react-three/cannon';

interface PlayerProps {
  glbUrl?: string | null;
  onPositionUpdate?: (position: Vector3, rotation: number) => void;
  movementInput: { x: number; z: number };
  shouldJump: boolean;
  onJumpComplete?: () => void;
}

export interface PlayerRef {
  getPosition: () => Vector3;
  getRotation: () => number;
  isGrounded: () => boolean;
}

export const Player = forwardRef<PlayerRef, PlayerProps>(({ 
  glbUrl, 
  onPositionUpdate, 
  movementInput,
  shouldJump,
  onJumpComplete
}, ref) => {
  const modelGroupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const visualGroupRef = useRef<Group>(null);
  const lastJumpRef = useRef(false);
  const playerRotation = useRef(0);
  const isGroundedRef = useRef(true);

  // Create physics body with cylinder shape
  const [physicsRef, physicsApi] = useCylinder(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [0, 1, 0], // Start above ground
    args: [0.4, 0.4, 1.6, 8], // topRadius, bottomRadius, height, segments
    material: {
      friction: 0.4,
      restitution: 0.1 // Less bouncy
    }
  }));

  // Movement constants
  const MOVE_FORCE = 8;
  const JUMP_FORCE = 6;
  const MAX_SPEED = 4;
  const ISLAND_RADIUS = 5.5;

  // Load GLB model if provided and valid, with error handling
  let gltf: any = null;
  try {
    gltf = (glbUrl && glbUrl.trim() !== '') ? useGLTF(glbUrl) : null;
  } catch (error) {
    console.warn('Failed to load GLB model:', glbUrl, error);
    gltf = null;
  }

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getPosition: () => {
      if (physicsRef.current) {
        return physicsRef.current.position.clone();
      }
      return new Vector3(0, 0, 0);
    },
    getRotation: () => playerRotation.current,
    isGrounded: () => isGroundedRef.current
  }), []);

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
    if (!physicsRef.current) return;

    // Get current physics state
    const currentPos = physicsRef.current.position;

    // Check if grounded (simple ground check)
    const newIsGrounded = currentPos.y <= 1.0; // Physics body center is ~0.8m when on ground
    isGroundedRef.current = newIsGrounded;

    // Apply movement forces
    if (movementInput.x !== 0 || movementInput.z !== 0) {
      // Constrain to island (apply force to push back if too far)
      const distance = Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z);
      
      let forceX = movementInput.x * MOVE_FORCE;
      let forceZ = movementInput.z * MOVE_FORCE;
      
      // If approaching island edge, reduce force in that direction
      if (distance > ISLAND_RADIUS * 0.8) {
        const pushBackForce = (distance - ISLAND_RADIUS * 0.8) * 10;
        const normalX = -currentPos.x / distance;
        const normalZ = -currentPos.z / distance;
        
        forceX += normalX * pushBackForce;
        forceZ += normalZ * pushBackForce;
      }
      
      // Apply movement force
      physicsApi.applyForce([forceX, 0, forceZ], [0, 0, 0]);

      // Update rotation based on movement direction
      const targetRotation = Math.atan2(movementInput.x, movementInput.z);
      const rotationDiff = ((targetRotation - playerRotation.current + Math.PI) % (2 * Math.PI)) - Math.PI;
      playerRotation.current += rotationDiff * 0.1; // Smooth rotation
    }

    // Handle jumping
    if (shouldJump && !lastJumpRef.current && newIsGrounded) {
      physicsApi.applyImpulse([0, JUMP_FORCE, 0], [0, 0, 0]);
      onJumpComplete?.();
    }
    lastJumpRef.current = shouldJump;

    // Update visual representation
    if (visualGroupRef.current) {
      // Copy physics body position to visual group, offsetting for ground level
      visualGroupRef.current.position.copy(currentPos);
      visualGroupRef.current.position.y -= 0.8; // Offset since physics center is at mid-height
      
      // Apply rotation to visual representation
      visualGroupRef.current.rotation.y = playerRotation.current;
      
      // Add gentle bobbing animation for visual appeal when on ground
      const bobbingY = newIsGrounded ? Math.sin(state.clock.elapsedTime * 3) * 0.02 : 0;
      visualGroupRef.current.position.y += bobbingY;
    }

    // Notify parent of position updates
    if (onPositionUpdate) {
      onPositionUpdate(currentPos.clone(), playerRotation.current);
    }
  });

  return (
    <>
      {/* Visual representation - follows physics body */}
      <group ref={visualGroupRef}>
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
    </>
  );
});

Player.displayName = 'Player';