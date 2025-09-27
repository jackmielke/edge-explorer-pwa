import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChatHistory } from './ChatHistory';
interface ChatBoxProps {
  botName?: string;
  community?: {
    id: string;
    name: string;
    description: string;
  } | null;
  onChatMessage?: (text: string, sender: 'user' | 'ai') => void;
  onThinkingChange?: (isThinking: boolean) => void;
}
export const ChatBox = ({
  botName,
  community,
  onChatMessage,
  onThinkingChange
}: ChatBoxProps) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayName = botName || community?.name || 'Eddie';

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
    
    // Store user message
    await storeMessage(messageToSend, 'user');
    
    setMessage('');
    setIsLoading(true);
    
    // Start thinking state after user message shows for a moment
    setTimeout(() => {
      onThinkingChange?.(true);
    }, 2800); // Slightly after user message fades (2.5s + 300ms fade)

    try {
      // Call GPT-5 via our edge function
      const { data, error } = await supabase.functions.invoke('chat-with-gpt5', {
        body: {
          messages: [
            { role: 'user', content: messageToSend }
          ],
          systemPrompt: `You are ${displayName}, an AI guide in a virtual world called Edge Explorer. You are helpful, friendly, and knowledgeable about exploring virtual worlds, communities, and digital experiences. 

IMPORTANT: Keep ALL responses to 3 sentences or less. This is critical for text bubble display. Be concise and direct.

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
        const aiResponse = data.choices[0].message.content;
        // Stop thinking and show AI response
        onThinkingChange?.(false);
        onChatMessage?.(aiResponse, 'ai');
        // Store AI response
        await storeMessage(aiResponse, 'ai');
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error in chat:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      // Stop thinking and show error
      onThinkingChange?.(false);
      onChatMessage?.("Sorry, I'm having trouble responding right now. Please try again in a moment.", 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickMessage = (quickMessage: string) => {
    handleSend(quickMessage);
  };

  const storeMessage = async (content: string, sender: 'user' | 'ai') => {
    if (!community?.id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) return;

      await supabase.from('messages').insert({
        sender_id: userData.id,
        community_id: community.id,
        content,
        sent_by: sender,
        chat_type: 'ai'
      });
    } catch (error) {
      console.error('Error storing message:', error);
    }
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
          className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/15 hover:bg-black/30 text-white" 
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Minimalist Chat Panel */}
      {isOpen && (
        <div className="absolute left-7 bottom-20 w-80 max-w-[calc(100vw-4rem)] md:w-96 z-40">
          <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Chat with {displayName}</h3>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowHistory(true)}
                    className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-white/70 text-xs mt-1">Messages appear as bubbles above the character</p>
            </div>

            {/* Quick Actions */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => sendQuickMessage('Tell me about this place')}
                  disabled={isLoading}
                  className="text-left p-3 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
                >
                  Tell me about this place
                </button>
                <button 
                  onClick={() => sendQuickMessage('What can I do here?')}
                  disabled={isLoading}
                  className="text-left p-3 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
                >
                  What can I do here?
                </button>
                <button 
                  onClick={() => sendQuickMessage('Help me explore')}
                  disabled={isLoading}
                  className="text-left p-3 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
                >
                  Help me explore
                </button>
              </div>
            </div>

            {/* Custom Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-end space-x-3">
                <Textarea 
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="bg-white/5 border border-white/15 text-white placeholder:text-white/60 resize-none min-h-[40px] max-h-[100px] flex-1 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-sm"
                  rows={1}
                  disabled={isLoading}
                />
                <Button 
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!message.trim() || isLoading}
                  className="bg-primary hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/40 text-primary-foreground w-10 h-10 flex-shrink-0"
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Chat History Modal */}
      <ChatHistory 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        communityId={community?.id}
      />
    </>
  );
};