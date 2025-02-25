import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Divider } from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import TaskComments from '../../../src/components/TaskComments';
import { useSelector } from 'react-redux';
import { RootState } from '../../../src/store';

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams();
  const task = useSelector((state: RootState) => 
    state.tasks.tasks.find(t => t.id === id)
  );

  if (!task) return null;

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Task Details",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
        }}
      />

      <ScrollView style={styles.container}>
        <Surface style={styles.section}>
          <Text variant="titleLarge" style={styles.title}>{task.title}</Text>
          {task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}
          
          <View style={styles.metadata}>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
            </Text>
          </View>

          <View style={styles.metadata}>
            <Text style={styles.label}>Priority:</Text>
            <Text style={styles.value}>
              {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'None'}
            </Text>
          </View>

          <View style={styles.metadata}>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.value}>
              {task.category || 'Uncategorized'}
            </Text>
          </View>

          <View style={styles.metadata}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>
              {task.completed ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </Surface>

        <View style={styles.spacer} />

        {/* Partner Approval Section */}
        {task.requires_partner_approval && (
          <>
            <Surface style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Partner Approval
              </Text>
              <Text style={styles.approvalStatus}>
                {task.partner_approved === null 
                  ? 'Waiting for partner approval'
                  : task.partner_approved 
                    ? 'Approved by partner'
                    : 'Not approved yet'
                }
              </Text>
            </Surface>
            <View style={styles.spacer} />
          </>
        )}

        {/* Comments Section */}
        <TaskComments taskId={task.id} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    marginBottom: 16,
  },
  metadata: {
    flexDirection: 'row',
    marginTop: 8,
  },
  label: {
    width: 100,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  approvalStatus: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  spacer: {
    height: 16,
  },
}); 