import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, IconButton } from 'react-native-paper';
import type { Database } from '../types/database';
import ProgressBar from './ProgressBar';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskSummaryProps {
  tasks: Task[];
}

export default function TaskSummary({ tasks }: TaskSummaryProps) {
  const theme = useTheme();

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed).length,
    overdue: tasks.filter(t => {
      if (!t.due_date || t.completed) return false;
      return new Date(t.due_date) < new Date();
    }).length,
  };

  const completionProgress = stats.total > 0 ? stats.completed / stats.total : 0;

  return (
    <View style={styles.container}>
      <Card style={styles.mainCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View>
              <Text variant="titleLarge">{stats.completed} of {stats.total}</Text>
              <Text variant="bodyMedium">Tasks Completed</Text>
            </View>
            <IconButton 
              icon={completionProgress >= 1 ? "trophy" : "progress-check"} 
              iconColor={theme.colors.primary}
              size={24}
            />
          </View>
          <ProgressBar 
            progress={completionProgress}
            color={theme.colors.primary}
          />
        </Card.Content>
      </Card>

      <View style={styles.row}>
        <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
          <Card.Content>
            <Text variant="titleLarge">{stats.highPriority}</Text>
            <Text variant="bodyMedium">High Priority</Text>
            <ProgressBar 
              progress={stats.highPriority / stats.total}
              color={theme.colors.error}
            />
          </Card.Content>
        </Card>
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text variant="titleLarge">{stats.overdue}</Text>
            <Text variant="bodyMedium">Overdue</Text>
            <ProgressBar 
              progress={stats.overdue / stats.total}
              color={theme.colors.error}
            />
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  mainCard: {
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
  },
}); 