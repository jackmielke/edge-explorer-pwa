import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Sparkles } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  community?: Community | null;
}

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export const ChatPanel = ({ isOpen, onClose, community }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Welcome to ${community?.name || 'Edge Explorer'}! I'm your community assistant. How can I help you explore today?`,
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const suggestedMessages = [
    "What can I do here?",
    "Tell me about this community",
    "How do I get started?",
    "What events are coming up?",
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Mock bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! I'm currently in demo mode, but soon I'll be able to help you with community information, events, and more.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleSuggestedMessage = (message: string) => {
    setInputValue(message);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div className={`
        fixed top-0 right-0 h-full z-50 w-full md:w-96
        bg-black/10 backdrop-blur-2xl border-l border-white/15
        shadow-2xl transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/15 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">Community Assistant</h3>
                <p className="text-white/70 text-sm">Always here to help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white w-8 h-8"
            >
              <X size={16} />
            </Button>
          </div>
          
          {community && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <p className="text-white/90 text-sm font-medium">{community.name}</p>
              <p className="text-white/60 text-xs mt-1">{community.description}</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`
                    max-w-[80%] p-3 rounded-2xl backdrop-blur-sm border
                    ${message.isBot 
                      ? 'bg-white/10 border-white/15 text-white' 
                      : 'bg-primary/20 border-primary/30 text-white ml-auto'
                    }
                  `}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Suggested Messages */}
        {messages.length <= 1 && (
          <div className="p-4 border-t border-white/10">
            <p className="text-white/70 text-xs mb-3 font-medium">Suggested questions:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestedMessages.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestedMessage(suggestion)}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white text-left justify-start h-auto py-2 px-3"
                >
                  <span className="text-xs leading-relaxed">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-black/20 backdrop-blur-xl border-t border-white/15 p-4">
          <div className="flex space-x-3">
            <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl overflow-hidden">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="w-full p-3 bg-transparent text-white placeholder-white/50 text-sm focus:outline-none"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-primary/20 backdrop-blur-sm border border-primary/30 hover:bg-primary/30 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};