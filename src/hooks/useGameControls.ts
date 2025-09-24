import { useState, useEffect, useCallback } from 'react';
import { Vector3 } from 'three';

interface GameControls {
  playerPosition: Vector3;
  playerRotation: number;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

export const useGameControls = (): GameControls => {
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [keys, setKeys] = useState<Record<string, boolean>>({});

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

  // Update player position and rotation based on keys (smooth rotation)
  useEffect(() => {
    const update = () => {
      // Determine movement vector from keys
      let dx = 0;
      let dz = 0;
      if (keys['ArrowUp'] || keys['w'] || keys['W']) dz -= MOVE_SPEED;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) dz += MOVE_SPEED;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= MOVE_SPEED;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += MOVE_SPEED;

      const moved = dx !== 0 || dz !== 0;

      if (moved) {
        // Move and constrain to island
        const nextPosition = constrainToIsland(new Vector3(
          playerPosition.x + dx,
          playerPosition.y,
          playerPosition.z + dz
        ));
        setPlayerPosition(nextPosition);

        // Compute desired facing angle based on movement vector
        const desired = Math.atan2(-dx, -dz);
        const current = playerRotation;
        // Shortest angular difference in range [-PI, PI]
        let diff = ((desired - current + Math.PI) % (2 * Math.PI)) - Math.PI;
        // Smooth factor (0..1) per tick
        const t = 0.2;
        const nextRotation = current + diff * t;
        setPlayerRotation(nextRotation);
      }
    };

    const interval = setInterval(update, 16); // ~60fps
    return () => clearInterval(interval);
  }, [keys, playerPosition, playerRotation, constrainToIsland]);

  return {
    playerPosition,
    playerRotation,
    handleKeyPress
  };
};