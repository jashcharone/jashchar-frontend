-- Create front_cms_media table if not exists
CREATE TABLE IF NOT EXISTS front_cms_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    filename TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE front_cms_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public read media" ON front_cms_media;
DROP POLICY IF EXISTS "School owners manage media" ON front_cms_media;
DROP POLICY IF EXISTS "Master Admin manage media" ON front_cms_media;

-- Policy 1: Public can read media
CREATE POLICY "Public read media" ON front_cms_media
FOR SELECT USING (true);

-- Policy 2: School owners can manage their media
CREATE POLICY "School owners manage media" ON front_cms_media
FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM school_users WHERE school_id = front_cms_media.school_id
        UNION
        SELECT owner_user_id FROM schools WHERE id = front_cms_media.school_id
    )
);

-- Policy 3: Master Admin can manage all media (using get_user_role function)
CREATE POLICY "Master Admin manage media" ON front_cms_media
FOR ALL USING (
    public.get_user_role() = 'master_admin'
);

-- Create storage bucket if not exists (run this in Supabase Dashboard > Storage)
-- Bucket name: cms-media
-- Public: Yes
-- Allowed MIME types: image/*,video/*,audio/*,application/*,text/*

-- Verify table
SELECT 'Table created successfully!' as status, COUNT(*) as total_media FROM front_cms_media;
