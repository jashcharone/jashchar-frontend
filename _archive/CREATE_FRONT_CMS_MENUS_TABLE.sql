-- ============================================
-- CREATE front_cms_menus TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create front_cms_menus table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.front_cms_menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create front_cms_menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.front_cms_menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_id UUID NOT NULL REFERENCES public.front_cms_menus(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    page_id UUID REFERENCES public.cms_pages(id) ON DELETE SET NULL,
    is_external BOOLEAN DEFAULT false,
    open_in_new_tab BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    parent_id UUID REFERENCES public.front_cms_menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.front_cms_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.front_cms_menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read menus" ON public.front_cms_menus;
DROP POLICY IF EXISTS "Admin all menus" ON public.front_cms_menus;
DROP POLICY IF EXISTS "Public read menu items" ON public.front_cms_menu_items;
DROP POLICY IF EXISTS "Admin all menu items" ON public.front_cms_menu_items;

-- Create RLS Policies for front_cms_menus
CREATE POLICY "Public read menus" ON public.front_cms_menus 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin all menus" ON public.front_cms_menus 
FOR ALL 
USING (
    auth.uid() IN (
        SELECT user_id FROM public.school_users WHERE school_id = front_cms_menus.school_id
        UNION
        SELECT owner_user_id FROM public.schools WHERE id = front_cms_menus.school_id
    )
);

-- Create RLS Policies for front_cms_menu_items
CREATE POLICY "Public read menu items" ON public.front_cms_menu_items 
FOR SELECT 
USING (true);

CREATE POLICY "Admin all menu items" ON public.front_cms_menu_items 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.front_cms_menus
        WHERE front_cms_menus.id = front_cms_menu_items.menu_id
        AND (
            front_cms_menus.school_id IN (
                SELECT school_id FROM public.school_users WHERE user_id = auth.uid()
            )
            OR
            front_cms_menus.school_id IN (
                SELECT id FROM public.schools WHERE owner_user_id = auth.uid()
            )
        )
    )
);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload config';

-- Verify tables were created
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('front_cms_menus', 'front_cms_menu_items')
ORDER BY table_name, ordinal_position;

