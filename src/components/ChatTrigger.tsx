import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';

interface ChatTriggerProps {
  onClick: () => void;
  hasNewMessages?: boolean;
}

export const ChatTrigger = ({ onClick, hasNewMessages = false }: ChatTriggerProps) => {
  return (
    <Button
      onClick={onClick}
      className="
        bg-black/15 backdrop-blur-2xl border border-white/15 
        hover:bg-black/25 text-white shadow-2xl 
        transition-all duration-300 ease-out
        w-14 h-14 rounded-2xl
        group relative overflow-hidden
      "
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Main icon */}
      <div className="relative z-10 flex items-center justify-center">
        <MessageCircle size={20} className="group-hover:scale-110 transition-transform duration-200" />
      </div>
      
      {/* Sparkle accent */}
      <div className="absolute top-1 right-1 z-20">
        <Sparkles size={12} className="text-primary opacity-60" />
      </div>
      
      {/* New message indicator */}
      {hasNewMessages && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white/20 z-30">
          <div className="w-full h-full bg-accent rounded-full animate-pulse" />
        </div>
      )}
      
      {/* Floating animation */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Button>
  );
};