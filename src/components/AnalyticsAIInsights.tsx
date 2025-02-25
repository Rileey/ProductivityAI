import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Card, Text, Divider, IconButton, Tooltip } from 'react-native-paper';
import { colors } from '../theme/colors';
import AITaskInsights from './AITaskInsights';
import { useDispatch } from 'react-redux';
import { fetchTasks } from '../store/slices/taskSlice';
import { MaterialIcons } from '@expo/vector-icons';

export default function AnalyticsAIInsights() {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchTasks());
    setRefreshing(false);
  };

  return (
    <Card style={styles.container}>
      <Card.Title 
        title={
          <View style={styles.titleContainer}>
            <Text style={styles.title}>AI Productivity Analysis</Text>
            <Tooltip title="AI analyzes your tasks to provide suggestions for improving productivity">
              <MaterialIcons name="info-outline" size={16} color={colors.primary} />
            </Tooltip>
          </View>
        }
        subtitle="Powered by machine learning insights"
        right={(props) => (
          <IconButton
            {...props}
            icon="refresh"
            onPress={handleRefresh}
            loading={refreshing}
          />
        )}
      />
      <Divider />
      <Card.Content style={styles.content}>
        <Text style={styles.description}>
          Our AI has analyzed your task completion patterns, priorities, and deadlines to generate personalized productivity insights:
        </Text>
        <View style={styles.insightsWrapper}>
          <AITaskInsights />
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            These insights update as your task data changes.
          </Text>
        </View>
      </Card.Content>
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
  description: {
    marginBottom: 16,
    color: colors.onSurfaceVariant,
    fontSize: 14,
  },
  insightsWrapper: {
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 