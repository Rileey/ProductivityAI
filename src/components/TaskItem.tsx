import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, ProgressBar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { icons } from '../theme/icons';
import type { Database } from '../types/database';
import {
  Swipeable,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_COLORS = {
  high: colors.error,
  medium: colors.warning,
  low: colors.success,
  none: colors.surfaceVariant,
} as const;

function DueTimeDisplay({ dueDate, dueTime, completed }: { 
  dueDate: string, 
  dueTime: string | null,
  completed: boolean 
}) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (completed) {
      setTimeLeft('Completed');
      return;
    }

    const updateTimeLeft = () => {
      try {
        const now = new Date();
        
        // Create a proper date string that JavaScript can parse
        const dueDateTime = new Date(dueDate);
        if (dueTime) {
          const [hours, minutes] = dueTime.split(':');
          dueDateTime.setHours(parseInt(hours, 10));
          dueDateTime.setMinutes(parseInt(minutes, 10));
        } else {
          // If no time specified, set to end of day
          dueDateTime.setHours(23, 59, 59);
        }

        const diff = dueDateTime.getTime() - now.getTime();
        
        // Time has elapsed
        if (diff <= 0) {
          const elapsed = Math.abs(diff);
          const minutes = Math.floor(elapsed / 1000 / 60);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          if (days > 0) return `${days}d elapsed`;
          if (hours > 0) return `${hours}h elapsed`;
          if (minutes > 0) return `${minutes}m elapsed`;
          return 'Just elapsed';
        }
        
        // Time remaining
        const minutes = Math.floor(diff / 1000 / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h left`;
        if (hours > 0) return `${hours}h ${minutes % 60}m left`;
        if (minutes > 0) return `${minutes}m left`;
        return 'Due now';

      } catch (error) {
        console.error('Error calculating time:', error);
        return 'Invalid date';
      }
    };

    setTimeLeft(updateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(updateTimeLeft());
    }, 60000);

    return () => clearInterval(interval);
  }, [dueDate, dueTime, completed]);

  return (
    <Text style={[
      styles.dueTime,
      completed && styles.completedTime,
      timeLeft.includes('elapsed') && styles.elapsedTime
    ]}>
      {timeLeft}
    </Text>
  );
}

export default function TaskItem({ task, onToggleComplete, onEdit, onDelete }: TaskItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;

  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.toDateString() === today.toDateString()) {
      return 'Due Soon';
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return new Date(date).toLocaleDateString();
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    onEdit(task);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      .then(() => {
        swipeableRef.current?.close();
        onDelete(task.id);
      });
  };

  const handleToggleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleComplete(task.id, !task.completed);
  };

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={handleEdit}
      >
        <MaterialCommunityIcons name={icons.edit} size={20} color="white" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: colors.error }]}
        onPress={handleDelete}
      >
        <MaterialCommunityIcons name={icons.delete} size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={2}
        overshootRight={false}
        onSwipeableOpen={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Surface style={styles.taskItem}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={handleToggleComplete}
          >
            <MaterialCommunityIcons
              name={task.completed ? icons.checkCircle : 'checkbox-blank-circle-outline'}
              size={24}
              color={task.completed ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <Text style={[
                styles.taskTitle,
                task.completed && styles.completedText
              ]}>
                {task.title}
              </Text>
            </View>

            {task.description ? (
              <Text style={styles.description}>{task.description}</Text>
            ) : null}

            <View style={styles.taskFooter}>
              <View style={styles.badges}>
                {task.priority && (
                  <View style={[styles.badge, { backgroundColor: `${PRIORITY_COLORS[task.priority]}10` }]}>
                    <MaterialCommunityIcons 
                      name={icons.flag} 
                      size={14} 
                      color={PRIORITY_COLORS[task.priority]} 
                    />
                    <Text style={[styles.badgeText, { color: PRIORITY_COLORS[task.priority] }]}>
                      {task.priority}
                    </Text>
                  </View>
                )}
                {task.category && (
                  <View style={[styles.badge, { backgroundColor: `${colors.primary}10` }]}>
                    <MaterialCommunityIcons 
                      name={icons.folder} 
                      size={14} 
                      color={colors.primary} 
                    />
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {task.category}
                    </Text>
                  </View>
                )}
                {task.due_date && (
                  <View style={[styles.badge, { backgroundColor: isOverdue ? `${colors.error}20` : `${colors.primary}20` }]}>
                    <MaterialCommunityIcons 
                      name={icons.clockOutline}
                      size={16}
                      color={isOverdue ? colors.error : colors.primary}
                    />
                    <DueTimeDisplay 
                      dueDate={task.due_date} 
                      dueTime={task.due_time}
                      completed={task.completed}
                    />
                  </View>
                )}
              </View>

              <View style={styles.subtasks}>
                <Text style={styles.subtaskCount}>0/4</Text>
                <ProgressBar 
                  progress={0} 
                  color={colors.primary}
                  style={styles.subtaskProgress} 
                />
              </View>
            </View>
          </View>
        </Surface>
      </Swipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  taskItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    elevation: 1,
  },
  checkbox: {
    padding: 16,
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant,
  },
  description: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
  },
  taskFooter: {
    gap: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subtasks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subtaskCount: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    minWidth: 24,
  },
  subtaskProgress: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginRight: 16,
  },
  actionButton: {
    width: 48,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 8,
  },
  dueTime: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  elapsedTime: {
    color: colors.error,
  },
  completedTime: {
    color: colors.success,
  },
}); 