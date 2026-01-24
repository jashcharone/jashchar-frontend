/**
 * DEMO AUTOMATION ENGINE V2 (SAFE MODE)
 * Singleton controller for managing the automation state.
 * FIXED: Context Propagation & School ID Validation
 */

import { generateDemoData } from './demoDataGenerator';
import { DemoLogger } from './demoLogger';
import { executePhase1, executePhase2, executePhase4, executePhase7, executePhaseHostel, executePhaseTransport } from './demoPhases';
import { verifyDemoIsolation } from './demoSafeMode';
import { generateFixPrompt } from './demoErrorPromptGenerator';
import { simulateThinking } from './demoHumanBehavior';
import { supabase } from '@/lib/customSupabaseClient';
import { createClient } from '@supabase/supabase-js';

// Helper to generate a secondary client for auth operations to avoid disrupting the main session
const getFreshClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabase.supabaseUrl;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabase.supabaseKey;
  return createClient(supabaseUrl, supabaseKey);
};

class AutomationEngine {
    constructor() {
        this.subscribers = [];
        // Initialize robust context structure
        this.context = {
            branchId: null,
            demoSchoolId: null, // Redundant key for safety as per requirements
            sessionId: null,
            ownerUserId: null,
            ownerClient: null,
            demoData: null,
            classMap: null,
            sectionMap: null,
            subjectMap: null
        };
        
        this.state = {
            status: 'idle', // idle, running, paused, error, complete
            currentPhase: 0,
            progress: 0,
            logs: [],
            error: null,
            fixPrompt: null,
            elapsedTime: 0,
            phases: [
                { id: 1, name: 'Create Demo School', status: 'pending' },
                { id: 2, name: 'Assign Subscription', status: 'pending' },
                { id: 3, name: 'Academic & HR', status: 'pending' },
                { id: 4, name: 'Student Enrollment', status: 'pending' },
                { id: 5, name: 'Fees & Finance', status: 'pending' },
                { id: 6, name: 'Library & Inventory', status: 'pending' },
                { id: 7, name: 'Hostel Management', status: 'pending' },
                { id: 8, name: 'Transport Management', status: 'pending' }
            ]
        };
        this.logger = new DemoLogger((updater) => {
            if (typeof updater === 'function') {
                const newLogs = updater(this.state.logs);
                this.updateState({ logs: newLogs });
            }
        });
        
        this.abortController = null;
        this.timerInterval = null;
        this.roleCache = {}; // Cache for role IDs
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        callback(this.state);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    updateState(partialState) {
        this.state = { ...this.state, ...partialState };
        this.subscribers.forEach(cb => cb(this.state));
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.state.status === 'running') {
                this.updateState({ elapsedTime: this.state.elapsedTime + 1 });
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    /**
     * Pre-flight validation checks
     */
    async runPreFlightChecks() {
        this.logger.log('ðŸ” Running pre-flight checks...', 'info');
        
        try {
            // Check database connectivity
            const { error: dbError } = await supabase.from('schools').select('id').limit(1);
            if (dbError) throw new Error(`Database connection failed: ${dbError.message}`);
            this.logger.log('✅ Database connection verified', 'success');
            
            // Check user permissions (basic check)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                this.logger.log(' ï¸ No authenticated user found, proceeding anyway', 'warning');
            } else {
                this.logger.log(`✅ Authenticated as: ${user.email}`, 'success');
            }
            
            this.logger.log('✅ All pre-flight checks passed', 'success');
        } catch (error) {
            this.logger.log(`❌ Pre-flight check failed: ${error.message}`, 'error');
            // Don't throw - allow automation to proceed even if checks fail
            // This prevents blocking due to minor issues
        }
    }

    async start() {
        if (this.state.status === 'running') return;
        
        // Reset if starting fresh (not resuming)
        if (this.state.status !== 'paused') {
            this.state.logs = [];
            this.state.currentPhase = 0;
            this.state.progress = 0;
            this.state.error = null;
            this.state.fixPrompt = null;
            this.state.elapsedTime = 0;
            this.state.phases = this.state.phases.map(p => ({ ...p, status: 'pending' }));
            
            // Reset context but keep structure
            this.context = {
                branchId: null,
                demoSchoolId: null,
                sessionId: null,
                ownerUserId: null,
                ownerClient: null,
                demoData: null,
                classMap: null,
                sectionMap: null,
                subjectMap: null,
                studentIds: null,
                enabledModules: null,
                subscriptionId: null,
                verificationResults: null
            };
        }

        this.updateState({ status: 'running' });
        this.startTimer();
        this.logger.log('ðŸš€ Automation Engine Started in SAFE MODE', 'info');

        try {
            // Pre-flight checks
            await this.runPreFlightChecks();
            
            // Get scenario from state
            const scenario = this.state.scenario || 'standard';
            
            // Phase 1: School Creation
            if (this.shouldRunPhase(1)) await this.runPhase(1, 'Create Demo School', async () => {
                const generator = generateDemoData;
                const data = generator(scenario); // FIXED: Pass scenario parameter
                verifyDemoIsolation(data.school); // Safe Mode Check
                
                // Execute Phase 1 and mutate context
                await executePhase1(this.context, this.logger, () => data);
                
                // CRITICAL: Capture and Validate School ID
                if (!this.context.branchId) {
                    throw new Error('Phase 1 completed but School ID was not captured in context.');
                }
                
                // Map to demoSchoolId as requested for explicit clarity
                this.context.demoSchoolId = this.context.branchId;
                
                this.logger.log(`✅ Context Secured: School ID ${this.context.demoSchoolId}`, 'success');
            });

            // Phase 2: Verify Subscription & Modules
            if (this.shouldRunPhase(2)) await this.runPhase(2, 'Verify Subscription', async () => {
                this.validateContext(['branchId']);
                await simulateThinking(1.5);
                
                // Verify subscription exists and is active
                const { data: subscription, error: subError } = await supabase
                    .from('school_subscriptions')
                    .select('*, subscription_plans(*)')
                    .eq('branch_id', this.context.branchId)
                    .eq('status', 'active')
                    .maybeSingle();
                
                if (subError) throw new Error(`Subscription verification failed: ${subError.message}`);
                if (!subscription) throw new Error('No active subscription found for demo school');
                
                this.logger.log(`✅ Subscription verified: ${subscription.subscription_plans?.name || 'Active Plan'}`, 'success');
                
                // Get enabled modules for this plan
                const { data: planModules } = await supabase
                    .from('plan_modules')
                    .select('modules(*)')
                    .eq('plan_id', subscription.plan_id);
                
                const moduleNames = planModules?.map(pm => pm.modules?.name).filter(Boolean) || [];
                this.logger.log(`ðŸ“¦ Enabled Modules (${moduleNames.length}): ${moduleNames.join(', ')}`, 'info');
                
                // Store module info in context for later phases
                this.context.enabledModules = moduleNames;
                this.context.subscriptionId = subscription.id;
            });

            // Phase 3: Academic & HR Structure
            if (this.shouldRunPhase(3)) await this.runPhase(3, 'Academic & HR', async () => {
                this.validateContext(['branchId']);
                await executePhase2(this.context, this.logger);
                
                if (!this.context.classMap || Object.keys(this.context.classMap).length === 0) {
                    throw new Error('Phase 3 Warning: No classes were created/mapped.');
                }
            });

            // Phase 4: Student Enrollment
            if (this.shouldRunPhase(4)) await this.runPhase(4, 'Student Enrollment', async () => {
                this.validateContext(['branchId', 'classMap', 'sectionMap']);
                await this.executeSafeStudentEnrollment();
            });

            // Phase 5: Fees & Finance
            if (this.shouldRunPhase(5)) await this.runPhase(5, 'Fees & Finance', async () => {
                this.validateContext(['branchId']);
                await executePhase4(this.context, this.logger);
            });

            // Phase 6: Library & Inventory
            if (this.shouldRunPhase(6)) await this.runPhase(6, 'Library & Inventory', async () => {
                this.validateContext(['branchId']);
                await executePhase7(this.context, this.logger);
            });

            // Phase 7: Hostel
            if (this.shouldRunPhase(7)) await this.runPhase(7, 'Hostel Management', async () => {
                this.validateContext(['branchId']);
                await executePhaseHostel(this.context, this.logger);
            });

            // Phase 8: Transport
            if (this.shouldRunPhase(8)) await this.runPhase(8, 'Transport Management', async () => {
                this.validateContext(['branchId']);
                await executePhaseTransport(this.context, this.logger);
            });

            // Phase 8: Examinations Setup
            if (this.shouldRunPhase(8)) await this.runPhase(8, 'Examinations Setup', async () => {
                this.validateContext(['branchId', 'classMap', 'subjectMap', 'studentIds']);
                await this.executeExaminationsSetup();
            });

            // Phase 9: Library & Inventory
            if (this.shouldRunPhase(9)) await this.runPhase(9, 'Library & Inventory', async () => {
                this.validateContext(['branchId']);
                await executePhase7(this.context, this.logger);
            });

            // Phase 10: Transport Setup
            if (this.shouldRunPhase(10)) await this.runPhase(10, 'Transport Setup', async () => {
                this.validateContext(['branchId']);
                await this.executeTransportSetup();
            });

            // Phase 11: Communication & CMS
            if (this.shouldRunPhase(11)) await this.runPhase(11, 'Communication & CMS', async () => {
                this.validateContext(['branchId']);
                await this.executeCommunicationSetup();
            });

            // Phase 12: Final Verification
            if (this.shouldRunPhase(12)) await this.runPhase(12, 'Final Verification', async () => {
                this.validateContext(['branchId']);
                await this.executeFinalVerification();
            });

            this.complete();

        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Validates that specific keys exist in the context.
     * @param {string[]} requiredKeys 
     */
    validateContext(requiredKeys) {
        const missing = requiredKeys.filter(key => !this.context[key]);
        if (missing.length > 0) {
            throw new Error(`Context Integrity Error: Missing required keys: ${missing.join(', ')}. Previous phase may have failed silently.`);
        }
    }

    /**
     * SAFE STUDENT ENROLLMENT (PHASE 4)
     * Replaced flaky RPC with robust Client-Side Auth Logic.
     */
    async executeSafeStudentEnrollment() {
        this.logger.log('ðŸ” Phase 4: Safe Student Enrollment Initiated (Client-Side)', 'info');
        
        // FIXED: Use demoSchoolId or branchId safely
        const branchId = this.context.demoSchoolId || this.context.branchId;
        
        if (!branchId) {
            throw new Error('CRITICAL: School ID missing from context. Phase 1 may have failed.');
        }

        // 1. Fetch Classes and Sections (Dependencies)
        const { data: classes } = await supabase.from('classes').select('id, name').eq('branch_id', branchId);
        const { data: sections } = await supabase.from('sections').select('id, name').eq('branch_id', branchId);

        if (!classes?.length || !sections?.length) {
            throw new Error('Academic structure missing (Classes/Sections). Cannot enroll students.');
        }

        const targetClass = classes[0];
        const targetSection = sections[0];
        this.logger.log(`Targeting Class: ${targetClass.name}, Section: ${targetSection.name}`, 'info');

        // 2. Generate Student Data
        const { students } = generateDemoData(); 
        
        // Get Category/House IDs dynamically
        const { data: cats } = await supabase.from('student_categories').select('id').eq('branch_id', branchId).limit(1);
        const { data: hse } = await supabase.from('student_houses').select('id').eq('branch_id', branchId).limit(1);
        
        const categoryId = cats?.[0]?.id || null;
        const houseId = hse?.[0]?.id || null;

        let successCount = 0;
        const freshAuthClient = getFreshClient();

        // 3. Enroll Students with Client-Side Logic
        for (const student of students) {
            let enrolled = false;
            let attempts = 0;
            
            while (!enrolled && attempts < 3) {
                try {
                    await simulateThinking(0.5);
                    
                    // Regenerate unique fields if this is a retry
                    if (attempts > 0) {
                        const retrySuffix = Math.floor(Math.random() * 999999).toString(36);
                        // Ensure we replace the domain correctly even on retry
                        const baseEmail = student.email.split('@')[0].replace(/^retry[a-z0-9]+/, '');
                        student.email = `retry${retrySuffix}${baseEmail}@gmail.com`;
                        
                        const baseGuardianEmail = student.guardianEmail.split('@')[0].replace(/^retry[a-z0-9]+/, '');
                        student.guardianEmail = `retry${retrySuffix}${baseGuardianEmail}@gmail.com`;

                        student.username = `retry_${retrySuffix}_${student.username}`;
                        student.rollNumber = `${student.rollNumber}R${attempts}`;
                        this.logger.log(`™ï¸ Retrying with new email: ${student.email}`, 'warning');
                    }

                    // A. Create Parent Auth
                    // FIX: Use valid email domain for demo
                    const validParentEmail = student.guardianEmail;
                    const validStudentEmail = student.email;

                    // Add delay to prevent rate limiting (Increased to 6s)
                    await new Promise(resolve => setTimeout(resolve, 6000));

                    const { data: parentAuth, error: parentError } = await freshAuthClient.auth.signUp({
                        email: validParentEmail,
                        password: student.password,
                        options: {
                            data: {
                                branch_id: branchId,
                                role: 'parent',
                                full_name: `Parent of ${student.firstName}`
                            }
                        }
                    });

                    if (parentError) throw new Error(`Parent Auth Failed: ${parentError.message}`);
                    const parentId = parentAuth.user.id;

                    // B. Create Student Auth
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Add delay between parent and student
                    const { data: studentAuth, error: studentError } = await freshAuthClient.auth.signUp({
                        email: validStudentEmail,
                        password: student.password,
                        options: {
                            data: {
                                branch_id: branchId,
                                role: 'student',
                                full_name: `${student.firstName} ${student.lastName}`,
                                class_id: targetClass.id,
                                section_id: targetSection.id,
                                admission_no: student.rollNumber,
                                roll_number: student.rollNumber
                            }
                        }
                    });

                    if (studentError) throw new Error(`Student Auth Failed: ${studentError.message}`);
                    const studentId = studentAuth.user.id;

                    // C. Create/Upsert Profiles (To ensure they exist even if triggers are flaky)
                    const parentRoleId = await this.getRoleId(branchId, 'parent');
                    const studentRoleId = await this.getRoleId(branchId, 'student');

                    // Upsert Parent Profile
                    await supabase.from('parent_profiles').upsert({
                        id: parentId,
                        branch_id: branchId,
                        full_name: `Parent of ${student.firstName}`,
                        email: validParentEmail,
                        username: student.guardianUsername,
                        phone: '9876543210',
                        role_id: parentRoleId
                    }, { onConflict: 'id' });

                    // Upsert Student Profile
                    await supabase.from('student_profiles').upsert({
                        id: studentId,
                        branch_id: branchId,
                        full_name: `${student.firstName} ${student.lastName}`,
                        email: validStudentEmail,
                        username: student.username,
                        class_id: targetClass.id,
                        section_id: targetSection.id,
                        category_id: categoryId,
                        house_id: houseId,
                        admission_date: new Date().toISOString().split('T')[0],
                        role_id: studentRoleId,
                        admission_no: student.rollNumber,
                        roll_number: student.rollNumber,
                        gender: student.gender,
                        dob: '2015-01-01',
                        guardian_name: `Parent of ${student.firstName}`,
                        guardian_email: validParentEmail,
                        guardian_phone: '9876543210'
                    }, { onConflict: 'id' });

                    this.logger.log(`✅ Enrolled: ${student.firstName} ${student.lastName}`, 'success');
                    enrolled = true;
                    successCount++;
                    
                    // Store student ID
                    if (!this.context.studentIds) this.context.studentIds = [];
                    this.context.studentIds.push(studentId);

                } catch (e) {
                    this.logger.log(` ï¸ Enrollment Attempt ${attempts + 1} Failed: ${e.message}`, 'warning');
                    attempts++;
                }
            }
        }

        if (successCount === 0) {
            throw new Error('Failed to enroll ANY students. Critical Phase 4 failure.');
        }
        
        // Ensure we have student IDs even if some failed
        if (!this.context.studentIds || this.context.studentIds.length === 0) {
            const { data: students } = await supabase
                .from('student_profiles')
                .select('id')
                .eq('branch_id', branchId)
                .limit(10);
            this.context.studentIds = students?.map(s => s.id) || [];
        }
        
        this.logger.log(`Phase 4 Complete: ${successCount} students enrolled successfully.`, 'success');
    }

    // Helper to cache/fetch role IDs
    async getRoleId(branchId, roleName) {
        const key = `${branchId}_${roleName}`;
        if (this.roleCache[key]) return this.roleCache[key];
        
        const { data } = await supabase.from('roles').select('id').eq('branch_id', branchId).eq('name', roleName).maybeSingle();
        if (data) {
            this.roleCache[key] = data.id;
            return data.id;
        }
        return null;
    }

    shouldRunPhase(phaseId) {
        const phase = this.state.phases.find(p => p.id === phaseId);
        if (!phase || phase.status === 'completed') return false;
        
        // Phase 1 and 2 are always required (School creation and subscription)
        if (phaseId === 1 || phaseId === 2) return true;
        
        // Phase 12 (Final Verification) is always required
        if (phaseId === 12) return true;
        
        // Check if selected modules require this phase
        const selectedModules = this.context.selectedModules || [];
        if (selectedModules.length === 0) return true; // If no selection, run all
        
        // Map phases to modules
        const phaseModuleMap = {
            3: ['academics'], // Academic Structure
            4: ['student_information', 'students'], // Student Enrollment
            5: ['human_resource', 'staff'], // Staff & HR
            6: ['fees_collection', 'fees'], // Fees & Finance
            7: ['attendance'], // Attendance
            8: ['examinations'], // Examinations
            9: ['library', 'inventory'], // Library & Inventory
            10: ['transport'], // Transport
            11: ['communicate', 'front_cms'], // Communication & CMS
        };
        
        const requiredModules = phaseModuleMap[phaseId] || [];
        if (requiredModules.length === 0) return true; // Unknown phase, run it
        
        // Check if any selected module requires this phase
        return requiredModules.some(moduleSlug => 
            selectedModules.includes(moduleSlug) || 
            selectedModules.some(selected => selected.toLowerCase().includes(moduleSlug.toLowerCase()))
        );
    }

    async runPhase(phaseId, phaseName, action) {
        if (this.state.status !== 'running') throw new Error('Automation Paused/Stopped');

        this.updateState({ currentPhase: phaseId });
        this.setPhaseStatus(phaseId, 'running');
        this.logger.log(`▼ï¸ Starting Phase ${phaseId}: ${phaseName}`, 'info');

        try {
            await action();
            this.setPhaseStatus(phaseId, 'completed');
            // Calculate progress based on completed phases
            const completedPhases = this.state.phases.filter(p => p.status === 'completed').length;
            const totalPhases = this.state.phases.length;
            this.updateState({ progress: Math.round((completedPhases / totalPhases) * 100) });
            await simulateThinking(0.5); 
        } catch (e) {
            this.setPhaseStatus(phaseId, 'failed');
            throw e;
        }
    }

    setPhaseStatus(id, status) {
        const newPhases = this.state.phases.map(p => p.id === id ? { ...p, status } : p);
        this.updateState({ phases: newPhases });
    }

    handleError(error) {
        this.stopTimer();
        const prompt = generateFixPrompt(error, `Phase ${this.state.currentPhase}`, this.state.phases[this.state.currentPhase - 1]?.name, null);
        
        this.updateState({
            status: 'error',
            error: error.message,
            fixPrompt: prompt
        });
        this.logger.log(`❌ Error: ${error.message}`, 'error');
    }

    stop() {
        this.stopTimer();
        this.updateState({ status: 'idle' });
        this.logger.log('⏹ï¸ Automation Stopped', 'warning');
    }

    complete() {
        this.stopTimer();
        this.updateState({ status: 'complete', progress: 100 });
        this.logger.log('✅ All Phases Completed Successfully!', 'success');
    }
}

export const automationEngine = new AutomationEngine();

// Helper function to run automation and hook up UI state setters
export const runDemoAutomation = async (
    loggerCallback, 
    progressCallback, 
    statusCallback, 
    scenario = 'standard',
    phasesCallback = null,
    verificationCallback = null,
    credentialsCallback = null,
    selectedModules = null // Array of module slugs to include
) => {
    // Create a new instance for each run to avoid state pollution
    const engine = new AutomationEngine();
    
    // Set the scenario in state so start() can access it
    engine.updateState({ scenario });
    
    // Set selected modules in context
    if (selectedModules && selectedModules.length > 0) {
        engine.context.selectedModules = selectedModules;
        engine.logger.log(`ðŸ“¦ Selected Modules: ${selectedModules.length} modules will be populated`, 'info');
    }

    // Subscribe UI callbacks
    engine.subscribe((state) => {
        if (loggerCallback) loggerCallback(state.logs);
        if (progressCallback) progressCallback(state.progress);
        if (statusCallback) statusCallback(state.status);
        if (phasesCallback) phasesCallback(state.phases);
        
        // On completion, send verification results and credentials
        if (state.status === 'complete') {
            if (verificationCallback && engine.context.verificationResults) {
                verificationCallback(engine.context.verificationResults);
            }
            if (credentialsCallback && engine.context.demoData) {
                credentialsCallback({
                    email: engine.context.demoData.school.email,
                    password: engine.context.demoData.school.password,
                    schoolName: engine.context.demoData.school.name
                });
            }
        }
        
        // On error, log it
        if (state.status === 'error') {
            console.error('Automation Engine Error:', state.error);
        }
    });

    // Start the engine
    console.log('ðŸŽ¯ Starting AutomationEngine...');
    try {
        await engine.start();
        console.log('✅ AutomationEngine started successfully');
    } catch (error) {
        console.error('❌ Failed to start automation engine:', error);
        if (statusCallback) statusCallback('error');
        throw error;
    }
};
