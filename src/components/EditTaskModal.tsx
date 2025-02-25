import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Modal, Portal, TextInput, Button } from 'react-native-paper';
import { Database } from '../types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

interface EditTaskModalProps {
  visible: boolean;
  task: Task | null;
  onDismiss: () => void;
  onSave: (taskId: string, updates: { title: string; description: string }) => void;
}

export default function EditTaskModal({ visible, task, onDismiss, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task]);

  const handleSave = () => {
    if (!task || !title.trim()) return;
    onSave(task.id, { title, description });
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <TextInput
          label="Task Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.input}
        />
        <Button mode="contained" onPress={handleSave}>
          Save Changes
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
}); 