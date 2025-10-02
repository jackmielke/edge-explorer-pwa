import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, LogOut, User as UserIcon, GamepadIcon, Trophy, MapPin, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import floatingIslandBg from '@/assets/new-login-bg.png';

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  profile_picture_url?: string;
  email?: string;
}

interface ProfileProps {
  user: User;
}

export const Profile = ({ user }: ProfileProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    // Skip profile fetch for guests
    if ((user as any)?.isGuest) {
      console.log('Guest user detected, skipping profile fetch');
      setProfile({ 
        id: 'guest', 
        name: 'Guest', 
        username: null, 
        bio: null, 
        avatar_url: null, 
        profile_picture_url: null, 
        email: 'guest@example.com' 
      });
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, bio, avatar_url, profile_picture_url')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({ ...data, email: user.email });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      navigate('/');
    }
  };

  const getProfileImage = () => {
    return profile?.avatar_url || profile?.profile_picture_url || null;
  };

  const getInitials = () => {
    if (profile?.name) {
      return profile.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6 relative"
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
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white shadow-lg"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-outfit font-light tracking-wide text-white drop-shadow-lg">Player Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="lg:col-span-2 p-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex items-center gap-6 w-full">
                <Avatar className="h-24 w-24 border-4 border-white/30 shadow-2xl">
                  <AvatarImage src={getProfileImage() || undefined} />
                  <AvatarFallback className="text-2xl font-semibold bg-white/20 backdrop-blur-sm text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">{profile?.name || 'Explorer'}</h2>
                  {profile?.username && (
                    <p className="text-white/80 drop-shadow-sm">@{profile.username}</p>
                  )}
                  <p className="text-sm text-white/70 mt-1 drop-shadow-sm">{profile?.email}</p>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <GamepadIcon className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">Active Player</span>
                </div>
              </div>

              <div className="flex-1 mt-6">

                {profile?.bio && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2 text-white">About</h3>
                    <p className="text-white/80 leading-relaxed drop-shadow-sm">{profile.bio}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm border border-white/20">
                    <Trophy className="h-3 w-3 text-white" />
                    <span className="text-white">Edge Explorer</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm border border-white/20">
                    <MapPin className="h-3 w-3 text-white" />
                    <span className="text-white">Digital Realm</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Player Stats & Actions */}
          <div className="space-y-6">
            <Card className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-white" />
                Player Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-white/70">Level</span>
                  <span className="font-semibold text-white">Explorer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/70">Worlds Visited</span>
                  <span className="font-semibold text-white">∞</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/70">Status</span>
                  <span className="font-semibold text-white">Active</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
                <UserIcon className="h-5 w-5 text-white" />
                Account Actions
              </h3>
              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl backdrop-blur-sm"
                  onClick={() => navigate('/asset-generator')}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  3D Asset Generator
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl backdrop-blur-sm"
                  onClick={() => toast({ title: "Coming soon!", description: "Profile editing will be available soon." })}
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start bg-white/5 hover:bg-red-500/20 text-white/80 hover:text-red-300 border border-white/20 rounded-2xl backdrop-blur-sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};