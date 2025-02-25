import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { FAB, Snackbar, Text, Surface, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../src/contexts/AuthContext';
import TaskList from '../../src/components/TaskList';
import TaskModal from '../../src/components/TaskModal';
import { AppDispatch, RootState } from '../../src/store';
import { fetchTasks, addTask, editTask, deleteTask, toggleTaskStatus, clearError } from '../../src/store/slices/taskSlice';
import { fetchCategories } from '../../src/store/slices/categorySlice';
import LoadingScreen from '../../src/components/LoadingScreen';
import type { Database } from '../../src/types/database';
import TaskSummary from '../../src/components/TaskSummary';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors } from '../../src/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { icons } from '../../src/theme/icons';
import DateScroller from '../../src/components/DateScroller';

type Task = Database['public']['Tables']['tasks']['Row'];

type TaskFilter = {
  dateRange: 'week' | 'month' | 'quarter' | 'all';
  status?: 'overdue' | 'today' | 'upcoming' | null;
  category?: string | null;
  priority?: string | null;
};

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { session } = useAuth();
  const { tasks, loading: tasksLoading, error } = useSelector((state: RootState) => state.tasks);
  const { categories } = useSelector((state: RootState) => state.categories);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [taskFilters, setTaskFilters] = useState<TaskFilter>({
    dateRange: 'week',
    status: null,
    category: null,
    priority: null
  });
  const [location, setLocation] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const router = useRouter();

  // Get filter params from URL
  const params = useLocalSearchParams<{
    dateRange?: 'week' | 'month' | 'quarter' | 'all';
    status?: 'overdue' | 'today' | 'upcoming' | null;
    category?: string | null;
    priority?: string | null;
  }>();

  // Update filters when URL params change
  useEffect(() => {
    if (Object.keys(params).length > 0) {
      setTaskFilters(prev => {
        const newFilters: TaskFilter = {
          dateRange: params.dateRange as TaskFilter['dateRange'] || prev.dateRange,
          status: null,
          category: null,
          priority: null
        };

        // Only update status if it's a valid value
        if (params.status && ['overdue', 'today', 'upcoming'].includes(params.status)) {
          newFilters.status = params.status as TaskFilter['status'];
        }

        // Handle category and priority
        if (params.category && params.category !== 'undefined') {
          newFilters.category = params.category;
        }
        if (params.priority && params.priority !== 'undefined') {
          newFilters.priority = params.priority;
        }

        return newFilters;
      });
    }
  }, [params.dateRange, params.status, params.category, params.priority]);

  const onRefresh = React.useCallback(async () => {
    if (!session?.user.id) return;
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchTasks(session.user.id)),
      dispatch(fetchCategories(session.user.id))
    ]);
    setRefreshing(false);
  }, [dispatch, session]);

  useEffect(() => {
    if (session?.user.id) {
      dispatch(fetchTasks(session.user.id));
      dispatch(fetchCategories(session.user.id));
    }
  }, [dispatch, session]);

  useEffect(() => {
    if (error) {
      setSnackbarVisible(true);
    }
  }, [error]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get current date in readable format
  const getCurrentDate = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date();
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Get user's location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        if (address[0]?.city) {
          setLocation(address[0].city);
        }
      }
    })();
  }, []);

  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    try {
      await dispatch(addTask(taskData)).unwrap();
      // Success handling
    } catch (error) {
      console.error('Failed to save task:', error);
      // Error handling
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await dispatch(deleteTask(taskId));
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await dispatch(toggleTaskStatus(task));
    }
  };

  const onDismissSnackbar = () => {
    setSnackbarVisible(false);
    dispatch(clearError());
  };

  const handleFilterChange = (filters: TaskFilter) => {
    setTaskFilters(filters);
    // Clear URL params when filters are reset to defaults
    if (filters.dateRange === 'week' && !filters.status && !filters.category && !filters.priority) {
      router.setParams({});
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalVisible(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const HeaderComponent = () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const activeTasks = tasks.length - completedTasks;
    const progress = tasks.length > 0 ? completedTasks / tasks.length : 0;

    return (
      <View>
        <Surface style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text variant="displaySmall" style={styles.greeting}>
              {getGreeting()}
            </Text>
            {location && (
              <Text variant="displaySmall" style={styles.location}>
                from <Text style={styles.locationHighlight}>{location}</Text>
              </Text>
            )}
            <Text variant="bodyLarge" style={styles.date}>
              {getCurrentDate()}
            </Text>
          </View>
          <IconButton
            icon={icons.bellOutline}
            size={24}
            onPress={() => {/* Handle notifications */}}
          />
        </Surface>

        <Surface style={styles.progressSection}>
          <Text variant="titleMedium" style={styles.progressTitle}>
            Overall Task Progress ({tasks.length})
          </Text>
          <View style={styles.progressStats}>
            <View style={styles.statBadge}>
              <MaterialCommunityIcons 
                name={icons.checkCircle} 
                size={16} 
                color={colors.success} 
              />
              <Text style={styles.statText}>{completedTasks} completed</Text>
            </View>
            <View style={styles.statBadge}>
              <MaterialCommunityIcons 
                name={icons.clockOutline} 
                size={16} 
                color={colors.primary} 
              />
              <Text style={styles.statText}>{activeTasks} active</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <Text style={styles.hint}>Tap to show completed tasks</Text>
        </Surface>
        <DateScroller 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          tasks={tasks.filter(task => !task.completed)}
        />
      </View>
    );
  };

  if (tasksLoading && tasks.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <TaskList 
        tasks={tasks}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        ListHeaderComponent={
          <HeaderComponent 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <TaskModal
        visible={isModalVisible || editingTask !== null}
        onDismiss={() => {
          setIsModalVisible(false);
          setEditingTask(null);
        }}
        onSave={handleTaskSubmit}
        task={editingTask}
        categories={categories}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={onDismissSnackbar}
        action={{
          label: 'Retry',
          onPress: onRefresh,
        }}
      >
        {error || 'An error occurred. Please try again.'}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light background for better contrast
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  header: {
    padding: 20,
    paddingTop: 24,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 4,
  },
  location: {
    fontSize: 32,
    fontWeight: '400',
    marginBottom: 12,
  },
  locationHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  date: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  progressSection: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  progressTitle: {
    marginBottom: 12,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  hint: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    minWidth: 45,
    textAlign: 'right',
  },
}); 