import { useState, useEffect, useCallback, useRef } from 'react';
import { Vector3 } from 'three';

interface GameControls {
  playerPosition: Vector3;
  playerRotation: number;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  setJoystickInput: (input: { x: number; y: number }) => void;
}

export const useGameControls = (): GameControls => {
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  // Refs to avoid re-subscribing loops on every state change
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ x: 0, y: 0 });

  const MOVE_SPEED = 0.1;
  const ISLAND_RADIUS = 5.5; // Keep player on the island

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
          const next = constrainToIsland(new Vector3(
            prev.x + dx,
            prev.y,
            prev.z + dz
          ));
          return next;
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
  }, [constrainToIsland]);

  return {
    playerPosition,
    playerRotation,
    handleKeyPress,
    setJoystickInput
  };
};