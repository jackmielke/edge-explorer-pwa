import React, { useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { supabase } from '@/integrations/supabase/client';
import { PhysicsObject } from './PhysicsObject';

interface WorldObject {
  id: string;
  object_type: string;
  position: { x: number; y: number; z: number };
  properties: { 
    color: string; 
    scale?: { x: number; y: number; z: number };
    physics?: {
      collisionType: 'solid' | 'passthrough' | 'platform' | 'bouncy';
      mass?: number;
      friction?: number;
      restitution?: number;
      isStatic?: boolean;
      interactivity?: {
        canJumpOn?: boolean;
        canPushAround?: boolean;
        triggersEvents?: boolean;
      };
    };
  };
  created_at: string;
}

interface WorldObjectsProps {
  communityId: string;
}

export const WorldObjects = ({ communityId }: WorldObjectsProps) => {
  const [objects, setObjects] = useState<WorldObject[]>([]);

  useEffect(() => {
    // Fetch existing objects
    const fetchObjects = async () => {
      console.log('Fetching world objects for community:', communityId);
      
      const { data, error } = await supabase
        .from('world_objects')
        .select('*')
        .eq('community_id', communityId);

      console.log('World objects fetch result:', { data, error });

      if (error) {
        console.error('Error fetching world objects:', error);
        return;
      }

      // Type-safe conversion of the data
      const typedObjects = (data || []).map(obj => ({
        id: obj.id,
        object_type: obj.object_type,
        position: obj.position as { x: number; y: number; z: number },
        properties: obj.properties as { color: string; scale?: { x: number; y: number; z: number } },
        created_at: obj.created_at
      }));

      console.log('Setting world objects:', typedObjects);
      setObjects(typedObjects);
    };

    fetchObjects();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('world-objects-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'world_objects',
          filter: `community_id=eq.${communityId}`
        },
        (payload) => {
          console.log('New object spawned:', payload);
          const newObject = {
            id: payload.new.id,
            object_type: payload.new.object_type,
            position: payload.new.position as { x: number; y: number; z: number },
            properties: payload.new.properties as { color: string; scale?: { x: number; y: number; z: number } },
            created_at: payload.new.created_at
          };
          setObjects(prev => [...prev, newObject]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'world_objects',
          filter: `community_id=eq.${communityId}`
        },
        (payload) => {
          console.log('Object deleted:', payload);
          setObjects(prev => prev.filter(obj => obj.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'world_objects',
          filter: `community_id=eq.${communityId}`
        },
        (payload) => {
          console.log('Object updated:', payload);
          const updatedObject = {
            id: payload.new.id,
            object_type: payload.new.object_type,
            position: payload.new.position as { x: number; y: number; z: number },
            properties: payload.new.properties as { color: string; scale?: { x: number; y: number; z: number } },
            created_at: payload.new.created_at
          };
          setObjects(prev => prev.map(obj => 
            obj.id === payload.new.id ? updatedObject : obj
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const renderObject = (obj: WorldObject) => {
    const position: [number, number, number] = [obj.position.x, obj.position.y, obj.position.z];
    const scale: [number, number, number] = obj.properties.scale 
      ? [obj.properties.scale.x, obj.properties.scale.y, obj.properties.scale.z] 
      : [1, 1, 1];

    // Default physics configuration
    const physics = {
      collisionType: obj.properties.physics?.collisionType || 'solid' as const,
      mass: obj.properties.physics?.mass || 1,
      friction: obj.properties.physics?.friction || 0.3,
      restitution: obj.properties.physics?.restitution || 0.3,
      isStatic: obj.properties.physics?.isStatic || false,
    };

    // Use PhysicsObject for all objects now
    return (
      <PhysicsObject
        key={obj.id}
        id={obj.id}
        objectType={obj.object_type}
        position={position}
        scale={scale}
        color={obj.properties.color}
        physics={physics}
      />
    );
  };

  return (
    <>
      {objects.map(renderObject)}
    </>
  );
};