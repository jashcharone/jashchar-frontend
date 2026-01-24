// This file is served as-is. Edit on the server to configure runtime values.
// Example:
// window.__RUNTIME_CONFIG__ = {
//   VITE_SUPABASE_URL: 'https://your-project.supabase.co',
//   VITE_SUPABASE_ANON_KEY: 'your_anon_key',
//   VITE_API_URL: 'https://your-api.example.com/api'
// };

window.__RUNTIME_CONFIG__ = window.__RUNTIME_CONFIG__ || {
  VITE_SUPABASE_URL: '',
  VITE_SUPABASE_ANON_KEY: '',
  // Leave empty by default so build-time env is used unless overridden on server
  VITE_API_URL: ''
};
