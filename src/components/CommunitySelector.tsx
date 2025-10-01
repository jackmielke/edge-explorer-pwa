import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users, Star } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import floatingIslandBg from '@/assets/new-login-bg.png';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  game_design_sky_color?: string;
  is_favorited?: boolean;
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
      // Use the new favorites function for both guests and authenticated users
      const { data, error } = await supabase.rpc('get_communities_with_favorites', {
        user_auth_id: user && !(user as any)?.isGuest ? user.id : null,
        limit_count: user && !(user as any)?.isGuest ? null : 10 // No limit for authenticated users
      });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (communityId: string, currentlyFavorited: boolean) => {
    if (!user || (user as any)?.isGuest) {
      toast({
        title: "Sign in required",
        description: "Please sign in to favorite communities",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) return;

      if (currentlyFavorited) {
        // Remove favorite
        await supabase
          .from('community_favorites')
          .delete()
          .eq('user_id', userData.id)
          .eq('community_id', communityId);
      } else {
        // Add favorite
        await supabase
          .from('community_favorites')
          .insert({
            user_id: userData.id,
            community_id: communityId
          });
      }

      // Refresh communities list
      await fetchCommunities();
      
      toast({
        title: currentlyFavorited ? "Removed from favorites" : "Added to favorites",
        description: currentlyFavorited ? "Community unfavorited" : "Community favorited",
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
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
    <div 
      className="min-h-screen p-4 relative"
      style={{
        backgroundImage: `url(${floatingIslandBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-blue-800/20" />
      <div className="max-w-4xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          {user && !((user as any)?.isGuest) && (
            <div>
              <h2 className="text-xl font-semibold text-white drop-shadow-lg">
                Welcome back, {userProfile?.name?.split(' ')[0] || user.email?.split('@')[0] || 'Explorer'}!
              </h2>
              <p className="text-white/70 text-sm drop-shadow-sm">
                Ready for your next adventure?
              </p>
            </div>
          )}
          {!user || ((user as any)?.isGuest) && (
            <div>
              <h2 className="text-xl font-semibold text-white drop-shadow-lg">
                Welcome, Explorer!
              </h2>
              <p className="text-white/70 text-sm drop-shadow-sm">
                Ready to begin your journey?
              </p>
            </div>
          )}
        </div>
        
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="p-0 h-auto hover:bg-white/10 rounded-full transition-all duration-300"
          >
            <Avatar className="w-14 h-14 border-3 border-white/30 hover:border-white/50 transition-all duration-300 shadow-2xl">
              <AvatarImage src={getProfileImage() || undefined} />
              <AvatarFallback className="text-lg font-semibold bg-white/20 backdrop-blur-sm text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl font-outfit">
          Choose Your Adventure
        </h1>
        <p className="text-lg text-white/80 mb-6 drop-shadow-lg">
          Step into immersive worlds where every choice shapes your journey
        </p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Card 
              key={community.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 rounded-3xl"
              onClick={() => onCommunitySelect(community)}
            >
              <div className="relative">
                {user && !((user as any)?.isGuest) && (
                  <div className="absolute top-3 right-3 z-20">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(community.id, community.is_favorited || false);
                      }}
                      className="bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white border-0 rounded-full"
                      aria-label={community.is_favorited ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star 
                        className={`h-5 w-5 ${
                          community.is_favorited 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-white'
                        }`}
                      />
                    </Button>
                  </div>
                )}

                <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-sm rounded-full mb-4 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
                  {community.cover_image_url ? (
                    <img 
                      src={community.cover_image_url} 
                      alt={`${community.name} cover image`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="text-3xl">🏝️</div>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-lg text-center">
                  {community.name}
                </h3>
                <p className="text-white/80 text-sm drop-shadow-sm text-center mb-4 line-clamp-3">
                  {community.description || 'An amazing adventure awaits in this community'}
                </p>
                <Button 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCommunitySelect(community);
                  }}
                >
                  Enter World
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};