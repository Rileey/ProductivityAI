import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB, Badge } from 'react-native-paper';
import { colors } from '../theme/colors';
import { RootState } from '../store';
import { useSelector } from 'react-redux';
import { getTaskAnalytics } from '../services/AIAssistantService';

interface AIAssistantButtonProps {
  onPress: () => void;
}

export default function AIAssistantButton({ onPress }: AIAssistantButtonProps) {
  const [hasImportantInsights, setHasImportantInsights] = useState(false);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  
  useEffect(() => {
    // Check if there are important insights to show
    const checkForImportantInsights = () => {
      try {
        const analytics = getTaskAnalytics();
        const insightsSection = analytics.split("Insights:\n")[1];
        
        if (insightsSection) {
          const insights = insightsSection
            .split("• ")
            .map(item => item.trim())
            .filter(item => item.length > 0);
          
          // Consider insights about overdue tasks or many high priority tasks as important
          const hasOverdue = insights.some(i => i.includes('overdue'));
          const hasTooManyHighPriority = insights.some(i => i.includes('high priority'));
          
          setHasImportantInsights(hasOverdue || hasTooManyHighPriority);
        }
      } catch (error) {
        console.error("Error checking for insights:", error);
      }
    };
    
    checkForImportantInsights();
  }, [tasks]);
  
  return (
    <View style={styles.container}>
      {hasImportantInsights && (
        <Badge style={styles.badge} size={8} />
      )}
      <FAB
        icon="assistant"
        style={styles.fab}
        onPress={onPress}
        color={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fab: {
    backgroundColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    zIndex: 2,
  },
}); 