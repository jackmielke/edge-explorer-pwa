import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { CharacterUpload } from './CharacterUpload';
import floatingIslandBg from '@/assets/new-login-bg.png';
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
        backgroundSize: window.innerWidth <= 768 ? 'cover' : 'cover',
        backgroundPosition: window.innerWidth <= 768 ? 'center 20%' : 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: window.innerWidth <= 768 ? 'scroll' : 'fixed'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-blue-800/20" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white shadow-lg rounded-2xl"
          >
            ← Back to Communities
          </Button>
          <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-2xl font-outfit">Choose Your Character</h1>
          <p className="text-lg text-white/80 mb-6 drop-shadow-lg">
            Select your avatar for this adventure
          </p>
          <Button 
            onClick={() => setShowUpload(true)}
            className="mb-6 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Character
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card 
              key={character.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/15 rounded-3xl"
              onClick={() => onCharacterSelect(character)}
            >
              <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-sm rounded-full mb-4 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
                {character.thumbnail_url ? (
                  <img 
                    src={character.thumbnail_url} 
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : character.id === 'default' || character.name === 'Explorer Bot' ? (
                  <img 
                    src={defaultCharacterPreview} 
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-3xl">🧑‍🚀</div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-lg text-center">
                {character.name}
              </h3>
              <p className="text-white/80 text-sm drop-shadow-sm text-center">
                {character.description || 'A unique character ready for adventure'}
              </p>
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