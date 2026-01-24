import { supabase } from '@/lib/customSupabaseClient';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate a secondary client for auth operations to avoid disrupting the main session
const getFreshClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabase.supabaseUrl;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabase.supabaseKey;
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * PHASE 1: MASTER ADMIN SETUP
 * Creates School, Session, and Owner.
 * Returns a logged-in client context for the School Owner.
 */
export const executePhase1 = async (context, logger, generator) => {
  logger.log('PHASE 1: Initializing Master Admin Setup...', 'info');
  
  const demoData = generator();
  context.demoData = demoData;

  // 1. Create School & Session Atomic
  logger.log(`Creating Demo School: ${demoData.school.name}`, 'info');
  
  const { data: schoolData, error: schoolError } = await supabase.rpc('create_demo_school_v2', {
    p_name: demoData.school.name,
    p_email: demoData.school.email,
    p_password_hash: 'managed_by_supabase_auth',
    p_trial_mode: true,
    p_session_name: demoData.school.sessionName
  });

  if (schoolError) throw new Error(`School Creation Failed: ${schoolError.message}`);
  
  context.branchId = schoolData.branch_id;
  context.sessionId = schoolData.session_id;
  logger.log(`School Created. ID: ${context.branchId}`, 'success');

  // 2. Create School Owner via Supabase Auth API (SAFE FIX)
  // We use a fresh client to create the user so we don't lose the Master Admin session in the browser
  logger.log('Creating School Owner Credentials...', 'info');
  const authClient = getFreshClient();
  
  try {
    // Try to create user
    let userId = null;
    let userCreated = false;
    
    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: demoData.school.email,
      password: demoData.school.password,
      options: {
        data: {
          branch_id: context.branchId,
          role: 'school_owner',
          full_name: 'Demo Owner',
          demo_flag: true
        },
        emailRedirectTo: undefined // Don't send confirmation email
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
         logger.log('User already exists, will attempt to sign in...', 'warning');
         // User exists, we'll try to sign in and get userId from there
         // If sign-in fails due to email confirmation, we'll need to find userId another way
      } else {
         throw authError;
      }
    } else if (authData?.user) {
       userId = authData.user.id;
       userCreated = true;
       logger.log(`School Owner Auth Created: ${demoData.school.email}`, 'success');
       
       // If email is not confirmed, try to confirm it using admin API if available
       if (!authData.user.email_confirmed_at) {
         logger.log('Email not confirmed, attempting to confirm...', 'warning');
         try {
           // Try to use admin client if service role key is available
           const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
           if (serviceRoleKey) {
             const adminClient = createClient(
               import.meta.env.VITE_SUPABASE_URL || supabase.supabaseUrl,
               serviceRoleKey
             );
             const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, {
               email_confirm: true
             });
             if (!confirmError) {
               logger.log('Email confirmed successfully via admin API', 'success');
             }
           }
         } catch (confirmErr) {
           logger.log('Could not auto-confirm email (admin API not available), will try sign-in anyway', 'warning');
         }
       }
    }

    // 3. Establish School Owner Session for subsequent phases
    // We need to perform actions AS the school owner to respect RLS and "School Owner UI" requirement
    logger.log('Establishing School Owner Session context...', 'info');
    
    // Wait a moment for email confirmation to process if we just created the user
    if (userCreated) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: demoData.school.email,
      password: demoData.school.password
    });

    if (signInError) {
      // If email confirmation error, try to handle it
      if (signInError.message.includes('Email not confirmed') || signInError.message.includes('email_not_confirmed')) {
        logger.log('Email confirmation required. Attempting workaround...', 'warning');
        
        // If we don't have userId yet, try to get it from auth.users via admin API
        let targetUserId = userId;
        const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        
        if (serviceRoleKey && !targetUserId) {
          try {
            const adminClient = createClient(
              import.meta.env.VITE_SUPABASE_URL || supabase.supabaseUrl,
              serviceRoleKey
            );
            // Try to find user by email
            const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
            if (!listError && users) {
              const foundUser = users.find(u => u.email === demoData.school.email);
              if (foundUser) {
                targetUserId = foundUser.id;
                logger.log(`Found existing user ID: ${targetUserId}`, 'info');
              }
            }
          } catch (err) {
            logger.log('Could not fetch user list', 'warning');
          }
        }
        
        // Try using RPC function first (safer, no service role key needed)
        logger.log('Attempting to confirm email via RPC function...', 'info');
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('confirm_demo_user_email', {
            p_email: demoData.school.email
          });
          
          if (!rpcError && rpcResult?.success) {
            logger.log(`Email confirmed via RPC: ${rpcResult.message}`, 'success');
            // Retry sign in
            const { data: retrySignIn, error: retryError } = await authClient.auth.signInWithPassword({
              email: demoData.school.email,
              password: demoData.school.password
            });
            
            if (retryError) {
              throw new Error(`Failed to login after email confirmation: ${retryError.message}`);
            }
            
            // Use retry data
            context.ownerClient = authClient;
            context.ownerUserId = retrySignIn.user.id;
            logger.log('Successfully signed in after email confirmation', 'success');
            // Skip to profile creation below
          } else {
            // RPC failed, try admin API as fallback
            logger.log('RPC function not available, trying admin API...', 'warning');
            throw new Error('RPC function failed or not found');
          }
        } catch (rpcErr) {
          // Fallback to admin API if RPC doesn't exist
          const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
          if (serviceRoleKey && targetUserId) {
            try {
              const adminClient = createClient(
                import.meta.env.VITE_SUPABASE_URL || supabase.supabaseUrl,
                serviceRoleKey
              );
              const { error: confirmError } = await adminClient.auth.admin.updateUserById(targetUserId, {
                email_confirm: true
              });
              
              if (!confirmError) {
                logger.log('Email confirmed via admin API, retrying sign-in...', 'success');
                // Retry sign in
                const { data: retrySignIn, error: retryError } = await authClient.auth.signInWithPassword({
                  email: demoData.school.email,
                  password: demoData.school.password
                });
                
                if (retryError) {
                  throw new Error(`Failed to login after email confirmation: ${retryError.message}`);
                }
                
                // Use retry data
                context.ownerClient = authClient;
                context.ownerUserId = retrySignIn.user.id;
                logger.log('Successfully signed in after email confirmation', 'success');
                // Skip to profile creation
              } else {
                throw new Error(`Failed to confirm email: ${confirmError.message}`);
              }
            } catch (adminErr) {
              throw new Error(`Email confirmation failed. Please run the SQL migration: database/migrations/confirm_demo_user_email_rpc.sql to create the RPC function, or add VITE_SUPABASE_SERVICE_ROLE_KEY to frontend/.env.development`);
            }
          } else {
            throw new Error(`Email confirmation required. Please run: database/migrations/confirm_demo_user_email_rpc.sql to create the RPC function, or add VITE_SUPABASE_SERVICE_ROLE_KEY to frontend/.env.development, or disable email confirmation in Supabase Dashboard > Authentication > Settings`);
          }
        }
      } else {
        throw new Error(`Failed to login as new School Owner: ${signInError.message}`);
      }
    } else {
      // Success - use signInData
      context.ownerClient = authClient;
      context.ownerUserId = signInData.user.id;
    }
    
    // Save this client to context to be used in future phases
    context.ownerClient = authClient; 
    context.ownerUserId = signInData.user.id;

    // Ensure profile exists (Master Admin insert to be safe, as trigger might be async)
    const { error: profileError } = await supabase.from('school_owner_profiles').insert({
        id: signInData.user.id,
        branch_id: context.branchId,
        email: demoData.school.email,
        full_name: 'Demo Owner',
        role_id: (await supabase.from('roles').select('id').ilike('name', 'school_owner').eq('branch_id', context.branchId).maybeSingle()).data?.id
    }).select().single();

    // Ignore duplicate key error if trigger already created it
    if (profileError && !profileError.message.includes('duplicate key')) {
        logger.log(`Profile creation warning: ${profileError.message}`, 'warning');
    }

  } catch (e) {
    logger.log(`Auth/Session Critical Error: ${e.message}`, 'error');
    throw e; // Fatal for automation
  }

  // 4. Assign Subscription Plan
  const { data: plan } = await supabase.from('subscription_plans').select('id').eq('name', 'Basic').maybeSingle();
  const planId = plan?.id || (await supabase.from('subscription_plans').select('id').limit(1).single()).data.id;

  await supabase.from('school_subscriptions').insert({
    branch_id: context.branchId,
    plan_id: planId,
    status: 'active',
    start_date: new Date().toISOString(),
    billing_type: 'prepaid', // Must be lowercase: 'prepaid' or 'postpaid' per schema
    total_students: 100,
    total_staff: 50,
    auto_renew: true,
    total_amount: 0
  });
  logger.log('Subscription Plan Assigned.', 'success');

  return context;
};

/**
 * PHASE 2: SCHOOL OWNER CORE STRUCTURE
 * Classes, Subjects, Staff
 */
export const executePhase2 = async (context, logger) => {
  logger.log('PHASE 2: Building Core Academic Structure...', 'info');
  const { branchId, demoData, ownerClient } = context;

  // Use ownerClient for operations to simulate School Owner actions
  // Fallback to main supabase if ownerClient is missing (shouldn't happen)
  const client = ownerClient || supabase; 

  // 1. Classes
  const classMap = {}; 
  for (const cls of demoData.classes) {
    const { data, error } = await client.from('classes').insert({ branch_id: branchId, name: cls.name }).select('id').single();
    if (error) logger.log(`Class Error: ${error.message}`, 'error');
    if (data) classMap[cls.name] = data.id;
  }
  context.classMap = classMap;
  logger.log(`Created ${Object.keys(classMap).length} Classes`, 'success');

  // 2. Sections
  const sectionMap = {};
  for (const sec of demoData.sections) {
    const { data, error } = await client.from('sections').insert({ branch_id: branchId, name: sec.name }).select('id').single();
    if (error) logger.log(`Section Error: ${error.message}`, 'error');
    if (data) sectionMap[sec.name] = data.id;
  }
  context.sectionMap = sectionMap;
  logger.log(`Created ${Object.keys(sectionMap).length} Sections`, 'success');

  // 3. Assign Sections to Classes
  for (const classId of Object.values(classMap)) {
    for (const sectionId of Object.values(sectionMap)) {
      await client.from('class_sections').insert({ class_id: classId, section_id: sectionId });
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
  const roleMap = roles.reduce((acc, r) => ({ ...acc, [r.name]: r.id }), {});

  const tempAuthClient = getFreshClient(); // Use fresh client for staff signup to avoid killing owner session

  for (const staff of demoData.staff) {
      try {
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

          // B. Insert Profile using Owner Client (with correct ID)
          const { error: profileError } = await client.from('employee_profiles').insert({
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
 * PHASE 3: STUDENT POPULATION - FIXED: Removing RPC, using direct Logic
 */
export const executePhase3 = async (context, logger) => {
  logger.log('PHASE 3: Enrolling Students (Frontend Flow)...', 'info');
  const { branchId, demoData, classMap, sectionMap, ownerClient } = context;
  const client = ownerClient || supabase;

  // Categories
  const catMap = {};
  for (const cat of demoData.studentCategories) {
      const { data } = await client.from('student_categories').insert({ branch_id: branchId, name: cat }).select('id').single();
      if(data) catMap[cat] = data.id;
  }

  // Houses
  const houseMap = {};
  for (const h of demoData.houses) {
      const { data } = await client.from('student_houses').insert({ branch_id: branchId, name: h }).select('id').single();
      if(data) houseMap[h] = data.id;
  }

  // Roles
  const { data: roles } = await client.from('roles').select('id, name').eq('branch_id', branchId);
  const studentRoleId = roles.find(r => r.name === 'student')?.id;
  const parentRoleId = roles.find(r => r.name === 'parent')?.id;

  if (!studentRoleId || !parentRoleId) {
      throw new Error("Critical: Student or Parent roles missing in school.");
  }

  // Students Loop
  let count = 0;
  const studentIds = [];
  const tempAuthClient = getFreshClient(); // Fresh client for student signups

  for (const s of demoData.students) {
      const classKey = demoData.classes[count % demoData.classes.length].name;
      const sectionKey = demoData.sections[count % demoData.sections.length].name;
      const studentUsername = `std${count}_${new Date().getTime()}`;
      const parentUsername = `parent${count}_${new Date().getTime()}`;

      try {
          // 1. Create Parent User (Auth)
          const { data: parentAuth, error: parentAuthError } = await tempAuthClient.auth.signUp({
              email: s.guardianEmail,
              password: 'password123',
              options: { data: { branch_id: branchId, role: 'parent', full_name: `Parent of ${s.firstName}` } }
          });
          if (parentAuthError) throw new Error(`Parent Auth Failed: ${parentAuthError.message}`);

          // 2. Create Parent Profile (DB)
          const { error: parentProfileError } = await client.from('parent_profiles').insert({
              id: parentAuth.user.id,
              branch_id: branchId,
              full_name: `Mr. ${s.lastName}`,
              email: s.guardianEmail,
              username: parentUsername,
              role_id: parentRoleId,
              phone: '9876543210'
          });
          if (parentProfileError && !parentProfileError.message.includes('duplicate')) 
              throw new Error(`Parent Profile Failed: ${parentProfileError.message}`);

          // 3. Create Student User (Auth)
          const { data: studentAuth, error: studentAuthError } = await tempAuthClient.auth.signUp({
              email: s.email,
              password: 'password123',
              options: { data: { branch_id: branchId, role: 'student', full_name: `${s.firstName} ${s.lastName}` } }
          });
          if (studentAuthError) throw new Error(`Student Auth Failed: ${studentAuthError.message}`);

          // 4. Create Student Profile (DB)
          // Note: We map guardian info as strings/independent fields as per schema provided in prompt, 
          // though linking via logic is good.
          const { error: studentProfileError } = await client.from('student_profiles').insert({
              id: studentAuth.user.id,
              branch_id: branchId,
              full_name: `${s.firstName} ${s.lastName}`,
              email: s.email,
              username: studentUsername,
              role_id: studentRoleId,
              class_id: classMap[classKey],
              section_id: sectionMap[sectionKey],
              admission_date: new Date().toISOString(),
              dob: '2010-01-01',
              gender: s.gender,
              category_id: catMap[demoData.studentCategories[0]], 
              house_id: houseMap[demoData.houses[0]],
              guardian_name: `Mr. ${s.lastName}`,
              guardian_relation: 'Father',
              guardian_email: s.guardianEmail,
              guardian_phone: '9876543210',
              admission_no: `ADM${new Date().getFullYear()}${count + 1000}`
          });

          if (studentProfileError) throw new Error(`Student Profile Failed: ${studentProfileError.message}`);

          studentIds.push(studentAuth.user.id);
          count++;
          logger.log(`Enrolled: ${s.firstName} ${s.lastName}`, 'success');

      } catch (e) {
          logger.log(`Enrollment Failed for ${s.firstName}: ${e.message}`, 'error');
          // Stop on critical error? Prompt says "STOP automation" if admission fails.
          // But maybe we tolerate one fail? "If student admission fails: STOP automation". Okay.
          throw e;
      }
  }
  context.studentIds = studentIds;
  logger.log(`Successfully enrolled ${count} Students`, 'success');
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
