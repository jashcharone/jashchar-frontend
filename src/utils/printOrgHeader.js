/**
 * Shared utility for analysis report PDF/Print — Organization header
 * Used by: FeesAnalysis, StudentAnalysis, AcademicAnalysis, TransportAnalysis, HostelAnalysis
 *
 * Fetches print_settings (header_image_url) + school details from Supabase,
 * returns ready-to-use HTML header string for print templates.
 */

/**
 * Fetch school details + print header settings from DB
 * @param {object} supabase - Supabase client
 * @param {string} branchId - Branch (school) ID
 * @returns {{ headerImageUrl, schoolName, logoUrl, address, phone, email, board, city }}
 */
export async function fetchPrintHeaderData(supabase, branchId) {
  if (!branchId) return {};

  const [schoolRes, settingsRes] = await Promise.all([
    supabase.from('schools').select('name, logo_url, address, contact_email, contact_number, city, board, branch_code').eq('id', branchId).maybeSingle(),
    supabase.from('print_settings').select('header_image_url').eq('branch_id', branchId).eq('type', 'fees_receipt').maybeSingle(),
  ]);

  const school = schoolRes.data || {};
  const settings = settingsRes.data || {};

  // Fallback: try org-level print_settings if branch-specific not found
  let headerImageUrl = settings.header_image_url || '';
  if (!headerImageUrl) {
    const { data: orgSettings } = await supabase.from('print_settings').select('header_image_url').is('branch_id', null).eq('type', 'fees_receipt').maybeSingle();
    headerImageUrl = orgSettings?.header_image_url || '';
  }

  return {
    headerImageUrl,
    schoolName: school.name || '',
    logoUrl: school.logo_url || '',
    address: school.address || '',
    phone: school.contact_number || '',
    email: school.contact_email || '',
    board: school.board || '',
    city: school.city || '',
    branchCode: school.branch_code || '',
  };
}

/**
 * Build the org header HTML for print templates
 * If header_image_url exists → show full-width header image (same as fee receipts)
 * Otherwise → show logo + school name + address + contact
 * @param {object} data - from fetchPrintHeaderData
 * @returns {string} HTML string
 */
export function buildOrgHeaderHtml(data = {}) {
  const { headerImageUrl, schoolName, logoUrl, address, phone, email, board, city } = data;

  if (headerImageUrl) {
    return `
      <div style="text-align:center; margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid #1a1a2e;">
        <img src="${headerImageUrl}" alt="School Header" style="max-width:100%; max-height:120px; object-fit:contain;" />
      </div>`;
  }

  // Fallback: structured header with logo + details
  const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:64px; margin-right:16px;" />` : '';
  const contactParts = [];
  if (address) contactParts.push(address);
  if (city) contactParts.push(city);
  if (phone) contactParts.push(`Phone: ${phone}`);
  if (email) contactParts.push(`Email: ${email}`);
  if (board) contactParts.push(`Board: ${board}`);

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; padding-bottom:12px; margin-bottom:16px; border-bottom:2px solid #1a1a2e;">
      <div style="display:flex; align-items:center;">
        ${logoHtml}
        <div>
          <div style="font-size:22px; font-weight:bold; color:#1a1a2e; text-transform:uppercase;">${schoolName || 'School'}</div>
          ${board ? `<div style="font-size:12px; color:#666; margin-top:2px;">${board}</div>` : ''}
        </div>
      </div>
      <div style="text-align:right; font-size:11px; color:#555; line-height:1.6;">
        ${address ? `<div>${address}</div>` : ''}
        ${city ? `<div>${city}</div>` : ''}
        ${phone ? `<div>📞 ${phone}</div>` : ''}
        ${email ? `<div>✉ ${email}</div>` : ''}
      </div>
    </div>`;
}

/**
 * Common print CSS styles shared across all analysis reports
 */
export const PRINT_STYLES = `
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; color: #333; font-size: 13px; }
  h1 { font-size: 18px; color: #1a1a2e; margin: 0 0 4px 0; }
  h2 { font-size: 15px; margin-top: 24px; color: #16213e; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .report-meta { font-size: 11px; color: #666; margin-bottom: 16px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
  .stat-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
  .stat-value { font-size: 20px; font-weight: bold; }
  .stat-label { font-size: 10px; color: #666; text-transform: uppercase; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
  th { background: #1a1a2e; color: white; padding: 6px 10px; text-align: left; font-size: 11px; }
  td { padding: 5px 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f8f9fa; }
  .text-green { color: #16a34a; } .text-red { color: #dc2626; } .text-amber { color: #d97706; }
  .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print { body { margin: 10px; } @page { margin: 10mm; } }
  @page { size: A4 landscape; }
`;
