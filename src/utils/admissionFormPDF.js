/**
 * 🎓 WORLD-CLASS ADMISSION FORM PDF GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * Premium quality, professional admission form PDF with:
 * - Organization & Branch branding
 * - Photo placeholder with guidelines
 * - All form fields with writing lines
 * - Multi-page support
 * - Modern, clean design
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import jsPDF from 'jspdf';
import { format } from 'date-fns';

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
  title: 18,
  subtitle: 14,
  sectionTitle: 11,
  label: 9,
  field: 10,
  small: 8,
  tiny: 7,
};

// ============================================================================
// 📝 FORM SECTIONS CONFIGURATION
// ============================================================================
const FORM_SECTIONS = [
  {
    key: 'basic_details',
    title: 'STUDENT BASIC DETAILS',
    color: 'primary',
    fields: [
      { label: 'First Name', width: 'half', required: true },
      { label: 'Last Name', width: 'half' },
      { label: 'Date of Birth (DD/MM/YYYY)', width: 'third', required: true },
      { label: 'Gender (Male/Female/Other)', width: 'third', required: true },
      { label: 'Blood Group', width: 'third' },
      { label: 'Class Applying For', width: 'half', required: true },
      { label: 'Academic Session', width: 'half', required: true },
      { label: 'Mother Tongue', width: 'third' },
      { label: 'Religion', width: 'third' },
      { label: 'Nationality', width: 'third' },
      { label: 'Caste Category (General/OBC/SC/ST)', width: 'half' },
      { label: 'Sub-Caste', width: 'half' },
    ]
  },
  {
    key: 'identity_details',
    title: 'IDENTITY DETAILS',
    color: 'secondary',
    fields: [
      { label: 'Aadhaar Number (XXXX XXXX XXXX)', width: 'half' },
      { label: 'PAN Number (if applicable)', width: 'half' },
      { label: 'Student Mobile Number', width: 'half' },
      { label: 'Student Email Address', width: 'half' },
    ]
  },
  {
    key: 'father_details',
    title: 'FATHER\'S DETAILS',
    color: 'accent',
    fields: [
      { label: 'Father\'s Full Name', width: 'half', required: true },
      { label: 'Father\'s Aadhaar Number', width: 'half' },
      { label: 'Father\'s Mobile Number', width: 'third', required: true },
      { label: 'Father\'s Email Address', width: 'third' },
      { label: 'Father\'s Date of Birth', width: 'third' },
      { label: 'Father\'s Occupation', width: 'half' },
      { label: 'Father\'s Annual Income (₹)', width: 'half' },
      { label: 'Father\'s Education Qualification', width: 'full' },
    ]
  },
  {
    key: 'mother_details',
    title: 'MOTHER\'S DETAILS',
    color: 'success',
    fields: [
      { label: 'Mother\'s Full Name', width: 'half', required: true },
      { label: 'Mother\'s Aadhaar Number', width: 'half' },
      { label: 'Mother\'s Mobile Number', width: 'third' },
      { label: 'Mother\'s Email Address', width: 'third' },
      { label: 'Mother\'s Date of Birth', width: 'third' },
      { label: 'Mother\'s Occupation', width: 'half' },
      { label: 'Mother\'s Annual Income (₹)', width: 'half' },
      { label: 'Mother\'s Education Qualification', width: 'full' },
    ]
  },
  {
    key: 'guardian_details',
    title: 'GUARDIAN DETAILS (If different from parents)',
    color: 'warning',
    fields: [
      { label: 'Guardian\'s Name', width: 'half' },
      { label: 'Relation with Student', width: 'half' },
      { label: 'Guardian\'s Mobile Number', width: 'half' },
      { label: 'Guardian\'s Occupation', width: 'half' },
    ]
  },
  {
    key: 'address_details',
    title: 'ADDRESS DETAILS',
    color: 'primary',
    fields: [
      { label: 'Current Address', width: 'full', multiline: true },
      { label: 'City', width: 'third' },
      { label: 'State', width: 'third' },
      { label: 'Pincode', width: 'third' },
      { label: 'Permanent Address (if different from current address)', width: 'full', multiline: true },
    ]
  },
  {
    key: 'previous_school',
    title: 'PREVIOUS SCHOOL DETAILS',
    color: 'secondary',
    fields: [
      { label: 'Previous School Name', width: 'full' },
      { label: 'Previous School Address', width: 'full' },
      { label: 'Last Class Attended', width: 'third' },
      { label: 'Year of Passing', width: 'third' },
      { label: 'Board/Medium', width: 'third' },
      { label: 'Reason for Leaving', width: 'full' },
      { label: 'Transfer Certificate Number', width: 'half' },
      { label: 'TC Issue Date', width: 'half' },
    ]
  },
  {
    key: 'transport_hostel',
    title: 'TRANSPORT & HOSTEL REQUIREMENTS',
    color: 'accent',
    fields: [
      { label: 'Transport Required? (Yes/No)', width: 'half' },
      { label: 'Pickup Point / Area', width: 'half' },
      { label: 'Hostel Required? (Yes/No)', width: 'half' },
      { label: 'Room Type Preference', width: 'half' },
    ]
  },
  {
    key: 'additional_info',
    title: 'ADDITIONAL INFORMATION',
    color: 'success',
    fields: [
      { label: 'Is RTE Student? (Yes/No)', width: 'half' },
      { label: 'Sibling in Same School? (Yes/No)', width: 'half' },
      { label: 'Sibling Name & Class (if applicable)', width: 'full' },
      { label: 'Any Medical Condition / Allergy', width: 'full', multiline: true },
      { label: 'Special Requirements / Remarks', width: 'full', multiline: true },
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
// 📄 PDF GENERATOR FUNCTION
// ============================================================================
export const generateAdmissionFormPDF = async ({
  organizationName = 'Educational Institution',
  organizationLogo = null,
  branchName = '',
  branchAddress = '',
  contactPhone = '',
  contactEmail = '',
  academicSession = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  formTitle = 'STUDENT ADMISSION FORM',
}) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
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

  const checkPageBreak = (neededSpace = 30) => {
    if (y + neededSpace > pageHeight - margin - 15) {
      addFooter();
      pdf.addPage();
      currentPage++;
      y = margin + 5;
      addPageHeader();
      return true;
    }
    return false;
  };

  const addPageHeader = () => {
    // Thin header line on subsequent pages
    addLine(margin, y, pageWidth - margin, COLORS.primary, 0.8);
    y += 3;
    addText(`${organizationName}${branchName ? ' - ' + branchName : ''}`, margin, y + 3, { 
      fontSize: FONTS.small, fontStyle: 'bold', color: COLORS.primary 
    });
    addText(`Page ${currentPage}`, pageWidth - margin, y + 3, { 
      fontSize: FONTS.tiny, color: COLORS.muted, align: 'right' 
    });
    y += 8;
    addLine(margin, y, pageWidth - margin, COLORS.border, 0.3);
    y += 5;
  };

  const addFooter = () => {
    const footerY = pageHeight - 10;
    addLine(margin, footerY - 3, pageWidth - margin, COLORS.border, 0.3);
    addText('Applicant Signature: _______________', margin, footerY, { fontSize: FONTS.tiny, color: COLORS.muted });
    addText(`Page ${currentPage}`, pageWidth / 2, footerY, { fontSize: FONTS.tiny, color: COLORS.muted, align: 'center' });
    addText(`Generated: ${format(new Date(), 'dd-MMM-yyyy')}`, pageWidth - margin, footerY, { fontSize: FONTS.tiny, color: COLORS.muted, align: 'right' });
  };

  // ========== PAGE 1: HEADER ==========
  
  // Top gradient header
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // Secondary gradient overlay
  pdf.setFillColor(99, 102, 241); // Indigo
  pdf.rect(0, 42, pageWidth, 8, 'F');
  
  // Organization Name
  addText(organizationName.toUpperCase(), pageWidth / 2, 15, {
    fontSize: FONTS.title,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'center'
  });
  
  // Branch Name
  if (branchName) {
    addText(branchName, pageWidth / 2, 24, {
      fontSize: FONTS.subtitle,
      fontStyle: 'bold',
      color: [191, 219, 254],
      align: 'center'
    });
  }
  
  // Contact Info
  let contactLine = '';
  if (branchAddress) contactLine += branchAddress;
  if (contactPhone) contactLine += (contactLine ? ' | ' : '') + 'Phone: ' + contactPhone;
  if (contactEmail) contactLine += (contactLine ? ' | ' : '') + contactEmail;
  
  if (contactLine) {
    addText(contactLine, pageWidth / 2, 33, {
      fontSize: FONTS.small,
      color: [191, 219, 254],
      align: 'center'
    });
  }
  
  // Form Title Badge
  addText(formTitle, pageWidth / 2, 47, {
    fontSize: FONTS.sectionTitle,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'center'
  });

  y = 58;

  // ========== PHOTO BOX & APPLICATION INFO ==========
  
  // Application Number Box
  addRoundedRect(margin, y, contentWidth - 45, 18, 2, { fill: COLORS.light, stroke: COLORS.border });
  addText('APPLICATION DETAILS', margin + 4, y + 5, { fontSize: FONTS.tiny, fontStyle: 'bold', color: COLORS.muted });
  addText('Application No:', margin + 4, y + 11, { fontSize: FONTS.small, color: COLORS.dark });
  addDottedLine(margin + 35, y + 11.5, margin + 70, COLORS.lineGray);
  addText('Date:', margin + 80, y + 11, { fontSize: FONTS.small, color: COLORS.dark });
  addDottedLine(margin + 92, y + 11.5, margin + contentWidth - 50, COLORS.lineGray);
  addText(`Academic Session: ${academicSession}`, margin + 4, y + 16, { fontSize: FONTS.small, fontStyle: 'bold', color: COLORS.primary });

  // Photo Box
  const photoBoxX = pageWidth - margin - 38;
  const photoBoxY = y;
  const photoBoxW = 35;
  const photoBoxH = 42;
  
  addRoundedRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 2, { stroke: COLORS.primary, lineWidth: 1 });
  addRoundedRect(photoBoxX + 2, photoBoxY + 2, photoBoxW - 4, photoBoxH - 12, 1.5, { fill: COLORS.light });
  
  // Photo placeholder text
  addText('Paste Recent', photoBoxX + photoBoxW/2, photoBoxY + 15, { 
    fontSize: FONTS.tiny, color: COLORS.muted, align: 'center' 
  });
  addText('Passport Size', photoBoxX + photoBoxW/2, photoBoxY + 19, { 
    fontSize: FONTS.tiny, color: COLORS.muted, align: 'center' 
  });
  addText('Photo Here', photoBoxX + photoBoxW/2, photoBoxY + 23, { 
    fontSize: FONTS.tiny, color: COLORS.muted, align: 'center' 
  });
  addText('(3.5 x 4.5 cm)', photoBoxX + photoBoxW/2, photoBoxY + 27, { 
    fontSize: 6, color: COLORS.muted, align: 'center' 
  });
  addText('PHOTO', photoBoxX + photoBoxW/2, photoBoxY + photoBoxH - 4, { 
    fontSize: FONTS.tiny, fontStyle: 'bold', color: COLORS.primary, align: 'center' 
  });

  y += 47;

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
    const fieldHeight = field.multiline ? 16 : 10;
    checkPageBreak(fieldHeight + 4);
    
    // Field label
    addText(field.label + (field.required ? ' *' : ''), startX, y + 3.5, {
      fontSize: FONTS.label,
      color: field.required ? COLORS.danger : COLORS.text
    });
    
    // Field box with line
    if (field.multiline) {
      // Multiple lines for address/textarea fields
      addDottedLine(startX, y + 8, startX + fieldWidth - 4, COLORS.lineGray);
      addDottedLine(startX, y + 13, startX + fieldWidth - 4, COLORS.lineGray);
    } else {
      // Single line
      addDottedLine(startX, y + 8, startX + fieldWidth - 4, COLORS.lineGray);
    }
    
    return fieldHeight;
  };

  const renderSection = (section) => {
    checkPageBreak(25);
    
    const sectionColor = getSectionColor(section.color);
    
    // Section header
    addRoundedRect(margin, y, contentWidth, 7, 1.5, { fill: sectionColor });
    addText(section.title, margin + 4, y + 5, {
      fontSize: FONTS.label,
      fontStyle: 'bold',
      color: COLORS.white
    });
    y += 10;

    // Render fields in rows
    let rowY = y;
    let rowX = margin + 2;
    let rowHeight = 0;
    
    section.fields.forEach((field, index) => {
      let fieldWidth;
      switch (field.width) {
        case 'full':
          fieldWidth = contentWidth - 4;
          // Start new row if not at beginning
          if (rowX > margin + 10) {
            y = rowY + rowHeight + 2;
            rowY = y;
          }
          rowX = margin + 2;
          break;
        case 'half':
          fieldWidth = (contentWidth - 8) / 2;
          break;
        case 'third':
          fieldWidth = (contentWidth - 12) / 3;
          break;
        default:
          fieldWidth = contentWidth - 4;
      }
      
      // Check if field fits in current row
      if (rowX + fieldWidth > pageWidth - margin - 2 && field.width !== 'full') {
        y = rowY + rowHeight + 2;
        rowY = y;
        rowX = margin + 2;
        rowHeight = 0;
      }
      
      const tempY = y;
      y = rowY;
      const fHeight = renderField(field, rowX, fieldWidth);
      rowHeight = Math.max(rowHeight, fHeight);
      y = tempY;
      
      if (field.width === 'full') {
        y = rowY + rowHeight + 2;
        rowY = y;
        rowX = margin + 2;
        rowHeight = 0;
      } else {
        rowX += fieldWidth + 2;
      }
    });
    
    y = rowY + rowHeight + 8;
  };

  // Render all sections
  FORM_SECTIONS.forEach(section => {
    renderSection(section);
  });

  // ========== DOCUMENTS CHECKLIST ==========
  checkPageBreak(60);
  
  addRoundedRect(margin, y, contentWidth, 7, 1.5, { fill: COLORS.dark });
  addText('DOCUMENTS CHECKLIST (Office Use)', margin + 4, y + 5, {
    fontSize: FONTS.label,
    fontStyle: 'bold',
    color: COLORS.white
  });
  y += 10;

  // Checklist in 2 columns
  const checklistColWidth = (contentWidth - 8) / 2;
  let checkY = y;
  
  DOCUMENTS_CHECKLIST.forEach((doc, index) => {
    const colX = index < 6 ? margin + 4 : margin + checklistColWidth + 8;
    const itemY = index < 6 ? checkY + (index * 7) : checkY + ((index - 6) * 7);
    
    // Checkbox
    addRoundedRect(colX, itemY - 2, 4, 4, 0.5, { stroke: COLORS.border });
    addText(doc, colX + 6, itemY + 1, { fontSize: FONTS.tiny, color: COLORS.text });
  });

  y = checkY + 45;

  // ========== DECLARATION ==========
  checkPageBreak(50);
  
  addRoundedRect(margin, y, contentWidth, 7, 1.5, { fill: [127, 29, 29] }); // Red-900
  addText('DECLARATION BY PARENT/GUARDIAN', margin + 4, y + 5, {
    fontSize: FONTS.label,
    fontStyle: 'bold',
    color: COLORS.white
  });
  y += 10;

  const declarationText = `I hereby declare that all the information provided in this form is true and correct to the best of my knowledge. I understand that providing false information may result in cancellation of admission. I agree to abide by all the rules and regulations of the institution.`;
  
  y = addText(declarationText, margin + 4, y + 4, {
    fontSize: FONTS.small,
    color: COLORS.dark,
    maxWidth: contentWidth - 8
  });
  
  y += 8;

  // Signature boxes
  const sigBoxWidth = (contentWidth - 12) / 3;
  
  addRoundedRect(margin, y, sigBoxWidth, 22, 1.5, { stroke: COLORS.border });
  addText('Father\'s Signature', margin + sigBoxWidth/2, y + 4, { fontSize: FONTS.tiny, color: COLORS.muted, align: 'center' });
  addDottedLine(margin + 8, y + 17, margin + sigBoxWidth - 8, COLORS.lineGray);

  addRoundedRect(margin + sigBoxWidth + 4, y, sigBoxWidth, 22, 1.5, { stroke: COLORS.border });
  addText('Mother\'s Signature', margin + sigBoxWidth + 4 + sigBoxWidth/2, y + 4, { fontSize: FONTS.tiny, color: COLORS.muted, align: 'center' });
  addDottedLine(margin + sigBoxWidth + 12, y + 17, margin + sigBoxWidth * 2 - 4, COLORS.lineGray);

  addRoundedRect(margin + sigBoxWidth * 2 + 8, y, sigBoxWidth, 22, 1.5, { stroke: COLORS.border });
  addText('Date', margin + sigBoxWidth * 2 + 8 + sigBoxWidth/2, y + 4, { fontSize: FONTS.tiny, color: COLORS.muted, align: 'center' });
  addDottedLine(margin + sigBoxWidth * 2 + 16, y + 17, pageWidth - margin - 8, COLORS.lineGray);

  y += 28;

  // ========== OFFICE USE ONLY ==========
  checkPageBreak(40);
  
  addRoundedRect(margin, y, contentWidth, 7, 1.5, { fill: COLORS.muted });
  addText('FOR OFFICE USE ONLY', margin + 4, y + 5, {
    fontSize: FONTS.label,
    fontStyle: 'bold',
    color: COLORS.white
  });
  y += 10;

  const officeFields = [
    'Admission No:',
    'Class Allotted:',
    'Section:',
    'Roll No:',
    'Fee Receipt No:',
    'Verified By:',
  ];
  
  const officeFieldWidth = (contentWidth - 12) / 3;
  officeFields.forEach((field, index) => {
    const colX = margin + (index % 3) * (officeFieldWidth + 4);
    const rowY = y + Math.floor(index / 3) * 10;
    addText(field, colX, rowY + 4, { fontSize: FONTS.small, color: COLORS.dark });
    addDottedLine(colX + 30, rowY + 4.5, colX + officeFieldWidth - 4, COLORS.lineGray);
  });

  y += 25;

  // Final signature
  addText('Principal / Admin Signature:', margin + 4, y + 4, { fontSize: FONTS.small, color: COLORS.dark });
  addDottedLine(margin + 55, y + 4.5, margin + 100, COLORS.lineGray);
  addText('Date:', margin + 105, y + 4, { fontSize: FONTS.small, color: COLORS.dark });
  addDottedLine(margin + 118, y + 4.5, pageWidth - margin - 8, COLORS.lineGray);
  
  addText('Seal:', pageWidth - margin - 25, y + 4, { fontSize: FONTS.small, color: COLORS.dark });

  // Add footer
  addFooter();

  // ========== DOWNLOAD ==========
  const fileName = `Admission_Form_${branchName || organizationName}_${format(new Date(), 'yyyy')}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};

export default generateAdmissionFormPDF;
