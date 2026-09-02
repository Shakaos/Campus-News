import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'edu.campus.news',
  appName: 'Campus News',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
    },
  },
};

export default config;
