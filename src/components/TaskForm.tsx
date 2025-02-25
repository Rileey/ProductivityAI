import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Surface, Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { icons } from '../theme/icons';
import type { Database } from '../types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Partial<Task>) => void;
  onCancel: () => void;
}

export default function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || null);
  const [category, setCategory] = useState(task?.category || null);
  const [dueDate, setDueDate] = useState<Date | null>(
    task?.due_date ? new Date(task.due_date) : null
  );
  const [dueTime, setDueTime] = useState<Date | null>(
    task?.due_time ? new Date(`2000-01-01T${task.due_time}`) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      priority,
      category,
      due_date: dueDate?.toISOString(),
      due_time: dueTime?.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Surface style={styles.container}>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <View style={styles.dateTimeSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Due Date & Time</Text>
        <View style={styles.dateTimeContainer}>
          <Button
            mode="outlined"
            icon={icons.calendarOutline}
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            {dueDate ? dueDate.toLocaleDateString() : 'Set date'}
          </Button>

          {dueDate && (
            <Button
              mode="outlined"
              icon={icons.clockOutline}
              onPress={() => setShowTimePicker(true)}
              style={styles.timeButton}
            >
              {dueTime ? formatTime(dueTime) : 'Add time'}
            </Button>
          )}

          {(dueDate || dueTime) && (
            <IconButton
              icon={icons.close}
              size={20}
              onPress={() => {
                setDueDate(null);
                setDueTime(null);
              }}
            />
          )}
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDueDate(selectedDate);
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dueTime || new Date()}
          mode="time"
          onChange={(event, selectedDate) => {
            setShowTimePicker(false);
            if (selectedDate) setDueTime(selectedDate);
          }}
        />
      )}

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          style={styles.button}
          disabled={!title.trim()}
        >
          {task ? 'Update' : 'Create'} Task
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  input: {
    marginBottom: 16,
  },
  dateTimeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flex: 1,
  },
  timeButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
}); 