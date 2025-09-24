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
  const [gameState, setGameState] = useState<GameState>(
    communityId ? 'character-select' : 'community-select'
  );
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    communityId ? { id: communityId, name: 'Community', description: '', cover_image_url: null } : null
  );
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

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