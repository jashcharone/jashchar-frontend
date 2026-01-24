-- Remove unwanted Front CMS submodules
-- Keep only: Website Settings, Menus, Pages, Gallery, News, Media Manager, Banners

-- First, let's see what we have
SELECT id, name, slug, parent_id 
FROM modules 
WHERE parent_id IN (SELECT id FROM modules WHERE slug = 'front_cms')
ORDER BY name;

-- Delete unwanted submodules (keep only: Website Settings, Menus, Pages, Gallery, News, Media Manager, Banners)
DELETE FROM modules 
WHERE slug IN (
    'general',
    'layout',
    'login_page'
)
AND parent_id IN (SELECT id FROM modules WHERE slug = 'front_cms');

-- Verify remaining submodules
SELECT m.id, m.name, m.slug, p.name as parent_name
FROM modules m
LEFT JOIN modules p ON m.parent_id = p.id
WHERE m.parent_id IN (SELECT id FROM modules WHERE slug = 'front_cms')
ORDER BY m.name;
