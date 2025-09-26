import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { CommunitySelector } from './CommunitySelector';
import { CharacterSelector } from './CharacterSelector';
import { Game } from './Game';
import { supabase } from '@/integrations/supabase/client';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  game_design_sky_color?: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  glb_file_url: string;
  thumbnail_url: string | null;
}

interface GameFlowProps {
  user: User | null;
  communityId?: string;
}

type GameState = 'community-select' | 'character-select' | 'playing';

export const GameFlow = ({ user, communityId }: GameFlowProps) => {
  const isGuest = (user as any)?.isGuest;
  
  const [gameState, setGameState] = useState<GameState>(
    isGuest ? 'playing' : (communityId ? 'character-select' : 'community-select')
  );
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    isGuest 
      ? null
      : communityId ? { id: communityId, name: 'Community', description: '', cover_image_url: null } : null
  );
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    isGuest 
      ? null
      : null
  );

  // Auto-load public community and default Eddie for guests
  useEffect(() => {
    if (!isGuest) return;

    const loadGuestDefaults = async () => {
      try {
        const { data: comm } = await supabase
          .from('communities')
          .select('id, name, description, cover_image_url, game_design_sky_color')
          .eq('privacy_level', 'public')
          .order('created_at', { ascending: true })
          .limit(1);
        if (comm && comm.length) setSelectedCommunity(comm[0] as any);

        const { data: chars } = await supabase
          .from('characters')
          .select('id, name, description, glb_file_url, thumbnail_url')
          .or('name.ilike.Eddie,is_default.eq.true')
          .order('is_default', { ascending: false })
          .limit(1);
        if (chars && chars.length) setSelectedCharacter(chars[0] as any);
      } catch (e) {
        console.error('Error loading guest defaults', e);
      }
    };

    loadGuestDefaults();
  }, [isGuest]);

  const handleCommunitySelect = async (community: Community) => {
    setSelectedCommunity(community);

    // Ensure authenticated users are members of the selected community
    if (user && !(user as any).isGuest) {
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (userRow) {
          const { data: existing } = await supabase
            .from('community_members')
            .select('id')
            .eq('community_id', community.id)
            .eq('user_id', userRow.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from('community_members').insert({
              community_id: community.id,
              user_id: userRow.id,
              role: 'member',
            });
          }
        }
      } catch (e) {
        console.error('Failed to ensure community membership', e);
      }
    }

    setGameState('character-select');
  };

  const handleSkipCommunity = () => {
    setSelectedCommunity(null);
    setGameState('character-select');
  };

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setGameState('playing');
  };

  const handleBackToCommunities = () => {
    setSelectedCommunity(null);
    setGameState('community-select');
  };

  const handleGoHome = () => {
    // For guests, we need to exit guest mode and go back to auth screen
    if ((user as any)?.isGuest) {
      // Reload the page to reset to login screen
      window.location.reload();
      return;
    }
    
    // For authenticated users, go to community selection
    setGameState('community-select');
  };

  if (gameState === 'community-select') {
    return (
      <CommunitySelector
        user={user}
        onCommunitySelect={handleCommunitySelect}
        onSkip={handleSkipCommunity}
      />
    );
  }

  if (gameState === 'character-select') {
    return (
      <CharacterSelector
        communityId={selectedCommunity?.id}
        onCharacterSelect={handleCharacterSelect}
        onBack={handleBackToCommunities}
      />
    );
  }

  return (
    <Game 
      user={user}
      community={selectedCommunity}
      character={selectedCharacter}
      onGoHome={handleGoHome}
    />
  );
};