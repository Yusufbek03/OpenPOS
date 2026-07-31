-- Supabase Storage: создайте bucket "uploads" (Public: Yes)
-- Затем выполните этот SQL в SQL Editor:
-- https://supabase.com/dashboard/project/ytanvpjxqfdxcvghmzny/sql/new

CREATE POLICY "Allow all for uploads bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');
