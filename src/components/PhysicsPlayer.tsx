import { useRef, useEffect } from 'react';
import { useCylinder } from '@react-three/cannon';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { Player } from './Player';

interface PhysicsPlayerProps {
  glbUrl?: string | null;
  velocity: { x: number; y: number; z: number };
  rotation: number;
  onPositionUpdate: (position: Vector3) => void;
  shouldJump: boolean;
  onJumpComplete: () => void;
}

export const PhysicsPlayer = ({ 
  glbUrl, 
  velocity, 
  rotation, 
  onPositionUpdate,
  shouldJump,
  onJumpComplete
}: PhysicsPlayerProps) => {
  const ISLAND_RADIUS = 5.5;
  const JUMP_FORCE = 5;
  
  // Create physics cylinder body for the player
  const [ref, api] = useCylinder<THREE.Group>(() => ({
    mass: 1,
    position: [0, 1, 0],
    args: [0.3, 0.3, 1.5, 8], // radius top, radius bottom, height, segments
    fixedRotation: true, // Prevent the cylinder from tipping over
    linearDamping: 0.9, // Add damping to prevent sliding
    material: {
      friction: 0.1,
      restitution: 0.0, // No bouncing
    }
  }));

  const velocityRef = useRef(velocity);
  const rotationRef = useRef(rotation);
  const jumpRequestedRef = useRef(false);

  // Update refs when props change
  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (shouldJump) {
      jumpRequestedRef.current = true;
    }
  }, [shouldJump]);

  // Apply movement and handle jump
  useEffect(() => {
    const unsubscribe = api.position.subscribe((pos) => {
      onPositionUpdate(new Vector3(pos[0], pos[1], pos[2]));
      
      // Constrain to island
      const distance = Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]);
      if (distance > ISLAND_RADIUS) {
        const scale = ISLAND_RADIUS / distance;
        api.position.set(pos[0] * scale, pos[1], pos[2] * scale);
      }
    });

    return unsubscribe;
  }, [api, onPositionUpdate]);

  // Apply velocity every frame
  useEffect(() => {
    let frameId: number;
    
    const updateVelocity = () => {
      const vel = velocityRef.current;
      
      // Apply horizontal velocity
      api.velocity.set(vel.x, vel.y, vel.z);
      
      // Handle jump
      if (jumpRequestedRef.current) {
        api.applyImpulse([0, JUMP_FORCE, 0], [0, 0, 0]);
        jumpRequestedRef.current = false;
        onJumpComplete();
      }
      
      frameId = requestAnimationFrame(updateVelocity);
    };
    
    frameId = requestAnimationFrame(updateVelocity);
    return () => cancelAnimationFrame(frameId);
  }, [api, onJumpComplete]);

  // Track current position for rendering
  const positionRef = useRef(new Vector3(0, 0, 0));
  
  useEffect(() => {
    const unsubscribe = api.position.subscribe((pos) => {
      positionRef.current.set(pos[0], pos[1] - 0.75, pos[2]); // Offset to align visual with physics
    });
    return unsubscribe;
  }, [api]);

  return (
    <group ref={ref}>
      {/* Visual player - offset to align with physics body */}
      <group position={[0, -0.75, 0]}>
        <Player 
          position={new Vector3(0, 0, 0)} 
          rotation={rotation} 
          glbUrl={glbUrl} 
        />
      </group>
    </group>
  );
};
