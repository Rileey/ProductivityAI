import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { requestNotificationPermissions, setupNotificationChannels, setupNotificationListeners } from './src/utils/notifications';
import { registerBackgroundTask, checkTaskReminders } from './src/utils/backgroundTasks';

export default function App() {
  useEffect(() => {
    async function initializeApp() {
      try {
        // Request permissions
        const permissionGranted = await requestNotificationPermissions();
        
        if (permissionGranted) {
          // Set up notification channels (Android)
          await setupNotificationChannels();
          
          // Set up notification listeners
          setupNotificationListeners();
          
          // Register background task
          await registerBackgroundTask();
          
          // Do initial check
          await checkTaskReminders();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    }

    // Initialize app
    initializeApp();

    // Set up app state change listener
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // Check reminders when app comes to foreground
        checkTaskReminders();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ... rest of your App component
} 