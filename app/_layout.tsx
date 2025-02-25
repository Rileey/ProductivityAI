import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { StatusBar } from 'expo-status-bar';
import AIAssistantProvider from '../src/components/AIAssistantProvider';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { Slot } from 'expo-router';
import { colors } from '../src/theme/colors';

// Ensure mobile navigation gestures work
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AuthProvider>
          <ThemeProvider>
            <PaperProvider theme={theme}>
              <StatusBar style="auto" />
              <AIAssistantProvider>
                <Slot />
              </AIAssistantProvider>
            </PaperProvider>
          </ThemeProvider>
        </AuthProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

// Configure initial route
export const unstable_settings = {
  initialRouteName: 'index'
}; 