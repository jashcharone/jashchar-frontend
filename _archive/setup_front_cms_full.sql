-- Add missing column to cms_settings
ALTER TABLE cms_settings ADD COLUMN IF NOT EXISTS exam_result_page_enabled BOOLEAN DEFAULT FALSE;

-- DROP tables to ensure clean state (Order matters due to FKs)
DROP TABLE IF EXISTS cms_banners CASCADE;
DROP TABLE IF EXISTS cms_news CASCADE;
DROP TABLE IF EXISTS cms_gallery_images CASCADE;
DROP TABLE IF EXISTS cms_gallery CASCADE;
DROP TABLE IF EXISTS cms_events CASCADE;
DROP TABLE IF EXISTS cms_menu_items CASCADE;
DROP TABLE IF EXISTS cms_menus CASCADE;
DROP TABLE IF EXISTS cms_pages CASCADE;
DROP TABLE IF EXISTS cms_media CASCADE;

-- 1. CMS Media (File Manager)
CREATE TABLE IF NOT EXISTS cms_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT, -- 'image', 'video', 'application', etc.
    file_url TEXT,
    youtube_url TEXT, -- For video links
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CMS Menus
CREATE TABLE IF NOT EXISTS cms_menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL, -- 'main-menu', 'bottom-menu'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, slug)
);

-- 3. CMS Menu Items
CREATE TABLE IF NOT EXISTS cms_menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES cms_menus(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES cms_menu_items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('page', 'external')),
    page_id UUID, -- Reference to cms_pages (added later to avoid circular dependency issues if any, though here it's fine)
    external_url TEXT,
    open_in_new_tab BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CMS Pages
CREATE TABLE IF NOT EXISTS cms_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('standard', 'events', 'news', 'gallery')),
    description TEXT, -- HTML Content
    meta_title TEXT,
    meta_keyword TEXT,
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image_id UUID REFERENCES cms_media(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, slug)
);

-- Add FK from menu_items to pages
ALTER TABLE cms_menu_items ADD CONSTRAINT fk_cms_menu_items_page FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE SET NULL;

-- 5. CMS Events
CREATE TABLE IF NOT EXISTS cms_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    venue TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    description TEXT,
    meta_title TEXT,
    meta_keyword TEXT,
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image_id UUID REFERENCES cms_media(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CMS Gallery
CREATE TABLE IF NOT EXISTS cms_gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    meta_title TEXT,
    meta_keyword TEXT,
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image_id UUID REFERENCES cms_media(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CMS Gallery Images (Many-to-Many for Gallery <-> Media)
CREATE TABLE IF NOT EXISTS cms_gallery_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gallery_id UUID NOT NULL REFERENCES cms_gallery(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES cms_media(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0
);

-- 8. CMS News
CREATE TABLE IF NOT EXISTS cms_news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    description TEXT,
    meta_title TEXT,
    meta_keyword TEXT,
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image_id UUID REFERENCES cms_media(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CMS Banners
CREATE TABLE IF NOT EXISTS cms_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES cms_media(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Helper function to check school access (if not exists)
-- Assuming 'school_users' table exists and links auth.uid() to school_id

-- Policy for School Admins (ALL operations)
CREATE POLICY "School admins can manage their own media" ON cms_media FOR ALL USING (school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid()));
CREATE POLICY "School admins can manage their own menus" ON cms_menus FOR ALL USING (school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid()));
CREATE POLICY "School admins can manage their own menu items" ON cms_menu_items FOR ALL USING (school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid()));
CREATE POLICY "School admins can manage their own pages" ON cms_pages FOR ALL USING (school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid()));
CREATE POLICY "School admins can manage their own events" ON cms_events FOR ALL USING (school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid()));
CREATE POLICY "School admins can manage their own galleries" ON cms_gallery FOR ALL USING (school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid()));
CREATE POLICY "School admins can manage their own gallery images" ON cms_gallery_images FOR ALL USING (gallery_id IN (SELECT id FROM cms_gallery WHERE school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid())));
CREATE POLICY "School admins can manage their own news" ON cms_news FOR ALL USING (school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid()));
CREATE POLICY "School admins can manage their own banners" ON cms_banners FOR ALL USING (school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid()));

-- Policy for Public Read Access (SELECT only)
-- We allow public read for all these tables, filtering by school_id is done in the query usually, 
-- but for RLS we can allow all or restrict to published.
-- For simplicity and performance on public site, we often allow public SELECT on these CMS tables.
-- Ideally, we should check if the school is active, but that might be complex in RLS.
-- Let's allow public SELECT for now.

CREATE POLICY "Public read access media" ON cms_media FOR SELECT USING (true);
CREATE POLICY "Public read access menus" ON cms_menus FOR SELECT USING (true);
CREATE POLICY "Public read access menu items" ON cms_menu_items FOR SELECT USING (true);
CREATE POLICY "Public read access pages" ON cms_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access events" ON cms_events FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access gallery" ON cms_gallery FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access gallery images" ON cms_gallery_images FOR SELECT USING (true);
CREATE POLICY "Public read access news" ON cms_news FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access banners" ON cms_banners FOR SELECT USING (true);

