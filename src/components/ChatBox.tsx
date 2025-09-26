import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setShowSuggestions(false);
    
    // Mock bot response
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

  const suggestions = [
    'Tell me about this place',
    'What can I do here?',
    'Show me around'
  ];

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
                    : 'bg-background/80 backdrop-blur-xl border border-border text-foreground'
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
            variant="secondary"
            className="w-12 h-12 rounded-full backdrop-blur-xl"
            size="icon"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        ) : (
          /* Expanded Chat Input */
          <div className="bg-background/80 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl w-72 sm:w-80">
            <div className="flex items-end p-3 gap-2">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={`Chat with ${displayName}...`}
                className="bg-transparent border-none text-foreground placeholder:text-muted-foreground resize-none min-h-[40px] max-h-[100px] flex-1 focus:ring-0 focus:outline-none p-0"
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!message.trim()}
                className="w-8 h-8 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Suggested Actions */}
            {showSuggestions && !message.trim() && (
              <div className="px-3 pb-3 border-t border-border pt-2">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setMessage(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};