/**
 * 🤖 AI-POWERED ADMISSION FORM PDF GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * Premium quality, professional admission form PDF with:
 * - AI Engine: Dynamically generates based on ACTIVE fields from Form Settings
 * - Organization & Branch branding
 * - Photo placeholder with guidelines
 * - Only enabled fields appear in PDF
 * - Multi-page support
 * - Modern, clean design
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import jsPDF from 'jspdf';
import { format } from 'date-fns';

// ============================================================================
// 🤖 AI ENGINE: SECTION & FIELD MAPPING (Backend to PDF)
// ============================================================================
const AI_SECTION_CONFIG = {
  academic_details: { title: 'ACADEMIC DETAILS', color: 'primary', icon: '📚' },
  student_details: { title: 'STUDENT DETAILS', color: 'secondary', icon: '👤' },
  student_login: { title: 'STUDENT LOGIN DETAILS', color: 'accent', icon: '🔐' },
  parent_login: { title: 'PARENT LOGIN DETAILS', color: 'warning', icon: '👨‍👩‍👧' },
  father_details: { title: 'FATHER\'S DETAILS', color: 'accent', icon: '👨' },
  mother_details: { title: 'MOTHER\'S DETAILS', color: 'success', icon: '👩' },
  guardian_details: { title: 'GUARDIAN\'S DETAILS', color: 'warning', icon: '👥' },
  address_details: { title: 'ADDRESS DETAILS', color: 'primary', icon: '📍' },
  additional_details: { title: 'ADDITIONAL DETAILS', color: 'secondary', icon: '📋' },
};

// Field label beautification mapping
const AI_FIELD_LABELS = {
  session: 'Academic Session',
  admission_no: 'Admission Number',
  class: 'Class Applying For',
  section: 'Section',
  roll_number: 'Roll Number',
  admission_date: 'Date of Admission (DD/MM/YYYY)',
  category: 'Admission Type / Category',
  first_name: 'First Name',
  last_name: 'Last Name',
  gender: 'Gender (Male/Female/Other)',
  dob: 'Date of Birth (DD/MM/YYYY)',
  religion: 'Religion',
  domicile_state_id: 'Domicile State',
  caste_category: 'Caste Category (General/OBC/SC/ST)',
  sub_caste: 'Sub-Caste',
  mother_tongue: 'Mother Tongue',
  blood_group: 'Blood Group',
  email: 'Email Address',
  mobile_no: 'Mobile Number',
  national_id_no: 'Aadhaar Number (XXXX XXXX XXXX)',
  student_photo: 'Student Photo',
  pincode: 'Pincode (6 digits)',
  post_office: 'Post Office',
  city: 'City / District',
  state: 'State',
  current_address: 'Current Address',
  permanent_address: 'Permanent Address',
  username: 'Student Username',
  password: 'Student Password',
  retype_password: 'Retype Password',
  parent_username: 'Parent Username',
  parent_password: 'Parent Password',
  parent_retype_password: 'Retype Parent Password',
  father_name: 'Father\'s Full Name',
  father_phone: 'Father\'s Mobile Number',
  father_occupation: 'Father\'s Occupation',
  father_email: 'Father\'s Email',
  father_aadhar_no: 'Father\'s Aadhaar Number',
  father_photo: 'Father\'s Photo',
  mother_name: 'Mother\'s Full Name',
  mother_phone: 'Mother\'s Mobile Number',
  mother_occupation: 'Mother\'s Occupation',
  mother_aadhar_no: 'Mother\'s Aadhaar Number',
  mother_photo: 'Mother\'s Photo',
  guardian_name: 'Guardian\'s Name',
  guardian_relation: 'Relation with Student',
  guardian_phone: 'Guardian\'s Phone',
  guardian_occupation: 'Guardian\'s Occupation',
  guardian_photo: 'Guardian\'s Photo',
  student_house: 'Student House',
  height: 'Height (cm)',
  weight: 'Weight (kg)',
  as_on_date: 'Measurement Date',
  previous_school_details: 'Previous School Details',
  local_id_no: 'Local ID Number',
  bank_account_no: 'Bank Account Number',
  bank_name: 'Bank Name',
  ifsc_code: 'IFSC Code',
  is_rte_student: 'Is RTE Student? (Yes/No)',
};

// Field width intelligence
const AI_FIELD_WIDTHS = {
  current_address: 'full',
  permanent_address: 'full',
  previous_school_details: 'full',
  student_photo: 'skip', // Photo box handled separately
  father_photo: 'skip',
  mother_photo: 'skip',
  guardian_photo: 'skip',
  // Default all others to smart sizing
};

// Multiline fields
const AI_MULTILINE_FIELDS = ['current_address', 'permanent_address', 'previous_school_details'];

// ============================================================================
// 📦 CHARACTER BOX CONFIGURATION (Passport/Government Form Style)
// ============================================================================
const FIELD_BOX_COUNTS = {
  // Names - 20 boxes
  first_name: 20,
  last_name: 20,
  father_name: 25,
  mother_name: 25,
  guardian_name: 25,
  
  // Aadhaar - 12 digits (grouped 4-4-4)
  national_id_no: { count: 12, grouped: true, groupSize: 4 },
  father_aadhar_no: { count: 12, grouped: true, groupSize: 4 },
  mother_aadhar_no: { count: 12, grouped: true, groupSize: 4 },
  
  // Mobile - 10 digits
  mobile_no: 10,
  father_phone: 10,
  mother_phone: 10,
  guardian_phone: 10,
  
  // Dates - DD/MM/YYYY (8 digits + 2 slashes)
  dob: { count: 10, format: 'date' },
  admission_date: { count: 10, format: 'date' },
  
  // Pincode - 6 digits
  pincode: 6,
  
  // Short fields
  gender: 8,
  blood_group: 3,
  session: 9,
  admission_no: 12,
  class: 10,
  section: 5,
  roll_number: 6,
  
  // Medium fields
  religion: 15,
  mother_tongue: 15,
  caste_category: 12,
  sub_caste: 15,
  email: 25,
  father_email: 25,
  city: 18,
  state: 15,
  post_office: 18,
  
  // Bank details
  bank_account_no: 18,
  bank_name: 20,
  ifsc_code: 11,
  
  // Occupation
  father_occupation: 18,
  mother_occupation: 18,
  guardian_occupation: 18,
  guardian_relation: 15,
  
  // Others
  student_house: 12,
  is_rte_student: 3,
  height: 5,
  weight: 5,
  
  // Address - multiple rows
  current_address: { count: 60, rows: 2, perRow: 30 },
  permanent_address: { count: 60, rows: 2, perRow: 30 },
  previous_school_details: { count: 45, rows: 2, perRow: 45 },
  
  // Default
  _default: 18,
};

// ============================================================================
// 🎨 DESIGN CONSTANTS
// ============================================================================
const COLORS = {
  primary: [30, 64, 175],      // Deep Blue
  secondary: [99, 102, 241],   // Indigo
  accent: [139, 92, 246],      // Purple
  success: [34, 197, 94],      // Green
  warning: [245, 158, 11],     // Amber
  danger: [239, 68, 68],       // Red
  dark: [30, 41, 59],          // Slate 800
  text: [51, 65, 85],          // Slate 700
  muted: [100, 116, 139],      // Slate 500
  light: [241, 245, 249],      // Slate 100
  white: [255, 255, 255],
  border: [203, 213, 225],     // Slate 300
  lineGray: [180, 190, 200],
};

const FONTS = {
  title: 14,
  subtitle: 11,
  sectionTitle: 9,
  label: 7.5,
  field: 8,
  small: 7,
  tiny: 6,
};

// ============================================================================
// 🤖 AI ENGINE: Convert Backend Fields to PDF Sections
// ============================================================================
const buildAISections = (allFields, formSections) => {
  // Group enabled fields by section
  const enabledFields = allFields.filter(f => f.is_enabled !== false);
  const enabledSections = formSections.filter(s => s.is_enabled !== false);
  
  const sectionFieldsMap = {};
  
  enabledFields.forEach(field => {
    const sectionKey = field.section_key || field.section;
    if (!sectionKey) return;
    if (!sectionFieldsMap[sectionKey]) {
      sectionFieldsMap[sectionKey] = [];
    }
    sectionFieldsMap[sectionKey].push(field);
  });
  
  // Build sections in order
  const sections = [];
  const sectionOrder = [
    'academic_details', 'student_details', 'address_details', 
    'student_login', 'parent_login',
    'father_details', 'mother_details', 'guardian_details', 
    'additional_details'
  ];
  
  sectionOrder.forEach(sectionKey => {
    const sectionConfig = AI_SECTION_CONFIG[sectionKey];
    const sectionMeta = enabledSections.find(s => s.key === sectionKey);
    
    // Skip if section is not enabled or has no enabled fields
    if (!sectionConfig) return;
    if (sectionMeta?.is_enabled === false) return;
    
    const fields = sectionFieldsMap[sectionKey] || [];
    if (fields.length === 0) return;
    
    // Transform fields for PDF
    const pdfFields = fields
      .filter(f => AI_FIELD_WIDTHS[f.field_name] !== 'skip') // Skip photo fields (handled separately)
      .sort((a, b) => (a.order_index || a.order || 0) - (b.order_index || b.order || 0))
      .map(field => {
        const fieldKey = field.field_name || field.field_key?.split('__')[1] || field.field_key;
        const label = AI_FIELD_LABELS[fieldKey] || field.field_label || fieldKey;
        const width = AI_FIELD_WIDTHS[fieldKey] || 'third'; // Default to third (3 per row)
        const multiline = AI_MULTILINE_FIELDS.includes(fieldKey);
        const required = field.is_required;
        
        return { label, width, multiline, required, fieldKey };  // Include fieldKey for box count
      });
    
    if (pdfFields.length > 0) {
      sections.push({
        key: sectionKey,
        title: sectionConfig.title,
        color: sectionConfig.color,
        fields: pdfFields,
      });
    }
  });
  
  return sections;
};

// ============================================================================
// 📝 DEFAULT SECTIONS (Fallback when AI mode is not available)
// ============================================================================
const getDefaultSections = () => [
  {
    key: 'academic_details',
    title: 'ACADEMIC DETAILS',
    color: 'primary',
    fields: [
      { label: 'Session', width: 'third', required: true, fieldKey: 'session' },
      { label: 'Admission No', width: 'third', required: true, fieldKey: 'admission_no' },
      { label: 'Admission Date', width: 'third', required: true, fieldKey: 'admission_date' },
      { label: 'Class', width: 'third', required: true, fieldKey: 'class' },
      { label: 'Section', width: 'third', required: true, fieldKey: 'section' },
      { label: 'Roll No', width: 'third', fieldKey: 'roll_number' },
    ]
  },
  {
    key: 'student_details',
    title: 'STUDENT DETAILS',
    color: 'secondary',
    fields: [
      { label: 'First Name', width: 'third', required: true, fieldKey: 'first_name' },
      { label: 'Last Name', width: 'third', fieldKey: 'last_name' },
      { label: 'Gender', width: 'third', required: true, fieldKey: 'gender' },
      { label: 'Date of Birth', width: 'third', required: true, fieldKey: 'dob' },
      { label: 'Blood Group', width: 'third', fieldKey: 'blood_group' },
      { label: 'Religion', width: 'third', fieldKey: 'religion' },
      { label: 'Mother Tongue', width: 'third', fieldKey: 'mother_tongue' },
      { label: 'Caste Category', width: 'third', fieldKey: 'caste_category' },
      { label: 'Sub-Caste', width: 'third', fieldKey: 'sub_caste' },
      { label: 'Aadhaar No', width: 'third', fieldKey: 'national_id_no' },
      { label: 'Mobile', width: 'third', fieldKey: 'mobile_no' },
      { label: 'Email', width: 'third', fieldKey: 'email' },
    ]
  },
  {
    key: 'address_details',
    title: 'ADDRESS DETAILS',
    color: 'primary',
    fields: [
      { label: 'Pincode', width: 'third', fieldKey: 'pincode' },
      { label: 'Post Office', width: 'third', fieldKey: 'post_office' },
      { label: 'City/District', width: 'third', fieldKey: 'city' },
      { label: 'State', width: 'third', fieldKey: 'state' },
      { label: 'Current Address', width: 'full', multiline: true, fieldKey: 'current_address' },
      { label: 'Permanent Address', width: 'full', multiline: true, fieldKey: 'permanent_address' },
    ]
  },
  {
    key: 'father_details',
    title: 'FATHER DETAILS',
    color: 'accent',
    fields: [
      { label: 'Father Name', width: 'third', required: true, fieldKey: 'father_name' },
      { label: 'Father Phone', width: 'third', fieldKey: 'father_phone' },
      { label: 'Father Occupation', width: 'third', fieldKey: 'father_occupation' },
      { label: 'Father Email', width: 'third', fieldKey: 'father_email' },
      { label: 'Father Aadhaar', width: 'third', fieldKey: 'father_aadhar_no' },
    ]
  },
  {
    key: 'mother_details',
    title: 'MOTHER DETAILS',
    color: 'success',
    fields: [
      { label: 'Mother Name', width: 'third', fieldKey: 'mother_name' },
      { label: 'Mother Phone', width: 'third', fieldKey: 'mother_phone' },
      { label: 'Mother Occupation', width: 'third', fieldKey: 'mother_occupation' },
      { label: 'Mother Aadhaar', width: 'third', fieldKey: 'mother_aadhar_no' },
    ]
  },
  {
    key: 'guardian_details',
    title: 'GUARDIAN DETAILS',
    color: 'warning',
    fields: [
      { label: 'Guardian Name', width: 'third', fieldKey: 'guardian_name' },
      { label: 'Relation', width: 'third', fieldKey: 'guardian_relation' },
      { label: 'Guardian Phone', width: 'third', fieldKey: 'guardian_phone' },
      { label: 'Guardian Occupation', width: 'third', fieldKey: 'guardian_occupation' },
    ]
  },
  {
    key: 'additional_details',
    title: 'ADDITIONAL DETAILS',
    color: 'secondary',
    fields: [
      { label: 'Student House', width: 'third', fieldKey: 'student_house' },
      { label: 'RTE Student?', width: 'third', fieldKey: 'is_rte_student' },
      { label: 'Bank A/C No', width: 'third', fieldKey: 'bank_account_no' },
      { label: 'Bank Name', width: 'third', fieldKey: 'bank_name' },
      { label: 'IFSC Code', width: 'third', fieldKey: 'ifsc_code' },
      { label: 'Previous School', width: 'full', multiline: true, fieldKey: 'previous_school_details' },
    ]
  },
];

const DOCUMENTS_CHECKLIST = [
  'Birth Certificate (Original + Photocopy)',
  'Aadhaar Card - Student (Photocopy)',
  'Aadhaar Card - Father (Photocopy)',
  'Aadhaar Card - Mother (Photocopy)',
  'Previous School Transfer Certificate (TC)',
  'Previous School Report Card / Marksheet',
  'Passport Size Photographs (4 nos)',
  'Caste Certificate (if applicable)',
  'Income Certificate (if applicable)',
  'Medical Fitness Certificate',
  'Address Proof (Ration Card / Utility Bill)',
  'Bank Passbook Copy (for EWS/RTE)',
];

// ============================================================================
// 📄 AI-POWERED PDF GENERATOR FUNCTION
// ============================================================================
export const generateAdmissionFormPDF = async ({
  organizationName = 'Educational Institution',
  organizationLogo = null,
  branchName = '',
  branchAddress = '',
  contactPhone = '',
  contactEmail = '',
  officePhone = '',        // Organization office phone
  academicSession = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  formTitle = 'STUDENT ADMISSION FORM',
  // AI Engine Parameters - Dynamic field generation
  allFields = null,      // From backend form settings
  formSections = null,   // From backend section settings
}) => {
  
  // 🤖 AI ENGINE: Build sections dynamically from enabled fields
  const PDF_SECTIONS = (allFields && formSections && allFields.length > 0) 
    ? buildAISections(allFields, formSections)
    : null;
  
  const isAIPowered = PDF_SECTIONS !== null;
  console.log(`[AdmissionFormPDF] 🤖 AI Mode: ${isAIPowered ? 'ENABLED' : 'DISABLED (using defaults)'}`);
  if (isAIPowered) {
    console.log(`[AdmissionFormPDF] Generated ${PDF_SECTIONS.length} sections from ${allFields.length} fields`);
  }
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 8; // Compact margin
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;
  let currentPage = 1;

  // ========== HELPER FUNCTIONS ==========
  
  const addText = (text, x, yPos, options = {}) => {
    const { fontSize = FONTS.field, fontStyle = 'normal', color = COLORS.text, align = 'left', maxWidth = null } = options;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(...color);
    
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text || '', maxWidth);
      pdf.text(lines, x, yPos, { align });
      return yPos + (lines.length * fontSize * 0.4);
    }
    
    pdf.text(text || '', x, yPos, { align });
    return yPos;
  };

  const addLine = (x1, yPos, x2, color = COLORS.border, lineWidth = 0.3) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(lineWidth);
    pdf.line(x1, yPos, x2, yPos);
    return yPos;
  };

  const addDottedLine = (x1, yPos, x2, color = COLORS.lineGray) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.3);
    const dashLength = 1.5;
    const gapLength = 1;
    let currentX = x1;
    while (currentX < x2) {
      const endX = Math.min(currentX + dashLength, x2);
      pdf.line(currentX, yPos, endX, yPos);
      currentX = endX + gapLength;
    }
    return yPos;
  };

  // 📦 CHARACTER BOXES (Passport/Government Form Style)
  const drawCharacterBoxes = (startX, yPos, boxCount, boxSize = 4, options = {}) => {
    const { grouped = false, groupSize = 4, rows = 1, perRow = boxCount, format = null } = options;
    const boxesPerRow = perRow || boxCount;
    const gap = grouped ? 1.5 : 0.3;
    let currentX = startX;
    let currentY = yPos;
    
    for (let r = 0; r < rows; r++) {
      currentX = startX;
      for (let i = 0; i < boxesPerRow && (r * boxesPerRow + i) < boxCount; i++) {
        // Add gap between groups (for Aadhaar 4-4-4 style)
        if (grouped && i > 0 && i % groupSize === 0) {
          currentX += gap;
        }
        
        // Draw box
        pdf.setDrawColor(...COLORS.border);
        pdf.setLineWidth(0.3);
        pdf.rect(currentX, currentY, boxSize, boxSize, 'S');
        
        // Date format: Add pre-printed slashes DD/MM/YYYY
        if (format === 'date') {
          if (i === 2 || i === 5) {
            pdf.setFontSize(6);
            pdf.setTextColor(...COLORS.muted);
            pdf.text('/', currentX + boxSize + 0.3, currentY + boxSize - 1);
            currentX += 2;
          }
        }
        
        currentX += boxSize + 0.3;
      }
      if (r < rows - 1) {
        currentY += boxSize + 1;
      }
    }
    
    return { endX: currentX, endY: currentY + boxSize, rows };
  };

  const addRoundedRect = (x, yPos, width, height, radius, options = {}) => {
    const { fill = null, stroke = null, lineWidth = 0.5 } = options;
    if (fill) {
      pdf.setFillColor(...fill);
      pdf.roundedRect(x, yPos, width, height, radius, radius, 'F');
    }
    if (stroke) {
      pdf.setDrawColor(...stroke);
      pdf.setLineWidth(lineWidth);
      pdf.roundedRect(x, yPos, width, height, radius, radius, 'S');
    }
  };

  const checkPageBreak = (neededSpace = 20) => {
    if (y + neededSpace > pageHeight - margin - 8) {
      addFooter();
      pdf.addPage();
      currentPage++;
      y = margin + 2;
      addPageHeader();
      return true;
    }
    return false;
  };

  const addPageHeader = () => {
    // Compact header on subsequent pages
    addText(`${organizationName} | Page ${currentPage}`, pageWidth / 2, y + 2, { 
      fontSize: 6, fontStyle: 'bold', color: COLORS.primary, align: 'center'
    });
    addLine(margin, y + 4, pageWidth - margin, COLORS.border, 0.3);
    y += 6;
  };

  const addFooter = () => {
    const footerY = pageHeight - 6;
    addText(`Page ${currentPage} | Downloaded: ${format(new Date(), 'dd-MMM-yyyy hh:mm a')} | Session: ${academicSession}`, pageWidth / 2, footerY, { fontSize: 5, color: COLORS.muted, align: 'center' });
  };

  // ========== PAGE 1: PROFESSIONAL HEADER ==========
  
  // Top header background
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, pageWidth, 36, 'F');
  
  // Light accent strip
  pdf.setFillColor(30, 58, 138); // Darker blue
  pdf.rect(0, 32, pageWidth, 4, 'F');
  
  // Organization Logo Placeholder (Left side)
  const logoX = margin + 2;
  const logoY = 4;
  const logoSize = 18;
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);
  pdf.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 'S');
  addText('LOGO', logoX + logoSize/2, logoY + logoSize/2 + 1, { 
    fontSize: 5, color: COLORS.white, align: 'center' 
  });
  
  // Photo Box (Right side - inside header)
  const photoBoxX = pageWidth - margin - 26;
  const photoBoxY = 3;
  const photoBoxW = 22;
  const photoBoxH = 28;
  
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 1.5, 1.5, 'F');
  pdf.setDrawColor(...COLORS.primary);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 1.5, 1.5, 'S');
  addText('Paste', photoBoxX + photoBoxW/2, photoBoxY + 10, { 
    fontSize: 5, color: COLORS.muted, align: 'center' 
  });
  addText('Photo', photoBoxX + photoBoxW/2, photoBoxY + 14, { 
    fontSize: 5, color: COLORS.muted, align: 'center' 
  });
  addText('(3.5×4.5cm)', photoBoxX + photoBoxW/2, photoBoxY + 18, { 
    fontSize: 4.5, color: COLORS.muted, align: 'center' 
  });
  addText('Attested', photoBoxX + photoBoxW/2, photoBoxY + 24, { 
    fontSize: 4, color: COLORS.danger, align: 'center' 
  });
  
  // Organization Name (Center)
  const headerCenterX = pageWidth / 2;
  addText(organizationName.toUpperCase(), headerCenterX, 10, {
    fontSize: FONTS.title + 1,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'center'
  });
  
  // Branch Name
  if (branchName) {
    addText(`( ${branchName} )`, headerCenterX, 16, {
      fontSize: FONTS.small,
      fontStyle: 'bold',
      color: [191, 219, 254],
      align: 'center'
    });
  }
  
  // Address line
  if (branchAddress) {
    addText(branchAddress, headerCenterX, 21, {
      fontSize: 6,
      color: [191, 219, 254],
      align: 'center',
      maxWidth: 140
    });
  }
  
  // Contact info line
  let contactLine = '';
  if (contactPhone) contactLine += `Ph: ${contactPhone}`;
  if (officePhone && officePhone !== contactPhone) contactLine += (contactLine ? '  |  ' : '') + `Office: ${officePhone}`;
  if (contactEmail) contactLine += (contactLine ? '  |  ' : '') + `Email: ${contactEmail}`;
  if (contactLine) {
    addText(contactLine, headerCenterX, 27, {
      fontSize: 5.5,
      color: [191, 219, 254],
      align: 'center'
    });
  }

  y = 40;
  
  // Form Title Bar
  pdf.setFillColor(...COLORS.dark);
  pdf.rect(margin, y, contentWidth, 7, 'F');
  addText(formTitle, pageWidth / 2, y + 4.5, {
    fontSize: FONTS.sectionTitle + 1,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'center'
  });
  
  y += 10;

  // ========== APPLICATION INFO ROW ==========
  
  // Application Number with boxes
  addText('APPLICATION NO:', margin, y + 3, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
  drawCharacterBoxes(margin + 28, y, 12, 4, {});
  
  // Date with boxes
  addText('DATE:', margin + 85, y + 3, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
  drawCharacterBoxes(margin + 97, y, 10, 4, { format: 'date' });
  
  // Session & Download info
  addText(`SESSION: ${academicSession}`, pageWidth - margin - 45, y + 3, { 
    fontSize: 6, fontStyle: 'bold', color: COLORS.primary 
  });
  
  y += 6;

  // ========== FORM SECTIONS ==========
  
  const getSectionColor = (colorName) => {
    const colorMap = {
      primary: COLORS.primary,
      secondary: COLORS.secondary,
      accent: COLORS.accent,
      success: COLORS.success,
      warning: COLORS.warning,
      danger: COLORS.danger,
    };
    return colorMap[colorName] || COLORS.primary;
  };

  const renderField = (field, startX, fieldWidth) => {
    // Get box configuration for this field
    const boxConfig = FIELD_BOX_COUNTS[field.fieldKey] || FIELD_BOX_COUNTS._default;
    const isComplex = typeof boxConfig === 'object';
    
    // Calculate box size based on field width
    let boxCount = isComplex ? boxConfig.count : boxConfig;
    let boxSize = 4; // Default box size
    
    // Adjust box size for field width
    const maxBoxesForWidth = Math.floor((fieldWidth - 4) / (boxSize + 0.3));
    if (boxCount > maxBoxesForWidth && !field.multiline) {
      boxCount = maxBoxesForWidth;
      boxSize = 3.5;
    }
    
    // Calculate height based on rows
    const rows = isComplex && boxConfig.rows ? boxConfig.rows : 1;
    const fieldHeight = field.multiline ? (rows * 5 + 3) : 8;
    
    checkPageBreak(fieldHeight + 2);
    
    // Field label (CAPITAL style instruction text)
    addText(field.label.toUpperCase() + (field.required ? '*' : ''), startX, y + 2.5, {
      fontSize: 6,
      fontStyle: 'bold',
      color: field.required ? COLORS.danger : COLORS.dark
    });
    
    // Draw character boxes
    const boxOptions = isComplex ? {
      grouped: boxConfig.grouped,
      groupSize: boxConfig.groupSize,
      rows: boxConfig.rows || 1,
      perRow: boxConfig.perRow || boxCount,
      format: boxConfig.format,
    } : {};
    
    drawCharacterBoxes(startX, y + 4, boxCount, boxSize, boxOptions);
    
    return fieldHeight;
  };

  const renderSection = (section) => {
    checkPageBreak(15);
    
    const sectionColor = getSectionColor(section.color);
    
    // Section header (compact)
    addRoundedRect(margin, y, contentWidth, 5, 1, { fill: sectionColor });
    addText(section.title, margin + 3, y + 3.5, {
      fontSize: FONTS.label,
      fontStyle: 'bold',
      color: COLORS.white
    });
    y += 6;

    // Render fields in rows
    let rowY = y;
    let rowX = margin + 2;
    let rowHeight = 0;
    
    section.fields.forEach((field, index) => {
      let fieldWidth;
      switch (field.width) {
        case 'full':
          fieldWidth = contentWidth - 2;
          if (rowX > margin + 5) {
            y = rowY + rowHeight + 1;
            rowY = y;
          }
          rowX = margin + 1;
          break;
        case 'half':
          fieldWidth = (contentWidth - 4) / 2;
          break;
        case 'third':
        default:
          fieldWidth = (contentWidth - 6) / 3;
          break;
      }
      
      // Check if field fits in current row
      if (rowX + fieldWidth > pageWidth - margin && field.width !== 'full') {
        y = rowY + rowHeight + 1;
        rowY = y;
        rowX = margin + 1;
        rowHeight = 0;
      }
      
      const tempY = y;
      y = rowY;
      const fHeight = renderField(field, rowX, fieldWidth);
      rowHeight = Math.max(rowHeight, fHeight);
      y = tempY;
      
      if (field.width === 'full') {
        y = rowY + rowHeight + 1;
        rowY = y;
        rowX = margin + 1;
        rowHeight = 0;
      } else {
        rowX += fieldWidth + 1;
      }
    });
    
    y = rowY + rowHeight + 4; // Compact spacing
  };

  // 🤖 AI BADGE: Show AI-powered indicator if using dynamic fields
  if (isAIPowered) {
    addText('[AI-Powered Form - Based on Active Settings]', pageWidth / 2, y + 2, {
      fontSize: 5,
      fontStyle: 'bold',
      color: COLORS.muted,
      align: 'center'
    });
    y += 4;
  }

  // Render all sections (AI-powered or fallback defaults)
  const sectionsToRender = PDF_SECTIONS || getDefaultSections();
  sectionsToRender.forEach(section => {
    renderSection(section);
  });

  // ========== COMPACT DOCUMENTS CHECKLIST ==========
  checkPageBreak(30);
  
  addRoundedRect(margin, y, contentWidth, 4.5, 1, { fill: COLORS.dark });
  addText('DOCUMENTS CHECKLIST', margin + 3, y + 3.2, {
    fontSize: FONTS.label,
    fontStyle: 'bold',
    color: COLORS.white
  });
  y += 6;

  // Checklist in 3 columns (compact)
  const checklistColWidth = (contentWidth - 6) / 3;
  let checkY = y;
  const docsPerCol = Math.ceil(DOCUMENTS_CHECKLIST.length / 3);
  
  DOCUMENTS_CHECKLIST.forEach((doc, index) => {
    const col = Math.floor(index / docsPerCol);
    const row = index % docsPerCol;
    const colX = margin + col * (checklistColWidth + 2);
    const itemY = checkY + (row * 4.5);
    
    // Small checkbox
    addRoundedRect(colX, itemY - 1.5, 2.5, 2.5, 0.3, { stroke: COLORS.border });
    addText(doc, colX + 3.5, itemY, { fontSize: 5.5, color: COLORS.text });
  });

  y = checkY + (docsPerCol * 4.5) + 2;

  // ========== DECLARATION SECTION ==========
  checkPageBreak(35);
  
  addRoundedRect(margin, y, contentWidth, 5, 1, { fill: [127, 29, 29] });
  addText('DECLARATION BY PARENT/GUARDIAN', margin + 3, y + 3.5, {
    fontSize: FONTS.label,
    fontStyle: 'bold',
    color: COLORS.white
  });
  y += 7;

  const declarationText = `I hereby declare that the information provided in this application form is true and correct to the best of my knowledge. I agree to abide by all the rules and regulations of the institution. I understand that any false information may result in cancellation of admission.`;
  
  addText(declarationText, margin + 2, y + 2, {
    fontSize: 6.5,
    color: COLORS.dark,
    maxWidth: contentWidth - 4
  });
  
  y += 12;

  // Signature boxes with proper areas
  const sigBoxWidth = (contentWidth - 12) / 3;
  const sigBoxHeight = 12;
  
  // Father/Parent signature box
  addRoundedRect(margin, y, sigBoxWidth, sigBoxHeight, 1, { stroke: COLORS.border });
  addText('FATHER/GUARDIAN SIGNATURE', margin + sigBoxWidth/2, y + sigBoxHeight - 1.5, { 
    fontSize: 5, fontStyle: 'bold', color: COLORS.muted, align: 'center' 
  });
  
  // Mother signature box
  addRoundedRect(margin + sigBoxWidth + 4, y, sigBoxWidth, sigBoxHeight, 1, { stroke: COLORS.border });
  addText('MOTHER SIGNATURE', margin + sigBoxWidth + 4 + sigBoxWidth/2, y + sigBoxHeight - 1.5, { 
    fontSize: 5, fontStyle: 'bold', color: COLORS.muted, align: 'center' 
  });
  
  // Date box
  addRoundedRect(margin + (sigBoxWidth + 4) * 2, y, sigBoxWidth, sigBoxHeight, 1, { stroke: COLORS.border });
  addText('DATE: ___ / ___ / ______', margin + (sigBoxWidth + 4) * 2 + sigBoxWidth/2, y + sigBoxHeight/2 + 1, { 
    fontSize: 6, color: COLORS.muted, align: 'center' 
  });

  y += sigBoxHeight + 6;

  // ========== PROFESSIONAL OFFICE USE SECTION ==========
  checkPageBreak(60);
  
  // Header with gradient effect
  addRoundedRect(margin, y, contentWidth, 6, 1.5, { fill: COLORS.dark });
  addText('FOR OFFICE USE ONLY - DO NOT WRITE BELOW THIS LINE', margin + contentWidth/2, y + 4, {
    fontSize: 7,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'center'
  });
  y += 8;

  // Main office table
  const tableStartY = y;
  const col1W = contentWidth * 0.45;
  const col2W = contentWidth * 0.55;
  
  // Left column - Registration Details
  addRoundedRect(margin, y, col1W - 2, 38, 1, { stroke: COLORS.border, fill: COLORS.light });
  addText('REGISTRATION DETAILS', margin + (col1W - 2)/2, y + 3.5, {
    fontSize: 6.5, fontStyle: 'bold', color: COLORS.primary, align: 'center'
  });
  
  // Registration fields with boxes
  let regY = y + 7;
  const regFields = [
    { label: 'ADMISSION NO', boxes: 10 },
    { label: 'CLASS ALLOTTED', boxes: 8 },
    { label: 'SECTION', boxes: 5 },
    { label: 'ROLL NUMBER', boxes: 6 },
  ];
  
  regFields.forEach(rf => {
    addText(rf.label + ':', margin + 2, regY + 2.5, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
    drawCharacterBoxes(margin + 32, regY, rf.boxes, 3.5, {});
    regY += 7;
  });
  
  // Right column - Fee & Verification
  addRoundedRect(margin + col1W, y, col2W - 2, 38, 1, { stroke: COLORS.border, fill: COLORS.light });
  addText('FEE & VERIFICATION', margin + col1W + (col2W - 2)/2, y + 3.5, {
    fontSize: 6.5, fontStyle: 'bold', color: COLORS.primary, align: 'center'
  });
  
  // Fee fields
  let feeY = y + 7;
  const feeFields = [
    { label: 'REG. FEE PAID', boxes: 8 },
    { label: 'RECEIPT NO', boxes: 10 },
  ];
  
  feeFields.forEach(ff => {
    addText(ff.label + ':', margin + col1W + 2, feeY + 2.5, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
    addText('₹', margin + col1W + 34, feeY + 2.5, { fontSize: 5.5, color: COLORS.dark });
    drawCharacterBoxes(margin + col1W + 38, feeY, ff.boxes, 3.5, {});
    feeY += 7;
  });
  
  // Verification checkboxes
  addText('DOCUMENTS VERIFIED:', margin + col1W + 2, feeY + 2.5, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
  addRoundedRect(margin + col1W + 38, feeY, 4, 4, 0.5, { stroke: COLORS.border });
  addText('YES', margin + col1W + 44, feeY + 3, { fontSize: 5, color: COLORS.dark });
  addRoundedRect(margin + col1W + 52, feeY, 4, 4, 0.5, { stroke: COLORS.border });
  addText('NO', margin + col1W + 58, feeY + 3, { fontSize: 5, color: COLORS.dark });
  feeY += 7;
  
  addText('ELIGIBILITY CHECK:', margin + col1W + 2, feeY + 2.5, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
  addRoundedRect(margin + col1W + 38, feeY, 4, 4, 0.5, { stroke: COLORS.border });
  addText('PASS', margin + col1W + 44, feeY + 3, { fontSize: 5, color: COLORS.success });
  addRoundedRect(margin + col1W + 54, feeY, 4, 4, 0.5, { stroke: COLORS.border });
  addText('FAIL', margin + col1W + 60, feeY + 3, { fontSize: 5, color: COLORS.danger });

  y = tableStartY + 42;

  // Bottom row - Signatures and Seal
  addRoundedRect(margin, y, contentWidth, 28, 1, { stroke: COLORS.border });
  
  const authBoxW = (contentWidth - 8) / 3;
  const authBoxY = y + 3;
  
  // Verified By box
  addText('VERIFIED BY:', margin + 4, authBoxY + 2, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
  addRoundedRect(margin + 4, authBoxY + 4, authBoxW - 8, 12, 0.5, { stroke: COLORS.muted });
  addText('Name & Signature', margin + 4 + (authBoxW - 8)/2, authBoxY + 13, { 
    fontSize: 4.5, color: COLORS.muted, align: 'center' 
  });
  addText('Date: ___ / ___ / ____', margin + 4, authBoxY + 19, { fontSize: 5, color: COLORS.muted });
  
  // Principal/HOD Approval box
  addText('PRINCIPAL/HOD APPROVAL:', margin + 4 + authBoxW, authBoxY + 2, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
  addRoundedRect(margin + 4 + authBoxW, authBoxY + 4, authBoxW - 8, 12, 0.5, { stroke: COLORS.muted });
  addText('Signature & Date', margin + 4 + authBoxW + (authBoxW - 8)/2, authBoxY + 13, { 
    fontSize: 4.5, color: COLORS.muted, align: 'center' 
  });
  addRoundedRect(margin + 4 + authBoxW, authBoxY + 18, 6, 6, 0.5, { stroke: COLORS.border });
  addText('APPROVED', margin + 4 + authBoxW + 8, authBoxY + 22.5, { fontSize: 5, color: COLORS.success });
  addRoundedRect(margin + 4 + authBoxW + 30, authBoxY + 18, 6, 6, 0.5, { stroke: COLORS.border });
  addText('REJECTED', margin + 4 + authBoxW + 38, authBoxY + 22.5, { fontSize: 5, color: COLORS.danger });
  
  // Official Seal area
  addText('OFFICIAL SEAL:', margin + 4 + authBoxW * 2, authBoxY + 2, { fontSize: 5.5, fontStyle: 'bold', color: COLORS.dark });
  // Seal circle
  pdf.setDrawColor(...COLORS.muted);
  pdf.setLineWidth(0.5);
  const sealCenterX = margin + 4 + authBoxW * 2 + (authBoxW - 4) / 2;
  const sealCenterY = authBoxY + 14;
  pdf.circle(sealCenterX, sealCenterY, 9, 'S');
  pdf.circle(sealCenterX, sealCenterY, 7.5, 'S');
  addText('SEAL', sealCenterX, sealCenterY + 1, { fontSize: 5, color: COLORS.muted, align: 'center' });

  y += 32;

  // Add footer
  addFooter();

  // ========== DOWNLOAD ==========
  const fileName = `Admission_Form_${branchName || organizationName}_${format(new Date(), 'yyyy')}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};

export default generateAdmissionFormPDF;
