/**
 * AUTO-REPAIR PROMPT GENERATOR
 * Constructs a high-precision prompt for Horizon AI to fix automation errors.
 */

export const generateFixPrompt = (error, phase, stepDetails, codeLocation) => {
    const timestamp = new Date().toISOString();
    const errorStack = error?.stack || 'No stack trace available';
    const errorMessage = error?.message || 'Unknown error';

    return `
🚨 **DEMO AUTOMATION ERROR REPORT - AUTO-GENERATED PROMPT** 🚨

**STATUS**: CRITICAL FAILURE in Phase: ${phase}
**TIMESTAMP**: ${timestamp}

---

### 1. ERROR ANALYSIS
**Message**: \`${errorMessage}\`
**Phase**: ${phase}
**Step**: ${stepDetails}
**Suspected Root Cause**:
- The automation failed while attempting to execute: *${stepDetails}*.
- The error suggests an issue with: *${analyzeErrorType(errorMessage)}*.

### 2. TECHNICAL STACK
\`\`\`
${errorStack}
\`\`\`

### 3. CODE LOCATION
**File**: \`${codeLocation || 'src/utils/demoAutomationEngine.js'}\` (Estimated)
**Function**: Automation Loop / API Interaction

### 4. REQUIRED FIX (SAFE MODE RULES APPLY)
Please generate a fix for this issue adhering to the following **STRICT CONSTRAINTS**:
1.  **NO UI CHANGES**: Do not modify Sidebar, Routes, or Layout.
2.  **NO SECURITY LOCK MODIFICATION**: Do not touch \`security/*.js\` files.
3.  **BACKEND/LOGIC ONLY**: Fix the data generation, API payload, or validation logic.
4.  **DEMO ISOLATION**: Ensure the fix does not affect production data.

### 5. PROPOSED SOLUTION STRATEGY
- [ ] Check Supabase RLS policies if permission denied.
- [ ] Verify payload structure matches current Database Schema.
- [ ] Ensure unique constraints (email/username) are handled with random suffixes.
- [ ] Increase timeout/delays if network latency caused failure.

**INSTRUCTION TO HORIZON**:
Please provide the corrected code block for the failing function.
`;
};

const analyzeErrorType = (msg) => {
    if (msg.toLowerCase().includes('auth')) return 'Authentication / Session Handling';
    if (msg.toLowerCase().includes('duplicate')) return 'Database Constraint (Unique Key Violation)';
    if (msg.toLowerCase().includes('permission')) return 'Row Level Security (RLS) / Permissions';
    if (msg.toLowerCase().includes('fetch')) return 'Network / API Connectivity';
    if (msg.toLowerCase().includes('timeout')) return 'Execution Timeout';
    return 'Logic / Data Validation Failure';
};
