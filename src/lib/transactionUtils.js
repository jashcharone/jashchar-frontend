/**
 * Generate a unique, readable Transaction ID
 * Format: BRANCH_CODE/YYMM/TYPE_SERIAL
 * Example: JIS/2601/F00001 (Jashchar ICSE School, Jan 2026, Fee payment serial 1)
 *          JIS/2601/T00001 (Transport payment)
 *          JIS/2601/H00001 (Hostel payment)
 * 
 * @param {object} supabase - Supabase client
 * @param {string} branchId - Branch ID
 * @param {string} branchCode - Branch code for prefix
 * @param {string} paymentType - 'fee' | 'transport' | 'hostel' (default: 'fee')
 */
export const generateTransactionId = async (supabase, branchId, branchCode, paymentType = 'fee') => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2); // 26
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01
  const yearMonth = `${year}${month}`; // 2601
  
  // Get branch code prefix (first 3-4 chars uppercase, remove special chars)
  let prefix = 'TXN';
  if (branchCode) {
    // Remove -T, -H suffixes if added by caller (legacy compatibility)
    const cleanCode = branchCode.replace(/-[TH]$/, '');
    prefix = cleanCode.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  
  // Determine type prefix and table based on payment type
  let typePrefix = 'F'; // Fee
  let tableName = 'fee_payments';
  
  if (paymentType === 'transport' || branchCode?.endsWith('-T')) {
    typePrefix = 'T'; // Transport
    tableName = 'transport_fee_payments';
  } else if (paymentType === 'hostel' || branchCode?.endsWith('-H')) {
    typePrefix = 'H'; // Hostel
    tableName = 'hostel_fee_payments';
  }
  
  // Get next serial number for this branch, month, and payment type
  // Count UNIQUE transaction_ids (not total rows) to avoid serial gaps from batch inserts
  try {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const { data: existing, error } = await supabase
      .from(tableName)
      .select('transaction_id')
      .eq('branch_id', branchId)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);
    
    if (error) throw error;
    
    // Count unique transaction_ids instead of total rows
    const uniqueTransactionIds = new Set((existing || []).map(r => r.transaction_id).filter(Boolean));
    const serial = String(uniqueTransactionIds.size + 1).padStart(5, '0'); // 00001
    
    return `${prefix}/${yearMonth}/${typePrefix}${serial}`;
  } catch (error) {
    console.error('Transaction ID generation error:', error);
    // Fallback: Use timestamp-based ID to ensure uniqueness
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}/${yearMonth}/${typePrefix}${timestamp}`;
  }
};

/**
 * Format currency in Indian style
 */
export const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Format number in Indian style (with commas)
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num || 0);
};
