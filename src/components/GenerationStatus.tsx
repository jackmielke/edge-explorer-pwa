import React from 'react';
import { Loader2 } from 'lucide-react';

interface GenerationStatusProps {
  isGenerating: boolean;
  status: string;
}

export const GenerationStatus = ({ isGenerating, status }: GenerationStatusProps) => {
  if (!isGenerating) return null;

  return (
    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/15 backdrop-blur-2xl border border-white/15 rounded-2xl px-6 py-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
          <div>
            <p className="text-white font-medium">🧪 Experimental Mode</p>
            <p className="text-white/70 text-sm">{status}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
