import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Capacitor} from '@capacitor/core';
import {StatusBar, Style} from '@capacitor/status-bar';
import {SplashScreen} from '@capacitor/splash-screen';
import {App as CapacitorApp} from '@capacitor/app';
import App from './App.tsx';
import './index.css';

async function setupNativeShell() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({style: Style.Light});
  } catch {
    // Status bar plugin is unavailable in some emulators.
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Splash screen may already be dismissed.
  }

  CapacitorApp.addListener('backButton', ({canGoBack}) => {
    if (canGoBack) {
      window.history.back();
      return;
    }
    CapacitorApp.exitApp();
  });
}

void setupNativeShell();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
