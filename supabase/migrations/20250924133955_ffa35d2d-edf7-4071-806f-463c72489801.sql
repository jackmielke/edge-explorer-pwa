-- Create characters table for GLB file management
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  glb_file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_by UUID REFERENCES public.users(id),
  community_id UUID REFERENCES public.communities(id),
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Create policies for characters
CREATE POLICY "Anyone can view characters for their communities" 
ON public.characters 
FOR SELECT 
USING (
  community_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM community_members cm 
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = characters.community_id 
    AND u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Community members can create characters" 
ON public.characters 
FOR INSERT 
WITH CHECK (
  created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) AND
  (community_id IS NULL OR EXISTS (
    SELECT 1 FROM community_members cm 
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = characters.community_id 
    AND u.auth_user_id = auth.uid()
  ))
);

CREATE POLICY "Character creators can update their characters" 
ON public.characters 
FOR UPDATE 
USING (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Character creators can delete their characters" 
ON public.characters 
FOR DELETE 
USING (created_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Create storage bucket for character models
INSERT INTO storage.buckets (id, name, public) VALUES ('character-models', 'character-models', true);

-- Create storage policies for character models
CREATE POLICY "Anyone can view character models" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'character-models');

CREATE POLICY "Community members can upload character models" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'character-models' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own character models" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'character-models' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();