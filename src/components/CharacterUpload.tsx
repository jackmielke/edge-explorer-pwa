import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Upload, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const characterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  description: z.string().trim().max(200, "Description must be less than 200 characters").optional()
});

interface CharacterUploadProps {
  open: boolean;
  onClose: () => void;
  communityId?: string;
  onCharacterCreated: () => void;
}

export const CharacterUpload = ({ open, onClose, communityId, onCharacterCreated }: CharacterUploadProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const glbFile = files.find(file => file.name.toLowerCase().endsWith('.glb'));
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (glbFile) {
      if (glbFile.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "File too large",
          description: "GLB file must be smaller than 50MB",
          variant: "destructive"
        });
        return;
      }
      setGlbFile(glbFile);
    }

    if (imageFile) {
      if (imageFile.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Image too large",
          description: "Thumbnail must be smaller than 2MB",
          variant: "destructive"
        });
        return;
      }
      setThumbnailFile(imageFile);
    }
  }, [toast]);

  // Sanitize file names to avoid spaces and special characters that can break uploads/URLs
  const sanitizeFileName = (name: string) => {
    const dotIndex = name.lastIndexOf('.');
    const base = dotIndex !== -1 ? name.slice(0, dotIndex) : name;
    const ext = dotIndex !== -1 ? name.slice(dotIndex) : '';
    const cleaned = base
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-') // keep alphanum, dash, underscore
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${cleaned || 'file'}${ext}`;
  };

  const uploadFile = async (file: File, bucket: string, path: string, label: string, contentType?: string) => {
    console.log(`[CharacterUpload] Starting ${label} upload to ${bucket}/${path}`);
    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType || file.type || undefined
      });

    const timeoutMs = 600000; // 10 minutes to avoid premature aborts on slower networks
    const result = await Promise.race([
      uploadPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} upload timed out`)), timeoutMs))
    ]) as { data: any; error: any };

    if (result?.error) throw result.error;
    console.log(`[CharacterUpload] ${label} upload complete`);
    return result?.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!glbFile) {
      toast({
        title: "GLB file required",
        description: "Please select a GLB file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      const validatedData = characterSchema.parse({ name, description });
      setUploading(true);
      console.log('[CharacterUpload] Validation passed. Starting upload process');

      // Get current user
      console.log('[CharacterUpload] Fetching current auth user');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('You must be logged in to upload characters');
      console.log('[CharacterUpload] Auth user found', user.id);

      // Get user's internal ID
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userDataError || !userData) {
        console.error('[CharacterUpload] No user profile found for auth user', user.id, userDataError);
        throw new Error('User profile not found');
      }
      console.log('[CharacterUpload] Internal user id', userData.id);

      const timestamp = Date.now();
      const sanitizedGlbName = sanitizeFileName(glbFile.name);
      const glbPath = `${user.id}/${timestamp}_${sanitizedGlbName}`;
      
      // Upload GLB file
      await uploadFile(glbFile, 'character-models', glbPath, 'GLB', 'model/gltf-binary');
      const glbUrl = `https://efdqqnubowgwsnwvlalp.supabase.co/storage/v1/object/public/character-models/${glbPath}`;

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailPath = `${user.id}/${timestamp}_thumbnail_${sanitizeFileName(thumbnailFile.name)}`;
        await uploadFile(thumbnailFile, 'character-models', thumbnailPath, 'Thumbnail', thumbnailFile.type || 'image/png');
        thumbnailUrl = `https://efdqqnubowgwsnwvlalp.supabase.co/storage/v1/object/public/character-models/${thumbnailPath}`;
      }

      // Create character record
      const { error: insertError } = await supabase
        .from('characters')
        .insert({
          name: validatedData.name,
          description: validatedData.description || null,
          glb_file_url: glbUrl,
          thumbnail_url: thumbnailUrl,
          community_id: communityId || null,
          created_by: userData.id,
          is_default: false,
          metadata: {
            file_size: glbFile.size,
            original_filename: glbFile.name
          }
        });

      if (insertError) throw insertError;

      toast({
        title: "Character uploaded successfully!",
        description: `${validatedData.name} is now available for selection.`
      });

      // Reset form
      setName('');
      setDescription('');
      setGlbFile(null);
      setThumbnailFile(null);
      onCharacterCreated();
      onClose();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload character. Please try again.",
        variant: "destructive"
      });
      setUploading(false);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (type: 'glb' | 'thumbnail') => {
    if (type === 'glb') {
      setGlbFile(null);
    } else {
      setThumbnailFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Add New Character</DialogTitle>
          <DialogDescription>
            Upload a .glb model (max 50MB) and an optional thumbnail image.
          </DialogDescription>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Character Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter character name"
              className="bg-input border-border"
              maxLength={50}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your character..."
              className="bg-input border-border resize-none"
              maxLength={200}
              rows={3}
            />
          </div>

          <div>
            <Label>GLB File *</Label>
            <Card
              className={`p-6 border-2 border-dashed transition-colors cursor-pointer ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : glbFile 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('glb-file')?.click()}
            >
              <input
                id="glb-file"
                type="file"
                accept=".glb"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 50 * 1024 * 1024) {
                      toast({
                        title: "File too large",
                        description: "GLB file must be smaller than 50MB",
                        variant: "destructive"
                      });
                      return;
                    }
                    setGlbFile(file);
                  }
                }}
              />
              
              {glbFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">{glbFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile('glb');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drop GLB file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 50MB
                  </p>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Label>Thumbnail (Optional)</Label>
            <Card
              className={`p-4 border-2 border-dashed transition-colors cursor-pointer ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : thumbnailFile 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('thumbnail-file')?.click()}
            >
              <input
                id="thumbnail-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      toast({
                        title: "Image too large",
                        description: "Thumbnail must be smaller than 2MB",
                        variant: "destructive"
                      });
                      return;
                    }
                    setThumbnailFile(file);
                  }
                }}
              />
              
              {thumbnailFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{thumbnailFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile('thumbnail');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">
                    Optional preview image (Max 2MB)
                  </p>
                </div>
              )}
            </Card>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !glbFile}
              className="flex-1"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Character
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};