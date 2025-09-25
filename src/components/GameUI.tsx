import React from 'react';
import { Button } from '@/components/ui/button';
import { SmoothJoystick } from './SmoothJoystick';
import { Home } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
}

interface GameUIProps {
  setJoystickInput: (input: { x: number; y: number }) => void;
  community?: Community | null;
  onGoHome: () => void;
}

export const GameUI = ({ setJoystickInput, community, onGoHome }: GameUIProps) => {
  return (
    <>
      {/* Glassmorphic Header */}
      <div className="absolute top-8 left-8 right-8 z-50">
        <div className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-outfit font-light tracking-wide text-white mb-2">
                Edge Explorer
              </h1>
              <p className="text-white/70 text-lg font-medium">
                {community ? `Exploring ${community.name}` : 'Choose your adventure'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onGoHome}
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white shadow-lg transition-all duration-300 w-12 h-12"
            >
              <Home size={24} />
            </Button>
          </div>
        </div>
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