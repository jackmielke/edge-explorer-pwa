import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  
  // Mock messages for now
  const [messages] = useState([
    {
      id: 1,
      text: `Hey there! I'm ${botName || community?.name || 'Eddie'}, your guide in this world. What would you like to explore?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  const displayName = botName || community?.name || 'Eddie';

  const handleSend = () => {
    if (!message.trim()) return;
    // This will be implemented with actual chat functionality later
    setMessage('');
  };

  return (
    <>
      {/* Chat Trigger Button */}
      {!isOpen && (
        <div className="absolute bottom-6 right-6 z-40">
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-black/15 backdrop-blur-2xl border border-white/15 hover:bg-white/10 text-white shadow-2xl transition-all duration-300 px-6 py-3 h-auto rounded-2xl group"
          >
            <MessageCircle className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
            <span className="font-medium text-base">Chat with {displayName}</span>
          </Button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-6 right-6 w-80 md:w-96 h-96 z-40 animate-scale-in">
          <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{displayName}</h3>
                    <p className="text-white/60 text-sm">AI Guide</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white hover:bg-white/10 w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-3 ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/10 backdrop-blur-sm text-white border border-white/10'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Actions */}
            <div className="p-3 border-t border-white/10">
              <div className="flex flex-wrap gap-2 mb-3">
                <button className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors">
                  Tell me about this place
                </button>
                <button className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors">
                  What can I do here?
                </button>
              </div>

              {/* Input */}
              <div className="flex space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSend();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-10 h-10 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};