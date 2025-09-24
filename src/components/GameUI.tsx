import React from 'react';
import { Button } from '@/components/ui/button';

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
        <div className="grid grid-cols-3 gap-2 w-32 h-32">
          <div></div>
          <Button
            variant="secondary"
            size="sm"
            className="h-10 w-10 p-0"
            onTouchStart={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
            }}
          >
            ↑
          </Button>
          <div></div>
          
          <Button
            variant="secondary"
            size="sm"
            className="h-10 w-10 p-0"
            onTouchStart={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
            }}
          >
            ←
          </Button>
          <div></div>
          <Button
            variant="secondary"
            size="sm"
            className="h-10 w-10 p-0"
            onTouchStart={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
            }}
          >
            →
          </Button>
          
          <div></div>
          <Button
            variant="secondary"
            size="sm"
            className="h-10 w-10 p-0"
            onTouchStart={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
            }}
          >
            ↓
          </Button>
          <div></div>
        </div>
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