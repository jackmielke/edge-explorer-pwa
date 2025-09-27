import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Clock, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string | null;
  sent_by: string | null;
  created_at: string;
  community_id: string | null;
  conversation_id: string;
}

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  communityId?: string;
  userId?: string;
}

export const ChatHistory = ({ isOpen, onClose, communityId, userId }: ChatHistoryProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Fetch chat history
  useEffect(() => {
    if (isOpen && (userId || communityId)) {
      fetchChatHistory();
    }
  }, [isOpen, userId, communityId]);

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('chat_type', 'ai')
        .order('created_at', { ascending: false })
        .limit(100);

      // Filter by community or user
      if (communityId) {
        query = query.eq('community_id', communityId);
      }
      if (userId) {
        query = query.eq('sender_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching chat history:', error);
        return;
      }

      if (data) {
        setMessages(data);
        
        // Group messages by conversation
        const grouped = data.reduce((acc, message) => {
          const convId = message.conversation_id;
          if (!acc[convId]) {
            acc[convId] = [];
          }
          acc[convId].push(message);
          return acc;
        }, {} as Record<string, ChatMessage[]>);

        // Sort messages within each conversation
        Object.keys(grouped).forEach(convId => {
          grouped[convId].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        setConversations(grouped);
        
        // Auto-select the most recent conversation
        const sortedConversations = Object.keys(grouped).sort((a, b) => {
          const lastA = grouped[a][grouped[a].length - 1]?.created_at || '';
          const lastB = grouped[b][grouped[b].length - 1]?.created_at || '';
          return new Date(lastB).getTime() - new Date(lastA).getTime();
        });
        
        if (sortedConversations.length > 0) {
          setSelectedConversation(sortedConversations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const getConversationPreview = (conversation: ChatMessage[]) => {
    const lastMessage = conversation[conversation.length - 1];
    return {
      preview: lastMessage.content.substring(0, 60) + (lastMessage.content.length > 60 ? '...' : ''),
      time: lastMessage.created_at,
      messageCount: conversation.length
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[80vh] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">Chat History</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-white/70 text-sm mt-2">
            Your conversation history with Eddie and other AI assistants
          </p>
        </div>

        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-white/10 bg-black/10">
            <div className="p-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Conversations
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {Object.keys(conversations).length === 0 ? (
                      <p className="text-white/60 text-sm py-4 text-center">
                        No chat history yet. Start a conversation with Eddie!
                      </p>
                    ) : (
                      Object.entries(conversations)
                        .sort(([,a], [,b]) => {
                          const lastA = a[a.length - 1]?.created_at || '';
                          const lastB = b[b.length - 1]?.created_at || '';
                          return new Date(lastB).getTime() - new Date(lastA).getTime();
                        })
                        .map(([convId, conversation]) => {
                          const { preview, time, messageCount } = getConversationPreview(conversation);
                          const isSelected = selectedConversation === convId;
                          
                          return (
                            <button
                              key={convId}
                              onClick={() => setSelectedConversation(convId)}
                              className={`w-full text-left p-3 rounded-lg transition-all ${
                                isSelected 
                                  ? 'bg-primary/20 border border-primary/30' 
                                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span className="text-white/90 text-sm font-medium">
                                  Conversation
                                </span>
                                <span className="text-white/60 text-xs">
                                  {formatMessageTime(time)}
                                </span>
                              </div>
                              <p className="text-white/70 text-xs leading-relaxed">
                                {preview}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-white/50 text-xs">
                                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </button>
                          );
                        })
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* Messages View */}
          <div className="flex-1 flex flex-col">
            {selectedConversation && conversations[selectedConversation] ? (
              <>
                <div className="p-4 border-b border-white/10 bg-black/5">
                  <h3 className="text-white font-medium">Conversation Details</h3>
                  <p className="text-white/60 text-sm">
                    {conversations[selectedConversation].length} messages • Started {format(new Date(conversations[selectedConversation][0].created_at), 'PPp')}
                  </p>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {conversations[selectedConversation].map((message, index) => {
                      const isUser = message.sent_by === 'user';
                      const isAI = message.sent_by === 'ai' || message.sent_by === 'assistant';
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex items-start gap-3 ${
                            isUser ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            isUser 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                          
                          <div className={`flex-1 max-w-[70%] ${isUser ? 'text-right' : ''}`}>
                            <div className={`inline-block p-3 rounded-lg ${
                              isUser 
                                ? 'bg-blue-500/20 text-white' 
                                : 'bg-white/10 text-white'
                            }`}>
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            </div>
                            <p className="text-white/50 text-xs mt-1">
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};