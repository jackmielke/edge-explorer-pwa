import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { CharacterUpload } from './CharacterUpload';
import defaultCharacterPreview from '@/assets/default-character-preview.jpg';

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
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, [communityId]);

  const fetchCharacters = async () => {
    try {
      console.log('Fetching characters for communityId:', communityId);
      let query = supabase
        .from('characters')
        .select('id, name, description, glb_file_url, thumbnail_url');

      // Get default characters and community-specific characters
      if (communityId) {
        // Use proper OR condition for both community and default characters
        query = query.or(`community_id.eq.${communityId},community_id.is.null`);
      } else {
        query = query.is('community_id', null);
      }

      const { data, error } = await query.order('is_default', { ascending: false }).limit(12);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      console.log('Characters fetched:', data);
      setCharacters(data || []);
    } catch (error) {
      console.error('Error fetching characters:', error);
      // Create a default character if none exist (no GLB file)
      setCharacters([{
        id: 'default',
        name: 'Explorer Bot',
        description: 'A friendly robot explorer ready for any adventure',
        glb_file_url: '', // No GLB file - will use fallback geometry
        thumbnail_url: null
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterCreated = () => {
    fetchCharacters(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky via-background to-accent/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky via-background to-accent/20 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with glass morphism */}
        <div className="text-center mb-8 bg-card/70 backdrop-blur-sm border border-border/30 rounded-2xl p-8 shadow-2xl">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="mb-6 bg-background/10 backdrop-blur-sm border border-border/20 hover:bg-background/20"
          >
            ← Back to Communities
          </Button>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6 tracking-tight">
            Choose Your Character
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
            Select your avatar for this adventure
          </p>
          <Button 
            onClick={() => setShowUpload(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Character
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card 
              key={character.id}
              className="group p-0 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border-border/50 bg-card/95 backdrop-blur-md overflow-hidden rounded-3xl"
              onClick={() => onCharacterSelect(character)}
            >
              <div className="relative overflow-hidden">
                <div className="w-full h-48 bg-muted rounded-t-3xl flex items-center justify-center overflow-hidden">
                  {character.thumbnail_url ? (
                    <img 
                      src={character.thumbnail_url} 
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : character.id === 'default' || character.name === 'Explorer Bot' ? (
                    <img 
                      src={defaultCharacterPreview} 
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-6xl">🧑‍🚀</div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-4 text-card-foreground group-hover:text-primary transition-colors tracking-tight">
                  {character.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {character.description || 'A unique character ready for adventure'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <CharacterUpload
        open={showUpload}
        onClose={() => setShowUpload(false)}
        communityId={communityId}
        onCharacterCreated={handleCharacterCreated}
      />
    </div>
  );
};