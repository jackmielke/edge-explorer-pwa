import { useState, useEffect, useCallback, useRef } from 'react';
import { Vector3 } from 'three';

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

interface GameControls {
  playerPosition: Vector3;
  playerRotation: number;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  setJoystickInput: (input: { x: number; y: number }) => void;
}

export const useGameControls = (worldObjects: WorldObject[] = []): GameControls => {
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  // Refs to avoid re-subscribing loops on every state change
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ x: 0, y: 0 });

  const MOVE_SPEED = 0.1;
  const ISLAND_RADIUS = 5.5; // Keep player on the island
  const PLAYER_RADIUS = 0.4; // Player collision radius

  // Check collision with world objects
  const checkCollision = useCallback((position: Vector3): boolean => {
    for (const obj of worldObjects) {
      const objPos = new Vector3(obj.position.x, obj.position.y, obj.position.z);
      const scale = obj.properties.scale || { x: 1, y: 1, z: 1 };
      
      // Calculate object bounds based on type and scale
      let objRadius = 0;
      switch (obj.object_type) {
        case 'box':
          // Use the largest dimension as radius for simple collision
          objRadius = Math.max(scale.x, scale.z) * 0.5;
          break;
        case 'sphere':
          objRadius = scale.x * 0.5; // sphere uses uniform scale
          break;
        case 'cylinder':
        case 'cone':
          objRadius = scale.x * 0.5; // base radius
          break;
        case 'torus':
          objRadius = scale.x * 0.7; // outer radius approximation
          break;
        default:
          objRadius = 0.5;
      }

      // Simple 2D distance check (ignore Y axis for ground-based collision)
      const distance = Math.sqrt(
        Math.pow(position.x - objPos.x, 2) + 
        Math.pow(position.z - objPos.z, 2)
      );

      // Check if player would collide with this object
      if (distance < PLAYER_RADIUS + objRadius) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }, [worldObjects]);

  const constrainToIsland = useCallback((position: Vector3): Vector3 => {
    const distance = Math.sqrt(position.x * position.x + position.z * position.z);
    if (distance > ISLAND_RADIUS) {
      const scale = ISLAND_RADIUS / distance;
      return new Vector3(position.x * scale, position.y, position.z * scale);
    }
    return position;
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    const key = e.key;
    const isPressed = e.type === 'keydown';
    
    setKeys(prev => ({
      ...prev,
      [key]: isPressed
    }));
  }, []);

  // Handle global keyboard events for better control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({
        ...prev,
        [e.key]: true
      }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({
        ...prev,
        [e.key]: false
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Keep refs in sync with latest inputs without re-creating loops
  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);

  useEffect(() => {
    joystickRef.current = joystickInput;
  }, [joystickInput]);

  // Animation loop with requestAnimationFrame (stable, no resubscribe thrashing)
  useEffect(() => {
    let frameId: number;

    const loop = () => {
      // Determine movement vector from latest inputs
      let dx = 0;
      let dz = 0;

      // Keyboard input (arrow keys only)
      if (keysRef.current['ArrowUp']) dz -= MOVE_SPEED;
      if (keysRef.current['ArrowDown']) dz += MOVE_SPEED;
      if (keysRef.current['ArrowLeft']) dx -= MOVE_SPEED;
      if (keysRef.current['ArrowRight']) dx += MOVE_SPEED;

      // Joystick input (smooth analog control) - Y up should move forward (negative Z)
      dx += joystickRef.current.x * MOVE_SPEED;
      dz -= joystickRef.current.y * MOVE_SPEED;

      const moved = dx !== 0 || dz !== 0;

      if (moved) {
        // Update position using functional set to avoid stale closures
        setPlayerPosition((prev) => {
          const tentativeNext = new Vector3(
            prev.x + dx,
            prev.y,
            prev.z + dz
          );
          
          // Check for collision with world objects
          if (checkCollision(tentativeNext)) {
            // Try moving only on X axis
            const xOnlyNext = new Vector3(prev.x + dx, prev.y, prev.z);
            if (!checkCollision(xOnlyNext)) {
              return constrainToIsland(xOnlyNext);
            }
            
            // Try moving only on Z axis
            const zOnlyNext = new Vector3(prev.x, prev.y, prev.z + dz);
            if (!checkCollision(zOnlyNext)) {
              return constrainToIsland(zOnlyNext);
            }
            
            // Can't move in any direction, stay in place
            return prev;
          }
          
          // No collision, apply normal movement
          return constrainToIsland(tentativeNext);
        });

        // Update rotation smoothly towards movement direction
        setPlayerRotation((current) => {
          const desired = Math.atan2(dx, dz);
          let diff = ((desired - current + Math.PI) % (2 * Math.PI)) - Math.PI;
          const t = 0.2; // smoothing factor
          return current + diff * t;
        });
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [constrainToIsland, checkCollision]);

  return {
    playerPosition,
    playerRotation,
    handleKeyPress,
    setJoystickInput
  };
};