/**
 * JASHCHAR ERP - Centralized Date Formatting Utilities
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🚨 PROJECT-WIDE STANDARD: DD-MM-YYYY format for all dates
 * 
 * This utility MUST be used for ALL date formatting across the entire project.
 * DO NOT use toLocaleDateString() or other date formatting methods directly.
 * 
 * Usage:
 *   import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';
 *   
 *   formatDate('2026-02-10')        // Returns: "10-02-2026"
 *   formatDateTime('2026-02-10')    // Returns: "10-02-2026 02:30 PM"
 *   formatTime('2026-02-10T14:30')  // Returns: "02:30 PM"
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Format date to DD-MM-YYYY format
 * @param {string|Date|null|undefined} date - Date to format
 * @param {string} fallback - Fallback value if date is invalid (default: '-')
 * @returns {string} Formatted date string in DD-MM-YYYY format
 */
export const formatDate = (date, fallback = '-') => {
  if (!date) return fallback;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
};

/**
 * Format date to DD-MM-YYYY HH:MM AM/PM format
 * @param {string|Date|null|undefined} date - Date to format
 * @param {string} fallback - Fallback value if date is invalid (default: '-')
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date, fallback = '-') => {
  if (!date) return fallback;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return fallback;
  }
};

/**
 * Format time to HH:MM AM/PM format
 * @param {string|Date|null|undefined} date - Date/time to format
 * @param {string} fallback - Fallback value if time is invalid (default: '-')
 * @returns {string} Formatted time string
 */
export const formatTime = (date, fallback = '-') => {
  if (!date) return fallback;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${hoursStr}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Time formatting error:', error);
    return fallback;
  }
};

/**
 * Format date for input fields (YYYY-MM-DD format required by HTML date inputs)
 * @param {string|Date|null|undefined} date - Date to format
 * @returns {string} Formatted date string in YYYY-MM-DD format for inputs
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '';
  }
};

/**
 * Parse DD-MM-YYYY string to Date object
 * @param {string} dateStr - Date string in DD-MM-YYYY format
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export const parseDDMMYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  
  return date;
};

/**
 * Get relative date string (Today, Yesterday, X days ago, etc.)
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative date string
 */
export const getRelativeDate = (date) => {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === -1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays < -1 && diffDays >= -7) return `In ${Math.abs(diffDays)} days`;
    
    return formatDate(date);
  } catch (error) {
    return formatDate(date);
  }
};

/**
 * Format date with month name (e.g., "10 Feb 2026")
 * @param {string|Date} date - Date to format
 * @param {string} fallback - Fallback value
 * @returns {string} Formatted date with month name
 */
export const formatDateWithMonthName = (date, fallback = '-') => {
  if (!date) return fallback;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    return fallback;
  }
};

/**
 * Format date range (e.g., "10-02-2026 to 15-02-2026")
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start === '-' && end === '-') return '-';
  if (start === '-') return `Until ${end}`;
  if (end === '-') return `From ${start}`;
  
  return `${start} to ${end}`;
};

/**
 * Format long date with weekday (e.g., "Wednesday, 24 March 2026")
 * Used for dashboard headers
 * @param {string|Date} date - Date to format
 * @param {string} fallback - Fallback value
 * @returns {string} Formatted long date
 */
export const formatLongDate = (date, fallback = '-') => {
  if (!date) return fallback;
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (error) {
    return fallback;
  }
};

/**
 * Format day and month only (e.g., "10 Feb")
 * Used for notices, events without year
 * @param {string|Date} date - Date to format
 * @param {string} fallback - Fallback value
 * @returns {string} Formatted day-month
 */
export const formatDayMonth = (date, fallback = '-') => {
  if (!date) return fallback;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch (error) {
    return fallback;
  }
};

/**
 * Format month and year (e.g., "March 2026")
 * Used for timeline group headers
 * @param {string|Date} date - Date to format
 * @param {string} fallback - Fallback value
 * @returns {string} Formatted month-year
 */
export const formatMonthYear = (date, fallback = '-') => {
  if (!date) return fallback;
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (error) {
    return fallback;
  }
};

/**
 * Get short month name (e.g., "Jan", "Feb")
 * Used for chart axis labels
 * @param {string|Date} date - Date to extract month from
 * @returns {string} Short month name
 */
export const getMonthShortName = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);
  return months[d.getMonth()] || '';
};

/**
 * Get short weekday name (e.g., "Mon", "Tue")
 * Used for chart axis labels
 * @param {string|Date} date - Date to extract weekday from
 * @returns {string} Short weekday name
 */
export const getWeekdayShortName = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(date);
  return days[d.getDay()] || '';
};

// Default export for convenience
export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatDateForInput,
  parseDDMMYYYY,
  getRelativeDate,
  formatDateWithMonthName,
  formatDateRange,
  formatLongDate,
  formatDayMonth,
  formatMonthYear,
  getMonthShortName,
  getWeekdayShortName
};
