import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatBoxProps {
  botName?: string;
  community?: {
    id: string;
    name: string;
    description: string;
  } | null;
}

export const ChatBox = ({ botName, community }: ChatBoxProps) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock messages for now
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hey there! I'm ${botName || community?.name || 'Eddie'}, your guide in this world. What would you like to explore?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  const displayName = botName || community?.name || 'Eddie';

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    
    // Mock bot response (will be replaced with actual AI integration)
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: "That's interesting! Tell me more about what you'd like to explore.",
        sender: 'bot' as const,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Chat Icon Button */}
      {!isOpen && (
        <div className="absolute bottom-6 left-4 z-40">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/15 hover:bg-black/30 text-white"
            size="icon"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Chat Panel - Half Width Left Side */}
      {isOpen && (
        <div className={`absolute left-4 bottom-4 top-32 w-1/2 max-w-md z-40 transition-all duration-300 ${
          isMinimized ? 'h-12' : ''
        }`}>
          <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
            
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-white font-medium">{displayName}</h3>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="bg-transparent hover:bg-white/10 text-white/60 hover:text-white w-8 h-8"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="bg-transparent hover:bg-white/10 text-white/60 hover:text-white w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/10 text-white border border-white/15'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-end space-x-3">
                    <Textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Chat with ${displayName}...`}
                      className="bg-white/5 border border-white/15 text-white placeholder:text-white/60 resize-none min-h-[40px] max-h-[80px] flex-1 focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                      rows={1}
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!message.trim()}
                      className="bg-primary hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/40 text-primary-foreground w-10 h-10 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Suggested Actions */}
                  {!message.trim() && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button 
                        onClick={() => setMessage('Tell me about this place')}
                        className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                      >
                        Tell me about this place
                      </button>
                      <button 
                        onClick={() => setMessage('What can I do here?')}
                        className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                      >
                        What can I do here?
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};