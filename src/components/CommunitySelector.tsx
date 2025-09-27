import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  game_design_sky_color?: string;
}

interface CommunitySelectorProps {
  user: User | null;
  onCommunitySelect: (community: Community) => void;
  onSkip: () => void;
}

export const CommunitySelector = ({ user, onCommunitySelect, onSkip }: CommunitySelectorProps) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string; avatar_url?: string; profile_picture_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommunities();
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchCommunities = async () => {
    try {
      // For guests, just fetch communities normally
      if (!user || (user as any)?.isGuest) {
        const { data, error } = await supabase
          .from('communities')
          .select('id, name, description, cover_image_url, game_design_sky_color')
          .limit(10);

        if (error) throw error;
        setCommunities(data || []);
        return;
      }

      // For authenticated users, we'll use a custom query to get communities
      // ordered by the user's recent activity
      const { data, error } = await supabase.rpc('get_communities_with_recent_activity', {
        user_auth_id: user.id,
        limit_count: 10
      });

      if (error) {
        // Fallback to regular community fetch if the function doesn't exist yet
        console.log('Custom function not available, using fallback');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('communities')
          .select('id, name, description, cover_image_url, game_design_sky_color')
          .limit(10);
        
        if (fallbackError) throw fallbackError;
        setCommunities(fallbackData || []);
        return;
      }
      
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    // Skip profile fetch for guests
    if ((user as any)?.isGuest) {
      console.log('Guest user detected, skipping profile fetch');
      setUserProfile({ name: 'Guest', avatar_url: null, profile_picture_url: null });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, avatar_url, profile_picture_url')
        .eq('auth_user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const getProfileImage = () => {
    return userProfile?.avatar_url || userProfile?.profile_picture_url || null;
  };

  const getInitials = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky via-background to-accent/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Minimal Header with profile */}
        <div className="flex justify-between items-center mb-12 p-4 bg-card/70 backdrop-blur-sm rounded-2xl border border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-card-foreground text-lg">
                Welcome{userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}!
              </h2>
            </div>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="p-0 h-auto hover:bg-transparent"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <AvatarImage src={getProfileImage() || undefined} />
                <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-accent/20">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>

        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6 tracking-tight">
            Choose Your Adventure
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
            Join a vibrant community and start your adventure
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          {communities.map((community) => (
            <Card 
              key={community.id}
              className="group p-0 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border-border/50 bg-card/95 backdrop-blur-md overflow-hidden rounded-3xl"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-card-foreground group-hover:text-primary transition-colors tracking-tight">
                  {community.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6 font-medium">
                  {community.description || 'A vibrant community waiting to be explored by brave adventurers like you!'}
                </p>
                <div className="flex items-center text-sm text-primary font-semibold">
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