import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, Surface, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Database } from '../types/database';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { colors } from '../theme/colors';
import { icons } from '../theme/icons';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [priorityExpanded, setPriorityExpanded] = useState(false);

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

  useEffect(() => {
    if (visible) {
      setCategoryExpanded(false);
      setPriorityExpanded(false);
    }
  }, [visible]);

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
                <TouchableOpacity 
                  style={styles.fieldButton} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                  <Text style={styles.fieldButtonText}>
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Due date'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.fieldButton} 
                  onPress={() => setShowTimePicker(true)}
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                  <Text style={styles.fieldButtonText}>
                    {dueTime ? format(dueTime, 'h:mm a') : 'Time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.fieldButton}
                onPress={() => {
                  setCategoryExpanded(!categoryExpanded);
                  setPriorityExpanded(false);
                }}
              >
                <MaterialCommunityIcons name="folder" size={20} color={colors.primary} />
                <Text style={styles.fieldButtonText}>
                  {category ? categories.find(c => c.id === category)?.name : 'Category'}
                </Text>
                <MaterialCommunityIcons 
                  name={categoryExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.onSurfaceVariant} 
                />
              </TouchableOpacity>
              
              {categoryExpanded && (
                <Surface style={styles.optionsContainer}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.optionItem}
                      onPress={() => {
                        setCategory(cat.id);
                        setCategoryExpanded(false);
                      }}
                    >
                      <Text style={[
                        styles.optionText,
                        cat.id === category && styles.selectedOptionText
                      ]}>
                        {cat.name}
                      </Text>
                      {cat.id === category && (
                        <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </Surface>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.fieldButton}
                onPress={() => {
                  setPriorityExpanded(!priorityExpanded);
                  setCategoryExpanded(false);
                }}
              >
                <MaterialCommunityIcons name="flag" size={20} color={colors.primary} />
                <Text style={styles.fieldButtonText}>
                  {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Priority'}
                </Text>
                <MaterialCommunityIcons 
                  name={priorityExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.onSurfaceVariant} 
                />
              </TouchableOpacity>
              
              {priorityExpanded && (
                <Surface style={styles.optionsContainer}>
                  {['high', 'medium', 'low'].map(p => (
                    <TouchableOpacity
                      key={p}
                      style={styles.optionItem}
                      onPress={() => {
                        setPriority(p);
                        setPriorityExpanded(false);
                      }}
                    >
                      <Text style={[
                        styles.optionText,
                        p === priority && styles.selectedOptionText
                      ]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                      {p === priority && (
                        <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </Surface>
              )}
            </View>
          </ScrollView>

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

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate && event.type !== 'dismissed') {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={dueTime || new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime && event.type !== 'dismissed') {
                  setDueTime(selectedTime);
                }
              }}
            />
          )}
        </View>
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
    maxHeight: '85%',
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
    fontSize: 20,
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
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 4,
  },
  fieldButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.onSurface,
  },
  optionsContainer: {
    marginTop: 4,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outline,
  },
  optionText: {
    fontSize: 16,
    color: colors.onSurface,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '500',
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
    height: 44,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 