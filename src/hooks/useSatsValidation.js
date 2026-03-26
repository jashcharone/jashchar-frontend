import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook for validating SATS Number (Student Achievement Tracking System)
 * Karnataka Government student tracking number - must be unique across all organizations
 */
export const useSatsValidation = (initialError = '') => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(initialError);
  const [duplicateDetails, setDuplicateDetails] = useState(null);
  const validationTimeout = useRef(null);

  const validateSatsNo = useCallback((satsNumber, currentStudentId = null) => {
    clearTimeout(validationTimeout.current);
    setError('');
    setDuplicateDetails(null);

    // SATS number is optional - don't validate empty
    if (!satsNumber || satsNumber.trim() === '') {
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    validationTimeout.current = setTimeout(async () => {
      try {
        // Check in student_profiles table - SATS must be unique GLOBALLY (all organizations)
        // because it's a government-issued number
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
          .eq('sats_no', satsNumber.toUpperCase())
          .limit(1);
        
        // Exclude current student (for edit mode)
        if (currentStudentId) {
          query = query.neq('id', currentStudentId);
        }
        
        const { data, error: dbError } = await query;
        
        if (dbError) {
          console.error('[SATS Validation] DB Error:', dbError);
          setError('Error checking SATS number');
          setIsChecking(false);
          return;
        }
        
        if (data && data.length > 0) {
          const duplicate = data[0];
          const studentName = duplicate.full_name || `${duplicate.first_name || ''} ${duplicate.last_name || ''}`.trim() || 'Unknown';
          const branchName = duplicate.branches?.branch_name || 'Unknown Branch';
          const orgName = duplicate.organizations?.name || 'Unknown Org';
          
          setDuplicateDetails({
            studentId: duplicate.id,
            studentName,
            schoolCode: duplicate.enrollment_id,
            branchName,
            orgName
          });
          
          setError(`SATS Number already assigned to ${studentName} (${duplicate.enrollment_id}) at ${branchName}`);
        } else {
          setError('');
          setDuplicateDetails(null);
        }
      } catch (err) {
        console.error('[SATS Validation] Error:', err);
        setError('Error validating SATS number');
      } finally {
        setIsChecking(false);
      }
    }, 500); // Debounce 500ms
  }, []);

  const clearError = useCallback(() => {
    setError('');
    setDuplicateDetails(null);
  }, []);

  return {
    isChecking,
    error,
    duplicateDetails,
    validateSatsNo,
    clearError
  };
};
