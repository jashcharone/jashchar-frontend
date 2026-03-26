import { maskEnvValue } from './envLogger';

export const printEnvStatus = (status) => {
  if (!status) return;
  console.log(`%c ENV STATUS: ${status.envLoaded ? 'OK' : 'MISSING'}`, `color: ${status.envLoaded ? 'green' : 'red'}; font-weight: bold`);
  if (!status.envLoaded) {
    console.table(status.errors);
  }
};

export const printSetupInstructions = () => {
  console.group("🛠️ ENV SETUP INSTRUCTIONS");
  console.log("1. Open .env file");
  console.log("2. Add VITE_SUPABASE_URL=...");
  console.log("3. Add VITE_SUPABASE_ANON_KEY=...");
  console.log("4. Restart dev server");
  console.groupEnd();
};
