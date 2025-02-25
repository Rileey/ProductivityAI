import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, RefreshControlProps, ScrollView, TouchableOpacity } from 'react-native';
import { Text, IconButton, Chip, useTheme, List, Checkbox, Menu, Button, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTaskStatus } from '../store/slices/taskSlice';
import type { AppDispatch, RootState } from '../store';
import type { Database } from '../types/database';
import TaskGroup from './TaskGroup';
import { colors } from '../theme/colors';
import TaskItem from './TaskItem';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DATE_RANGES } from './TaskTrends';
import { isToday, startOfDay, endOfDay, isSameDay, format } from 'date-fns';

type Task = Database['public']['Tables']['tasks']['Row'];

type SortOption = 'date' | 'dueDate' | 'alphabetical' | 'priority';
type FilterOption = 'all' | 'completed' | 'pending';

interface TaskListProps {
  tasks: Task[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

const PRIORITY_COLORS = {
  high: '#FF4444',    // Red
  medium: '#FFA000',  // Orange
  low: '#4CAF50',     // Green
  default: '#9E9E9E'  // Grey
} as const;

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
  null: 0,
} as const;

export default function TaskList({ 
  tasks,
  selectedDate,
  onDateSelect,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  ListHeaderComponent,
  refreshControl,
}: TaskListProps) {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.categories.categories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'pending' | 'completed'>('pending');
  const [menuVisible, setMenuVisible] = useState(false);
  const theme = useTheme();

  const filteredTasks = useMemo(() => {
    // First filter by selected date
    let filtered = selectedDate ? tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), selectedDate);
    }) : tasks;

    // Then apply completion filter
    switch (filterBy) {
      case 'completed':
        return filtered.filter(task => task.completed);
      case 'pending':
        return filtered.filter(task => !task.completed);
      default:
        return filtered;
    }
  }, [tasks, selectedDate, filterBy]);

  const sortTasks = (tasksToSort: Task[]) => {
    switch (sortBy) {
      case 'priority':
        return [...tasksToSort].sort((a, b) => {
          // First sort by priority
          const priorityDiff = (PRIORITY_ORDER[b.priority || 'null'] || 0) - 
                             (PRIORITY_ORDER[a.priority || 'null'] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by due date if priorities are equal
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          return 0;
        });

      case 'dueDate':
        return [...tasksToSort].sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          const dateA = new Date(a.due_date).getTime();
          const dateB = new Date(b.due_date).getTime();
          return dateA - dateB;
        });

      case 'alphabetical':
        return [...tasksToSort].sort((a, b) => a.title.localeCompare(b.title));

      default: // date
        return [...tasksToSort].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  };

  const filterTasks = (tasksToFilter: Task[]) => {
    let filtered = tasksToFilter;
    
    if (selectedCategory) {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    return filtered;
  };

  const processedTasks = sortTasks(filterTasks(filteredTasks));

  const formatDueDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return PRIORITY_COLORS.default;
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.default;
  };

  const groupTasksByDate = (tasks: Task[]) => {
    const now = new Date();
    
    return {
      overdue: tasks.filter(task => {
        if (task.completed) return false;
        if (!task.due_date) return false;
        return new Date(`${task.due_date}T${task.due_time || '23:59:59'}`) < now;
      }),
      today: tasks.filter(task => {
        if (task.completed) return false;
        const taskDate = new Date(task.due_date || task.created_at);
        return isToday(taskDate);
      }),
      upcoming: tasks.filter(task => {
        if (task.completed) return false;
        if (!task.due_date) return false;
        return new Date(task.due_date) > endOfDay(now);
      }),
      noDate: tasks.filter(task => !task.due_date && !task.completed),
    };
  };

  const renderTaskGroups = () => {
    const groups = groupTasksByDate(tasks);
    
    return (
      <View style={styles.groups}>
        {groups.today.length > 0 && (
          <TaskGroup 
            title="Today" 
            count={groups.today.length}
            tasks={groups.today}
            onTaskToggle={onToggleComplete}
            onTaskEdit={onEditTask}
            onTaskDelete={onDeleteTask}
          />
        )}
        {groups.overdue.length > 0 && (
          <TaskGroup 
            title="Overdue" 
            count={groups.overdue.length}
            tasks={groups.overdue}
            onTaskToggle={onToggleComplete}
            onTaskEdit={onEditTask}
            onTaskDelete={onDeleteTask}
          />
        )}
        {groups.upcoming.length > 0 && (
          <TaskGroup 
            title="Upcoming" 
            count={groups.upcoming.length}
            tasks={groups.upcoming}
            onTaskToggle={onToggleComplete}
            onTaskEdit={onEditTask}
            onTaskDelete={onDeleteTask}
          />
        )}
        {groups.noDate.length > 0 && (
          <TaskGroup 
            title="No Due Date" 
            count={groups.noDate.length}
            tasks={groups.noDate}
            onTaskToggle={onToggleComplete}
            onTaskEdit={onEditTask}
            onTaskDelete={onDeleteTask}
          />
        )}
      </View>
    );
  };

  const renderActiveFilters = () => {
    if (!selectedDate) return null;

    const activeFilters: { label: string; onClear: () => void }[] = [];

    activeFilters.push({
      label: format(selectedDate, 'MMM d, yyyy'),
      onClear: () => {
        // Clear date filter
        onDateSelect?.(new Date());
      }
    });

    return (
      <View style={styles.activeFilters}>
        {activeFilters.map(({ label, onClear }, index) => (
          <Chip
            key={index}
            onClose={onClear}
            style={styles.activeFilterChip}
            icon="calendar"
          >
            {label}
          </Chip>
        ))}
        <Button 
          mode="text" 
          onPress={() => {
            // Clear date filter
            onDateSelect?.(new Date());
            // Reset other filters
            setFilterBy('pending');
            setSelectedCategory(null);
          }}
          style={styles.clearButton}
        >
          Clear All
        </Button>
      </View>
    );
  };

  const handleCategoryPress = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleFilterByChange = (newFilter: FilterOption) => {
    setFilterBy(newFilter);
    setMenuVisible(false);
  };

  const renderFilterMenu = () => (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button 
          onPress={() => setMenuVisible(true)}
          mode="outlined"
          icon="filter-variant"
        >
          {filterBy === 'all' ? 'All Tasks' : 
           filterBy === 'completed' ? 'Completed' : 
           'Pending Tasks'}
        </Button>
      }
    >
      <Menu.Item 
        title="All Tasks"
        onPress={() => { setFilterBy('all'); setMenuVisible(false); }}
      />
      <Menu.Item 
        title="Pending Tasks"
        onPress={() => { setFilterBy('pending'); setMenuVisible(false); }}
      />
      <Menu.Item 
        title="Completed Tasks"
        onPress={() => { setFilterBy('completed'); setMenuVisible(false); }}
      />
    </Menu>
  );

  // Update the header to show active filters more clearly
  const renderHeader = () => (
    <View style={styles.header}>
      {renderActiveFilters()}
      <View style={styles.filterBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilter}
        >
          <Chip
            selected={!selectedCategory}
            onPress={() => handleCategoryPress(null)}
            style={styles.filterChip}
          >
            All
          </Chip>
          {categories.map(category => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onPress={() => handleCategoryPress(category.id)}
              style={styles.filterChip}
            >
              {category.name}
            </Chip>
          ))}
        </ScrollView>
        {renderFilterMenu()}
      </View>
    </View>
  );

  const renderTask = ({ item }: { item: Task }) => (
    <TaskItem
      task={item}
      onToggleComplete={onToggleComplete}
      onEdit={onEditTask}
      onDelete={onDeleteTask}
    />
  );

  return (
    <FlatList
      data={processedTasks}
      renderItem={renderTask}
      ListHeaderComponent={
        <>
          {ListHeaderComponent && (
            typeof ListHeaderComponent === 'function' 
              ? <ListHeaderComponent />
              : ListHeaderComponent
          )}
          {renderHeader()}
          {renderTaskGroups()}
        </>
      }
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      refreshControl={refreshControl}
    />
  );
}

const styles = StyleSheet.create({
  categoryFilter: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    paddingTop: 8,
  },
  task: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  completedTask: {
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
  },
  header: {
    gap: 8,
    padding: 16,
  },
  filterControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  priorityChip: {
    height: 24,
  },
  groups: {
    marginBottom: 16,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: `${colors.primary}10`,
  },
  clearButton: {
    marginLeft: 'auto',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  taskItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  checkbox: {
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontWeight: '600',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant,
  },
  description: {
    color: colors.onSurfaceVariant,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  subtasks: {
    marginTop: 4,
  },
  subtaskCount: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  subtaskProgress: {
    height: 4,
    borderRadius: 2,
  },
}); 