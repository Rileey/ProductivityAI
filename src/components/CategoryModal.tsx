import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, TextInput, Button, IconButton } from 'react-native-paper';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];

interface CategoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (data: { name: string; color: string; icon: string }) => void;
}

export default function CategoryModal({ visible, onDismiss, onSave }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <TextInput
          label="Category Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <View style={styles.colorGrid}>
          {COLORS.map(color => (
            <IconButton
              key={color}
              icon="circle"
              iconColor={color}
              size={30}
              mode={selectedColor === color ? 'contained' : 'outlined'}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
        <Button mode="contained" onPress={() => onSave({ name, color: selectedColor, icon: 'folder' })}>
          Add Category
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
}); 