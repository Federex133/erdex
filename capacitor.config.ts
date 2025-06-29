
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7f355098a4124277833ca0cebf412aec',
  appName: 'Digital Emporium Genesis Hub',
  webDir: 'dist',
  server: {
    url: "https://7f355098-a412-4277-833c-a0cebf412aec.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};

export default config;
