import React, { useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { supabase } from '@/integrations/supabase/client';

interface WorldObject {
  id: string;
  object_type: string;
  position: { x: number; y: number; z: number };
  properties: { 
    color: string; 
    scale?: { x: number; y: number; z: number };
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
      const { data, error } = await supabase
        .from('world_objects')
        .select('*')
        .eq('community_id', communityId);

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

    switch (obj.object_type) {
      case 'box':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      case 'sphere':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      case 'cylinder':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      case 'cone':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <coneGeometry args={[0.5, 1, 32]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      case 'torus':
        return (
          <mesh key={obj.id} position={position} scale={scale} castShadow receiveShadow>
            <torusGeometry args={[0.5, 0.2, 16, 100]} />
            <meshStandardMaterial color={obj.properties.color} />
          </mesh>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {objects.map(renderObject)}
    </>
  );
};