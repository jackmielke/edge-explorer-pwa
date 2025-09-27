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
    
    // Trigger chat bubble for user message
    onChatMessage?.(message, 'user');
    
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
        
        // Trigger chat bubble for AI response
        onChatMessage?.(data.choices[0].message.content, 'ai');
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
    {/* Retro Chat Icon Button */}
    <div className="absolute bottom-6 left-7 z-40">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-12 h-12 bg-[hsl(var(--retro-bg))] border-4 border-[hsl(var(--retro-border))] text-[hsl(var(--retro-text))] hover:bg-[hsl(var(--retro-accent))] transition-colors duration-200 font-bold text-lg pixel-art-button"
        style={{
          imageRendering: 'pixelated',
          fontFamily: 'monospace',
          boxShadow: 'var(--pixel-shadow)'
        }}
      >
        💬
      </button>
    </div>

    {/* Retro Chat Panel - Speech Bubble Style */}
    {isOpen && (
      <div className="absolute left-7 bottom-20 w-96 max-w-md z-40">
        {/* Speech Bubble Tail */}
        <div className="relative">
          <div 
            className="absolute -bottom-4 left-8 w-0 h-0"
            style={{
              borderLeft: '16px solid hsl(var(--retro-border))',
              borderRight: '16px solid transparent',
              borderTop: '16px solid hsl(var(--retro-border))',
              borderBottom: '0px solid transparent'
            }}
          />
          <div 
            className="absolute -bottom-2 left-9 w-0 h-0"
            style={{
              borderLeft: '14px solid hsl(var(--retro-bg))',
              borderRight: '14px solid transparent',
              borderTop: '14px solid hsl(var(--retro-bg))',
              borderBottom: '0px solid transparent'
            }}
          />
          
          {/* Main Chat Container */}
          <div 
            className="bg-[hsl(var(--retro-bg))] border-4 border-[hsl(var(--retro-border))] text-[hsl(var(--retro-text))] rounded-none max-h-80 flex flex-col overflow-hidden pixel-art-container"
            style={{
              imageRendering: 'pixelated',
              fontFamily: 'monospace',
              boxShadow: '8px 8px 0px 0px hsl(var(--retro-border))'
            }}
          >
            {/* Retro Header */}
            <div className="bg-[hsl(var(--retro-border))] text-[hsl(var(--retro-bg))] px-3 py-2 flex justify-between items-center">
              <span className="font-bold text-sm">{displayName}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-6 h-6 bg-[hsl(var(--retro-bg))] text-[hsl(var(--retro-border))] border-2 border-[hsl(var(--retro-bg))] hover:bg-[hsl(var(--retro-accent))] font-bold text-xs"
                >
                  {isMinimized ? '□' : '‾'}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 bg-[hsl(var(--retro-bg))] text-[hsl(var(--retro-border))] border-2 border-[hsl(var(--retro-bg))] hover:bg-red-500 hover:text-white font-bold text-xs"
                >
                  ×
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-48">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[80%] border-2 px-3 py-2 text-sm font-mono ${
                          msg.sender === 'user' 
                            ? 'bg-[hsl(var(--retro-accent))] border-[hsl(var(--retro-border))] text-[hsl(var(--retro-bg))]' 
                            : 'bg-[hsl(var(--retro-bg))] border-[hsl(var(--retro-border))] text-[hsl(var(--retro-text))]'
                        }`}
                        style={{
                          imageRendering: 'pixelated',
                          boxShadow: '2px 2px 0px 0px hsl(var(--retro-border))'
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Retro Input Area */}
                <div className="p-3 border-t-4 border-[hsl(var(--retro-border))]">
                  <div className="flex items-end space-x-2">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Type to ${displayName}...`}
                      className="bg-[hsl(var(--retro-bg))] border-2 border-[hsl(var(--retro-border))] text-[hsl(var(--retro-text))] placeholder:text-[hsl(var(--retro-border))] resize-none min-h-[40px] max-h-[80px] flex-1 p-2 font-mono text-sm focus:outline-none focus:ring-0 rounded-none"
                      rows={1}
                      disabled={isLoading}
                      style={{
                        imageRendering: 'pixelated',
                        boxShadow: 'inset 2px 2px 0px 0px hsl(var(--retro-border))'
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || isLoading}
                      className="bg-[hsl(var(--retro-success))] border-2 border-[hsl(var(--retro-border))] text-[hsl(var(--retro-bg))] hover:bg-green-600 disabled:bg-gray-400 disabled:text-gray-600 w-10 h-10 flex-shrink-0 font-bold text-lg"
                      style={{
                        imageRendering: 'pixelated',
                        boxShadow: '2px 2px 0px 0px hsl(var(--retro-border))'
                      }}
                    >
                      {isLoading ? '⏳' : '►'}
                    </button>
                  </div>
                  
                  {/* Retro Suggested Actions */}
                  {!message.trim() && !isLoading && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        'Tell me about this place',
                        'What can I do here?',
                        'Help me explore'
                      ].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setMessage(suggestion)}
                          className="text-xs px-2 py-1 bg-[hsl(var(--retro-bg))] border-2 border-[hsl(var(--retro-border))] text-[hsl(var(--retro-text))] hover:bg-[hsl(var(--retro-accent))] hover:text-[hsl(var(--retro-bg))] transition-colors font-mono"
                          style={{
                            imageRendering: 'pixelated',
                            boxShadow: '1px 1px 0px 0px hsl(var(--retro-border))'
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}
  </>;
};