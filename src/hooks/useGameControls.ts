import { useState, useEffect, useCallback, useRef } from 'react';
import { Vector3 } from 'three';

interface GameControls {
  playerPosition: Vector3;
  playerRotation: number;
  playerVelocity: { x: number; y: number; z: number };
  handleKeyPress: (e: React.KeyboardEvent) => void;
  setJoystickInput: (input: { x: number; y: number }) => void;
  jump: () => void;
  isGrounded: boolean;
  shouldJump: boolean;
  onJumpComplete: () => void;
  setPlayerPosition: (position: Vector3) => void;
}

export const useGameControls = (): GameControls => {
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 1, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [playerVelocity, setPlayerVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [isGrounded, setIsGrounded] = useState(true);
  const [shouldJump, setShouldJump] = useState(false);
  
  // Refs to avoid re-subscribing loops on every state change
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ x: 0, y: 0 });

  const MOVE_SPEED = 3; // Increased for physics-based movement

  const jump = useCallback(() => {
    setShouldJump(true);
  }, []);

  const onJumpComplete = useCallback(() => {
    setShouldJump(false);
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

  // Calculate velocity based on input
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

      // Set velocity for physics
      setPlayerVelocity({ x: dx, y: 0, z: dz });

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
  }, []);

  return {
    playerPosition,
    playerRotation,
    playerVelocity,
    handleKeyPress,
    setJoystickInput,
    jump,
    isGrounded,
    shouldJump,
    onJumpComplete,
    setPlayerPosition,
  };
};