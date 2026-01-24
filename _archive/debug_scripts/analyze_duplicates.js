const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bjuteyzpcpbittmdzveq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

/*
  ANALYSIS: Duplicates found in module_registry
  
  TRUE DUPLICATES (Same function, different records - SHOULD REMOVE ONE):
  
  1. GENERAL category sub-modules that duplicate modules in their proper category:
     - academics.class -> exists properly in academics
     - alumni.* -> exist properly in administration 
     - certificate.generate_staff_id_card -> exists as certificate.generate_staff_id in administration
     - download_center.* -> exist properly in administration
     - expenses.expense -> exists as expenses.expense_list in finance
     - fees_collection.fees_discount -> exists as fees_collection.fee_discount (typo)
     - fees_collection.fees_group -> exists as fees_collection.fee_group (typo)
     - fees_collection.fees_reminder -> exists as fees_collection.fee_reminder (typo)
     - fees_collection.fees_type -> exists as fees_collection.fee_type (typo)
     - fees_collection.search_fees_payment -> exists as fees_collection.search_fee_payment (typo)
     - front_cms.branch_login_settings -> exists as front_cms.login_settings in cms
     - front_office.setup_front_office -> exists as front_office.setup in administration
     - hostel.hostel -> exists as hostel.hostels in facilities
     - income.income -> exists as income.income_list in finance
     - lesson_plan.add_homework -> exists as homework.add_homework in academics
     - online_course.online_course -> exists as online_course.course_list in academics
     - online_course.online_course_report -> exists as online_course.report in academics
     - qr_code_attendance.* -> parent doesn't exist, orphan sub-modules
     - student_information.student_admission -> should be in core
     - system_settings.general_setting -> exists as system_settings.general in core
     - system_settings.upgrade_to_organization -> exists as system_settings.upgrade_to_org in core
     - zoom_live_classes.* -> parent doesn't exist, orphan sub-modules
  
  2. MASTER_ADMIN category:
     - librarian_library.* -> orphan sub-modules (parent doesn't exist)
  
  VALID DUPLICATES (Different contexts - KEEP BOTH):
     - reports.attendance vs attendance (parent vs analytics sub-report)
     - reports.examinations vs examinations (parent vs analytics sub-report)
     - reports.homework vs homework (parent vs analytics sub-report)
     - etc. (reports category serves different purpose)
  
*/

async function cleanupDuplicates() {
  console.log('='.repeat(80));
  console.log('🧹 MODULE REGISTRY CLEANUP SCRIPT');
  console.log('='.repeat(80));
  
  // IDs to DELETE (duplicates in GENERAL category that should be removed)
  const idsToDelete = [];
  
  // Get all modules first
  const { data: modules, error } = await supabase
    .from('module_registry')
    .select('*');
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  // Find modules to delete from GENERAL category (they are duplicates of properly categorized modules)
  const generalModules = modules.filter(m => m.category === 'general');
  
  console.log('\n📋 GENERAL CATEGORY MODULES TO REVIEW:');
  console.log('-'.repeat(60));
  
  generalModules.forEach(gm => {
    // Check if this module exists in a proper category
    const properModule = modules.find(m => 
      m.slug === gm.slug && 
      m.category !== 'general' && 
      m.id !== gm.id
    );
    
    // Or check if it's a variant (similar slug pattern)
    const normalSlug = gm.slug.replace(/_/g, '');
    const similar = modules.find(m => 
      m.slug.replace(/_/g, '') === normalSlug && 
      m.category !== 'general' && 
      m.id !== gm.id
    );
    
    if (properModule) {
      console.log('   ❌ DELETE:', gm.name, '[' + gm.slug + '] - exists in', properModule.category);
      idsToDelete.push({ id: gm.id, slug: gm.slug, reason: 'exact duplicate in ' + properModule.category });
    } else {
      console.log('   ⚠️ REVIEW:', gm.name, '[' + gm.slug + '] - parent:', gm.parent_slug || 'NONE');
    }
  });
  
  // Find orphan sub-modules (parent doesn't exist)
  const parentSlugs = new Set(modules.map(m => m.slug));
  const orphans = modules.filter(m => m.is_submodule && m.parent_slug && !parentSlugs.has(m.parent_slug));
  
  console.log('\n📋 ORPHAN SUB-MODULES (parent not found):');
  console.log('-'.repeat(60));
  
  orphans.forEach(o => {
    console.log('   🔗', o.name, '[' + o.slug + '] -> parent:', o.parent_slug, '| category:', o.category);
  });
  
  // Specific duplicates to analyze
  console.log('\n📋 SPECIFIC DUPLICATES ANALYSIS:');
  console.log('-'.repeat(60));
  
  // Fees collection duplicates (typos)
  const feesDups = [
    { keep: 'fees_collection.fee_discount', remove: 'fees_collection.fees_discount' },
    { keep: 'fees_collection.fee_group', remove: 'fees_collection.fees_group' },
    { keep: 'fees_collection.fee_reminder', remove: 'fees_collection.fees_reminder' },
    { keep: 'fees_collection.fee_type', remove: 'fees_collection.fees_type' },
    { keep: 'fees_collection.search_fee_payment', remove: 'fees_collection.search_fees_payment' },
  ];
  
  for (const dup of feesDups) {
    const keepMod = modules.find(m => m.slug === dup.keep);
    const removeMod = modules.find(m => m.slug === dup.remove);
    
    if (keepMod && removeMod) {
      console.log('   KEEP:', dup.keep, '(' + (keepMod.category) + ')');
      console.log('   DELETE:', dup.remove, '(' + (removeMod.category) + ')');
      idsToDelete.push({ id: removeMod.id, slug: removeMod.slug, reason: 'typo variant of ' + dup.keep });
    } else if (removeMod && !keepMod) {
      console.log('   ⚠️', dup.remove, 'exists but', dup.keep, 'does not - KEEP the existing one');
    }
  }
  
  // Other specific duplicates
  const specificDups = [
    { keep: 'front_office.setup', remove: 'front_office.setup_front_office' },
    { keep: 'certificate.generate_staff_id', remove: 'certificate.generate_staff_id_card' },
    { keep: 'hostel.hostels', remove: 'hostel.hostel' },
    { keep: 'expenses.expense_list', remove: 'expenses.expense' },
    { keep: 'income.income_list', remove: 'income.income' },
    { keep: 'homework.add_homework', remove: 'lesson_plan.add_homework' },
    { keep: 'online_course.course_list', remove: 'online_course.online_course' },
    { keep: 'online_course.report', remove: 'online_course.online_course_report' },
    { keep: 'system_settings.general', remove: 'system_settings.general_setting' },
    { keep: 'system_settings.upgrade_to_org', remove: 'system_settings.upgrade_to_organization' },
    { keep: 'front_cms.login_settings', remove: 'front_cms.branch_login_settings' },
  ];
  
  console.log('\n   Other specific duplicates:');
  for (const dup of specificDups) {
    const keepMod = modules.find(m => m.slug === dup.keep);
    const removeMod = modules.find(m => m.slug === dup.remove);
    
    if (keepMod && removeMod) {
      console.log('   KEEP:', dup.keep, '(' + (keepMod.category) + ')');
      console.log('   DELETE:', dup.remove, '(' + (removeMod.category) + ')');
      idsToDelete.push({ id: removeMod.id, slug: removeMod.slug, reason: 'duplicate of ' + dup.keep });
    } else if (removeMod && !keepMod) {
      console.log('   ⚠️', dup.remove, 'exists but', dup.keep, 'does not - NEED TO RENAME or KEEP');
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 FINAL DELETE LIST (' + idsToDelete.length + ' modules):');
  console.log('='.repeat(80));
  
  idsToDelete.forEach((item, i) => {
    console.log((i+1) + '. ' + item.slug + ' - ' + item.reason);
  });
  
  // Return the IDs for deletion
  return idsToDelete;
}

cleanupDuplicates().then(idsToDelete => {
  console.log('\n\n🔧 To delete these, run the delete script');
});
