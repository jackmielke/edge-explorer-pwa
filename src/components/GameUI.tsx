import React from 'react';
import { Button } from '@/components/ui/button';
import { SmoothJoystick } from './SmoothJoystick';

interface GameUIProps {
  setJoystickInput: (input: { x: number; y: number }) => void;
}

export const GameUI = ({ setJoystickInput }: GameUIProps) => {
  return (
    <>
      {/* Game Title */}
      <div className="absolute top-6 left-6 z-10">
        <h1 className="text-3xl font-outfit font-light tracking-wide text-primary">Edge Explorer</h1>
        <p className="text-muted-foreground">Use arrow keys to move</p>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-8 right-8 z-10 md:hidden">
        <SmoothJoystick onMove={setJoystickInput} />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 z-10 hidden md:block">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 text-sm">
          <p className="text-card-foreground font-medium mb-2">Controls:</p>
          <div className="space-y-1 text-muted-foreground">
            <p>← → ↑ ↓ Move around</p>
            <p>Mouse: Rotate camera</p>
            <p>Scroll: Zoom</p>
          </div>
        </div>
      </div>
    </>
  );
};