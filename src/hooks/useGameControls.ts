import { useState, useEffect, useCallback, useRef } from 'react';
import { Vector3 } from 'three';

interface GameControls {
  playerPosition: Vector3;
  playerRotation: number;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  setJoystickInput: (input: { x: number; y: number }) => void;
  setPlayerApi: (api: any) => void;
  jump: () => void;
  isGrounded: boolean;
}

export const useGameControls = (): GameControls => {
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [isGrounded, setIsGrounded] = useState(true);
  const [playerApi, setPlayerApi] = useState<any>(null);
  
  // Refs to avoid re-subscribing loops on every state change
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ x: 0, y: 0 });
  const playerApiRef = useRef<any>(null);
  const isGroundedRef = useRef(true);

  const MOVE_FORCE = 5;
  const JUMP_FORCE = 8;
  const ISLAND_RADIUS = 5.5;

  // Sync player API ref
  useEffect(() => {
    playerApiRef.current = playerApi;
    
    // Subscribe to position changes from physics
    if (playerApi) {
      const unsubscribe = playerApi.position.subscribe((position: number[]) => {
        setPlayerPosition(new Vector3(position[0], position[1] - 0.8, position[2]));
      });
      return unsubscribe;
    }
  }, [playerApi]);

  const constrainToIsland = useCallback((position: Vector3): Vector3 => {
    const distance = Math.sqrt(position.x * position.x + position.z * position.z);
    if (distance > ISLAND_RADIUS) {
      const scale = ISLAND_RADIUS / distance;
      return new Vector3(position.x * scale, position.y, position.z * scale);
    }
    return position;
  }, []);

  const jump = useCallback(() => {
    if (isGroundedRef.current && playerApiRef.current) {
      playerApiRef.current.velocity.set(0, JUMP_FORCE, 0);
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
      if (e.key === ' ') {
        e.preventDefault();
        jump();
      }
      
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

  // Animation loop for physics-based movement
  useEffect(() => {
    let frameId: number;

    const loop = () => {
      if (playerApiRef.current) {
        // Determine movement vector from latest inputs
        let dx = 0;
        let dz = 0;

        // Keyboard input (arrow keys only)
        if (keysRef.current['ArrowUp']) dz -= MOVE_FORCE;
        if (keysRef.current['ArrowDown']) dz += MOVE_FORCE;
        if (keysRef.current['ArrowLeft']) dx -= MOVE_FORCE;
        if (keysRef.current['ArrowRight']) dx += MOVE_FORCE;

        // Joystick input (smooth analog control)
        dx += joystickRef.current.x * MOVE_FORCE;
        dz -= joystickRef.current.y * MOVE_FORCE;

        const moved = dx !== 0 || dz !== 0;

        if (moved) {
          // Apply physics forces instead of setting position directly
          playerApiRef.current.velocity.set(dx, 0, dz);
          
          // Update rotation smoothly towards movement direction
          setPlayerRotation((current) => {
            const desired = Math.atan2(dx, dz);
            let diff = ((desired - current + Math.PI) % (2 * Math.PI)) - Math.PI;
            const t = 0.2;
            return current + diff * t;
          });
        } else {
          // Stop horizontal movement when no input
          playerApiRef.current.velocity.set(0, 0, 0);
        }

        // Simple ground detection (check if Y velocity is near zero and position is low)
        const currentVel = playerApiRef.current.velocity.current;
        if (currentVel && Math.abs(currentVel[1]) < 0.1 && playerPosition.y <= 0.2) {
          setIsGrounded(true);
        }
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [playerPosition.y]);

  return {
    playerPosition,
    playerRotation,
    handleKeyPress,
    setJoystickInput,
    setPlayerApi,
    jump,
    isGrounded
  };
};