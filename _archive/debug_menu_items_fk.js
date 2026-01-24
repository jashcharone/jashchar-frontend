const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkForeignKey() {
  console.log('🔍 Checking front_cms_menu_items and front_cms_pages relationship...\n');

  // Check column types
  const { data: columns, error: colError } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type, udt_name')
    .in('table_name', ['front_cms_pages', 'front_cms_menu_items'])
    .in('column_name', ['id', 'page_id']);

  if (colError) {
    console.error('Error fetching columns:', colError);
  } else {
    console.log('Column Data Types:');
    console.table(columns);
  }

  // Check existing pages
  const { data: pages, error: pagesError } = await supabase
    .from('front_cms_pages')
    .select('id, title, school_id')
    .limit(5);

  if (pagesError) {
    console.error('Error fetching pages:', pagesError);
  } else {
    console.log('\n✅ Sample Pages:');
    console.table(pages);
    if (pages.length > 0) {
      console.log('First page ID type:', typeof pages[0].id);
      console.log('First page ID value:', pages[0].id);
    }
  }

  // Check foreign key constraint
  const { data: constraints, error: fkError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'front_cms_menu_items' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'page_id';
    `
  });

  if (fkError) {
    console.error('\nError checking FK:', fkError);
  } else {
    console.log('\n🔗 Foreign Key Constraint:');
    console.log(constraints);
  }
}

checkForeignKey().catch(console.error);
