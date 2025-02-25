import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Modal, Portal, TextInput, Button, Switch, Text, SegmentedButtons, Menu, Chip, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Database } from '../types/database';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { colors } from '../theme/colors';
import { icons } from '../theme/icons';
import { format } from 'date-fns';

type Category = Database['public']['Tables']['categories']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  task?: Task | null;
  categories: Category[];
}

export default function TaskModal({ visible, onDismiss, onSave, task, categories }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setCategory(task.category);
      setDueDate(task.due_date ? new Date(task.due_date) : null);
      setPriority(task.priority);
      if (task.due_time) {
        const [hours, minutes] = task.due_time.split(':');
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours, 10));
        timeDate.setMinutes(parseInt(minutes, 10));
        setDueTime(timeDate);
      } else {
        setDueTime(null);
      }
    } else {
      resetForm();
    }
  }, [task]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(null);
    setDueDate(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setPriority(null);
    setDueTime(null);
  };

  const handleSubmit = async () => {
    try {
      if (!title.trim()) {
        return; // Add validation message later
      }

      const taskData = {
        title: title.trim(),
        description: description?.trim() || null,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        due_time: dueTime ? format(dueTime, 'HH:mm:ss') : null,
        category: category || null,
        priority: priority || null,
        // user_id will be added by the slice
      };

      await onSave(taskData);
      onDismiss();
    } catch (error) {
      console.error('Failed to save task:', error);
      // Add error message display later
    }
  };

  // Date/Time picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && event.type !== 'dismissed') {
      setDueDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime && event.type !== 'dismissed') {
      setDueTime(selectedTime);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {task ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.form}>
            <View style={styles.inputGroup}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                mode="flat"
                placeholder="Task title"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                mode="flat"
                placeholder="Description (optional)"
                multiline
                numberOfLines={2}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.row}>
                <Chip
                  icon="calendar"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateChip}
                  mode="outlined"
                >
                  {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Due date'}
                </Chip>
                
                <Chip
                  icon="clock-outline"
                  onPress={() => setShowTimePicker(true)}
                  style={styles.timeChip}
                  mode="outlined"
                >
                  {dueTime ? format(dueTime, 'h:mm a') : 'Time'}
                </Chip>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.row}>
                <Chip
                  icon="folder"
                  onPress={() => setShowCategoryMenu(true)}
                  mode="outlined"
                  style={styles.chip}
                >
                  {category ? categories.find(c => c.id === category)?.name : 'Category'}
                </Chip>

                <Chip
                  icon="flag"
                  onPress={() => setShowPriorityMenu(true)}
                  mode="outlined"
                  style={styles.chip}
                >
                  {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Priority'}
                </Chip>
              </View>
            </View>
          </ScrollView>

          {/* Priority Menu */}
          <Menu
            visible={showPriorityMenu}
            onDismiss={() => setShowPriorityMenu(false)}
            anchor={null}
            style={styles.menu}
          >
            {['high', 'medium', 'low'].map(p => (
              <Menu.Item
                key={p}
                onPress={() => {
                  setPriority(p);
                  setShowPriorityMenu(false);
                }}
                title={p.charAt(0).toUpperCase() + p.slice(1)}
              />
            ))}
          </Menu>

          {/* Category Menu */}
          <Menu
            visible={showCategoryMenu}
            onDismiss={() => setShowCategoryMenu(false)}
            anchor={null}
            style={styles.menu}
          >
            {categories.map(cat => (
              <Menu.Item
                key={cat.id}
                onPress={() => {
                  setCategory(cat.id);
                  setShowCategoryMenu(false);
                }}
                title={cat.name}
              />
            ))}
          </Menu>

          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              style={styles.saveButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Save
            </Button>
          </View>
        </View>

        {/* Render pickers in a separate Portal to ensure proper overlay */}
        <Portal>
          {showDatePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            </View>
          )}

          {showTimePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={dueTime || new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            </View>
          )}
        </Portal>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%', // Increased height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outline,
  },
  headerTitle: {
    fontSize: 20, // Slightly larger
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
    flex: 1,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.primary,
    paddingHorizontal: 8,
  },
  form: {
    padding: 20, // Increased padding
  },
  inputGroup: {
    marginBottom: 24, // Increased spacing between inputs
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16, // Larger font size
    paddingVertical: 8, // More vertical padding
  },
  row: {
    flexDirection: 'row',
    gap: 12, // Increased gap
  },
  dateChip: {
    flex: 2,
    height: 40, // Taller chips
  },
  timeChip: {
    flex: 1,
    height: 40, // Taller chips
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outline,
    alignItems: 'center',
  },
  saveButton: {
    width: '40%',
    borderRadius: 20,
  },
  buttonContent: {
    height: 44, // Slightly taller button
  },
  buttonLabel: {
    fontSize: 16, // Larger font
    fontWeight: '600',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 2000,
  },
  chip: {
    flex: 1,
    height: 40,
  },
  menu: {
    maxWidth: '80%',
    marginTop: Platform.OS === 'ios' ? -40 : 0,
  },
}); 