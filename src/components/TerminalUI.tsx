import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Terminal, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Memory {
  id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  tags: string[] | null;
  metadata: any;
  creator_name?: string;
}

interface TerminalUIProps {
  open: boolean;
  onClose: () => void;
  communityId: string;
  userId?: string;
}

export const TerminalUI = ({ open, onClose, communityId, userId }: TerminalUIProps) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMemories();
    }
  }, [open, communityId]);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          users:created_by (name)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const memoriesWithNames = (data || []).map(mem => ({
        ...mem,
        creator_name: (mem as any).users?.name || 'Anonymous'
      }));

      setMemories(memoriesWithNames);
    } catch (error) {
      console.error('Error fetching memories:', error);
      toast({
        title: "Error",
        description: "Failed to load community memories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim() || !userId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('memories')
        .insert({
          community_id: communityId,
          created_by: userId,
          content: newMemory.trim(),
          tags: [],
          metadata: { source: 'terminal' }
        });

      if (error) throw error;

      toast({
        title: "Memory saved",
        description: "Your memory has been added to the terminal"
      });

      setNewMemory('');
      await fetchMemories();
    } catch (error) {
      console.error('Error creating memory:', error);
      toast({
        title: "Error",
        description: "Failed to save memory",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col bg-black/95 border-green-500/50 text-green-400 font-mono">
        <DialogHeader className="border-b border-green-500/30 pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-green-400">
            <Terminal className="h-6 w-6" />
            COMMUNITY TERMINAL v1.0
          </DialogTitle>
          <p className="text-xs text-green-500/70 mt-1">&gt; Shared memories and notes from the community</p>
        </DialogHeader>

        {/* Terminal Content */}
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Memories Display */}
          <div className="flex-1 border border-green-500/30 rounded bg-black/50 p-4 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
              </div>
            ) : memories.length === 0 ? (
              <div className="flex items-center justify-center h-full text-green-500/50">
                <div className="text-center">
                  <Terminal className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>&gt; NO MEMORIES LOGGED</p>
                  <p className="text-xs mt-1">&gt; Be the first to add one</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {memories.map((memory, index) => (
                    <div 
                      key={memory.id}
                      className="border-l-2 border-green-500/50 pl-4 pb-4 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-green-300 text-sm">
                          &gt; {memory.creator_name}
                        </span>
                        <span className="text-green-500/50 text-xs">
                          {formatDate(memory.created_at)}
                        </span>
                      </div>
                      <p className="text-green-400/90 whitespace-pre-wrap text-sm leading-relaxed">
                        {memory.content}
                      </p>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {memory.tags.map((tag, i) => (
                            <span 
                              key={i}
                              className="text-xs px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-green-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border border-green-500/30 rounded bg-black/50 p-4">
            <div className="mb-2 text-xs text-green-500/70">
              &gt; WRITE NEW MEMORY
            </div>
            <Textarea
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              placeholder="Enter your memory or note..."
              className="min-h-[100px] bg-black border-green-500/30 text-green-400 placeholder:text-green-500/30 focus:border-green-500 resize-none font-mono"
              disabled={submitting || !userId}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-green-500/50">
                {newMemory.length}/1000 characters
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="border-green-500/30 bg-black/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                >
                  <X className="h-4 w-4 mr-1" />
                  CLOSE
                </Button>
                <Button
                  type="submit"
                  disabled={!newMemory.trim() || submitting || !userId}
                  size="sm"
                  className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 hover:text-green-300"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      SAVING...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      SUBMIT
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="border-t border-green-500/30 pt-2 text-xs text-green-500/50 text-center">
          &gt; TERMINAL SESSION ACTIVE | MEMORIES: {memories.length}
        </div>
      </DialogContent>
    </Dialog>
  );
};
