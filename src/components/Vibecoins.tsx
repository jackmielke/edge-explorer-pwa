import { useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { supabase } from '@/integrations/supabase/client';
import { Vibecoin } from './Vibecoin';
import { toast } from 'sonner';

interface VibecoinData {
  id: string;
  position_x: number;
  position_y: number;
  position_z: number;
  is_collected: boolean;
}

interface VibecoinsProps {
  communityId: string;
  playerPosition: Vector3;
  userId?: string;
}

export const Vibecoins = ({ communityId, playerPosition, userId }: VibecoinsProps) => {
  const [coins, setCoins] = useState<VibecoinData[]>([]);

  useEffect(() => {
    // Fetch initial coins
    const fetchCoins = async () => {
      const { data, error } = await supabase
        .from('vibecoin_pickups')
        .select('*')
        .eq('community_id', communityId)
        .eq('is_collected', false)
        .is('respawn_at', null);

      if (error) {
        console.error('Error fetching vibecoins:', error);
        return;
      }

      setCoins(data || []);
    };

    fetchCoins();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('vibecoin-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibecoin_pickups',
          filter: `community_id=eq.${communityId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCoin = payload.new as VibecoinData;
            if (!newCoin.is_collected) {
              setCoins((prev) => [...prev, newCoin]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as VibecoinData;
            if (updated.is_collected) {
              setCoins((prev) => prev.filter((c) => c.id !== updated.id));
            } else {
              setCoins((prev) => prev.map((c) => c.id === updated.id ? updated : c));
            }
          } else if (payload.eventType === 'DELETE') {
            setCoins((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const handleCollect = async (coinId: string) => {
    if (!userId) return;

    try {
      // Update coin as collected
      const { error: coinError } = await supabase
        .from('vibecoin_pickups')
        .update({
          is_collected: true,
          collected_by: userId,
          collected_at: new Date().toISOString(),
          respawn_at: new Date(Date.now() + 30000).toISOString() // Respawn in 30 seconds
        })
        .eq('id', coinId);

      if (coinError) {
        console.error('Error collecting coin:', coinError);
        return;
      }

      // Increment user's vibecoin balance
      const { data: userData } = await supabase
        .from('users')
        .select('vibecoin_balance')
        .eq('id', userId)
        .single();

      if (userData) {
        await supabase
          .from('users')
          .update({ vibecoin_balance: (userData.vibecoin_balance || 0) + 1 })
          .eq('id', userId);
      }

      // Show toast
      toast.success('⚡ +1 Vibecoin collected!');

      // Remove coin from local state
      setCoins((prev) => prev.filter((c) => c.id !== coinId));
    } catch (error) {
      console.error('Error in handleCollect:', error);
    }
  };

  return (
    <>
      {coins.map((coin) => (
        <Vibecoin
          key={coin.id}
          position={[coin.position_x, coin.position_y, coin.position_z]}
          onCollect={() => handleCollect(coin.id)}
          playerPosition={playerPosition}
        />
      ))}
    </>
  );
};
