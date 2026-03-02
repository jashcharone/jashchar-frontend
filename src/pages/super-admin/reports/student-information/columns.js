/**
 * Student Information Report - Column Definitions
 * All possible columns for student reports
 */

export const STUDENT_COLUMNS = [
  // Basic Identity
  { key: 'admission_number', label: 'Adm. No', type: 'string', width: 100, groupable: false },
  { key: 'first_name', label: 'First Name', type: 'string', width: 120, groupable: false },
  { key: 'last_name', label: 'Last Name', type: 'string', width: 100, groupable: false },
  {
    key: 'full_name',
    label: 'Full Name',
    type: 'computed',
    width: 180,
    render: (_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-'
  },
  { key: 'gender', label: 'Gender', type: 'badge', width: 80, groupable: true },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date', width: 110 },
  {
    key: 'age',
    label: 'Age',
    type: 'computed',
    width: 60,
    render: (_, row) => {
      if (!row.date_of_birth) return '-';
      const dob = new Date(row.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      if (today.getMonth() < dob.getMonth() || 
          (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    }
  },
  { key: 'photo_url', label: 'Photo', type: 'image', width: 60 },
  { key: 'status', label: 'Status', type: 'badge', width: 90, groupable: true },

  // Academic
  { key: 'class.name', label: 'Class', type: 'string', width: 80, groupable: true },
  { key: 'section.name', label: 'Section', type: 'string', width: 70, groupable: true },
  { key: 'roll_number', label: 'Roll No', type: 'string', width: 70 },
  { key: 'admission_date', label: 'Admission Date', type: 'date', width: 120 },
  { key: 'session.session_name', label: 'Session', type: 'string', width: 100, groupable: true },

  // Parent Details
  { key: 'father_name', label: 'Father Name', type: 'string', width: 150 },
  { key: 'father_phone', label: 'Father Phone', type: 'phone', width: 120 },
  { key: 'father_email', label: 'Father Email', type: 'email', width: 180 },
  { key: 'father_occupation', label: 'Father Occupation', type: 'string', width: 140 },
  { key: 'mother_name', label: 'Mother Name', type: 'string', width: 150 },
  { key: 'mother_phone', label: 'Mother Phone', type: 'phone', width: 120 },
  { key: 'mother_occupation', label: 'Mother Occupation', type: 'string', width: 140 },
  { key: 'guardian_name', label: 'Guardian Name', type: 'string', width: 150 },
  { key: 'guardian_phone', label: 'Guardian Phone', type: 'phone', width: 120 },
  { key: 'guardian_relation', label: 'Guardian Relation', type: 'string', width: 120 },

  // Contact
  { key: 'phone', label: 'Primary Phone', type: 'phone', width: 120 },
  { key: 'email', label: 'Email', type: 'email', width: 180 },
  { key: 'alternate_phone', label: 'Alt. Phone', type: 'phone', width: 120 },
  { key: 'emergency_contact', label: 'Emergency Contact', type: 'phone', width: 130 },

  // Address
  { key: 'address', label: 'Address', type: 'string', width: 250 },
  { key: 'city', label: 'City', type: 'string', width: 120, groupable: true },
  { key: 'state', label: 'State', type: 'string', width: 100, groupable: true },
  { key: 'pincode', label: 'Pincode', type: 'string', width: 80, groupable: true },
  { key: 'country', label: 'Country', type: 'string', width: 100, groupable: true },

  // Demographics
  { key: 'blood_group', label: 'Blood Group', type: 'badge', width: 90, groupable: true },
  { key: 'religion', label: 'Religion', type: 'string', width: 100, groupable: true },
  { key: 'caste', label: 'Caste', type: 'string', width: 100, groupable: true },
  { key: 'category', label: 'Category', type: 'string', width: 100, groupable: true },
  { key: 'sub_category', label: 'Sub Category', type: 'string', width: 100, groupable: true },
  { key: 'nationality', label: 'Nationality', type: 'string', width: 100, groupable: true },
  { key: 'mother_tongue', label: 'Mother Tongue', type: 'string', width: 110, groupable: true },

  // Documents
  { key: 'aadhar_number', label: 'Aadhar No', type: 'string', width: 130 },
  { key: 'birth_certificate_no', label: 'Birth Cert No', type: 'string', width: 130 },
  { key: 'previous_school', label: 'Previous School', type: 'string', width: 200 },
  { key: 'previous_class', label: 'Previous Class', type: 'string', width: 100 },
  { key: 'tc_number', label: 'TC Number', type: 'string', width: 120 },
  { key: 'tc_date', label: 'TC Date', type: 'date', width: 110 },

  // Medical
  { key: 'height', label: 'Height (cm)', type: 'number', width: 90 },
  { key: 'weight', label: 'Weight (kg)', type: 'number', width: 90 },
  { key: 'medical_conditions', label: 'Medical Conditions', type: 'string', width: 180 },
  { key: 'allergies', label: 'Allergies', type: 'string', width: 150 },

  // Additional
  { key: 'house', label: 'House', type: 'string', width: 100, groupable: true },
  { key: 'transport_user', label: 'Transport User', type: 'boolean', width: 100 },
  { key: 'hostel_user', label: 'Hostel User', type: 'boolean', width: 100 },
  { key: 'is_rte', label: 'RTE', type: 'boolean', width: 70, groupable: true },
  { key: 'scholarship_type', label: 'Scholarship', type: 'string', width: 120, groupable: true },
  { key: 'medium', label: 'Medium', type: 'string', width: 90, groupable: true },
  { key: 'shift', label: 'Shift', type: 'string', width: 80, groupable: true },

  // System
  { key: 'created_at', label: 'Created', type: 'datetime', width: 140 },
  { key: 'updated_at', label: 'Updated', type: 'datetime', width: 140 },
  
  // Computed: Counts for strength reports
  { key: 'boys_count', label: 'Boys', type: 'number', width: 70 },
  { key: 'girls_count', label: 'Girls', type: 'number', width: 70 },
  { key: 'total_count', label: 'Total', type: 'number', width: 70 },
];

// Get column by key
export const getColumn = (key) => STUDENT_COLUMNS.find(c => c.key === key);

// Get columns by keys
export const getColumns = (keys) => keys.map(getColumn).filter(Boolean);

// Predefined column sets
export const COLUMN_SETS = {
  basic: ['admission_number', 'full_name', 'class.name', 'section.name', 'father_name', 'phone'],
  complete: STUDENT_COLUMNS.filter(c => c.type !== 'computed').map(c => c.key),
  contact: ['admission_number', 'full_name', 'class.name', 'phone', 'email', 'father_phone', 'mother_phone', 'emergency_contact'],
  address: ['admission_number', 'full_name', 'class.name', 'address', 'city', 'state', 'pincode'],
  demographics: ['admission_number', 'full_name', 'class.name', 'gender', 'date_of_birth', 'blood_group', 'religion', 'caste', 'category'],
  documents: ['admission_number', 'full_name', 'class.name', 'aadhar_number', 'birth_certificate_no', 'tc_number', 'tc_date'],
  strength: ['class.name', 'section.name', 'boys_count', 'girls_count', 'total_count'],
};

export default STUDENT_COLUMNS;
