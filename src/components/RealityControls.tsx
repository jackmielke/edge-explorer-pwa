import React from 'react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Card } from './ui/card';

interface RealityControlsProps {
  gravity: number;
  timeScale: number;
  onGravityChange: (value: number) => void;
  onTimeScaleChange: (value: number) => void;
}

export const RealityControls = ({
  gravity,
  timeScale,
  onGravityChange,
  onTimeScaleChange,
}: RealityControlsProps) => {
  return (
    <Card className="fixed top-20 right-4 p-4 w-64 bg-background/80 backdrop-blur-lg border-primary/20 z-50">
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Gravity: {gravity.toFixed(2)}
          </Label>
          <Slider
            value={[gravity]}
            onValueChange={([value]) => onGravityChange(value)}
            min={-30}
            max={0}
            step={0.5}
            className="w-full"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">
            Time Scale: {timeScale.toFixed(2)}x
          </Label>
          <Slider
            value={[timeScale]}
            onValueChange={([value]) => onTimeScaleChange(value)}
            min={0.1}
            max={3}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
};
