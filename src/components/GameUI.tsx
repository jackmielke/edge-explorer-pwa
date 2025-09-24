import React from 'react';
import { Button } from '@/components/ui/button';
import { Joystick } from './Joystick';

export const GameUI = () => {
  return (
    <>
      {/* Game Title */}
      <div className="absolute top-6 left-6 z-10">
        <h1 className="text-3xl font-bold text-primary">Edge Explorer</h1>
        <p className="text-muted-foreground">Use arrow keys to move</p>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-6 right-6 z-10 md:hidden">
        <Joystick 
          onMove={(direction) => {
            // Convert joystick direction to keyboard events
            const threshold = 0.3;
            
            // Handle horizontal movement
            if (Math.abs(direction.x) > threshold) {
              if (direction.x > 0) {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
              } else {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
              }
            } else {
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
            }
            
            // Handle vertical movement
            if (Math.abs(direction.y) > threshold) {
              if (direction.y > 0) {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
              } else {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
              }
            } else {
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
            }
          }}
        />
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