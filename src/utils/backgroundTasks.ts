import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../config/supabase';
import { scheduleTaskReminders, cancelTaskReminders } from './notifications';
import type { Task } from '../types/database';
import { Platform } from 'react-native';

const BACKGROUND_TASK_NAME = 'CHECK_TASK_REMINDERS';
const NOTIFICATION_WINDOW = 6 * 60 * 1000; // 6 minutes in milliseconds

// Helper function to check if a task needs reminders
function taskNeedsReminders(task: Task): boolean {
  if (!task.due_date || !task.due_time || task.completed) return false;

  const taskDateTime = new Date(`${task.due_date}T${task.due_time}`);
  const now = new Date();
  const timeDiff = taskDateTime.getTime() - now.getTime();

  // Check if task is within our notification window
  return Math.abs(timeDiff) <= NOTIFICATION_WINDOW;
}

// Define the background task
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return BackgroundFetch.Result.Failed;

    // Get tasks that need attention
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .not('due_date', 'is', null)
      .not('due_time', 'is', null)
      .order('due_date', { ascending: true });

    if (error) throw error;
    if (!tasks?.length) return BackgroundFetch.Result.NoData;

    let updatedCount = 0;
    const now = new Date();

    // Process each task
    for (const task of tasks) {
      if (taskNeedsReminders(task)) {
        await scheduleTaskReminders(task);
        updatedCount++;
      }
    }

    return updatedCount > 0 
      ? BackgroundFetch.Result.NewData 
      : BackgroundFetch.Result.NoData;

  } catch (error) {
    console.error('Background task failed:', error);
    return BackgroundFetch.Result.Failed;
  }
});

export async function registerBackgroundTask() {
  try {
    // First, unregister any existing task
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    } catch (e) {
      // Task wasn't registered yet
    }

    // Register the task with more aggressive settings
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60, // Check every minute
      stopOnTerminate: false, // Continue running when app is closed
      startOnBoot: true, // Start after device reboot
    });

    // For iOS, request background fetch capability
    if (Platform.OS === 'ios') {
      await BackgroundFetch.setMinimumIntervalAsync(60);
    }

    console.log('Background task registered successfully');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
}

// Add this function to manually trigger a check
export async function checkTaskReminders() {
  try {
    await TaskManager.getRegisteredTasksAsync()
      .then(tasks => {
        const isRegistered = tasks.some(task => task.taskName === BACKGROUND_TASK_NAME);
        if (!isRegistered) {
          registerBackgroundTask();
        }
      });
    
    // Manually execute the task
    await TaskManager.executeTaskAsync(BACKGROUND_TASK_NAME);
  } catch (error) {
    console.error('Failed to check task reminders:', error);
  }
} 