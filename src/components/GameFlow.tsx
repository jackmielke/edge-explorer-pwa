import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { CommunitySelector } from './CommunitySelector';
import { CharacterSelector } from './CharacterSelector';
import { Game } from './Game';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
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
      ? { id: '365e2785-6f31-47f0-909f-8a062ae95ba7', name: 'Frontier Tower', description: 'A vertical village in SF designed to build a brighter future', cover_image_url: null }
      : communityId ? { id: communityId, name: 'Community', description: '', cover_image_url: null } : null
  );
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    isGuest 
      ? { id: '3c2d59d2-84dc-41f0-87d9-2102fd616f6e', name: 'Eddie', description: 'OG', glb_file_url: 'https://efdqqnubowgwsnwvlalp.supabase.co/storage/v1/object/public/character-models/18f08f2d-f922-4c83-83ea-8ce2afdfc520/1758721690787_3d eddie.glb', thumbnail_url: null }
      : null
  );

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
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