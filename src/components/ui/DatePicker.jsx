import React, { useState, useEffect } from 'react';
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

  // Sync prop value to internal state
  useEffect(() => {
    if (value) {
      // Parse the YYYY-MM-DD string into a local Date object
      const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
      
      if (isValid(parsedDate)) {
        setDate(parsedDate);
        setInputValue(format(parsedDate, 'dd-MM-yyyy'));
        setError(false);
      } else {
        setDate(null);
        setInputValue("");
      }
    } else {
        // Only clear if value is strictly null/empty to allow controlled components to reset
        setDate(null);
        setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // Basic format check: DD-MM-YYYY
    // We allow partial typing, but only validate and set upon completion or match
    if (val.trim() === "") {
        onChange && onChange(null);
        setError(false);
        return;
    }

    // Try parsing
    const parsed = parse(val, 'dd-MM-yyyy', new Date());
    
    if (isValid(parsed) && val.length === 10) {
        // Valid date string length and parsing
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
        // Don't error immediately while typing, but if we wanted strict blur validation we could do it there.
        // For now, we just don't update the parent 'onChange' with an invalid date
        if (val.length === 10 && !isValid(parsed)) {
            setError(true);
        } else {
            setError(false);
        }
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
