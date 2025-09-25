import React, { useRef, useState, useCallback, TouchEvent, MouseEvent } from 'react';

interface SmoothJoystickProps {
  onMove: (direction: { x: number; y: number }) => void;
}

export const SmoothJoystick: React.FC<SmoothJoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    const maxDistance = rect.width / 2 - 20; // Account for knob size
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;

    // Clamp to circle
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance) * 1;
      normalizedY = (deltaY / distance) * 1;
    }

    // Update visual position
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    setKnobPosition({
      x: Math.cos(angle) * clampedDistance,
      y: Math.sin(angle) * clampedDistance,
    });

    // Send smooth movement direction (normalized -1 to 1)
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
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
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
      className="relative w-24 h-24 bg-black/20 backdrop-blur-md rounded-full border-2 border-white/30 touch-none select-none shadow-lg"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Joystick knob */}
      <div
        className="absolute w-8 h-8 bg-white rounded-full shadow-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 will-change-transform border-2 border-white/50"
        style={{
          transform: `translate(-50%, -50%) translate(${knobPosition.x}px, ${knobPosition.y}px) ${isDragging ? 'scale(1.2)' : 'scale(1)'}`,
        }}
      />
      
      {/* Center dot for reference */}
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
};