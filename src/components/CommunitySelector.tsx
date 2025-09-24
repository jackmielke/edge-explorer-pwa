import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
}

interface CommunitySelectorProps {
  onCommunitySelect: (community: Community) => void;
  onSkip: () => void;
}

export const CommunitySelector = ({ onCommunitySelect, onSkip }: CommunitySelectorProps) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

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
          <h1 className="text-4xl font-bold mb-4 text-foreground">Choose Your Community</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Select a community to explore, or skip to start your adventure
          </p>
          <Button 
            variant="outline" 
            onClick={onSkip}
            className="mb-8"
          >
            Skip & Enter Default World
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Card 
              key={community.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-border bg-card"
              onClick={() => onCommunitySelect(community)}
            >
              {community.cover_image_url && (
                <img 
                  src={community.cover_image_url} 
                  alt={community.name}
                  className="w-full h-32 object-cover rounded-md mb-4"
                />
              )}
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                {community.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {community.description || 'A vibrant community waiting to be explored'}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};