import React from 'react';
import { Button } from '@/components/ui/button';
import { Joystick } from './Joystick';

export const GameUI = () => {
  return (
    <>
      {/* Game Title */}
      <div className="absolute top-6 left-6 z-10">
        <h1 className="text-3xl font-bold text-primary">Edge Explorer</h1>
        <p className="text-muted-foreground">Explore the island world</p>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-center gap-4">
        {/* Joystick for all devices */}
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
        
        {/* Continuous Gas Button */}
        <Button
          variant="default"
          size="lg"
          className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl border-4 border-primary-foreground/20 active:scale-95 transition-all duration-150 font-bold text-lg select-none"
          onMouseDown={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
          }}
          onMouseUp={() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
          }}
          onMouseLeave={() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
          }}
        >
          ⚡
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-card/90 backdrop-blur-md rounded-2xl p-6 text-sm border border-border/50 shadow-xl">
          <p className="text-card-foreground font-semibold mb-3 flex items-center gap-2">
            <span className="text-primary">⚡</span> Controls:
          </p>
          <div className="space-y-2 text-muted-foreground">
            <p className="hidden md:block">← → ↑ ↓ or WASD: Move around</p>
            <p className="md:hidden">Joystick: Move around</p>
            <p><span className="text-primary font-medium">⚡ Gas Button:</span> Continuous forward</p>
            <p className="hidden md:block">Mouse: Rotate camera</p>
            <p className="hidden md:block">Scroll: Zoom in/out</p>
          </div>
        </div>
      </div>
    </>
  );
};