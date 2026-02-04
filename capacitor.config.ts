import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.faae96baaf6c4264be661a79bc2fe650',
  appName: 'RestaurantOS',
  webDir: 'dist',
  server: {
    url: 'https://faae96ba-af6c-4264-be66-1a79bc2fe650.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000'
  },
  ios: {
    backgroundColor: '#000000'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
