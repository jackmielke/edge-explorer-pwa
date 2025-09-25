import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SmoothJoystick } from './SmoothJoystick';
import { ChatPanel } from './ChatPanel';
import { ChatTrigger } from './ChatTrigger';
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Glassmorphic Header */}
      <div className="absolute top-12 left-3 right-3 md:left-6 md:right-6 z-50">
        <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl px-5 py-4 md:px-6 md:py-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-outfit font-light tracking-wide text-white mb-1">
                Edge Explorer
              </h1>
              <p className="text-white/70 text-sm md:text-base font-medium">
                {community ? `Exploring ${community.name}` : 'Choose your adventure'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onGoHome}
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white shadow-lg transition-all duration-300 w-10 h-10 md:w-11 md:h-11 ml-4 flex-shrink-0"
            >
              <Home size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-8 right-8 z-10 md:hidden">
        <SmoothJoystick onMove={setJoystickInput} />
      </div>

      {/* Chat Trigger Button */}
      <div className="absolute bottom-8 right-8 md:right-24 z-10">
        <ChatTrigger onClick={() => setIsChatOpen(true)} />
      </div>

      {/* Chat Panel */}
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        community={community}
      />

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