import React, { useRef, useState, useCallback, TouchEvent, MouseEvent, useMemo } from 'react';

interface JoystickProps {
  onMove: (direction: { x: number; y: number }) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
  }, []);

  // Throttle movement updates for better performance
  const lastMoveTime = useRef(0);
  
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !joystickRef.current) return;

    // Throttle to ~60fps for better mobile performance
    const now = Date.now();
    if (now - lastMoveTime.current < 16) return;
    lastMoveTime.current = now;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    const maxDistance = rect.width / 2 - 20; // Account for knob size
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;

    if (distance > maxDistance) {
      normalizedX = (deltaX / distance) * (maxDistance / maxDistance);
      normalizedY = (deltaY / distance) * (maxDistance / maxDistance);
    }

    setKnobPosition({
      x: normalizedX * maxDistance,
      y: normalizedY * maxDistance,
    });

    // Send movement direction (normalized -1 to 1)
    onMove({
      x: Math.max(-1, Math.min(1, normalizedX)),
      y: Math.max(-1, Math.min(1, -normalizedY)), // Invert Y for game coordinates
    });
  }, [isDragging, onMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setKnobPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  // Touch events
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  // Mouse events for testing on desktop
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={joystickRef}
      className="relative w-32 h-32 bg-secondary/60 backdrop-blur-sm rounded-full border-2 border-secondary/80 touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Joystick knob */}
      <div
        className="absolute w-10 h-10 bg-primary rounded-full shadow-lg border-2 border-primary-foreground/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 will-change-transform"
        style={{
          transform: `translate(-50%, -50%) translate(${knobPosition.x}px, ${knobPosition.y}px) ${isDragging ? 'scale(1.1)' : 'scale(1)'}`,
        }}
      />
      
      {/* Center dot for reference */}
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-secondary-foreground/30 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
};