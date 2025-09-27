import { useState, useEffect, useCallback, useRef } from 'react';
import { Vector3 } from 'three';

interface GameControls {
  playerPosition: Vector3;
  playerRotation: number;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  setJoystickInput: (input: { x: number; y: number }) => void;
  jump: () => void;
  isGrounded: boolean;
  setPhysicsApi: (api: any) => void; // New: to receive physics API
}

export const useGameControls = (): GameControls => {
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [isGrounded, setIsGrounded] = useState(true);
  
  // Refs to hold physics API and latest input states
  const physicsApiRef = useRef<any>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ x: 0, y: 0 });
  const isGroundedRef = useRef(true);

  // Physics movement constants
  const MOVE_FORCE = 8; // Force applied for movement
  const JUMP_FORCE = 12; // Force applied for jumping
  const MAX_SPEED = 5; // Maximum movement speed
  const ISLAND_RADIUS = 5.5; // Keep player on the island

  // Function to set the physics API from the Player component
  const setPhysicsApi = useCallback((api: any) => {
    physicsApiRef.current = api;
    
    // Subscribe to physics body position updates
    if (api && api.position) {
      api.position.subscribe((pos: [number, number, number]) => {
        setPlayerPosition(new Vector3(pos[0], pos[1], pos[2]));
      });
    }
  }, []);

  const jump = useCallback(() => {
    if (isGroundedRef.current && physicsApiRef.current?.velocity) {
      // Apply upward velocity for jumping
      physicsApiRef.current.velocity.set(0, JUMP_FORCE, 0);
      setIsGrounded(false);
    }
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    const key = e.key;
    const isPressed = e.type === 'keydown';
    
    if (key === ' ' && isPressed) {
      jump();
    }
    
    setKeys(prev => ({
      ...prev,
      [key]: isPressed
    }));
  }, [jump]);

  // Handle global keyboard events for better control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field - don't interfere with typing
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      if (e.key === ' ' && !isTyping) {
        e.preventDefault();
        jump();
      }
      
      // Only register movement keys when not typing
      if (!isTyping) {
        setKeys(prev => ({
          ...prev,
          [e.key]: true
        }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Only register key releases when not typing
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      if (!isTyping) {
        setKeys(prev => ({
          ...prev,
          [e.key]: false
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump]);

  // Keep refs in sync with latest inputs without re-creating loops
  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);

  useEffect(() => {
    joystickRef.current = joystickInput;
  }, [joystickInput]);

  useEffect(() => {
    isGroundedRef.current = isGrounded;
  }, [isGrounded]);

  // Physics-based movement loop
  useEffect(() => {
    let frameId: number;

    const loop = () => {
      if (!physicsApiRef.current) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      // Calculate desired movement direction
      let dx = 0;
      let dz = 0;

      // Keyboard input (arrow keys)
      if (keysRef.current['ArrowUp']) dz -= 1;
      if (keysRef.current['ArrowDown']) dz += 1;
      if (keysRef.current['ArrowLeft']) dx -= 1;
      if (keysRef.current['ArrowRight']) dx += 1;

      // Joystick input - Y up should move forward (negative Z)
      dx += joystickRef.current.x;
      dz -= joystickRef.current.y;

      // Normalize movement vector
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length > 0) {
        dx = (dx / length) * MOVE_FORCE;
        dz = (dz / length) * MOVE_FORCE;
      }

      // Apply horizontal movement forces
      if (dx !== 0 || dz !== 0) {
        // Get current velocity to prevent over-acceleration
        physicsApiRef.current.velocity.subscribe((vel: [number, number, number]) => {
          const [currentVx, currentVy, currentVz] = vel;
          
          // Only apply force if not at max speed
          const horizontalSpeed = Math.sqrt(currentVx * currentVx + currentVz * currentVz);
          if (horizontalSpeed < MAX_SPEED) {
            physicsApiRef.current.applyImpulse([dx, 0, dz], [0, 0, 0]);
          }
          
          // Check if player is outside island bounds and push back
          physicsApiRef.current.position.subscribe((pos: [number, number, number]) => {
            const distance = Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]);
            if (distance > ISLAND_RADIUS) {
              const pushBackX = -pos[0] * 0.1;
              const pushBackZ = -pos[2] * 0.1;
              physicsApiRef.current.applyImpulse([pushBackX, 0, pushBackZ], [0, 0, 0]);
            }
          });
        });

        // Update rotation smoothly towards movement direction
        setPlayerRotation((current) => {
          const desired = Math.atan2(dx, dz);
          let diff = ((desired - current + Math.PI) % (2 * Math.PI)) - Math.PI;
          const t = 0.15; // smoothing factor
          return current + diff * t;
        });
      }

      // Simple ground detection (improve this in Step 4)
      physicsApiRef.current.position.subscribe((pos: [number, number, number]) => {
        const isNearGround = pos[1] <= 1.2; // Rough ground detection
        if (isNearGround !== isGroundedRef.current) {
          setIsGrounded(isNearGround);
        }
      });

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return {
    playerPosition,
    playerRotation,
    handleKeyPress,
    setJoystickInput,
    jump,
    isGrounded,
    setPhysicsApi
  };
};