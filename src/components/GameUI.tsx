import React from 'react';
import { Button } from '@/components/ui/button';
import { SmoothJoystick } from './SmoothJoystick';
import { ChatBox } from './ChatBox';
import { Home, Menu, RotateCcw } from 'lucide-react';
import edgeExplorerLogo from '@/assets/edge-explorer-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  onChatMessage?: (text: string, sender: 'user' | 'ai') => void;
}

export const GameUI = ({ setJoystickInput, community, onGoHome, onChatMessage }: GameUIProps) => {
  const { toast } = useToast();

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

  return (
    <>
      {/* Glassmorphic Header */}
      <div className="absolute top-12 left-3 right-3 md:left-6 md:right-6 z-50">
        <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl px-5 py-4 md:px-6 md:py-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-4">
              <img 
                src={edgeExplorerLogo} 
                alt="Edge Explorer" 
                className="w-16 h-10 object-contain drop-shadow-lg rounded-2xl"
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

      {/* Chat Box */}
      <ChatBox community={community} onChatMessage={onChatMessage} />
    </>
  );
};