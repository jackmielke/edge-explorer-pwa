import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Users, Globe, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-sky-light via-background to-sky-mid p-4 relative overflow-hidden">
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-2 h-2 bg-city-glow rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-accent rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-60 left-16 w-1.5 h-1.5 bg-primary rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-60 left-1/2 w-1 h-1 bg-city-glow rounded-full opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with user info and logout */}
        <div className="flex justify-between items-center mb-8 p-6 backdrop-blur-xl rounded-2xl border border-border/50 shadow-premium" 
             style={{ background: 'var(--gradient-card)' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl border border-primary/20">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ', Explorer'}!
              </h2>
              <p className="text-sm text-muted-foreground">Ready to discover floating worlds?</p>
            </div>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>

        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-city-glow bg-clip-text text-transparent">
            Choose Your Realm
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Discover floating cities, mystical communities, and boundless adventures in the Edge Explorer multiverse
          </p>
          <Button 
            size="lg"
            onClick={onSkip}
            className="px-10 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 shadow-floating hover:shadow-premium transition-all duration-500 transform hover:scale-105 group"
          >
            <Globe className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            Enter Default Realm
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communities.map((community) => (
            <Card 
              key={community.id}
              className="group p-0 cursor-pointer hover:shadow-floating hover:scale-[1.02] transition-all duration-500 border border-border/30 overflow-hidden backdrop-blur-xl relative"
              onClick={() => onCommunitySelect(community)}
              style={{ background: 'var(--gradient-card)' }}
            >
              <div className="relative overflow-hidden">
                {community.cover_image_url ? (
                  <img 
                    src={community.cover_image_url} 
                    alt={community.name}
                    className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-52 bg-gradient-to-br from-primary/30 via-accent/40 to-city-glow/30 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
                    <Globe className="h-20 w-20 text-primary/60 relative z-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-card-foreground group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {community.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {community.description || 'A mystical floating community where explorers gather to share adventures and discover new horizons together.'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-primary font-medium">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Join Realm</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors duration-300">
                    <ArrowRight className="h-3 w-3 text-primary group-hover:translate-x-0.5 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};