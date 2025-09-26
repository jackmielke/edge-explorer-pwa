import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
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
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Messages Overlay - Only show when chat is open */}
      {isOpen && messages.length > 1 && (
        <div className="absolute top-32 left-6 max-w-sm z-30 space-y-3">
          {messages.slice(1).map((msg, index) => (
            <div
              key={msg.id}
              className={`animate-fade-in flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-3 shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : 'bg-black/20 backdrop-blur-xl border border-white/15 text-white'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Icon or Expanded Input */}
      <div className="absolute bottom-6 left-4 z-40">
        {!isOpen ? (
          /* Chat Icon Button */
          <Button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/15 hover:bg-black/30 text-white"
            size="icon"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        ) : (
          /* Expanded Chat Input */
          <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl w-72 sm:w-80">
            <div className="flex items-end p-3 space-x-3">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsActive(true)}
                onBlur={() => setIsActive(false)}
                placeholder={`Chat with ${displayName}...`}
                className="bg-transparent border-none text-white placeholder:text-white/60 resize-none min-h-[40px] max-h-[120px] flex-1 focus:ring-0 focus:outline-none p-0"
                rows={1}
                autoFocus
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!message.trim()}
                className="bg-primary hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/40 text-primary-foreground w-8 h-8 flex-shrink-0 transition-all duration-200"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={() => setIsOpen(false)}
                className="bg-transparent hover:bg-white/10 text-white/60 hover:text-white w-8 h-8 flex-shrink-0"
              >
                ×
              </Button>
            </div>
            
            {/* Suggested Actions - Only show when input is focused and empty */}
            {isActive && !message.trim() && (
              <div className="px-3 pb-3 border-t border-white/10 pt-2">
                <div className="flex flex-wrap gap-2">
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
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};