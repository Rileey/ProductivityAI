import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, LayoutAnimation, Animated } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { colors } from '../theme/colors';
import { icons } from '../theme/icons';
import TaskItem from './TaskItem';
import type { Database } from '../types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskGroupProps {
  title: string;
  count: number;
  tasks: Task[];
  color?: string;
  onPress?: () => void;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
}

export default function TaskGroup({ 
  title, 
  count, 
  tasks, 
  color = colors.primary,
  onPress,
  onTaskToggle,
  onTaskEdit,
  onTaskDelete 
}: TaskGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  const toggleExpanded = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    Animated.spring(rotateAnim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: true,
      tension: 20,
      friction: 7,
    }).start();

    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const renderTasks = () => (
    <View style={styles.taskList}>
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onTaskToggle}
          onEdit={onTaskEdit}
          onDelete={onTaskDelete}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <Pressable 
        style={({ pressed }) => [
          styles.header,
          { 
            opacity: pressed ? 0.9 : 1,
            backgroundColor: color ? `${color}10` : colors.surface,
          }
        ]}
        onPress={toggleExpanded}
      >
        <View style={styles.headerContent}>
          <Text variant="titleMedium" style={{ color }}>
            {title}
          </Text>
          <View style={styles.headerRight}>
            <Text variant="labelMedium" style={{ color }}>
              {count} {count === 1 ? 'task' : 'tasks'}
            </Text>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <IconButton 
                icon={icons.chevronDown}
                size={20}
                iconColor={color}
                onPress={toggleExpanded}
              />
            </Animated.View>
          </View>
        </View>
      </Pressable>

      {expanded && renderTasks()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskList: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
}); 