// Environment configuration for static deployment
export const config = {
  // Base URL for static assets
  baseUrl: import.meta.env.BASE_URL || './',
  
  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Supabase configuration
  supabase: {
    url: "https://esvtnnswavfyweokiyrp.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnRubnN3YXZmeXdlb2tpeXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjQyNzAsImV4cCI6MjA2NTUwMDI3MH0.4T2rXPOLQ261Cbv6XRbySsg0T1nNNjVR97oPZa18_lA"
  },
  
  // App configuration
  app: {
    name: 'Digital Emporium Genesis Hub',
    version: '1.0.0'
  }
};

// Helper function to get asset URL
export const getAssetUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${config.baseUrl}${path.startsWith('/') ? path.slice(1) : path}`;
};

// Helper function to check if running in static mode
export const isStaticMode = (): boolean => {
  return !config.isDevelopment && window.location.protocol === 'file:';
}; 