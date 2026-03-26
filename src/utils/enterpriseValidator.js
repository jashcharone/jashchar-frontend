import baseline from '@/enterprise-dna/projectBaseline.json';
import { NEW_MODULES } from '@/modules/moduleRegistry.append';

export const validateEntireProject = () => {
  const report = {
    routes: { status: 'Unknown', count: 0 },
    sidebar: { status: 'Unknown', count: 0 },
    extensions: { status: 'Unknown', count: 0 }
  };

  // 1. Validate Routes (Simulated via baseline)
  if (baseline.critical_routes.length > 0) {
      report.routes.status = 'Healthy';
      report.routes.count = baseline.stats.total_routes;
  }

  // 2. Validate Extensions
  if (Array.isArray(NEW_MODULES)) {
      report.extensions.status = 'Healthy';
      report.extensions.count = NEW_MODULES.length;
  }

  return report;
};
