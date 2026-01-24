import { MASTER_ADMIN_CONSTANTS } from '@/constants/masterAdminConstants';

export const masterAdminSafetyService = {
  /**
   * Checks if an operation on a table is allowed.
   * @param {string} table - The table name being accessed.
   * @param {string} operation - The operation (INSERT, UPDATE, DELETE, SELECT).
   * @returns {boolean} - True if allowed, false if blocked.
   */
  validateMasterAdminOperation: (table, operation = 'UPDATE') => {
    // If the table is protected and the operation is destructive
    if (
      MASTER_ADMIN_CONSTANTS.PROTECTED_TABLES.includes(table) &&
      MASTER_ADMIN_CONSTANTS.PROTECTED_OPERATIONS.includes(operation.toUpperCase())
    ) {
      console.error(`ðŸ›‘ BLOCKED: Attempt to ${operation} protected table '${table}' from unauthorized service.`);
      return false;
    }
    return true;
  },

  /**
   * Logs a safety violation or operation.
   * @param {string} table 
   * @param {string} operation 
   * @param {object} data 
   */
  logSafetyEvent: (table, operation, data) => {
    console.warn(`[Safety Monitor] Operation: ${operation} on ${table}`, data);
    // In a real system, this would write to an audit log table.
  },

  /**
   * Throws an error if the table is protected.
   * @param {string} table 
   */
  blockUnauthorizedModification: (table) => {
    if (MASTER_ADMIN_CONSTANTS.PROTECTED_TABLES.includes(table)) {
        throw new Error(`Security Violation: Cannot modify protected Master Admin table '${table}' from this context.`);
    }
  }
};
