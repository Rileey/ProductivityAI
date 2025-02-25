import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { Task } from '../types/database';

// Configure notifications with high priority
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX, // Maximum priority for Android
  }),
});

export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowProvisional: true,
    },
  });
  return status === 'granted';
}

export async function scheduleTaskReminders(task: Task) {
  if (!task.due_date || !task.due_time || task.completed) return;

  const taskDateTime = new Date(`${task.due_date}T${task.due_time}`);
  const beforeTime = new Date(taskDateTime.getTime() - 5 * 60000);
  const afterTime = new Date(taskDateTime.getTime() + 5 * 60000);
  const now = new Date();

  // Cancel any existing notifications
  await cancelTaskReminders(task.id);

  // Schedule "5 minutes before" reminder if it's in the future
  if (beforeTime > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Important Task Coming Up!",
        body: `"${task.title}" starts in 5 minutes`,
        data: { taskId: task.id, type: 'before' },
        sound: true,
        priority: 'max',
        vibrate: [0, 250, 250, 250], // Custom vibration pattern
      },
      trigger: {
        date: beforeTime,
        channelId: 'task-reminders', // Android notification channel
      },
    });

    // Trigger haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  // Schedule "5 minutes after" reminder if task isn't completed
  if (!task.completed) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Task Needs Attention!",
        body: `"${task.title}" was due 5 minutes ago and is still pending`,
        data: { taskId: task.id, type: 'after' },
        sound: true,
        priority: 'max',
        vibrate: [0, 500, 200, 500], // Stronger vibration pattern for overdue
      },
      trigger: {
        date: afterTime,
        channelId: 'task-reminders',
      },
    });
  }
}

export async function cancelTaskReminders(taskId: string) {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const taskNotifications = scheduledNotifications.filter(
    notification => notification.content.data?.taskId === taskId
  );
  
  for (const notification of taskNotifications) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
}

export async function handleTaskUpdate(task: Task) {
  if (task.completed) {
    // Cancel reminders if task is completed
    await cancelTaskReminders(task.id);
    // Optional: Trigger success haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    // Schedule/reschedule reminders
    await scheduleTaskReminders(task);
  }
}

// Add notification channel setup for Android
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

// Handle notification interactions
export function setupNotificationListeners() {
  Notifications.addNotificationResponseReceivedListener(response => {
    const taskId = response.notification.request.content.data?.taskId;
    if (taskId) {
      // Handle notification tap - could navigate to task details
      console.log('Notification tapped for task:', taskId);
    }
  });

  // Handle notifications received while app is running
  Notifications.addNotificationReceivedListener(notification => {
    const taskId = notification.request.content.data?.taskId;
    // Trigger haptic feedback when notification is received
    Haptics.notificationAsync(
      notification.request.content.data?.type === 'after' 
        ? Haptics.NotificationFeedbackType.Error 
        : Haptics.NotificationFeedbackType.Warning
    );
  });
} 