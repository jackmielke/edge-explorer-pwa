import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  description: string;
  glb_file_url: string;
  thumbnail_url: string | null;
}

interface CharacterSelectorProps {
  communityId?: string;
  onCharacterSelect: (character: Character) => void;
  onBack: () => void;
}

export const CharacterSelector = ({ communityId, onCharacterSelect, onBack }: CharacterSelectorProps) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacters();
  }, [communityId]);

  const fetchCharacters = async () => {
    try {
      let query = supabase
        .from('characters')
        .select('id, name, description, glb_file_url, thumbnail_url');

      // Get default characters and community-specific characters
      if (communityId) {
        query = query.or(`community_id.eq.${communityId},community_id.is.null`);
      } else {
        query = query.is('community_id', null);
      }

      const { data, error } = await query.limit(12);

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      console.error('Error fetching characters:', error);
      // Create a default character if none exist
      setCharacters([{
        id: 'default',
        name: 'Explorer',
        description: 'A brave adventurer ready to explore new worlds',
        glb_file_url: '/default-character.glb',
        thumbnail_url: null
      }]);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="mb-4"
          >
            ← Back to Communities
          </Button>
          <h1 className="text-4xl font-bold mb-4 text-foreground">Choose Your Character</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Select your avatar for this adventure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card 
              key={character.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-border bg-card"
              onClick={() => onCharacterSelect(character)}
            >
              {character.thumbnail_url && (
                <img 
                  src={character.thumbnail_url} 
                  alt={character.name}
                  className="w-full h-32 object-cover rounded-md mb-4 bg-muted"
                />
              )}
              <div className="w-full h-32 bg-muted rounded-md mb-4 flex items-center justify-center">
                <div className="text-character text-6xl">🧑‍🚀</div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                {character.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {character.description || 'A unique character ready for adventure'}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};