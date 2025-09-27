import { useState, useEffect, useCallback, useRef } from 'react';
import { Vector3 } from 'three';

interface GameControls {
  playerPosition: Vector3;
  playerRotation: number;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  setJoystickInput: (input: { x: number; y: number }) => void;
  jump: () => void;
  isGrounded: boolean;
}

export const useGameControls = (): GameControls => {
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [isGrounded, setIsGrounded] = useState(true);
  const [velocityY, setVelocityY] = useState(0);
  
  // Refs to avoid re-subscribing loops on every state change
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ x: 0, y: 0 });
  const velocityYRef = useRef(0);
  const isGroundedRef = useRef(true);

  const MOVE_SPEED = 0.1;
  const JUMP_FORCE = 0.25;
  const GRAVITY = 0.012;
  const GROUND_LEVEL = 0;
  const ISLAND_RADIUS = 5.5; // Keep player on the island

  const constrainToIsland = useCallback((position: Vector3): Vector3 => {
    const distance = Math.sqrt(position.x * position.x + position.z * position.z);
    if (distance > ISLAND_RADIUS) {
      const scale = ISLAND_RADIUS / distance;
      return new Vector3(position.x * scale, position.y, position.z * scale);
    }
    return position;
  }, []);

  const jump = useCallback(() => {
    if (isGroundedRef.current) {
      setVelocityY(JUMP_FORCE);
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
    velocityYRef.current = velocityY;
  }, [velocityY]);

  useEffect(() => {
    isGroundedRef.current = isGrounded;
  }, [isGrounded]);

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

      // Apply gravity and jumping physics
      setVelocityY((currentVelY) => {
        const newVelY = currentVelY - GRAVITY;
        velocityYRef.current = newVelY;
        return newVelY;
      });

      // Update position using functional set to avoid stale closures
      setPlayerPosition((prev) => {
        const newY = prev.y + velocityYRef.current;
        
        // Check ground collision
        if (newY <= GROUND_LEVEL) {
          setIsGrounded(true);
          setVelocityY(0);
          const next = constrainToIsland(new Vector3(
            prev.x + dx,
            GROUND_LEVEL,
            prev.z + dz
          ));
          return next;
        } else {
          setIsGrounded(false);
          const next = constrainToIsland(new Vector3(
            prev.x + dx,
            newY,
            prev.z + dz
          ));
          return next;
        }
      });

      if (moved) {
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
  }, [constrainToIsland]);

  return {
    playerPosition,
    playerRotation,
    handleKeyPress,
    setJoystickInput,
    jump,
    isGrounded
  };
};