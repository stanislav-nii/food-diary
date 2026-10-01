import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fooddiary.app',
  appName: 'Food Diary',
  webDir: 'out',
  // Отключаем встроенный сервер — приложение работает полностью как статика (file://)
  server: {
    androidScheme: 'https',
  },
};

export default config;
