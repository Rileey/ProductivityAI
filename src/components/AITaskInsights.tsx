import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Surface, Text, Divider, Card, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { getTaskAnalytics } from '../services/AIAssistantService';
import { updateTask } from '../store/slices/taskSlice';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AITaskInsights() {
  const [expanded, setExpanded] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  
  const insightsMemo = useMemo(() => {
    try {
      const analytics = getTaskAnalytics();
      const insightsSection = analytics.split("Insights:\n")[1];
      
      if (insightsSection) {
        return insightsSection
          .split("• ")
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    } catch (error) {
      console.error("Error processing insights:", error);
    }
    return [];
  }, [tasks]);
  
  useEffect(() => {
    setLoading(true);
    setInsights(insightsMemo);
    setLoading(false);
  }, [insightsMemo]);
  
  useEffect(() => {
    const loadDismissedInsights = async () => {
      try {
        const dismissed = await AsyncStorage.getItem('dismissed_insights');
        if (dismissed) {
          setDismissedInsights(JSON.parse(dismissed));
        }
      } catch (error) {
        console.error('Error loading dismissed insights:', error);
      }
    };
    
    loadDismissedInsights();
  }, []);
  
  const handleInsightAction = (insight: string) => {
    if (insight.includes('priority')) {
      return (
        <Button 
          mode="outlined" 
          compact 
          style={styles.actionButton}
          onPress={() => {
            // Navigate to tasks filtered by priority
            router.push({
              pathname: '/home',
              params: { filter: 'priority' }
            });
          }}
        >
          Fix Priorities
        </Button>
      );
    }
    
    if (insight.includes('overdue')) {
      return (
        <Button 
          mode="outlined" 
          compact 
          style={styles.actionButton}
          onPress={() => {
            // Navigate to overdue tasks
            router.push({
              pathname: '/home',
              params: { filter: 'overdue' }
            });
          }}
        >
          Review Overdue
        </Button>
      );
    }
    
    if (insight.includes('completion rate')) {
      return (
        <Button 
          mode="outlined" 
          compact 
          style={styles.actionButton}
          onPress={() => {
            // Navigate to completed tasks
            router.push({
              pathname: '/home',
              params: { dateRange: 'week', status: 'upcoming' }
            });
          }}
        >
          Plan Week
        </Button>
      );
    }
    
    return null;
  };
  
  const dismissInsight = async (insightText: string) => {
    try {
      const newDismissed = [...dismissedInsights, insightText];
      setDismissedInsights(newDismissed);
      await AsyncStorage.setItem('dismissed_insights', JSON.stringify(newDismissed));
      
      // Remove from current insights
      setInsights(insights.filter(i => i !== insightText));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Generating insights...</Text>
      </View>
    );
  }
  
  if (insights.length === 0) {
    return null; // Don't render if no insights available
  }
  
  return (
    <Card style={styles.container} mode="outlined">
      <Card.Title
        title="AI Productivity Insights"
        left={(props) => <MaterialCommunityIcons {...props} name="lightbulb-outline" size={24} color={colors.primary} />}
        right={(props) => (
          <IconButton
            {...props}
            icon={expanded ? "chevron-up" : "chevron-down"}
            onPress={() => setExpanded(!expanded)}
          />
        )}
      />
      <Divider />
      {expanded && (
        <Card.Content style={styles.content}>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={styles.insightContent}>
                <MaterialCommunityIcons name="circle-small" size={20} color={colors.primary} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
              <View style={styles.insightActions}>
                {handleInsightAction(insight)}
                <IconButton
                  icon="close"
                  size={16}
                  onPress={() => dismissInsight(insight)}
                  style={styles.dismissButton}
                />
              </View>
            </View>
          ))}
        </Card.Content>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
  },
  content: {
    paddingVertical: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.primary,
  },
  insightContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  actionButton: {
    marginLeft: 8,
    marginTop: -4,
    height: 28,
  },
  insightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dismissButton: {
    margin: 0,
    padding: 0,
  },
}); 