import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useAadharValidation = (initialError = '') => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(initialError);
  const [duplicateDetails, setDuplicateDetails] = useState(null); // Store full duplicate info
  const validationTimeout = useRef(null);

  const validateAadhar = useCallback((aadharNumber, currentStudentId = null) => {
    clearTimeout(validationTimeout.current);
    setError('');
    setDuplicateDetails(null);

    if (!aadharNumber || aadharNumber.length !== 12) {
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    validationTimeout.current = setTimeout(async () => {
      try {
        // Check in student_profiles table with organization & branch details
        let query = supabase
          .from('student_profiles')
          .select(`
            id, 
            first_name, 
            last_name, 
            full_name,
            school_code,
            organizations:organization_id (id, name, code),
            branches:branch_id (id, name, code)
          `)
          .eq('aadhar_no', aadharNumber)
          .limit(1);
        
        // Exclude current student (for edit mode)
        if (currentStudentId) {
          query = query.neq('id', currentStudentId);
        }
        
        const { data, error: dbError } = await query;

        if (dbError) {
          console.error("Aadhar validation error:", dbError);
          // Don't set error message if it's a schema issue - just log it
        } else if (data && data.length > 0) {
          const student = data[0];
          const studentName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
          const orgName = student.organizations?.name || 'Unknown';
          const branchName = student.branches?.name || 'Unknown';
          
          // Store duplicate details for display
          setDuplicateDetails({
            studentName,
            admissionNo: student.school_code,
            organizationName: orgName,
            branchName: branchName
          });
          
          // Error message with branch info
          setError(`This Aadhar number is already registered to ${studentName || 'another student'}. (${branchName})`);
        } else {
          setError('');
          setDuplicateDetails(null);
        }
      } catch (e) {
        console.error("Aadhar validation failed:", e);
      } finally {
        setIsChecking(false);
      }
    }, 800); // 800ms debounce
  }, []);
  
  const resetValidation = useCallback(() => {
      clearTimeout(validationTimeout.current);
      setIsChecking(false);
      setError('');
      setDuplicateDetails(null);
  }, []);

  return { isChecking, error, duplicateDetails, validateAadhar, setError: setError, resetValidation };
};
