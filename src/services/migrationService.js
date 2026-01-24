import { seedCoreModules } from '@/seeds/seedCoreModules';
import { repairPlanModuleMappings } from '@/services/planModuleRepairService';
import { checkDatabaseIntegrity } from '@/utils/databaseHealthCheck';

/**
 * Runs safe, append-only migrations and repairs from the frontend client.
 * This is a safety net when backend migrations might have been skipped or failed.
 */
export const runSafeMigrations = async () => {
    const report = { success: true, migrations: [], errors: [] };

    try {
        // 1. Health Check
        const health = await checkDatabaseIntegrity();
        
        // 2. Seed Modules (if table exists)
        if (health.modulesTableExists) {
            console.log("Seeding modules...");
            const seedResult = await seedCoreModules();
            report.migrations.push({ name: 'seed_core_modules', result: seedResult });
        } else {
            report.errors.push("Cannot seed modules: table missing");
        }

        // 3. Repair Plan Mappings
        console.log("Repairing plan mappings...");
        const planRepairResult = await repairPlanModuleMappings();
        report.migrations.push({ name: 'repair_plan_mappings', result: planRepairResult });

    } catch (e) {
        report.success = false;
        report.errors.push(e.message);
    }

    return report;
};

export const rollbackIfNeeded = async () => {
    // In this context, rollback is not really possible via client-side logic safely without specific backup endpoints.
    // We assume append-only operations don't need destructive rollback.
    return { success: true, rolled_back: false, message: "Client-side rollback not supported/needed for append-only ops." };
};
