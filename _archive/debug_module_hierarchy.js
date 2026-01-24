const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHierarchy() {
    console.log('Checking module hierarchy for website-settings...');

    const { data: modules, error } = await supabase
        .from('modules')
        .select('id, name, slug, parent_id')
        .or('slug.eq.website-settings,slug.eq.front-cms');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Modules found:', modules);

    const frontCms = modules.find(m => m.slug === 'front-cms');
    const websiteSettings = modules.find(m => m.slug === 'website-settings');

    if (frontCms) {
        console.log('Front CMS ID:', frontCms.id);
    } else {
        console.log('Front CMS module NOT found');
    }

    if (websiteSettings) {
        console.log('Website Settings ID:', websiteSettings.id);
        console.log('Website Settings Parent ID:', websiteSettings.parent_id);
        
        if (frontCms && websiteSettings.parent_id === frontCms.id) {
            console.log('SUCCESS: website-settings is a child of front-cms');
        } else {
            console.log('FAILURE: website-settings is NOT a child of front-cms');
        }
    } else {
        console.log('Website Settings module NOT found');
    }
}

checkHierarchy();
