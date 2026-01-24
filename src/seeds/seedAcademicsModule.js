import { ensureAcademicsModuleExists } from '@/services/planModuleSyncService';

/**
 * Simple runner for seeding Academics.
 * Can be imported and called in main.jsx or App.jsx if needed, 
 * but currently it's called dynamically by the sync service.
 */
export const seedAcademicsModule = async () => {
  console.log("Running Academics Module Seeder...");
  await ensureAcademicsModuleExists();
};
