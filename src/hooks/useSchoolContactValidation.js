import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useSchoolContactValidation = () => {
  const [checkingField, setCheckingField] = useState(null); // 'email' | 'phone' | null
  const [errors, setErrors] = useState({ email: '', phone: '' });
  const validationTimeout = useRef(null);

  const validateContact = useCallback((field, value) => {
    // Clear previous timeout
    if (validationTimeout.current) {
        clearTimeout(validationTimeout.current);
    }
    
    // Reset error for this field immediately
    setErrors(prev => ({ ...prev, [field]: '' }));

    if (!value) return;

    // Basic format validation
    if (field === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
        // Optional: setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
        return;
    }
    
    // Only check phone if it's 10 digits
    if (field === 'phone' && value.length !== 10) {
         return; 
    }

    setCheckingField(field);

    validationTimeout.current = setTimeout(async () => {
      try {
        let query = supabase.from('schools').select('id');
        
        if (field === 'email') {
            query = query.eq('contact_email', value);
        } else if (field === 'phone') {
            // We assume the DB stores it with +91 prefix
            const formatted = `+91${value}`;
            query = query.eq('contact_number', formatted);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Validation error:", error);
        } else if (data && data.length > 0) {
            setErrors(prev => ({ 
                ...prev, 
                [field]: `This ${field === 'email' ? 'email' : 'mobile number'} is already registered.` 
            }));
        }
      } catch (e) {
        console.error("Validation failed:", e);
      } finally {
        setCheckingField(null);
      }
    }, 800); // Debounce 800ms
  }, []);

  return { checkingField, errors, validateContact, setErrors };
};
