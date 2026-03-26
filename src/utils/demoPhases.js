import { supabase } from '@/lib/customSupabaseClient';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '@/lib/apiClient';

// Helper to generate a secondary client for auth operations to avoid disrupting the main session
const getFreshClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabase.supabaseUrl;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabase.supabaseKey;
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * PHASE 1: MASTER ADMIN SETUP (End-to-End Simulation)
 * 1. Submits School Registration (Frontend Simulation)
 * 2. Approves Request (Master Admin API)
 * 3. Logs in as School Owner
 */
export const executePhase1 = async (context, logger, generator) => {
  logger.log('PHASE 1: Simulating End-to-End Registration & Approval...', 'info');
  
  const demoData = generator();
  context.demoData = demoData;

  // --- STEP 1: SUBMIT REGISTRATION FORM (Frontend Simulation) ---
  logger.log(`Submitting Registration for: ${demoData.school.name}`, 'info');

  const password = demoData.school.password || 'DemoPass123!';
  const organizationData = {
      name: demoData.school.name,
      code: null
  };
  
  // Create multi-branch setup (2 Branches)
  const branchData = [
    {
      name: `${demoData.school.name} - Main Branch`,
      board: 'CBSE',
      address: demoData.school.address,
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      sequence: 1,
      is_primary: true,
      session: {
          name: demoData.school.sessionName,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }
    },
    {
      name: `${demoData.school.name} - Branch 2`,
      board: 'ICSE',
      address: '456 Secondary Road, Tech Park',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560002',
      sequence: 2,
      is_primary: false,
      session: {
          name: demoData.school.sessionName,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }
    }
  ];
  
  const metadataJson = JSON.stringify({
      organization: organizationData,
      branches: branchData
  });
  
  const notesWithPassword = `Demo Automation Request||PWD:${password}||ORG_BRANCH_DATA:${metadataJson}`;
  const uniqueSlug = `demo-school-${Date.now()}`;
  
  // Generate unique mobile number to avoid unique constraint violations
  // Format: 9 + 9 random digits
  const uniqueMobile = '9' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');

  const requestPayload = {
      registration_type: 'organization_multi_branch',
      school_name: demoData.school.name,
      contact_number: uniqueMobile,
      contact_email: demoData.school.email,
      address: demoData.school.address,
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      board: 'CBSE',
      owner_name: 'Demo Owner',
      owner_email: demoData.school.email,
      owner_mobile: uniqueMobile,
      notes: notesWithPassword,
      slug: uniqueSlug,
      status: 'pending'
  };

  const { data: requestData, error: requestError } = await supabase
      .from('school_requests')
      .insert([requestPayload])
      .select()
      .single();

  if (requestError) throw new Error(`Registration Failed: ${requestError.message}`);
  
  const requestId = requestData.id;
  logger.log(`Registration Submitted. Request ID: ${requestId}`, 'success');

  // --- STEP 2: APPROVE REQUEST (Master Admin Simulation) ---
  logger.log('Approving Request via Master Admin API...', 'info');

  // Fetch a valid plan ID (Must support multiple branches for this scenario)
  const { data: plans } = await supabase
      .from('subscription_plans')
      .select('id, name')
      .gte('max_branches_allowed', 2)
      .order('max_branches_allowed', { ascending: false })
      .limit(1);
      
  const planId = plans && plans.length > 0 ? plans[0].id : null;
  const planName = plans && plans.length > 0 ? plans[0].name : 'Unknown Plan';

  if (!planId) throw new Error('No subscription plans found that support multiple branches (Diamond Plan required).');
  
  logger.log(`Selected Plan: ${planName} (Required for Approval)`, 'info');
  logger.log(`Initial Academic Session: ${demoData.school.sessionName}`, 'info');

  try {
      // Call the backend approval endpoint
      const response = await apiClient.post('/admin/approve-request', {
          requestId: requestId,
          planId: planId
      });
      
      // apiClient returns the data directly, not an axios response object
      logger.log(`Request Approved: ${response.message}`, 'success');
      
      // Fetch the created School to get IDs
      // We wait a moment to ensure DB propagation if needed, though usually immediate
      const { data: school } = await supabase
          .from('schools')
          .select('id, organization_id, current_session_id')
          .eq('slug', uniqueSlug)
          .single();
          
      if (!school) throw new Error('School created but not found in database.');
      
      context.branchId = school.id;
      context.sessionId = school.current_session_id;
      
      logger.log(`School Created. ID: ${context.branchId}`, 'success');

  } catch (apiError) {
      console.error(apiError);
      // Handle both apiClient errors (error.data) and standard errors
      const errorMessage = apiError.data?.message || apiError.message || 'Unknown error';
      throw new Error(`Approval Failed: ${errorMessage}`);
  }

  // --- STEP 3: LOGIN AS SCHOOL OWNER ---
  logger.log('Logging in as School Owner...', 'info');
  
  // Use fresh client for School Owner auth
  const authClient = getFreshClient();
  
  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: demoData.school.email,
      password: password
  });

  if (signInError) throw new Error(`Login Failed: ${signInError.message}`);
  
  context.ownerClient = authClient;
  context.ownerUserId = signInData.user.id;
  
  logger.log('School Owner Logged In Successfully', 'success');
};

/**
 * PHASE 2: SCHOOL OWNER CORE STRUCTURE (Academic Structure)
 * Classes, Subjects, Staff
 */
export const executePhase2 = async (context, logger) => {
  logger.log('PHASE 2: Building Core Academic Structure...', 'info');
  const { branchId, demoData, ownerClient } = context;

  // Use ownerClient for operations to simulate School Owner actions
  // Fallback to main supabase if ownerClient is missing (shouldn't happen)
  const client = ownerClient || supabase; 

  // --- FIX: Use School ID as Primary Branch ID ---
  // In the new model, the 'school' created via slug IS the primary branch.
  // And 'branches' table is synced with 'schools' table (id = id).
  logger.log(`Using Primary Branch ID: ${branchId}`, 'info');
  // ------------------------------------

  // 1. Classes
  const classMap = {}; 
  for (const cls of demoData.classes) {
    // Try insert, if fails (duplicate), try select
    let { data, error } = await client.from('classes').insert({ 
        branch_id: branchId, 
        name: cls.name 
    }).select('id').single();

    if (error && error.code === '23505') { // Unique violation
        const { data: existing } = await client.from('classes')
            .select('id')
            .eq('branch_id', branchId)
            .eq('name', cls.name)
            .single();
        if (existing) {
            data = existing;
            error = null;
        }
    }

    if (error) logger.log(`Class Error: ${error.message}`, 'error');
    if (data) classMap[cls.name] = data.id;
  }
  context.classMap = classMap;
  logger.log(`Created ${Object.keys(classMap).length} Classes`, 'success');

  // 2. Sections
  const sectionMap = {};
  for (const sec of demoData.sections) {
    let { data, error } = await client.from('sections').insert({ 
        branch_id: branchId, 
        name: sec.name 
    }).select('id').single();

    if (error && error.code === '23505') { // Unique violation
        const { data: existing } = await client.from('sections')
            .select('id')
            .eq('branch_id', branchId)
            .eq('name', sec.name)
            .single();
        if (existing) {
            data = existing;
            error = null;
        }
    }

    if (error) logger.log(`Section Error: ${error.message}`, 'error');
    if (data) sectionMap[sec.name] = data.id;
  }
  context.sectionMap = sectionMap;
  logger.log(`Created ${Object.keys(sectionMap).length} Sections`, 'success');

  // 3. Assign Sections to Classes
  for (const classId of Object.values(classMap)) {
    for (const sectionId of Object.values(sectionMap)) {
      // Check if mapping exists
      const { data: existingMap } = await client.from('class_sections')
        .select('id')
        .eq('class_id', classId)
        .eq('section_id', sectionId)
        .maybeSingle();
      
      if (!existingMap) {
        await client.from('class_sections').insert({ class_id: classId, section_id: sectionId });
      }
    }
  }
  logger.log('Linked Classes & Sections', 'success');

  // 4. Subjects
  const subjectMap = {};
  for (const sub of demoData.subjects) {
    const { data } = await client.from('subjects').insert({ 
        branch_id: branchId, name: sub.name, type: sub.type, code: sub.code 
    }).select('id').single();
    if (data) subjectMap[sub.name] = data.id;
  }
  context.subjectMap = subjectMap;
  logger.log(`Created ${Object.keys(subjectMap).length} Subjects`, 'success');

  // 5. Departments & Designations
  const deptMap = {};
  for (const dept of demoData.departments) {
      const { data } = await client.from('departments').insert({ branch_id: branchId, name: dept }).select('id').single();
      if(data) deptMap[dept] = data.id;
  }
  const desigMap = {};
  for (const desig of demoData.designations) {
      const { data } = await client.from('designations').insert({ branch_id: branchId, name: desig }).select('id').single();
      if(data) desigMap[desig] = data.id;
  }
  logger.log('HR Structure (Departments & Designations) Created', 'success');

  // 6. Staff Members - FIXED: Create Auth User First
  logger.log('Creating Staff Members (Auth + Profile)...', 'info');
  
  // Fetch Role IDs using owner client
  const { data: roles } = await client.from('roles').select('id, name').eq('branch_id', branchId);
  // Create a map that handles both original case and lowercase for robustness
  const roleMap = roles.reduce((acc, r) => ({ ...acc, [r.name]: r.id, [r.name.toLowerCase()]: r.id }), {});

  const tempAuthClient = getFreshClient(); // Use fresh client for staff signup to avoid killing owner session

  for (const staff of demoData.staff) {
      try {
          // Add delay to prevent rate limiting (Increased to 6s)
          await new Promise(resolve => setTimeout(resolve, 6000));

          // A. Create Auth User
          const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
              email: staff.email,
              password: 'password123',
              options: {
                  data: {
                      branch_id: branchId,
                      role: staff.role.toLowerCase(),
                      full_name: staff.name
                  }
              }
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('No user returned from SignUp');

          // FIX: Use the client that has the session (if available) or fallback to owner
          // If signUp returns a session, tempAuthClient is authenticated as the new user.
          // However, RLS often restricts profile creation to Admins.
          // We use the Owner Client ('client') to insert the profile to ensure permissions.
          const profileClient = client; 

          // B. Insert Profile using Owner Client (with correct ID)
          const { error: profileError } = await profileClient.from('employee_profiles').insert({
              id: authData.user.id, // CRITICAL FIX: Use real Auth ID
              branch_id: branchId,
              full_name: staff.name,
              email: staff.email,
              username: staff.email.split('@')[0], // Generate a username
              role_id: roleMap[staff.role.toLowerCase()] || roleMap['teacher'],
              department_id: deptMap['Academic'], // Defaulting for demo
              designation_id: desigMap[staff.role] || desigMap['Teacher'],
              date_of_joining: new Date().toISOString(),
              phone: '1234567890',
              current_address: 'Demo Address'
          });

          if (profileError) throw new Error(`Profile Insert Failed: ${profileError.message}`);
          
          logger.log(`Staff Created: ${staff.name}`, 'success');

      } catch (err) {
          logger.log(`Failed to create staff ${staff.name}: ${err.message}`, 'error');
          // We continue to next staff, but log error
      }
  }
};

/**
 * PHASE 4: FEES & FINANCE
 */
export const executePhase4 = async (context, logger) => {
    logger.log('PHASE 4: Configuring Finance & Fees...', 'info');
    const { branchId, demoData, studentIds, ownerClient } = context;
    const client = ownerClient || supabase;

    // 1. Fee Groups
    const groupMap = {};
    for(const g of demoData.feeGroups) {
        const { data } = await client.from('fee_groups').insert({ branch_id: branchId, name: g }).select('id').single();
        if(data) groupMap[g] = data.id;
    }

    // 2. Fee Types
    const typeMap = {};
    for(const t of demoData.feeTypes) {
        const { data } = await client.from('fee_types').insert({ branch_id: branchId, name: t.name, code: t.code }).select('id').single();
        if(data) typeMap[t.code] = data.id;
    }

    // 3. Fee Masters
    const masterIds = [];
    const { data: m1 } = await client.from('fee_masters').insert({
        branch_id: branchId,
        fee_group_id: groupMap['Tuition Fees'],
        fee_type_id: typeMap['MTH_TUIT'],
        due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        amount: 5000,
        fine_type: 'None',
        fine_value: 0
    }).select('id').single();
    if(m1) masterIds.push(m1.id);

    // 4. Assign Fees to Students
    for(const sid of studentIds) {
        for(const mid of masterIds) {
            await client.from('student_fee_allocations').insert({
                branch_id: branchId,
                student_id: sid,
                fee_master_id: mid
            });
        }
    }
    logger.log('Fees Assigned to Students', 'success');

    // 5. Collect Fees (Simulate Payment)
    for(let i=0; i<3; i++) {
        if(studentIds[i] && masterIds[0]) {
            await client.from('fee_payments').insert({
                branch_id: branchId,
                student_id: studentIds[i],
                fee_master_id: masterIds[0],
                amount: 5000,
                payment_date: new Date().toISOString(),
                payment_mode: 'Cash',
                note: 'Demo Payment',
                created_by: context.ownerUserId // Valid FK to School Owner
            });
        }
    }
    logger.log('Simulated Fee Collections for 3 Students', 'success');

    // 6. Income/Expenses
    const { data: incHead } = await client.from('income_heads').insert({ branch_id: branchId, name: 'General Income' }).select('id').single();
    const { data: expHead } = await client.from('expense_heads').insert({ branch_id: branchId, name: 'Maintenance' }).select('id').single();
    
    if (incHead) {
        await client.from('income').insert({
            branch_id: branchId,
            income_head_id: incHead.id,
            name: 'Donation',
            date: new Date().toISOString(),
            amount: 10000
        });
    }
    if (expHead) {
        await client.from('expenses').insert({
            branch_id: branchId,
            expense_head_id: expHead.id,
            name: 'AC Repair',
            date: new Date().toISOString(),
            amount: 2500
        });
    }
    logger.log('Recorded Income & Expense entries', 'success');
};

/**
 * PHASE 7: LIBRARY & INVENTORY
 */
export const executePhase7 = async (context, logger) => {
    logger.log('PHASE 7: Setting up Library & Inventory...', 'info');
    const { branchId, demoData, ownerClient } = context;
    const client = ownerClient || supabase;

    // Books
    for(const book of demoData.books) {
        await client.from('books').insert({
            branch_id: branchId,
            book_title: book.title,
            author: book.author,
            qty: 10,
            available: 10,
            book_price: 500
        });
    }
    logger.log('Library stocked with books', 'success');

    // Items
    const { data: cat } = await client.from('item_categories').insert({ branch_id: branchId, name: 'Stationery' }).select('id').single();
    if(cat) {
        for(const item of demoData.items) {
            await client.from('items').insert({
                branch_id: branchId,
                name: item.name,
                category_id: cat.id,
                unit: item.unit,
                available_quantity: 100
            });
        }
    }
    logger.log('Inventory items added', 'success');
};

/**
 * PHASE 8: HOSTEL
 */
export const executePhaseHostel = async (context, logger) => {
    logger.log('PHASE 8: Setting up Hostel...', 'info');
    const { branchId, demoData, ownerClient } = context;
    const client = ownerClient || supabase;

    // 1. Hostel Rooms
    const hostelMap = {};
    for (const h of demoData.hostels) {
        const { data } = await client.from('hostel_rooms').insert({
            branch_id: branchId,
            hostel_name: h.name,
            type: h.type,
            address: 'Campus',
            intake: 100
        }).select('id').single();
        if (data) hostelMap[h.name] = data.id;
    }
    logger.log(`Created ${Object.keys(hostelMap).length} Hostels`, 'success');

    // 2. Room Types
    const roomTypeMap = {};
    for (const rt of demoData.roomTypes) {
        const { data } = await client.from('room_types').insert({
            branch_id: branchId,
            room_type: rt.name,
            description: rt.description
        }).select('id').single();
        if (data) roomTypeMap[rt.name] = data.id;
    }
    logger.log(`Created ${Object.keys(roomTypeMap).length} Room Types`, 'success');
};

/**
 * PHASE 9: TRANSPORT
 */
export const executePhaseTransport = async (context, logger) => {
    logger.log('PHASE 9: Setting up Transport...', 'info');
    const { branchId, demoData, ownerClient } = context;
    const client = ownerClient || supabase;

    // 1. Routes (fare column removed - fees now in Fee Structures)
    const routeMap = {};
    for (const r of demoData.transportRoutes) {
        const { data } = await client.from('transport_routes').insert({
            branch_id: branchId,
            route_title: r.title
        }).select('id').single();
        if (data) routeMap[r.title] = data.id;
    }
    logger.log(`Created ${Object.keys(routeMap).length} Transport Routes`, 'success');

    // 2. Vehicles
    for (const v of demoData.vehicles) {
        await client.from('vehicles').insert({
            branch_id: branchId,
            vehicle_no: v.vehicle_no,
            driver_name: v.driver_name,
            driver_contact: v.driver_contact,
            note: 'Demo Vehicle'
        });
    }
    logger.log('Vehicles added', 'success');
};
