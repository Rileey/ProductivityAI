import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, RefreshControlProps, ScrollView, TouchableOpacity } from 'react-native';
import { Text, IconButton, Chip, useTheme, List, Checkbox, Menu, Button, Divider, Surface } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTaskStatus } from '../store/slices/taskSlice';
import type { AppDispatch, RootState } from '../store';
import type { Database } from '../types/database';
import TaskGroup from './TaskGroup';
import { colors } from '../theme/colors';
import TaskItem from './TaskItem';
import { DATE_RANGES } from './TaskTrends';
import { isToday, startOfDay, endOfDay, isSameDay, format, formatDistanceToNow, isPast, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { icons } from '../theme/icons';

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

  const formatDueDate = (dueDate: string | null, dueTime: string | null) => {
    if (!dueDate) return '';
    
    const now = new Date();
    const taskDate = new Date(dueDate);
    if (dueTime) {
      const [hours, minutes] = dueTime.split(':');
      taskDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    }

    // If the date is in the past
    if (isPast(taskDate)) {
      const minutesAgo = differenceInMinutes(now, taskDate);
      if (minutesAgo < 60) {
        return `${minutesAgo}m ago`;
      }
      
      const hoursAgo = differenceInHours(now, taskDate);
      if (hoursAgo < 24) {
        return `${hoursAgo}h ago`;
      }
      
      const daysAgo = differenceInDays(now, taskDate);
      if (daysAgo === 1) {
        return 'Yesterday';
      }
      return `${daysAgo}d ago`;
    }
    
    // If the date is in the future
    const minutesLeft = differenceInMinutes(taskDate, now);
    if (minutesLeft < 60) {
      return `${minutesLeft}m left`;
    }
    
    const hoursLeft = differenceInHours(taskDate, now);
    if (hoursLeft < 24) {
      return `${hoursLeft}h left`;
    }
    
    const daysLeft = differenceInDays(taskDate, now);
    if (daysLeft === 1) {
      return 'Tomorrow';
    }
    return `${daysLeft}d left`;
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

  const renderRightActions = (task: Task) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEditTask(task)}
        >
          <MaterialCommunityIcons name={icons.edit} size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDeleteTask(task.id)}
        >
          <MaterialCommunityIcons name={icons.delete} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const onSwipeOpen = (task: Task) => {
    // Optional: Add any logic you want to happen when swipe opens
    console.log('Swipe opened for task:', task.title);
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    // Get category name from the categories list
    const categoryName = categories.find(cat => cat.id === item.category)?.name;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        onSwipeableOpen={() => onSwipeOpen(item)}
      >
        <Surface style={styles.taskItem}>
          <TouchableOpacity 
            style={styles.taskContent}
            onPress={() => onToggleComplete(item.id, !item.completed)}
          >
            <View style={styles.taskHeader}>
              <View style={styles.checkbox}>
                <MaterialCommunityIcons
                  name={item.completed ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                  size={24}
                  color={item.completed ? colors.success : colors.primary}
                />
              </View>
              <View style={styles.taskTitleContainer}>
                <Text style={[
                  styles.taskTitle,
                  item.completed && styles.completedTaskTitle
                ]}>
                  {item.title}
                </Text>
                
                <View style={styles.taskMetaRow}>
                  {item.description && (
                    <Text style={styles.taskDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                  
                  <View style={styles.metadataContainer}>
                    {/* Due time */}
                    {item.due_date && (
                      <View style={styles.taskMetaItem}>
                        <MaterialCommunityIcons 
                          name="clock-outline"
                          size={14} 
                          color={colors.onSurfaceVariant} 
                        />
                        <Text style={styles.taskMetaText}>
                          {formatDueDate(item.due_date, item.due_time)}
                        </Text>
                      </View>
                    )}

                    {/* Category */}
                    {categoryName && (
                      <View style={styles.taskMetaItem}>
                        <MaterialCommunityIcons 
                          name="folder-outline"
                          size={14} 
                          color={colors.onSurfaceVariant} 
                        />
                        <Text style={styles.taskMetaText}>
                          {categoryName}
                        </Text>
                      </View>
                    )}

                    {/* Priority tag */}
                    {item.priority && (
                      <View style={[
                        styles.priorityTag, 
                        { backgroundColor: getPriorityColor(item.priority) + '20' }
                      ]}>
                        <Text style={[
                          styles.priorityText, 
                          { color: getPriorityColor(item.priority) }
                        ]}>
                          {item.priority}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Surface>
      </Swipeable>
    );
  };

  return (
    <FlatList
      data={processedTasks}
      renderItem={renderTaskItem}
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
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    elevation: 1,
  },
  taskContent: {
    padding: 12,
    flexDirection: 'column',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    padding: 2,
  },
  taskTitleContainer: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant,
  },
  taskMetaRow: {
    flexDirection: 'column',
    gap: 4,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  taskDescription: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
}); 