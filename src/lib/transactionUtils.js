/**
 * Generate a unique, readable Transaction ID
 * Format: BRANCH_CODE/YYMM/SERIAL
 * Example: JIS/2601/00001 (Jashchar ICSE School, Jan 2026, serial 1)
 */

export const generateTransactionId = async (supabase, branchId, branchCode) => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2); // 26
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01
  const yearMonth = `${year}${month}`; // 2601
  
  // Get branch code prefix (first 3-4 chars uppercase)
  let prefix = 'TXN';
  if (branchCode) {
    prefix = branchCode.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  
  // Get next serial number for this branch and month
  try {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const { count } = await supabase
      .from('fee_payments')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);
    
    const serial = String((count || 0) + 1).padStart(5, '0'); // 00001
    
    return `${prefix}/${yearMonth}/${serial}`;
  } catch (error) {
    // Fallback to timestamp-based ID
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}/${yearMonth}/${timestamp}`;
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
