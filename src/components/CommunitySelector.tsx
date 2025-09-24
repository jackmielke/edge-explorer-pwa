import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Users, Sparkles } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
}

interface CommunitySelectorProps {
  user: User | null;
  onCommunitySelect: (community: Community) => void;
  onSkip: () => void;
}

export const CommunitySelector = ({ user, onCommunitySelect, onSkip }: CommunitySelectorProps) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, description, cover_image_url')
        .limit(10);

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "See you next time, explorer!"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky via-background to-accent/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with user info and logout */}
        <div className="flex justify-between items-center mb-8 p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-border shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-card-foreground">
                Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
              </h2>
              <p className="text-sm text-muted-foreground">Ready to explore?</p>
            </div>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Choose Your Adventure
            </h1>
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join a vibrant community or embark on your solo journey in the Edge Explorer universe
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={onSkip}
            className="px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Skip & Enter Default World
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communities.map((community) => (
            <Card 
              key={community.id}
              className="group p-0 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-border bg-card/90 backdrop-blur-sm overflow-hidden"
              onClick={() => onCommunitySelect(community)}
            >
              <div className="relative overflow-hidden">
                {community.cover_image_url ? (
                  <img 
                    src={community.cover_image_url} 
                    alt={community.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                    <Users className="h-16 w-16 text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 text-card-foreground group-hover:text-primary transition-colors">
                  {community.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {community.description || 'A vibrant community waiting to be explored by brave adventurers like you!'}
                </p>
                <div className="mt-4 flex items-center text-sm text-primary">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Join Community</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};