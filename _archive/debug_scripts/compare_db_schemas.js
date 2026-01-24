/**
 * DATABASE SCHEMA COMPARISON SCRIPT
 * Compares Production and Development databases using Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const PROD = {
  url: 'https://fexjccrkgaeafyimpobv.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGpjY3JrZ2FlYWZ5aW1wb2J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzgzNDczOCwiZXhwIjoyMDQ5NDEwNzM4fQ.6BqFLgNTbFcMVzZH-yBnZ9hdPH1FNt6IFm5Tlf3jdT4'
};

const DEV = {
  url: 'https://bjuteyzpcpbittmdzveq.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
};

async function getTableColumns(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) return null;
    
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
  } catch (e) {
    return null;
  }
}

async function compareSchemas() {
  console.log('🔌 Connecting to databases...\n');
  
  const prodClient = createClient(PROD.url, PROD.key);
  const devClient = createClient(DEV.url, DEV.key);
  
  console.log('✅ Connected to PRODUCTION DB');
  console.log('✅ Connected to DEVELOPMENT DB\n');

  // Tables to check
  const tablesToCheck = [
    // Core
    'schools', 'users', 'profiles', 'roles', 'permissions', 'role_permissions',
    // Module system
    'module_registry', 'plan_modules', 'subscription_plans', 'school_subscriptions',
    // Organization
    'branches', 'branch_users', 'organizations', 'org_branches',
    // Academics
    'classes', 'sections', 'subjects', 'academic_years', 'terms',
    // Students
    'students', 'student_attendance', 'student_documents',
    // Staff
    'staff', 'staff_attendance', 'staff_documents',
    // Finance
    'fee_types', 'fee_structures', 'fee_collections', 'expenses', 'income',
    // Communication
    'announcements', 'events', 'notifications', 'email_configs', 'sms_configs',
    // CMS
    'front_cms_pages', 'front_cms_sections', 'front_cms_menus', 'front_cms_galleries',
    // System
    'audit_logs', 'sync_logs', 'version_snapshots', 'system_settings',
    // Other
    'school_users', 'school_owners', 'email_templates', 'whatsapp_configs',
    'library_books', 'book_issues', 'transport_routes', 'vehicles',
    'hostel_rooms', 'hostel_allocations', 'inventory_items', 'timetables',
    'exams', 'exam_results', 'exam_schedules', 'grades', 'report_cards',
    'requests', 'tickets', 'activity_logs', 'admissions', 'inquiries'
  ];

  console.log('='.repeat(70));
  console.log('📊 TABLE EXISTENCE COMPARISON');
  console.log('='.repeat(70));

  const prodTables = [];
  const devTables = [];
  const differences = [];
  
  console.log('\nChecking tables...\n');

  for (const table of tablesToCheck) {
    // Check PROD
    const { error: prodError } = await prodClient.from(table).select('*').limit(0);
    const existsInProd = !prodError || !prodError.message.includes('does not exist');
    
    // Check DEV
    const { error: devError } = await devClient.from(table).select('*').limit(0);
    const existsInDev = !devError || !devError.message.includes('does not exist');
    
    if (existsInProd) prodTables.push(table);
    if (existsInDev) devTables.push(table);
    
    if (existsInProd !== existsInDev) {
      const status = existsInProd && !existsInDev ? '❌ Missing in DEV' : '⚠️ Missing in PROD';
      differences.push({ table, status, prod: existsInProd, dev: existsInDev });
      console.log(`${status}: ${table}`);
    }
  }

  // Find differences
  const onlyInProd = prodTables.filter(t => !devTables.includes(t));
  const onlyInDev = devTables.filter(t => !prodTables.includes(t));
  const commonTables = prodTables.filter(t => devTables.includes(t));

  console.log('\n' + '='.repeat(70));
  console.log('📋 COMMON TABLES (exist in both)');
  console.log('='.repeat(70));
  console.log(`\n${commonTables.join(', ')}`);

  console.log('\n' + '='.repeat(70));
  console.log('🔍 COLUMN COMPARISON FOR KEY TABLES');
  console.log('='.repeat(70));

  const keyTables = ['module_registry', 'schools', 'users', 'profiles', 'subscription_plans', 'plan_modules', 'branches', 'roles'];
  let columnDiffs = 0;
  
  for (const table of keyTables) {
    if (!commonTables.includes(table)) continue;
    
    const prodCols = await getTableColumns(prodClient, table);
    const devCols = await getTableColumns(devClient, table);
    
    if (prodCols && devCols) {
      const missingInDev = prodCols.filter(c => !devCols.includes(c));
      const missingInProd = devCols.filter(c => !prodCols.includes(c));
      
      if (missingInDev.length > 0 || missingInProd.length > 0) {
        columnDiffs++;
        console.log(`\n📋 ${table}:`);
        console.log(`   PROD columns: ${prodCols.length} | DEV columns: ${devCols.length}`);
        if (missingInDev.length > 0) {
          console.log(`   ❌ Missing in DEV: ${missingInDev.join(', ')}`);
        }
        if (missingInProd.length > 0) {
          console.log(`   ⚠️ Missing in PROD: ${missingInProd.join(', ')}`);
        }
      } else {
        console.log(`\n✅ ${table}: Identical (${prodCols.length} columns)`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\n🏭 PRODUCTION Tables: ${prodTables.length}`);
  console.log(`🧪 DEVELOPMENT Tables: ${devTables.length}`);
  console.log(`📋 Common Tables: ${commonTables.length}`);
  console.log(`❌ Only in PROD: ${onlyInProd.length}`);
  console.log(`⚠️ Only in DEV: ${onlyInDev.length}`);
  console.log(`🔄 Tables with column differences: ${columnDiffs}`);

  // Final verdict
  console.log('\n' + '='.repeat(70));
  
  if (onlyInProd.length === 0 && onlyInDev.length === 0 && columnDiffs === 0) {
    console.log('🎉🎉🎉 DATABASES ARE FULLY IN SYNC! 🎉🎉🎉');
  } else if (onlyInProd.length === 0 && onlyInDev.length === 0) {
    console.log('✅ All tables exist in both databases');
    console.log(`⚠️ But ${columnDiffs} tables have column differences`);
  } else {
    console.log('⚠️ DATABASES ARE NOT FULLY IN SYNC');
    if (onlyInProd.length > 0) {
      console.log(`\n❌ Tables to ADD to DEV:`);
      onlyInProd.forEach(t => console.log(`   - ${t}`));
    }
    if (onlyInDev.length > 0) {
      console.log(`\n⚠️ Tables to ADD to PROD:`);
      onlyInDev.forEach(t => console.log(`   - ${t}`));
    }
  }
  
  console.log('\n' + '='.repeat(70));
}

compareSchemas().catch(console.error);
