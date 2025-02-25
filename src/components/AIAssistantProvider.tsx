import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AIAssistantButton from './AIAssistantButton';
import AIAssistantModal from './AIAssistantModal';

interface AIAssistantProviderProps {
  children: React.ReactNode;
}

export default function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const [isAssistantVisible, setIsAssistantVisible] = useState(false);

  return (
    <View style={styles.container}>
      {children}
      <AIAssistantButton onPress={() => setIsAssistantVisible(true)} />
      <AIAssistantModal 
        visible={isAssistantVisible} 
        onDismiss={() => setIsAssistantVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 