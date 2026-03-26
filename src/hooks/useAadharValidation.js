import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useAadharValidation = (initialError = '') => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(initialError);
  const [duplicateDetails, setDuplicateDetails] = useState(null); // Store full duplicate info
  const validationTimeout = useRef(null);

  const validateAadhar = useCallback((aadharNumber, currentStudentId = null, organizationId = null) => {
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
        // Check in student_profiles table - ONLY within same organization
        let query = supabase
          .from('student_profiles')
          .select(`
            id, 
            first_name, 
            last_name, 
            full_name,
            enrollment_id,
            organization_id,
            organizations:organization_id (id, name, code),
            branches:branch_id (id, branch_name, branch_code)
          `)
          .eq('aadhar_no', aadharNumber);
        
        // ?? IMPORTANT: Only check duplicates within SAME organization
        if (organizationId) {
          query = query.eq('organization_id', organizationId);
        }
        
        query = query.limit(1);
        
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
          const branchName = student.branches?.branch_name || 'Unknown';
          
          // Store duplicate details for display
          setDuplicateDetails({
            studentName,
            enrollmentId: student.enrollment_id,
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
