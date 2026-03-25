/**
 * feeLedgerService.js
 * ═══════════════════════════════════════════════════════════════
 * Unified Fee Ledger Service
 * "3 ನದಿಗಳು, 1 ಸಾಗರ" - Three Sources, One Ledger
 * 
 * Used by: HostelFee.jsx, StudentTransportFees.jsx, FeeStructures.jsx
 * Plan: UNIFIED_FEE_LEDGER_MASTER_PLAN.md (Option B)
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '@/lib/customSupabaseClient';

/**
 * Generate monthly billing periods from a start date to session end
 * @param {string} sessionStartDate - Session start date (ISO)
 * @param {string} sessionEndDate - Session end date (ISO)
 * @param {string} effectiveFrom - Optional: if student joins mid-session
 * @returns {Array<{month: number, year: number, label: string, dueDate: string}>}
 */
function generateMonthlyPeriods(sessionStartDate, sessionEndDate, effectiveFrom = null) {
  const periods = [];
  const start = effectiveFrom ? new Date(effectiveFrom) : new Date(sessionStartDate);
  const end = new Date(sessionEndDate);

  // Start from 1st of the effective month
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  let installmentNum = 1;
  while (current <= endMonth) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    periods.push({
      installmentNumber: installmentNum,
      label: `${monthNames[month]} ${year}`,
      // Due date = 10th of each month (reasonable default)
      dueDate: `${year}-${String(month + 1).padStart(2, '0')}-10`,
    });

    installmentNum++;
    current.setMonth(current.getMonth() + 1);
  }

  return periods;
}

/**
 * Generate quarterly billing periods
 */
function generateQuarterlyPeriods(sessionStartDate, sessionEndDate) {
  const periods = [];
  const start = new Date(sessionStartDate);
  const end = new Date(sessionEndDate);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  let installmentNum = 1;
  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];

  while (current <= endMonth) {
    const quarter = Math.floor(current.getMonth() / 3);
    periods.push({
      installmentNumber: installmentNum,
      label: `${quarterNames[quarter]} ${current.getFullYear()}`,
      dueDate: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-10`,
    });

    installmentNum++;
    current.setMonth(current.getMonth() + 3);
  }

  return periods;
}

/**
 * Get fee_type_id by code (e.g., 'hostel-fee', 'transport-fee')
 */
async function getFeeTypeId(code, branchId, sessionId) {
  const { data } = await supabase
    .from('fee_types')
    .select('id')
    .eq('code', code)
    .eq('branch_id', branchId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (data?.id) return data.id;

  // Auto-seed if not found (same logic as FeesType.jsx SYSTEM_FEE_TYPES)
  const systemTypes = {
    'HOSTEL': { name: 'Hostel Fee', description: 'Boarding/hostel accommodation fee' },
    'TRANSPORT': { name: 'Transport Fee', description: 'School bus/van transport fee' },
    // Legacy codes (backward compatibility)
    'hostel-fee': { name: 'Hostel Fee', description: 'Boarding/hostel accommodation fee' },
    'transport-fee': { name: 'Transport Fee', description: 'School bus/van transport fee' },
  };

  const meta = systemTypes[code];
  if (!meta) return null;

  // Need organization_id from branch
  const { data: branchData } = await supabase
    .from('branches')
    .select('organization_id')
    .eq('id', branchId)
    .single();

  if (!branchData?.organization_id) return null;

  const { data: inserted, error } = await supabase
    .from('fee_types')
    .insert({
      name: meta.name,
      code,
      description: meta.description,
      is_system: true,
      branch_id: branchId,
      session_id: sessionId,
      organization_id: branchData.organization_id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Auto-seed fee type error:', error);
    return null;
  }
  return inserted?.id || null;
}

/**
 * Get session dates (start_date, end_date) by session ID
 */
async function getSessionDates(sessionId) {
  const { data } = await supabase
    .from('sessions')
    .select('start_date, end_date')
    .eq('id', sessionId)
    .single();

  return data;
}

/**
 * Write fee entries to student_fee_ledger
 * 
 * This is the CORE function used by Hostel, Transport, and Academic modules
 * to register fees in the unified ledger.
 * 
 * @param {Object} params
 * @param {string} params.studentId - Student UUID
 * @param {string} params.feeSource - 'academic' | 'hostel' | 'transport' | 'other'
 * @param {string} params.feeTypeId - UUID from fee_types table
 * @param {number} params.amount - Fee amount per period
 * @param {string} params.billingCycle - 'monthly' | 'quarterly' | 'annual' | 'one_time'
 * @param {string} params.sessionId - Current session UUID
 * @param {string} params.branchId - Branch UUID
 * @param {string} params.organizationId - Organization UUID
 * @param {string} params.sourceReferenceId - ID of the source record (hostel_details.id, transport_details.id, etc.)
 * @param {string} [params.effectiveFrom] - Optional: start billing from this date (mid-session join)
 * @returns {Object} { success: boolean, rowsCreated: number, error?: string }
 */
export async function writeToFeeLedger({
  studentId,
  feeSource,
  feeTypeId,
  amount,
  billingCycle,
  sessionId,
  branchId,
  organizationId,
  sourceReferenceId,
  effectiveFrom = null,
}) {
  if (!studentId || !feeSource || !amount || amount <= 0) {
    return { success: false, rowsCreated: 0, error: 'Missing required parameters' };
  }

  // Get session dates for period calculation
  const sessionDates = await getSessionDates(sessionId);
  if (!sessionDates?.start_date || !sessionDates?.end_date) {
    return { success: false, rowsCreated: 0, error: 'Session dates not found' };
  }

  // Generate billing periods based on cycle
  let periods;
  const cycle = billingCycle || 'monthly';

  if (cycle === 'annual' || cycle === 'one_time') {
    periods = [{
      installmentNumber: 1,
      label: 'Annual',
      dueDate: sessionDates.start_date,
    }];
  } else if (cycle === 'quarterly') {
    periods = generateQuarterlyPeriods(sessionDates.start_date, sessionDates.end_date);
  } else {
    // monthly (default)
    periods = generateMonthlyPeriods(sessionDates.start_date, sessionDates.end_date, effectiveFrom);
  }

  if (periods.length === 0) {
    return { success: false, rowsCreated: 0, error: 'No billing periods calculated' };
  }

  // Build ledger rows
  const ledgerRows = periods.map(period => ({
    student_id: studentId,
    fee_source: feeSource,
    fee_type_id: feeTypeId || null,
    fee_structure_id: feeSource === 'academic' ? sourceReferenceId : null,
    source_reference_id: sourceReferenceId || null,
    original_amount: parseFloat(amount),
    discount_amount: 0,
    concession_amount: 0,
    net_amount: parseFloat(amount),
    paid_amount: 0,
    fine_amount: 0,
    installment_number: period.installmentNumber,
    due_date: period.dueDate,
    billing_period: period.label,
    status: 'pending',
    is_paid: false,
    assigned_by: 'system',
    branch_id: branchId,
    session_id: sessionId,
    organization_id: organizationId,
  }));

  const { error } = await supabase
    .from('student_fee_ledger')
    .insert(ledgerRows);

  if (error) {
    console.error('writeToFeeLedger error:', error);
    return { success: false, rowsCreated: 0, error: error.message };
  }

  return { success: true, rowsCreated: ledgerRows.length };
}

/**
 * Remove/cancel existing ledger entries for a student + source
 * Used when fee amount changes or allocation is removed
 * Only cancels UNPAID rows (paid rows are untouched)
 * 
 * @param {Object} params
 * @param {string} params.studentId
 * @param {string} params.feeSource - 'hostel' | 'transport' | etc.
 * @param {string} params.sourceReferenceId
 * @param {string} params.sessionId
 * @returns {Object} { success: boolean, rowsCancelled: number }
 */
export async function cancelUnpaidLedgerEntries({
  studentId,
  feeSource,
  sourceReferenceId,
  sessionId,
}) {
  const { data, error } = await supabase
    .from('student_fee_ledger')
    .update({ status: 'cancelled' })
    .eq('student_id', studentId)
    .eq('fee_source', feeSource)
    .eq('session_id', sessionId)
    .eq('is_paid', false)
    .neq('status', 'cancelled')
    .select('id');

  if (error) {
    console.error('cancelUnpaidLedgerEntries error:', error);
    return { success: false, rowsCancelled: 0 };
  }

  return { success: true, rowsCancelled: data?.length || 0 };
}

/**
 * Refresh ledger entries when fee amount changes
 * 1. Cancel all unpaid old entries
 * 2. Write new entries with updated amount
 */
export async function refreshFeeLedger(params) {
  // Step 1: Cancel old unpaid entries
  await cancelUnpaidLedgerEntries({
    studentId: params.studentId,
    feeSource: params.feeSource,
    sourceReferenceId: params.sourceReferenceId,
    sessionId: params.sessionId,
  });

  // Step 2: Write new entries
  return await writeToFeeLedger(params);
}

/**
 * Get fee_type_id for hostel fee (creates if not exists via FeesType auto-seed)
 */
export async function getHostelFeeTypeId(branchId, sessionId) {
  return getFeeTypeId('HOSTEL', branchId, sessionId);
}

/**
 * Get fee_type_id for transport fee
 */
export async function getTransportFeeTypeId(branchId, sessionId) {
  return getFeeTypeId('TRANSPORT', branchId, sessionId);
}

// ═══════════════════════════════════════════════════════════════
// UNIVERSAL INSTALLMENT-BASED LEDGER ENGINE (v2)
// "Annual Fee is the Truth" — billing_mode splits into installments
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch installment config from transport or hostel installment table
 * @param {'transport'|'hostel'} source
 * @param {string} branchId
 * @param {string} sessionId
 * @returns {Array} installment configs sorted by installment_number
 */
async function fetchInstallmentConfig(source, branchId, sessionId) {
  const table = source === 'transport'
    ? 'transport_fee_installment_config'
    : 'hostel_fee_installment_config';

  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('branch_id', branchId)
    .eq('session_id', sessionId)
    .order('installment_number');

  return data || [];
}

/**
 * Fetch billing master config (billing_mode, working_months, prorate, etc.)
 * @param {'transport'|'hostel'} source
 * @param {string} branchId
 * @param {string} sessionId
 */
export async function fetchBillingConfig(source, branchId, sessionId) {
  const table = source === 'transport' ? 'transport_fees_master' : 'hostel_fees_master';

  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('branch_id', branchId)
    .eq('session_id', sessionId)
    .maybeSingle();

  return data || null;
}

/**
 * Write installment-based ledger entries for Transport / Hostel fees.
 *
 * @param {Object} params
 * @param {string} params.studentId
 * @param {'transport'|'hostel'} params.feeSource
 * @param {string} params.feeTypeId - UUID from fee_types
 * @param {number} params.annualFee - Total annual fee (the Truth)
 * @param {string} params.sessionId
 * @param {string} params.branchId
 * @param {string} params.organizationId
 * @param {string} params.sourceReferenceId
 * @param {string} [params.effectiveFrom] - For pro-rata calculation
 * @returns {{ success: boolean, rowsCreated: number, error?: string }}
 */
export async function writeInstallmentsToLedger({
  studentId,
  feeSource,
  feeTypeId,
  annualFee,
  sessionId,
  branchId,
  organizationId,
  sourceReferenceId,
  effectiveFrom = null,
}) {
  if (!studentId || !feeSource || !annualFee || annualFee <= 0) {
    return { success: false, rowsCreated: 0, error: 'Missing required parameters' };
  }

  // 1. Fetch billing config
  const config = await fetchBillingConfig(feeSource, branchId, sessionId);
  const billingMode = config?.billing_mode || 'annual';
  const workingMonths = config?.working_months || 10;
  const prorateMidYear = config?.prorate_mid_year !== false;

  // 2. Fetch installment config (due dates + fines)
  const installments = await fetchInstallmentConfig(feeSource, branchId, sessionId);

  // 3. Calculate per-installment amount
  let numInstallments;
  switch (billingMode) {
    case 'monthly': numInstallments = workingMonths; break;
    case 'quarterly': numInstallments = 4; break;
    case 'half_yearly': numInstallments = 2; break;
    case 'term_wise': numInstallments = config?.num_terms || 3; break;
    default: numInstallments = 1; // annual
  }

  // Pro-rata: if mid-year join and prorate is ON, reduce total
  let effectiveAnnualFee = annualFee;
  let startInstallment = 1;

  if (effectiveFrom && prorateMidYear && billingMode !== 'annual') {
    const sessionDates = await getSessionDates(sessionId);
    if (sessionDates?.start_date) {
      const sessionStart = new Date(sessionDates.start_date);
      const joinDate = new Date(effectiveFrom);

      if (joinDate > sessionStart) {
        // Calculate which installment the student starts from
        const totalMonths = workingMonths;
        const monthsElapsed = (joinDate.getFullYear() - sessionStart.getFullYear()) * 12
          + (joinDate.getMonth() - sessionStart.getMonth());

        if (billingMode === 'monthly') {
          startInstallment = Math.max(1, monthsElapsed + 1);
        } else {
          const monthsPerInstallment = Math.ceil(totalMonths / numInstallments);
          startInstallment = Math.max(1, Math.floor(monthsElapsed / monthsPerInstallment) + 1);
        }

        const remainingInstallments = numInstallments - startInstallment + 1;
        effectiveAnnualFee = Math.round((annualFee / numInstallments) * remainingInstallments);
      }
    }
  }

  const perInstallment = Math.round((effectiveAnnualFee / (numInstallments - startInstallment + 1)) * 100) / 100;

  // 4. Build ledger rows
  const ledgerRows = [];
  for (let i = startInstallment; i <= numInstallments; i++) {
    const configRow = installments.find(c => c.installment_number === i);
    const label = configRow?.installment_label || `Installment ${i}`;
    const dueDate = configRow?.due_date || null;
    const fineType = configRow?.fine_type || 'none';
    const fineValue = configRow?.fine_value || 0;

    // Calculate fine amount if applicable
    let fineAmount = 0;
    if (fineType === 'fixed') {
      fineAmount = fineValue;
    } else if (fineType === 'percentage') {
      fineAmount = Math.round((perInstallment * fineValue / 100) * 100) / 100;
    }

    ledgerRows.push({
      student_id: studentId,
      fee_source: feeSource,
      fee_type_id: feeTypeId || null,
      fee_structure_id: null,
      source_reference_id: sourceReferenceId || null,
      original_amount: perInstallment,
      discount_amount: 0,
      concession_amount: 0,
      net_amount: perInstallment,
      paid_amount: 0,
      fine_amount: 0, // Fine applied only after due date passes — not at generation time
      installment_number: i,
      due_date: dueDate,
      billing_period: label,
      status: 'pending',
      is_paid: false,
      assigned_by: 'system',
      branch_id: branchId,
      session_id: sessionId,
      organization_id: organizationId,
    });
  }

  if (ledgerRows.length === 0) {
    return { success: false, rowsCreated: 0, error: 'No installments generated' };
  }

  const { error } = await supabase
    .from('student_fee_ledger')
    .insert(ledgerRows);

  if (error) {
    console.error('writeInstallmentsToLedger error:', error);
    return { success: false, rowsCreated: 0, error: error.message };
  }

  return { success: true, rowsCreated: ledgerRows.length };
}

/**
 * Refresh installment ledger: cancel old unpaid + write new installments
 */
export async function refreshInstallmentLedger(params) {
  await cancelUnpaidLedgerEntries({
    studentId: params.studentId,
    feeSource: params.feeSource,
    sourceReferenceId: params.sourceReferenceId,
    sessionId: params.sessionId,
  });

  return await writeInstallmentsToLedger(params);
}
