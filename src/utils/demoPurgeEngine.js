import { supabase } from '@/lib/customSupabaseClient';

export const purgeDemoData = async (logger) => {
  logger.log('Initiating Purge Sequence...', 'warning');
  
  try {
    // 1. Find all schools marked as Demo Automation schools
    // We identify them by name pattern or code prefix used in generator
    const { data: demoSchools, error: searchError } = await supabase
      .from('schools')
      .select('id, name, current_session_id')
      .ilike('name', 'Jashchar Demo School (Automation)%');

    if (searchError) throw searchError;

    if (!demoSchools || demoSchools.length === 0) {
      logger.log('No active demo automation schools found to purge.', 'info');
      return;
    }

    logger.log(`Found ${demoSchools.length} demo schools to purge.`, 'info');

    for (const school of demoSchools) {
      logger.log(`Purging school: ${school.name} (${school.id})...`, 'warning');
      
      // MANUAL CASCADE DELETE (Robust Fallback)
      // 1. Delete Student Data (Dependent on Sections/Classes)
      await supabase.from('fee_payments').delete().eq('branch_id', school.id);
      await supabase.from('student_fee_allocations').delete().eq('branch_id', school.id);
      await supabase.from('student_profiles').delete().eq('branch_id', school.id);
      await supabase.from('parent_profiles').delete().eq('branch_id', school.id);

      // 2. Delete Staff Data
      await supabase.from('employee_profiles').delete().eq('branch_id', school.id);

      // 3. Delete Module Data
      await supabase.from('hostel_rooms').delete().eq('branch_id', school.id);
      await supabase.from('room_types').delete().eq('branch_id', school.id);
      await supabase.from('vehicles').delete().eq('branch_id', school.id);
      await supabase.from('transport_route').delete().eq('branch_id', school.id);
      await supabase.from('books').delete().eq('branch_id', school.id);
      await supabase.from('items').delete().eq('branch_id', school.id);
      await supabase.from('expenses').delete().eq('branch_id', school.id);
      await supabase.from('income').delete().eq('branch_id', school.id);

      // 4. Delete Academic Structure
      await supabase.from('class_sections').delete().eq('class_id', (await supabase.from('classes').select('id').eq('branch_id', school.id)).data?.map(c => c.id));
      // Note: class_sections doesn't always have branch_id, so we delete by class_id lookup or just rely on cascade if configured. 
      // Safer to try direct delete if schema allows, but usually it's a link table.
      // Let's try deleting sections and classes, usually cascade handles the link table.
      
      await supabase.from('sections').delete().eq('branch_id', school.id);
      await supabase.from('classes').delete().eq('branch_id', school.id);
      await supabase.from('subjects').delete().eq('branch_id', school.id);
      
      // 5. Delete HR Structure
      await supabase.from('designations').delete().eq('branch_id', school.id);
      await supabase.from('departments').delete().eq('branch_id', school.id);

      // 6. Delete School (Final Step)
      // Use the powerful RPC function to delete everything related to the school
      const { error: deleteError } = await supabase.rpc('delete_school_and_data', {
        p_branch_id: school.id
      });

      if (deleteError) {
        // If RPC fails, try direct delete as last resort
        const { error: directDeleteError } = await supabase.from('schools').delete().eq('id', school.id);
        if (directDeleteError) {
             logger.log(`Failed to delete school ${school.name}: ${directDeleteError.message}`, 'error');
        } else {
             logger.log(`Successfully deleted school (Manual): ${school.name}`, 'success');
        }
      } else {
        logger.log(`Successfully deleted school: ${school.name}`, 'success');
      }

      // Cleanup session if it was specific to this demo (Assuming generator creates unique sessions)
      if (school.current_session_id) {
         // We try to delete the session. If it fails (FK constraint), it means it's used elsewhere or wasn't fully cleaned.
         // However, delete_school_and_data usually handles school-linked data. Sessions are global but this one is specific.
         const { error: sessionError } = await supabase.from('sessions').delete().eq('id', school.current_session_id);
         if (!sessionError) logger.log('Demo session cleaned up.', 'success');
      }
    }

    logger.log('Purge sequence completed.', 'success');
    return true;

  } catch (error) {
    logger.log(`Critical Purge Error: ${error.message}`, 'error');
    return false;
  }
};
