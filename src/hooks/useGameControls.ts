import { useState, useEffect, useCallback, useRef } from 'react';

interface GameControls {
  movementInput: { x: number; z: number };
  handleKeyPress: (e: React.KeyboardEvent) => void;
  setJoystickInput: (input: { x: number; y: number }) => void;
  shouldJump: boolean;
  resetJump: () => void;
  jump: () => void;
}

export const useGameControls = (): GameControls => {
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [shouldJump, setShouldJump] = useState(false);
  const [movementInput, setMovementInput] = useState({ x: 0, z: 0 });
  
  // Refs to avoid re-subscribing loops on every state change
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ x: 0, y: 0 });

  const MOVE_SPEED = 1.0;

  const jump = useCallback(() => {
    setShouldJump(true);
  }, []);

  const resetJump = useCallback(() => {
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

  // Update movement input whenever keys or joystick changes
  useEffect(() => {
    let x = 0;
    let z = 0;

    // Keyboard input (arrow keys and WASD)
    if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) z -= MOVE_SPEED;
    if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) z += MOVE_SPEED;
    if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) x -= MOVE_SPEED;
    if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) x += MOVE_SPEED;

    // Joystick input (smooth analog control) - Y up should move forward (negative Z)
    x += joystickRef.current.x * MOVE_SPEED;
    z -= joystickRef.current.y * MOVE_SPEED;

    setMovementInput({ x, z });
  }, [keys, joystickInput]);

  return {
    movementInput,
    handleKeyPress,
    setJoystickInput,
    shouldJump,
    resetJump,
    jump,
  };
};
