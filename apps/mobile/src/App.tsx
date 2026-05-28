import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { RootNavigator } from '@navigation/RootNavigator';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any assets needed for the app
        await Font.loadAsync({
          'sans': require('./assets/fonts/OpenSans-Regular.ttf'),
          'sans-bold': require('./assets/fonts/OpenSans-Bold.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the splash screen to hide after all resources are loaded.
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />
      <RootNavigator />
    </>
  );
}
