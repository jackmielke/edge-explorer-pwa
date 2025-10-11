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
  const ISLAND_RADIUS = 11;
  const JUMP_FORCE = 5;
  
  // Create physics cylinder body for the player
  const [ref, api] = useCylinder<THREE.Group>(() => ({
    mass: 1,
    position: [0, 1, 0],
    args: [0.3, 0.3, 1.5, 8], // radius top, radius bottom, height, segments
    fixedRotation: true, // Prevent the cylinder from tipping over
    linearDamping: 0.2, // Light damping for smoother movement
  }));

  const velocityRef = useRef(velocity);
  const rotationRef = useRef(rotation);
  const jumpRequestedRef = useRef(false);
  const yVelRef = useRef(0);

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

  // Track current vertical velocity to preserve jump/gravity
  useEffect(() => {
    const unsubscribe = api.velocity.subscribe((v) => {
      yVelRef.current = v[1];
    });
    return unsubscribe;
  }, [api]);

  // Apply velocity every frame (only X/Z, keep Y from physics)
  useEffect(() => {
    let frameId: number;
    const SPEED = 4.5; // units per second (handled by physics step)
    
    const updateVelocity = () => {
      let { x: ix, z: iz } = velocityRef.current;
      // Normalize input to length <= 1
      const mag = Math.hypot(ix, iz);
      if (mag > 1) {
        ix /= mag; iz /= mag;
      }

      const vx = ix * SPEED;
      const vz = iz * SPEED;

      // Preserve Y velocity from physics
      api.velocity.set(vx, yVelRef.current, vz);
      
      // Handle jump only when near-ground (low vertical speed)
      if (jumpRequestedRef.current && Math.abs(yVelRef.current) < 0.05) {
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
