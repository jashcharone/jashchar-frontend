import { v4 as uuidv4 } from 'uuid';

const generateRandomSuffix = () => {
    return Math.floor(Math.random() * 1000000).toString(36);
};

export const generateDemoData = (scenario = 'standard') => {
  const timestamp = new Date().getTime();
  const randomSuffix = generateRandomSuffix();
  const sessionName = `DEMO_SESSION_${new Date().getFullYear()}_${timestamp}`; // Unique session per run
  
  // Generate robust unique school email to avoid collisions on rapid retries
  const schoolEmail = `demo.school.${timestamp}.${randomSuffix}@jashchar.com`;

  let classes = [];
  let subjects = [];

  if (scenario === 'primary') {
      classes = [{ name: 'Class 1' }, { name: 'Class 2' }, { name: 'Class 3' }, { name: 'Class 4' }, { name: 'Class 5' }];
      subjects = [
          { name: 'Mathematics', type: 'Theory', code: 'MTH_PRI' },
          { name: 'English', type: 'Theory', code: 'ENG_PRI' },
          { name: 'Environmental Science', type: 'Theory', code: 'EVS_PRI' },
          { name: 'Arts', type: 'Practical', code: 'ART_PRI' }
      ];
  } else if (scenario === 'coaching') {
      classes = [{ name: 'Batch A (Morning)' }, { name: 'Batch B (Evening)' }, { name: 'Crash Course' }];
      subjects = [
          { name: 'Physics', type: 'Theory', code: 'PHY_JEE' },
          { name: 'Chemistry', type: 'Theory', code: 'CHEM_JEE' },
          { name: 'Mathematics', type: 'Theory', code: 'MATH_JEE' }
      ];
  } else {
      // Standard High School
      classes = [{ name: 'Class 1' }, { name: 'Class 2' }, { name: 'Class 10' }];
      subjects = [
          { name: 'Mathematics', type: 'Theory', code: 'MTH101' },
          { name: 'Science', type: 'Theory', code: 'SCI101' },
          { name: 'English', type: 'Theory', code: 'ENG101' },
          { name: 'Social Studies', type: 'Theory', code: 'SST101' },
          { name: 'Computer', type: 'Practical', code: 'CMP101' }
      ];
  }

  return {
    school: {
      name: `Jashchar Demo School (Automation) ${scenario.toUpperCase()} ${timestamp}`,
      email: schoolEmail,
      code: `DEMO_${timestamp}`,
      address: '123 Innovation Drive, Tech Park, Cyber City',
      phone: '9876543210',
      password: 'password123',
      sessionName: sessionName
    },
    classes: classes,
    sections: [
      { name: 'A' }, 
      { name: 'B' }
    ],
    subjects: subjects,
    departments: ['Academic', 'Administration', 'Support Staff'],
    designations: ['Teacher', 'Accountant', 'Receptionist'],
    staff: [
      { name: 'John Doe', email: `john${timestamp}${randomSuffix}@gmail.com`, role: 'Teacher' },
      { name: 'Jane Smith', email: `jane${timestamp}${randomSuffix}@gmail.com`, role: 'Teacher' },
      { name: 'Robert Brown', email: `rob${timestamp}${randomSuffix}@gmail.com`, role: 'Accountant' },
      { name: 'Emily Davis', email: `emily${timestamp}${randomSuffix}@gmail.com`, role: 'Receptionist' },
      { name: 'Michael Wilson', email: `mike${timestamp}${randomSuffix}@gmail.com`, role: 'Teacher' }
    ],
    studentCategories: ['General', 'OBC', 'SC/ST'],
    houses: ['Red House', 'Blue House', 'Green House', 'Yellow House'],
    students: Array.from({ length: 5 }).map((_, i) => {
        const studentSuffix = Math.floor(Math.random() * 1000000).toString(36);
        return {
          firstName: ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayan', 'Krishna', 'Ishaan'][i] || `Student${i}`,
          lastName: ['Sharma', 'Verma', 'Gupta', 'Mehta', 'Singh', 'Patel', 'Kumar', 'Das', 'Reddy', 'Nair'][i] || `Test`,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          // High-entropy email generation to prevent 'duplicate key' errors
          email: `student${i}${timestamp}${studentSuffix}@gmail.com`,
          guardianEmail: `parent${i}${timestamp}${studentSuffix}@gmail.com`,
          username: `usr${i}_${timestamp}_${studentSuffix}`,
          guardianUsername: `par${i}_${timestamp}_${studentSuffix}`,
          password: 'password123',
          rollNumber: (100 + i).toString()
        };
    }),
    feeGroups: ['Tuition Fees', 'Exam Fees'],
    feeTypes: [
      { name: 'Monthly Tuition', code: 'MTH_TUIT' },
      { name: 'Term 1 Exam', code: 'TERM1' },
      { name: 'Transport', code: 'TRANS' }
    ],
    expenseHeads: ['Electricity Bill', 'Stationery', 'Maintenance'],
    incomeHeads: ['Donations', 'Grant', 'Hall Rental'],
    hostels: [
        { name: 'Boys Hostel A', type: 'Boys' },
        { name: 'Girls Hostel B', type: 'Girls' }
    ],
    roomTypes: [
        { name: 'Single AC', description: 'Single bed with AC' },
        { name: 'Double Non-AC', description: 'Double bed without AC' }
    ],
    transportRoutes: [
        { title: 'Route 1 - City Center', fare: 1500 },
        { title: 'Route 2 - Suburbs', fare: 2000 }
    ],
    vehicles: [
        { vehicle_no: 'KA-01-AB-1234', driver_name: 'Ramesh', driver_contact: '9988776655' },
        { vehicle_no: 'KA-02-CD-5678', driver_name: 'Suresh', driver_contact: '8877665544' }
    ],
    items: [
      { name: 'Chalk Box', unit: 'Box' },
      { name: 'Duster', unit: 'Pcs' },
      { name: 'A4 Paper Rim', unit: 'Rim' },
      { name: 'Whiteboard Marker', unit: 'Pcs' },
      { name: 'Notebook', unit: 'Pcs' }
    ],
    books: [
      { title: 'Mathematics Vol 1', author: 'R.D. Sharma' },
      { title: 'Concepts of Physics', author: 'H.C. Verma' },
      { title: 'History of India', author: 'Bipin Chandra' },
      { title: 'World Geography', author: 'Majid Husain' },
      { title: 'English Grammar', author: 'Wren & Martin' },
      { title: 'Organic Chemistry', author: 'Morrison & Boyd' },
      { title: 'Biology Today', author: 'Trueman' },
      { title: 'Computer Science', author: 'Sumita Arora' },
      { title: 'Macro Economics', author: 'Sandeep Garg' },
      { title: 'Business Studies', author: 'T.R. Jain' }
    ]
  };
};
