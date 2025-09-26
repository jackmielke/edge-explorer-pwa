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
}
export const ChatBox = ({
  botName,
  community
}: ChatBoxProps) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a greeting from the AI
  const [messages, setMessages] = useState([{
    id: 1,
    text: `Hey there! I'm ${botName || community?.name || 'Eddie'}, your AI guide in this world. I'm powered by GPT-5 and ready to help you explore and answer any questions you might have!`,
    sender: 'bot',
    timestamp: new Date()
  }]);
  const displayName = botName || community?.name || 'Eddie';

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  }, [message]);
  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history for GPT-5
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add the new user message
      conversationHistory.push({
        role: 'user',
        content: message
      });

      // Call GPT-5 via our edge function
      const { data, error } = await supabase.functions.invoke('chat-with-gpt5', {
        body: {
          messages: conversationHistory,
          systemPrompt: `You are ${displayName}, an AI guide in a virtual world called Edge Explorer. You are helpful, friendly, and knowledgeable about exploring virtual worlds, communities, and digital experiences. Keep your responses conversational and engaging.

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
        const aiResponse = {
          id: Date.now() + 1,
          text: data.choices[0].message.content,
          sender: 'bot' as const,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error in chat:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        sender: 'bot' as const,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
  return <>
      {/* Chat Icon Button - Always Visible */}
      <div className="absolute bottom-6 left-7 z-40">
        <Button onClick={() => setIsOpen(!isOpen)} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/15 hover:bg-black/30 text-white" size="icon">
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Chat Panel - Positioned Above Chat Button */}
      {isOpen && <div className={`absolute left-7 bottom-20 top-96 w-1/2 max-w-xl z-40 transition-all duration-300 ${isMinimized ? 'h-12' : ''}`}>
          <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">

            {!isMinimized && <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white border border-white/15'}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>)}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-end space-x-3">
                    <Textarea ref={textareaRef} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Chat with ${displayName}...`} className="bg-white/5 border border-white/15 text-white placeholder:text-white/60 resize-none min-h-[40px] max-h-[80px] flex-1 focus:ring-1 focus:ring-primary/50 focus:border-primary/50" rows={1} disabled={isLoading} />
                    <Button size="icon" onClick={handleSend} disabled={!message.trim() || isLoading} className="bg-primary hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/40 text-primary-foreground w-10 h-10 flex-shrink-0">
                      {isLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Suggested Actions */}
                  {!message.trim() && !isLoading && <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setMessage('Tell me about this place')} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors">
                        Tell me about this place
                      </button>
                      <button onClick={() => setMessage('What can I do here?')} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors">
                        What can I do here?
                      </button>
                      <button onClick={() => setMessage('Help me explore')} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors">
                        Help me explore
                      </button>
                    </div>}
                </div>
              </>}
          </div>
        </div>}
    </>;
};