import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const formatAadhar = (value) => {
  const numericValue = value.replace(/\D/g, '');
  const trimmedValue = numericValue.slice(0, 12);
  const parts = [];
  for (let i = 0; i < trimmedValue.length; i += 4) {
    parts.push(trimmedValue.slice(i, i + 4));
  }
  return parts.join(' ');
};

const AadharInput = ({ value, onChange, label, required, checkDuplicates = false, organizationId = null, initialError = '', hideLabel = false, className }) => {
  const [formattedValue, setFormattedValue] = useState(formatAadhar(value || ''));
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(initialError);
  const debounceTimeout = useRef(null);

  const validateAadhar = useCallback(async (aadharNumber) => {
    if (!checkDuplicates || aadharNumber.length !== 12) {
      setError('');
      setIsChecking(false);
      return;
    }
    setIsChecking(true);
    try {
      // Check in student_profiles table - ONLY within same organization
      let query = supabase
        .from('student_profiles')
        .select(`
          id, 
          first_name, 
          last_name,
          full_name,
          organizations:organization_id (name),
          branches:branch_id (branch_name)
        `)
        .eq('aadhar_no', aadharNumber);
      
      // ?? IMPORTANT: Only check duplicates within SAME organization
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error: dbError } = await query.limit(1).maybeSingle();

      if (dbError) {
        throw dbError;
      }

      if (data) {
        const studentName = data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim();
        const branchName = data.branches?.branch_name || '';
        setError(`This Aadhar number is already registered to ${studentName || 'another student'} (${branchName}).`);
      } else {
        setError('');
      }
    } catch (e) {
      console.error('Aadhar validation error:', e);
      // Don't show technical errors to the user
    } finally {
      setIsChecking(false);
    }
  }, [checkDuplicates, organizationId]);

  useEffect(() => {
    // This effect ensures that if an initial error is passed, it is displayed.
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  // Sync formattedValue when external value prop changes (e.g., form reset)
  useEffect(() => {
    const newFormatted = formatAadhar(value || '');
    if (newFormatted !== formattedValue) {
      setFormattedValue(newFormatted);
      // Also clear error when value is cleared externally
      if (!value) {
        setError('');
      }
    }
  }, [value]);

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, '').slice(0, 12);
    
    setFormattedValue(formatAadhar(rawValue));
    onChange(numericValue);

    // Clear length error when user starts typing valid digits
    if (numericValue.length === 12) {
      setError('');
    }

    if (checkDuplicates) {
      clearTimeout(debounceTimeout.current);
      if (numericValue.length === 12) {
        debounceTimeout.current = setTimeout(() => {
          validateAadhar(numericValue);
        }, 800);
      }
    }
  };

  // TC-70 FIX: Validate on blur to show error for invalid length
  const handleBlur = () => {
    const numericValue = (value || '').replace(/\D/g, '');
    // Only validate if user has entered some digits (not empty)
    if (numericValue.length > 0 && numericValue.length !== 12) {
      setError('12-digit Aadhaar number is required');
    }
  };

  return (
    <div>
      {!hideLabel && label && <Label htmlFor={`aadhar-${label}`} required={required}>{label}</Label>}
      <div className="relative">
        <Input
          id={`aadhar-${label || 'input'}`}
          type="text"
          value={formattedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="xxxx xxxx xxxx"
          maxLength={14} // 12 digits + 2 spaces
          className={cn(className, error && "border-destructive")}
        />
        {isChecking && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default AadharInput;
