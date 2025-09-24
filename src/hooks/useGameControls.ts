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

  // Update player position based on keys
  useEffect(() => {
    const updatePosition = () => {
      const newPosition = playerPosition.clone();
      let moved = false;
      let newRotation = playerRotation;

      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        newPosition.z -= MOVE_SPEED;
        newRotation = 0;
        moved = true;
      }
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        newPosition.z += MOVE_SPEED;
        newRotation = Math.PI;
        moved = true;
      }
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        newPosition.x -= MOVE_SPEED;
        newRotation = Math.PI / 2;
        moved = true;
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        newPosition.x += MOVE_SPEED;
        newRotation = -Math.PI / 2;
        moved = true;
      }

      // Diagonal movement
      if ((keys['ArrowUp'] || keys['w'] || keys['W']) && (keys['ArrowRight'] || keys['d'] || keys['D'])) {
        newRotation = -Math.PI / 4;
      }
      if ((keys['ArrowUp'] || keys['w'] || keys['W']) && (keys['ArrowLeft'] || keys['a'] || keys['A'])) {
        newRotation = Math.PI / 4;
      }
      if ((keys['ArrowDown'] || keys['s'] || keys['S']) && (keys['ArrowRight'] || keys['d'] || keys['D'])) {
        newRotation = -3 * Math.PI / 4;
      }
      if ((keys['ArrowDown'] || keys['s'] || keys['S']) && (keys['ArrowLeft'] || keys['a'] || keys['A'])) {
        newRotation = 3 * Math.PI / 4;
      }

      if (moved) {
        const constrainedPosition = constrainToIsland(newPosition);
        setPlayerPosition(constrainedPosition);
        setPlayerRotation(newRotation);
      }
    };

    const interval = setInterval(updatePosition, 16); // ~60fps
    return () => clearInterval(interval);
  }, [keys, playerPosition, playerRotation, constrainToIsland]);

  return {
    playerPosition,
    playerRotation,
    handleKeyPress
  };
};