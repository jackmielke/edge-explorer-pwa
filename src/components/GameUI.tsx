import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SmoothJoystick } from './SmoothJoystick';
import { ChatBox } from './ChatBox';
import { Home, Menu, RotateCcw, Clock, RefreshCw } from 'lucide-react';
import edgeExplorerLogo from '@/assets/edge-explorer-logo.png';
import defaultCommunityCover from '@/assets/default-community-cover.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatHistory } from './ChatHistory';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
}

interface GameUIProps {
  setJoystickInput: (input: { x: number; y: number }) => void;
  jump: () => void;
  isGrounded: boolean;
  community?: Community | null;
  onGoHome: () => void;
  onChatMessage?: (text: string, sender: 'user' | 'ai') => void;
  onThinkingChange?: (isThinking: boolean) => void;
  onRefreshWorld?: () => void;
  physicsMode: boolean;
  onPhysicsModeChange: (enabled: boolean) => void;
}

export const GameUI = ({ setJoystickInput, jump, isGrounded, community, onGoHome, onChatMessage, onThinkingChange, onRefreshWorld, physicsMode, onPhysicsModeChange }: GameUIProps) => {
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);

  const handleResetObjects = async () => {
    if (!community) {
      toast({
        title: "Error",
        description: "No community selected",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('world_objects')
        .delete()
        .eq('community_id', community.id);

      if (error) throw error;

      toast({
        title: "Objects Reset",
        description: "All world objects have been cleared from this community"
      });
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRefreshWorld = () => {
    toast({
      title: "Refreshing World",
      description: "Reloading the current world state..."
    });
    onRefreshWorld?.();
  };

  return (
    <>
      {/* Glassmorphic Header */}
      <div className="absolute top-12 left-3 right-3 md:left-6 md:right-6 z-50">
        <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl px-5 py-4 md:px-6 md:py-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-4">
              <img 
                src={community?.cover_image_url || defaultCommunityCover} 
                alt={community ? community.name : "Edge Explorer"} 
                className="w-12 h-12 object-cover drop-shadow-lg rounded-2xl"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-outfit font-light tracking-wide text-white mb-1">
                  Edge Explorer
                </h1>
                <p className="text-white/70 text-sm md:text-base font-medium">
                  {community ? `Exploring ${community.name}` : 'Choose your adventure'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white shadow-lg transition-all duration-300 w-10 h-10 md:w-11 md:h-11 flex-shrink-0"
                  >
                    <Menu size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/80 backdrop-blur-xl border-white/20 text-white">
                  <DropdownMenuLabel className="text-white/70">Settings</DropdownMenuLabel>
                  <DropdownMenuItem 
                    className="hover:bg-white/20 focus:bg-white/20 cursor-pointer flex items-center justify-between"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span>Physics Mode</span>
                    <Switch 
                      checked={physicsMode}
                      onCheckedChange={onPhysicsModeChange}
                      className="ml-2"
                    />
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-white/20" />
                  
                  <DropdownMenuItem 
                    onClick={() => setShowHistory(true)}
                    className="hover:bg-white/20 focus:bg-white/20 cursor-pointer"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Chat History
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleRefreshWorld}
                    className="hover:bg-white/20 focus:bg-white/20 cursor-pointer"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh World
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleResetObjects}
                    className="hover:bg-white/20 focus:bg-white/20 cursor-pointer"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Objects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onGoHome}
                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white shadow-lg transition-all duration-300 w-10 h-10 md:w-11 md:h-11 flex-shrink-0"
              >
                <Home size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-8 right-8 z-10 md:hidden">
        <SmoothJoystick onMove={setJoystickInput} />
      </div>

      {/* Jump Button - Next to Chat Button on Mobile */}
      <div className="absolute bottom-6 left-20 z-40 md:hidden">
        <Button
          onTouchStart={(e) => {
            e.preventDefault();
            jump();
          }}
          onClick={jump}
          disabled={!isGrounded}
          className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/15 hover:bg-black/30 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          size="icon"
        >
          ↑
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 z-10 hidden md:block">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 text-sm">
          <p className="text-card-foreground font-medium mb-2">Controls:</p>
          <div className="space-y-1 text-muted-foreground">
            <p>← → ↑ ↓ Move around</p>
            <p>SPACE Jump</p>
            <p>Mouse: Rotate camera</p>
            <p>Scroll: Zoom</p>
          </div>
        </div>
      </div>

      {/* Chat Box */}
      <ChatBox 
        community={community} 
        onChatMessage={onChatMessage}
        onThinkingChange={onThinkingChange}
      />

      {/* Chat History Modal */}
      <ChatHistory 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        communityId={community?.id}
      />
    </>
  );
};