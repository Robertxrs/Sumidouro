import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.robert.sumidouro',
  appName: 'Sumidouro',
  webDir: 'public',
  server: {
    url: 'https://sumidouro-beta.vercel.app',
    cleartext: true
  }
};

export default config;
