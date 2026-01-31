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

const AadharInput = ({ value, onChange, label, required, checkDuplicates = false, initialError = '', hideLabel = false, className }) => {
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
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .eq('aadhar_no', aadharNumber)
        .limit(1)
        .maybeSingle();

      if (dbError) {
        throw dbError;
      }

      if (data) {
        setError('This Aadhar number already exists.');
      } else {
        setError('');
      }
    } catch (e) {
      console.error('Aadhar validation error:', e);
      // Don't show technical errors to the user
    } finally {
      setIsChecking(false);
    }
  }, [checkDuplicates]);

  useEffect(() => {
    // This effect ensures that if an initial error is passed, it is displayed.
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, '').slice(0, 12);
    
    setFormattedValue(formatAadhar(rawValue));
    onChange(numericValue);

    if (checkDuplicates) {
      clearTimeout(debounceTimeout.current);
      setError(''); // Clear previous errors on new input
      if (numericValue.length === 12) {
        debounceTimeout.current = setTimeout(() => {
          validateAadhar(numericValue);
        }, 800);
      }
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
