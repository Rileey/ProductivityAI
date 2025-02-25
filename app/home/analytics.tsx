import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { fetchTasks } from '../../src/store/slices/taskSlice';
import { fetchCategories } from '../../src/store/slices/categorySlice';
import TaskTrends from '../../src/components/TaskTrends';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function Analytics() {
  const dispatch = useDispatch<AppDispatch>();
  const { session } = useAuth();
  const { tasks, loading } = useSelector((state: RootState) => state.tasks);
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleFilterChange = (filters: {
    dateRange: 'week' | 'month' | 'quarter' | 'all';
    status?: 'overdue' | 'today' | 'upcoming' | null;
    category?: string | null;
    priority?: string | null;
  }) => {
    const params = {
      dateRange: filters.dateRange,
      // Only include non-null values
      ...(filters.status && { status: filters.status }),
      ...(filters.category && { category: filters.category }),
      ...(filters.priority && { priority: filters.priority }),
    };

    router.push({
      pathname: '/home',
      params
    });
  };

  const onRefresh = React.useCallback(async () => {
    if (!session?.user.id) return;
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchTasks(session.user.id)),
      dispatch(fetchCategories(session.user.id))
    ]);
    setRefreshing(false);
  }, [dispatch, session]);

  if (loading && tasks.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <TaskTrends 
        tasks={tasks} 
        onFilterChange={handleFilterChange}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
}); 