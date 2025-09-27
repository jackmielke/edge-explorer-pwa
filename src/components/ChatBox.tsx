import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface ChatBoxProps {
  botName?: string;
  community?: {
    id: string;
    name: string;
    description: string;
  } | null;
  onChatMessage?: (text: string, sender: 'user' | 'ai') => void;
}
export const ChatBox = ({
  botName,
  community,
  onChatMessage
}: ChatBoxProps) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayName = botName || community?.name || 'Eddie';

  const [firstOpen, setFirstOpen] = useState(true);
  
  // Show brief intro message on first open, then delay chat opening
  useEffect(() => {
    if (isOpen && firstOpen) {
      setFirstOpen(false);
      const introText = `Hi! I'm ${displayName}, ready to help you explore!`;
      onChatMessage?.(introText, 'ai');
      
      // Close chat temporarily to show just the bubble
      setIsOpen(false);
      
      // Reopen chat after 2 seconds
      setTimeout(() => {
        setIsOpen(true);
      }, 2000);
    }
  }, [isOpen, firstOpen, displayName, onChatMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [message]);
  const handleSend = async (messageToSend = message) => {
    if (!messageToSend.trim() || isLoading) return;

    // Trigger chat bubble for user message
    onChatMessage?.(messageToSend, 'user');
    
    setMessage('');
    setIsLoading(true);

    try {
      // Call GPT-5 via our edge function
      const { data, error } = await supabase.functions.invoke('chat-with-gpt5', {
        body: {
          messages: [
            { role: 'user', content: messageToSend }
          ],
          systemPrompt: `You are ${displayName}, an AI guide in a virtual world called Edge Explorer. You are helpful, friendly, and knowledgeable about exploring virtual worlds, communities, and digital experiences. Keep your responses conversational and engaging, but concise for text bubbles.

You can manipulate the game world! When users ask you to change the sky color or make it a specific color, use the changeSkyColor function. You can change the sky to any color they want - be creative! Examples:
- "Make the sky purple" → use #800080
- "I want a sunset sky" → use #FF6347  
- "Make it look like night" → use #191970
- "Pink sky please" → use #FF69B4

Always acknowledge the color change and be enthusiastic about it!`,
          communityId: community?.id
        }
      });

      if (error) {
        console.error('Error calling GPT-5:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data && data.choices && data.choices[0]) {
        // Trigger chat bubble for AI response
        onChatMessage?.(data.choices[0].message.content, 'ai');
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error in chat:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      // Show error in text bubble
      onChatMessage?.("Sorry, I'm having trouble responding right now. Please try again in a moment.", 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickMessage = (quickMessage: string) => {
    handleSend(quickMessage);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        handleSend();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };
  return (
    <>
      {/* Chat Icon Button - Always Visible */}
      <div className="absolute bottom-6 left-7 z-40">
        <Button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-12 h-12 rounded-full bg-card/70 backdrop-blur-sm border border-border/30 hover:bg-card/80 text-card-foreground" 
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Minimalist Chat Panel */}
      {isOpen && (
        <div className="absolute left-7 bottom-20 w-80 max-w-[calc(100vw-4rem)] md:w-96 z-40">
          <div className="bg-card/70 backdrop-blur-sm border border-border/30 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-border/20">
              <div className="flex items-center justify-between">
                <h3 className="text-card-foreground font-medium">Chat with {displayName}</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 text-muted-foreground hover:text-card-foreground hover:bg-accent/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs mt-1">Messages appear as bubbles above the character</p>
            </div>

            {/* Quick Actions */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => sendQuickMessage('Tell me about this place')}
                  disabled={isLoading}
                  className="text-left p-3 rounded-lg bg-accent/20 text-card-foreground hover:bg-accent/30 transition-colors text-sm disabled:opacity-50"
                >
                  Tell me about this place
                </button>
                <button 
                  onClick={() => sendQuickMessage('What can I do here?')}
                  disabled={isLoading}
                  className="text-left p-3 rounded-lg bg-accent/20 text-card-foreground hover:bg-accent/30 transition-colors text-sm disabled:opacity-50"
                >
                  What can I do here?
                </button>
                <button 
                  onClick={() => sendQuickMessage('Help me explore')}
                  disabled={isLoading}
                  className="text-left p-3 rounded-lg bg-accent/20 text-card-foreground hover:bg-accent/30 transition-colors text-sm disabled:opacity-50"
                >
                  Help me explore
                </button>
              </div>
            </div>

            {/* Custom Message Input */}
            <div className="p-4 border-t border-border/20">
              <div className="flex items-end space-x-3">
                <Textarea 
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="bg-background/50 border border-border/30 text-card-foreground placeholder:text-muted-foreground resize-none min-h-[40px] max-h-[100px] flex-1 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-sm"
                  rows={1}
                  disabled={isLoading}
                />
                <Button 
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!message.trim() || isLoading}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground w-10 h-10 flex-shrink-0"
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};