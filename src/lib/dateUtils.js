import { format, parse, isValid } from 'date-fns';

// --- DATE FORMATTING (DD-MM-YYYY) ---

export const DATE_FORMAT = 'dd-MM-yyyy';
export const TIME_FORMAT = 'hh:mm:ss a'; // 12-hour format with AM/PM

export const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (!isValid(d)) return '';
    return format(d, DATE_FORMAT);
  } catch (e) {
    return '';
  }
};

export const formatTime = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (!isValid(d)) return '';
    return format(d, TIME_FORMAT);
  } catch (e) {
    return '';
  }
};

export const formatDateTime = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (!isValid(d)) return '';
      return format(d, `${DATE_FORMAT} ${TIME_FORMAT}`);
    } catch (e) {
      return '';
    }
};

// Parse DD-MM-YYYY string back to Date object
export const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
        const parsed = parse(dateString, DATE_FORMAT, new Date());
        if (isValid(parsed)) return parsed;
        return null;
    } catch (e) {
        return null;
    }
};

// --- ADDRESS UTILS ---

export const isValidPinCode = (pin) => {
    return /^[1-9][0-9]{5}$/.test(pin);
};
