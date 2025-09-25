import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Island {
  id: string;
  name: string;
  emoji: string;
  description: string;
  position: { x: number; y: number };
}

const islands: Island[] = [
  {
    id: 'lumy',
    name: 'Lumy',
    emoji: '🌋',
    description: 'Volcanic island with ancient mysteries',
    position: { x: 20, y: 15 }
  },
  {
    id: 'sf',
    name: 'SF',
    emoji: '🏠',
    description: 'Tech hub with palm trees',
    position: { x: 70, y: 10 }
  },
  {
    id: 'koh-phangan',
    name: 'Koh Phangan',
    emoji: '🌴',
    description: 'Tropical paradise with hidden treasures',
    position: { x: 15, y: 35 }
  },
  {
    id: 'patagonia',
    name: 'Patagonia',
    emoji: '🏔️',
    description: 'Majestic peaks and endless adventures',
    position: { x: 75, y: 30 }
  },
  {
    id: 'world-3',
    name: 'Oasis',
    emoji: '🌊',
    description: 'Serene waters and gentle breezes',
    position: { x: 25, y: 55 }
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda',
    emoji: '🗻',
    description: 'Crystal peaks touching the clouds',
    position: { x: 65, y: 50 }
  },
  {
    id: 'world-1',
    name: 'Eden',
    emoji: '🌳',
    description: 'Lush forests with sacred pools',
    position: { x: 30, y: 75 }
  },
  {
    id: 'world-2',
    name: 'Mirage',
    emoji: '🌵',
    description: 'Desert realm of infinite possibilities',
    position: { x: 70, y: 70 }
  }
];

export const EdgeExplorer = () => {
  const navigate = useNavigate();

  const handleIslandClick = (island: Island) => {
    console.log(`Clicked on ${island.name}`);
    // TODO: Navigate to specific island/world
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-sky-300 to-cyan-300 relative overflow-hidden">
      {/* Navigation */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Floating particles for ambiance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Islands */}
      <div className="relative w-full h-screen">
        {islands.map((island) => (
          <div
            key={island.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${island.position.x}%`,
              top: `${island.position.y}%`
            }}
            onClick={() => handleIslandClick(island)}
          >
            {/* Island base */}
            <div className="relative">
              {/* Shadow */}
              <div className="absolute top-2 left-2 w-24 h-16 bg-black/10 rounded-full blur-md" />
              
              {/* Island */}
              <div className="w-24 h-16 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full border-4 border-amber-100 shadow-lg transform group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl">
                {/* Grass layer */}
                <div className="absolute inset-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full" />
                
                {/* Feature emoji */}
                <div className="absolute inset-0 flex items-center justify-center text-2xl group-hover:scale-125 transition-transform duration-300">
                  {island.emoji}
                </div>
              </div>

              {/* Island name */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                  {island.name}
                </div>
              </div>

              {/* Description tooltip */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm text-black px-3 py-2 rounded-lg text-xs font-medium shadow-lg max-w-32 text-center">
                  {island.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
        <h1 className="text-6xl font-bold text-black mb-2 drop-shadow-lg">
          Edge Explorer
        </h1>
        <p className="text-lg text-black/80 font-medium">
          Choose your world to explore
        </p>
      </div>

      {/* Waves animation at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-400 to-transparent">
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 opacity-50 animate-pulse" />
      </div>
    </div>
  );
};