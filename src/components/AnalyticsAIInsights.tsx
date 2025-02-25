import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Divider, IconButton } from 'react-native-paper';
import { colors } from '../theme/colors';
import AITaskInsights from './AITaskInsights';
import { useDispatch } from 'react-redux';
import { fetchTasks } from '../store/slices/taskSlice';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AnalyticsAIInsights() {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useAuth();

  const handleRefresh = async () => {
    if (!session?.user.id) return;
    setRefreshing(true);
    try {
      await dispatch(fetchTasks(session.user.id));
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Productivity Insights</Text>
          <MaterialIcons name="info-outline" size={16} color={colors.primary} style={styles.infoIcon} />
        </View>
        <IconButton
          icon="refresh"
          size={20}
          onPress={handleRefresh}
          loading={refreshing}
          style={styles.refreshButton}
        />
      </View>
      <Divider />
      <View style={styles.content}>
        <AITaskInsights />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  infoIcon: {
    marginLeft: 8,
  },
  refreshButton: {
    margin: 0,
  },
  content: {
    paddingVertical: 8,
  },
}); 