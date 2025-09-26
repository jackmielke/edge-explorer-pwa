import { useState, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface PlayerData {
  id: string;
  userId: string;
  userName: string;
  position: Vector3;
  rotation: number;
  characterUrl?: string;
  lastSeen: Date;
}

interface UseMultiplayerProps {
  user: User | null;
  communityId: string | null;
  playerPosition: Vector3;
  playerRotation: number;
  characterUrl?: string;
}

export const useMultiplayer = ({
  user,
  communityId,
  playerPosition,
  playerRotation,
  characterUrl
}: UseMultiplayerProps) => {
  const [otherPlayers, setOtherPlayers] = useState<PlayerData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get internal user ID
  useEffect(() => {
    if (!user?.id) return;

    const getUserId = async () => {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (data) {
        setUserId(data.id);
      }
    };

    getUserId();
  }, [user?.id]);

  // Update own position periodically
  useEffect(() => {
    if (!userId || !communityId) {
      console.log('Multiplayer: Missing userId or communityId:', { userId, communityId });
      return;
    }

    console.log('Multiplayer: Setting up position updates for user:', userId, 'in community:', communityId);

    const updatePosition = async () => {
      const now = Date.now();
      // Only update if position changed significantly or it's been a while
      if (now - lastUpdateRef.current < 100) return;

      lastUpdateRef.current = now;

      console.log('Multiplayer: Updating position:', {
        userId,
        communityId,
        position: { x: playerPosition.x, y: playerPosition.y, z: playerPosition.z },
        rotation: playerRotation
      });

      await supabase
        .from('player_positions')
        .upsert({
          user_id: userId,
          community_id: communityId,
          position_x: playerPosition.x,
          position_y: playerPosition.y,
          position_z: playerPosition.z,
          rotation: playerRotation,
          character_glb_url: characterUrl || null,
          is_active: true,
          last_seen_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,community_id'
        });
    };

    // Update immediately, then every 200ms
    updatePosition();
    updateIntervalRef.current = setInterval(updatePosition, 200);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [userId, communityId, playerPosition.x, playerPosition.y, playerPosition.z, playerRotation, characterUrl]);

  // Listen for other players' positions
  useEffect(() => {
    if (!communityId || !userId) return;

    // Fetch initial player positions
    const fetchPlayers = async () => {
      console.log('Fetching other players for community:', communityId, 'excluding user:', userId);
      
      const { data, error } = await supabase
        .from('player_positions')
        .select(`
          id,
          user_id,
          position_x,
          position_y,
          position_z,
          rotation,
          character_glb_url,
          last_seen_at,
          users!inner(name)
        `)
        .eq('community_id', communityId)
        .eq('is_active', true)
        .neq('user_id', userId)
        .gte('last_seen_at', new Date(Date.now() - 30000).toISOString()); // Active in last 30 seconds

      console.log('Other players fetch result:', { data, error });

      if (data) {
        const players = data.map(player => ({
          id: player.id,
          userId: player.user_id,
          userName: (player.users as any)?.name || 'Player',
          position: new Vector3(player.position_x, player.position_y, player.position_z),
          rotation: player.rotation,
          characterUrl: player.character_glb_url,
          lastSeen: new Date(player.last_seen_at)
        }));
        console.log('Mapped players:', players);
        setOtherPlayers(players);
      }
    };

    fetchPlayers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('player-positions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_positions',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            
            // Skip own updates
            if (newData.user_id === userId) return;

            // Get user name
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', newData.user_id)
              .single();

            const playerData = {
              id: newData.id,
              userId: newData.user_id,
              userName: userData?.name || 'Player',
              position: new Vector3(newData.position_x, newData.position_y, newData.position_z),
              rotation: newData.rotation,
              characterUrl: newData.character_glb_url,
              lastSeen: new Date(newData.last_seen_at)
            };

            setOtherPlayers(prev => {
              const filtered = prev.filter(p => p.userId !== newData.user_id);
              if (newData.is_active && new Date(newData.last_seen_at) > new Date(Date.now() - 30000)) {
                return [...filtered, playerData];
              }
              return filtered;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedData = payload.old as any;
            setOtherPlayers(prev => prev.filter(p => p.userId !== deletedData.user_id));
          }
        }
      )
      .subscribe();

    // Clean up inactive players periodically
    const cleanupInterval = setInterval(() => {
      setOtherPlayers(prev => 
        prev.filter(player => 
          Date.now() - player.lastSeen.getTime() < 30000
        )
      );
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [communityId, userId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (userId && communityId) {
        supabase
          .from('player_positions')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('community_id', communityId);
      }
    };
  }, [userId, communityId]);

  return { otherPlayers };
};