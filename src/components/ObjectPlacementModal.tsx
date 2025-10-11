import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ObjectPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (glbUrl: string, name: string, scale: { x: number; y: number; z: number }, position: { x: number; y: number; z: number }) => void;
}

export const ObjectPlacementModal = ({ isOpen, onClose, onConfirm }: ObjectPlacementModalProps) => {
  const [glbUrl, setGlbUrl] = useState('');
  const [objectName, setObjectName] = useState('');
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.glb')) {
      alert('Please upload a .glb file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `world-objects/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('character-models')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('character-models')
        .getPublicUrl(filePath);

      setGlbUrl(publicUrl);
      if (!objectName) {
        setObjectName(file.name.replace('.glb', ''));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (!glbUrl || !objectName) {
      alert('Please provide both a GLB file and a name');
      return;
    }
    onConfirm(glbUrl, objectName, scale, position);
    setGlbUrl('');
    setObjectName('');
    setScale({ x: 1, y: 1, z: 1 });
    setPosition({ x: 0, y: 0, z: 0 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Custom Object</DialogTitle>
          <DialogDescription>
            Upload a GLB file or paste a URL to add a 3D object to the world.
            <span className="block mt-1 text-amber-500 font-medium">
              Note: Enable "Experimental Mode" in settings to see GLB objects.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="object-name">Object Name</Label>
            <Input
              id="object-name"
              placeholder="e.g., Tree, Rock, Building"
              value={objectName}
              onChange={(e) => setObjectName(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Upload GLB File (max 200MB)</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => document.getElementById('glb-file-input')?.click()}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </>
                )}
              </Button>
              <input
                id="glb-file-input"
                type="file"
                accept=".glb"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {uploading && (
              <p className="text-sm text-muted-foreground">
                Uploading large file, please wait...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="glb-url">Or paste GLB URL</Label>
            <Input
              id="glb-url"
              placeholder="https://example.com/model.glb"
              value={glbUrl}
              onChange={(e) => setGlbUrl(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Scale</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="scale-x" className="text-xs">X</Label>
                <Input
                  id="scale-x"
                  type="number"
                  step="0.1"
                  value={scale.x}
                  onChange={(e) => setScale(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="scale-y" className="text-xs">Y</Label>
                <Input
                  id="scale-y"
                  type="number"
                  step="0.1"
                  value={scale.y}
                  onChange={(e) => setScale(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="scale-z" className="text-xs">Z</Label>
                <Input
                  id="scale-z"
                  type="number"
                  step="0.1"
                  value={scale.z}
                  onChange={(e) => setScale(prev => ({ ...prev, z: parseFloat(e.target.value) }))}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Position (X, Y, Z)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="position-x" className="text-xs">X</Label>
                <Input
                  id="position-x"
                  type="number"
                  step="0.5"
                  value={position.x}
                  onChange={(e) => setPosition(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="position-y" className="text-xs">Y</Label>
                <Input
                  id="position-y"
                  type="number"
                  step="0.5"
                  value={position.y}
                  onChange={(e) => setPosition(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="position-z" className="text-xs">Z</Label>
                <Input
                  id="position-z"
                  type="number"
                  step="0.5"
                  value={position.z}
                  onChange={(e) => setPosition(prev => ({ ...prev, z: parseFloat(e.target.value) || 0 }))}
                  className="bg-background/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Island center is (0, 0, 0). Island radius is about 11 units.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="flex-1"
              disabled={!glbUrl || !objectName}
            >
              Place Object
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};