import { config } from '@/config/environment';

/**
 * Initialize the application for static deployment
 * This handles any special setup needed when running as static files
 */
export const initializeStaticApp = () => {
  // Check if running in static mode (file:// protocol)
  const isStatic = isStaticMode();
  
  if (isStatic) {
    console.log('Running in static mode - file:// protocol detected');
    
    // Set up any static-specific configurations
    document.addEventListener('DOMContentLoaded', () => {
      // Ensure all relative paths work correctly
      const baseUrl = config.baseUrl;
      
      // Fix any absolute paths that might cause issues
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
          link.setAttribute('href', `${baseUrl}${href.slice(1)}`);
        }
      });
      
      // Fix any image sources that might cause issues
      const images = document.querySelectorAll('img[src^="/"]');
      images.forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('/')) {
          img.setAttribute('src', `${baseUrl}${src.slice(1)}`);
        }
      });
    });
  }
  
  return { isStatic };
};

/**
 * Check if the app is running in static mode
 */
export const isStaticMode = (): boolean => {
  return window.location.protocol === 'file:' || 
         window.location.hostname === 'localhost' && 
         window.location.port === '';
};

/**
 * Get the correct base URL for assets
 */
export const getBaseUrl = (): string => {
  if (isStaticMode()) {
    return './';
  }
  return config.baseUrl;
}; 