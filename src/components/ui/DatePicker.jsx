import React, { useState, useEffect, useRef } from 'react';
import { format, isValid, isAfter, startOfToday, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

export function DatePicker({ value, onChange, className, disabled, id, required, label, disableFuture, disablePast }) {
  const [date, setDate] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(false);
  const prevValueRef = useRef(value);
  const isInitializedRef = useRef(false);

  // Sync prop value to internal state - only when value actually changes
  useEffect(() => {
    // Skip if value hasn't changed
    if (isInitializedRef.current && prevValueRef.current === value) {
      return;
    }
    prevValueRef.current = value;
    isInitializedRef.current = true;
    
    if (value) {
      // Parse the YYYY-MM-DD string into a local Date object
      const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
      
      if (isValid(parsedDate)) {
        const newInputValue = format(parsedDate, 'dd-MM-yyyy');
        // Only update if different to prevent cursor issues
        if (inputValue !== newInputValue) {
          setDate(parsedDate);
          setInputValue(newInputValue);
        }
        setError(false);
      } else {
        setDate(null);
        setInputValue("");
      }
    } else {
        setDate(null);
        setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e) => {
    let val = e.target.value;
    
    // Allow user to delete completely
    if (val === "") {
        setInputValue("");
        onChange && onChange(null);
        setError(false);
        return;
    }

    // Auto-format logic: DD-MM-YYYY
    // 1. Remove non-numeric characters except existing hyphens if user typed them
    const numericOnly = val.replace(/\D/g, '');
    
    // 2. Logic to construct dd-mm-yyyy
    let formatted = numericOnly;
    if (numericOnly.length > 2) {
      formatted = `${numericOnly.slice(0, 2)}-${numericOnly.slice(2)}`;
    }
    if (numericOnly.length > 4) {
      formatted = `${numericOnly.slice(0, 2)}-${numericOnly.slice(2, 4)}-${numericOnly.slice(4, 8)}`;
    }
    
    // Update input value with formatting
    setInputValue(formatted);

    // 3. Validation
    // Only validate if we have a full date (10 chars: dd-mm-yyyy)
    if (formatted.length === 10) {
        const parsed = parse(formatted, 'dd-MM-yyyy', new Date());
        
        if (isValid(parsed)) {
             // Valid date
            if (disableFuture && isAfter(parsed, startOfToday())) {
                setError(true);
                return;
            }
            if (disablePast && parsed < startOfToday()) {
                 setError(true);
                 return;
            }
            
            setDate(parsed);
            setError(false);
            onChange && onChange(format(parsed, 'yyyy-MM-dd'));
        } else {
             // Invalid date (e.g. 99-99-2022)
             setError(true);
        }
    } else {
        // Incomplete date
        setError(false); // Can change to true if you want to show error while typing
    }
  };

  const handleCalendarSelect = (selectedDate) => {
    if (selectedDate) {
        const formattedDisplay = format(selectedDate, 'dd-MM-yyyy');
        setInputValue(formattedDisplay);
        setDate(selectedDate);
        setError(false);
        
        // Output YYYY-MM-DD
        onChange && onChange(format(selectedDate, 'yyyy-MM-dd'));
    } else {
        // Deselection?
    }
    setIsOpen(false);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      {label && <Label htmlFor={id} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>{label}</Label>}
      <div className="relative flex items-center">
            <Input
                id={id}
                type="text"
                placeholder="DD-MM-YYYY"
                value={inputValue}
                onChange={handleInputChange}
                disabled={disabled}
                className={cn("pr-10", error && "border-red-500 focus-visible:ring-red-500")}
                autoComplete="off"
                maxLength={10}
            />
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 h-full w-10 text-muted-foreground hover:bg-transparent hover:text-foreground"
                        disabled={disabled}
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleCalendarSelect}
                        disabled={(date) => {
                            if (disableFuture && isAfter(date, startOfToday())) return true;
                            if (disablePast && date < startOfToday()) return true;
                            return false;
                        }}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear() + 5}
                    />
                </PopoverContent>
            </Popover>
      </div>
      {error && <p className="text-[0.8rem] text-red-500">Invalid date format (DD-MM-YYYY)</p>}
    </div>
  );
}

export default DatePicker;
