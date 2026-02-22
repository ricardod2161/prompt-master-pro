
-- Create marketing_images table
CREATE TABLE public.marketing_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  prompt_used TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  format TEXT NOT NULL,
  style TEXT,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_images ENABLE ROW LEVEL SECURITY;

-- Users can view images from their units
CREATE POLICY "Users can view marketing images"
  ON public.marketing_images FOR SELECT
  USING (has_unit_access(auth.uid(), unit_id));

-- Users can insert images for their units
CREATE POLICY "Users can insert marketing images"
  ON public.marketing_images FOR INSERT
  WITH CHECK (has_unit_access(auth.uid(), unit_id) AND auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete their marketing images"
  ON public.marketing_images FOR DELETE
  USING (has_unit_access(auth.uid(), unit_id) AND auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-images', 'marketing-images', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload marketing images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'marketing-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view marketing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-images');

CREATE POLICY "Users can delete their marketing images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'marketing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
