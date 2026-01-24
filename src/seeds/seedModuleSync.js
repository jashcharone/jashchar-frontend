import { moduleSyncService } from '@/services/moduleSyncService';

export const seedModuleSync = async () => {
    console.log("Seeding modules...");
    await moduleSyncService.syncModulesToDatabase();
    console.log("Modules seeded.");
};
