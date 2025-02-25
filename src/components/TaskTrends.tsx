import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Modal, ScrollView, useWindowDimensions, Dimensions } from 'react-native';
import { Card, Text, useTheme, IconButton, ActivityIndicator, Tooltip, Menu, Title, Surface, Divider, ProgressBar, List } from 'react-native-paper';
import { Svg, Circle, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Database } from '../types/database';
import { colors } from '../theme/colors';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { icons, type IconName } from '../theme/icons';
import { startOfDay, subDays, format } from 'date-fns';
import StatCard from './StatCard';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  completed_at?: string | null;
  completed_on_time?: boolean | null;
};

interface TaskTrendsProps {
  tasks: Task[];
  onFilterChange?: (filter: {
    dateRange: DateRange;
    status?: 'overdue' | 'today' | 'upcoming' | null;
    category?: string | null;
    priority?: string | null;
  }) => void;
}

interface TabRoute {
  key: string;
  title: string;
  count: number;
}

const PRIORITY_COLORS = {
  high: colors.error,
  medium: colors.warning,
  low: colors.success,
  none: colors.surfaceVariant,
} as const;

export const DATE_RANGES = {
  today: { label: 'Today', value: 'today', days: 1 },
  week: { label: 'This Week', value: 'week', days: 7 },
  month: { label: 'This Month', value: 'month', days: 30 },
  all: { label: 'All Time', value: 'all', days: Infinity }
} as const;

type DateRange = keyof typeof DATE_RANGES;

export default function TaskTrends({ tasks, onFilterChange }: TaskTrendsProps) {
  const theme = useTheme();
  const progressAnimation = new Animated.Value(0);
  const [showDetails, setShowDetails] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [routes, setRoutes] = useState<TabRoute[]>([
    { key: 'categories', title: 'Categories', count: 0 },
    { key: 'priorities', title: 'Priorities', count: 0 },
    { key: 'weekly', title: 'Weekly', count: 0 },
  ]);
  
  const layout = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    if (dateRange === 'all') return tasks;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DATE_RANGES[dateRange].days);

    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate >= cutoffDate;
    });
  }, [tasks, dateRange]);

  // Calculate completion percentage
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(task => task.completed).length;
  const activeCount = totalTasks - completedTasks;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // SVG circle parameters
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const refreshProgress = () => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(progressAnimation, {
        toValue: progress,
        useNativeDriver: true,
        tension: 10,
        friction: 8,
      })
    ]).start(() => {
      rotateAnim.setValue(0);
    });
  };

  useEffect(() => {
    refreshProgress();
  }, [progress]);

  const progressFill = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const getStatusColor = (count: number) => {
    if (count === 0) return colors.surfaceVariant;
    return count > 2 ? colors.error : colors.warning;
  };

  const stats = {
    overdue: filteredTasks.filter(task => !task.completed && task.due_date && new Date(task.due_date) < new Date()).length,
    today: filteredTasks.filter(task => !task.completed && task.due_date && 
      new Date(task.due_date).toDateString() === new Date().toDateString()).length,
    upcoming: filteredTasks.filter(task => !task.completed && task.due_date && 
      new Date(task.due_date) > new Date()).length,
  };

  const categoryStats = useMemo(() => {
    const stats = new Map<string, { total: number; completed: number }>();
    
    filteredTasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      if (!stats.has(category)) {
        stats.set(category, { total: 0, completed: 0 });
      }
      const categoryStats = stats.get(category)!;
      categoryStats.total++;
      if (task.completed) categoryStats.completed++;
    });

    return Array.from(stats.entries()).map(([category, stats]) => ({
      category,
      ...stats,
      completionRate: (stats.completed / stats.total) * 100
    }));
  }, [filteredTasks]);

  const priorityStats = useMemo(() => {
    const stats = {
      high: filteredTasks.filter(t => t.priority === 'high').length,
      medium: filteredTasks.filter(t => t.priority === 'medium').length,
      low: filteredTasks.filter(t => t.priority === 'low').length,
      none: filteredTasks.filter(t => !t.priority).length,
    };
    return stats;
  }, [filteredTasks]);

  const weeklyStats = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const stats = days.map(day => ({
      day,
      completed: 0,
      total: 0,
    }));

    filteredTasks.forEach(task => {
      if (task.completed && task.updated_at) {
        const completedDate = new Date(task.updated_at);
        stats[completedDate.getDay()].completed++;
      }
      if (task.created_at) {
        const createdDate = new Date(task.created_at);
        stats[createdDate.getDay()].total++;
      }
    });

    return stats.map(stat => ({
      ...stat,
      completionRate: stat.total > 0 ? (stat.completed / stat.total) * 100 : 0,
    }));
  }, [filteredTasks]);

  // Update tab counts
  useEffect(() => {
    setRoutes([
      { key: 'categories', title: 'Categories', count: categoryStats.length },
      { key: 'priorities', title: 'Priorities', count: Object.values(priorityStats).filter(count => count > 0).length },
      { key: 'weekly', title: 'Weekly', count: weeklyStats.filter(stat => stat.total > 0).length },
    ]);
  }, [categoryStats, priorityStats, weeklyStats]);

  // Calculate trend
  const getTrendIcon = (): IconName => {
    const previousTotal = filteredTasks.filter(task => {
      const date = new Date(task.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;

    const previousCompleted = filteredTasks.filter(task => {
      const date = new Date(task.updated_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return task.completed && date >= weekAgo;
    }).length;

    const previousRate = previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;
    const difference = progress - previousRate;

    if (Math.abs(difference) < 5) return icons.trendingNeutral;
    return difference > 0 ? icons.trendingUp : icons.trendingDown;
  };

  // Add loading animation when switching tabs
  const handleTabChange = (index: number) => {
    setIsLoading(true);
    setTabIndex(index);
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 300);
  };

  // Reset fade animation when tab changes
  useEffect(() => {
    fadeAnim.setValue(0);
  }, [tabIndex]);

  const renderTabContent = (children: React.ReactNode) => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        children
      )}
    </Animated.View>
  );

  const renderEmptyState = (icon: IconName, message: string) => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name={icon} 
        size={48} 
        color={colors.surfaceVariant} 
      />
      <Text variant="bodyLarge" style={styles.emptyText}>
        {message}
      </Text>
    </View>
  );

  const handleFilterChange = useCallback((updates: Partial<Parameters<NonNullable<typeof onFilterChange>>[0]>) => {
    onFilterChange?.({
      dateRange,
      status: null,
      category: null,
      priority: null,
      ...updates
    });
  }, [dateRange, onFilterChange]);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    handleFilterChange({ dateRange: newRange });
    setShowRangeMenu(false);
    refreshProgress();
  };

  const handleBreakdownPress = (status: 'overdue' | 'today' | 'upcoming') => {
    handleFilterChange({ status });
    setShowDetails(true);
  };

  const handleCategoryPress = (category: string) => {
    handleFilterChange({ category });
    setShowDetails(false);
  };

  const handlePriorityPress = (priority: string) => {
    handleFilterChange({ priority });
    setShowDetails(false);
  };

  const renderCategoriesTab = () => (
    renderTabContent(
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {categoryStats.length === 0 ? (
          renderEmptyState(icons.folderOutline, 'No categories yet')
        ) : (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>By Category</Text>
            {categoryStats.map(({ category, total, completed, completionRate }) => (
              <TouchableOpacity 
                key={category} 
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={styles.categoryHeader}>
                  <Text variant="bodyLarge">{category}</Text>
                  <Text variant="bodyMedium">
                    {completed}/{total} ({Math.round(completionRate)}%)
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${completionRate}%`, backgroundColor: colors.primary }
                    ]} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    )
  );

  const renderPrioritiesTab = () => (
    renderTabContent(
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Object.values(priorityStats).every(count => count === 0) ? (
          renderEmptyState(icons.flagOutline, 'No priorities set')
        ) : (
          <View style={styles.priorityGrid}>
            {Object.entries(priorityStats).map(([priority, count]) => (
              <TouchableOpacity 
                key={priority} 
                onPress={() => handlePriorityPress(priority)}
              >
                <Card style={styles.priorityCard}>
                  <Card.Content>
                    <MaterialCommunityIcons 
                      name={icons.flag} 
                      size={24} 
                      color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]} 
                    />
                    <Text variant="headlineMedium" style={styles.priorityCount}>
                      {count}
                    </Text>
                    <Text variant="bodyMedium">
                      {priority === 'none' ? 'No Priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    )
  );

  const renderWeeklyTab = () => (
    renderTabContent(
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {weeklyStats.every(stat => stat.total === 0) ? (
          renderEmptyState(icons.calendarOutline, 'No task activity this week')
        ) : (
          weeklyStats.map(({ day, completed, total, completionRate }) => (
            <View key={day} style={styles.weeklyItem}>
              <View style={styles.weeklyHeader}>
                <Text variant="bodyLarge">{day}</Text>
                <Text variant="bodyMedium">
                  {completed}/{total} ({Math.round(completionRate)}%)
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${completionRate}%`,
                      backgroundColor: completionRate > 75 ? colors.success : 
                                     completionRate > 50 ? colors.primary :
                                     completionRate > 25 ? colors.warning : 
                                     colors.error
                    }
                  ]} 
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    )
  );

  const renderScene = SceneMap({
    categories: renderCategoriesTab,
    priorities: renderPrioritiesTab,
    weekly: renderWeeklyTab,
  });

  const renderDetailsModal = () => (
    <Modal
      visible={showDetails}
      onRequestClose={() => setShowDetails(false)}
      animationType="slide"
      transparent
    >
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            transform: [{
              translateY: progressAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: [300, 0],
              })
            }]
          }
        ]}
      >
        <Card style={styles.modalContent}>
          <Card.Content style={styles.modalCardContent}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge">Task Analytics</Text>
              <IconButton icon="close" onPress={() => setShowDetails(false)} />
            </View>
            <TabView
              navigationState={{ index: tabIndex, routes }}
              renderScene={renderScene}
              onIndexChange={handleTabChange}
              initialLayout={{ width: layout.width }}
              style={styles.tabView}
              renderTabBar={props => (
                <TabBar
                  {...props}
                  indicatorStyle={styles.tabIndicator}
                  style={styles.tabBar}
                  labelStyle={styles.tabLabel}
                  activeColor={colors.primary}
                  inactiveColor={colors.onSurfaceVariant}
                  renderBadge={({ route }) => 
                    route.count > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{route.count}</Text>
                      </View>
                    ) : null
                  }
                />
              )}
            />
          </Card.Content>
        </Card>
      </Animated.View>
    </Modal>
  );

  const renderDateRangeSelector = () => (
    <Menu
      visible={showRangeMenu}
      onDismiss={() => setShowRangeMenu(false)}
      anchor={
        <TouchableOpacity 
          onPress={() => setShowRangeMenu(true)}
          style={styles.dateRangeButton}
        >
          <Text variant="bodyMedium" style={styles.dateRangeText}>
            {DATE_RANGES[dateRange].label}
          </Text>
          <MaterialCommunityIcons 
            name={icons.chevronDown} 
            size={20} 
            color={colors.primary}
          />
        </TouchableOpacity>
      }
    >
      {Object.entries(DATE_RANGES).map(([key, { label }]) => (
        <Menu.Item
          key={key}
          title={label}
          onPress={() => handleDateRangeChange(key as DateRange)}
        />
      ))}
    </Menu>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text variant="titleLarge" style={styles.title}>Task Analytics</Text>
        {renderDateRangeSelector()}
      </View>
      <View style={styles.headerStats}>
        <View style={styles.headerStatsLeft}>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {completedTasks} of {totalTasks} tasks completed
          </Text>
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons 
              name={getTrendIcon()} 
              size={20} 
              color={getTrendIcon() === icons.trendingUp ? colors.success : 
                     getTrendIcon() === icons.trendingDown ? colors.error : 
                     colors.surfaceVariant}
            />
            <Text variant="bodySmall" style={[
              styles.trendText,
              { 
                color: getTrendIcon() === icons.trendingUp ? colors.success : 
                       getTrendIcon() === icons.trendingDown ? colors.error : 
                       colors.surfaceVariant 
              }
            ]}>
              {getTrendIcon() === icons.trendingUp ? 'Improving' :
               getTrendIcon() === icons.trendingDown ? 'Declining' : 
               'Stable'}
            </Text>
          </View>
        </View>
        <Tooltip title="Tap to view detailed analytics">
          <TouchableOpacity 
            onPress={() => {
              refreshProgress();
              setShowDetails(true);
            }}
          >
            <Animated.View 
              style={[
                styles.progressContainer,
                { transform: [{ rotate: spin }] }
              ]}
            >
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={colors.surfaceVariant}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <AnimatedCircle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={colors.primary}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={progressFill}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                <SvgText
                  x={size / 2}
                  y={size / 2 + 8}
                  fontSize="24"
                  fill={colors.primary}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {Math.round(progress * 100)}%
                </SvgText>
              </Svg>
            </Animated.View>
          </TouchableOpacity>
        </Tooltip>
      </View>
    </View>
  );

  const renderBreakdownItem = (
    icon: IconName,
    count: number,
    label: string,
    color: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={[styles.statItem, styles.statItemBorder]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}10` }]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={color}
        />
      </View>
      <View style={styles.statContent}>
        <Text variant="titleMedium" style={[styles.statCount, { color }]}>
          {count}
        </Text>
        <Text variant="bodySmall" style={styles.statLabel}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderBreakdown = () => (
    <View style={styles.breakdownContainer}>
      {renderBreakdownItem(
        icons.clockAlert,
        stats.overdue,
        'Overdue',
        getStatusColor(stats.overdue),
        () => handleBreakdownPress('overdue')
      )}
      {renderBreakdownItem(
        icons.calendarToday,
        stats.today,
        'Due Today',
        getStatusColor(stats.today),
        () => handleBreakdownPress('today')
      )}
      {renderBreakdownItem(
        icons.calendarCheck,
        stats.upcoming,
        'Upcoming',
        colors.success,
        () => handleBreakdownPress('upcoming')
      )}
    </View>
  );

  const analytics = useMemo(() => {
    const now = new Date();
    const completedTasks = tasks.filter(t => t.completed).sort((a, b) => {
      // Sort by completion date, most recent first
      const dateA = a.completed_at ? new Date(a.completed_at) : new Date(0);
      const dateB = b.completed_at ? new Date(b.completed_at) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return {
      total: tasks.length,
      completed: completedTasks,
      completedOnTime: tasks.filter(t => t.completed && t.completed_on_time).length,
      completedLate: tasks.filter(t => t.completed && !t.completed_on_time).length,
      overdue: tasks.filter(t => {
        if (t.completed) return false;
        if (!t.due_date) return false;
        return new Date(`${t.due_date}T${t.due_time || '23:59:59'}`) < now;
      }).length,
      pending: tasks.filter(t => !t.completed).length,
    };
  }, [tasks]);

  const renderCompletedTasks = () => (
    <Surface style={styles.section}>
      <List.Accordion
        title="Completed Tasks"
        description={`${analytics.completed.length} tasks completed`}
        expanded={expandedSection === 'completed'}
        onPress={() => setExpandedSection(expandedSection === 'completed' ? null : 'completed')}
        left={props => <List.Icon {...props} icon={icons.checkCircle} color={colors.success} />}
        style={styles.accordion}
      >
        {analytics.completed.map(task => (
          <Surface key={task.id} style={styles.taskItem}>
            <View style={styles.taskContent}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.description && (
                  <Text style={styles.taskDescription} numberOfLines={2}>
                    {task.description}
                  </Text>
                )}
              </View>
              <View style={styles.taskFooter}>
                <View style={styles.taskMeta}>
                  {task.completed_at && (
                    <Text style={styles.completionDate}>
                      Completed {format(new Date(task.completed_at), 'MMM d, yyyy')}
                    </Text>
                  )}
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: task.completed_on_time ? colors.success : colors.warning }
                  ]}>
                    <Text style={styles.statusText}>
                      {task.completed_on_time ? 'On time' : 'Late'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Surface>
        ))}
      </List.Accordion>
    </Surface>
  );

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Task Analytics</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Track your productivity and task completion
        </Text>
      </Surface>

      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsColumn}>
          <StatCard
            title="Completed On Time"
            value={analytics.completedOnTime}
            icon={icons.checkCircle}
            color={colors.success}
          />
          <StatCard
            title="Completed Late"
            value={analytics.completedLate}
            icon={icons.clockCheck}
            color={colors.warning}
          />
          <StatCard
            title="Overdue"
            value={analytics.overdue}
            icon={icons.clockAlert}
            color={colors.error}
          />
          <StatCard
            title="Pending"
            value={analytics.pending}
            icon={icons.clockOutline}
            color={colors.primary}
          />
        </View>
      </Surface>

      <View style={styles.sectionSpacer} />

      {renderCompletedTasks()}
    </ScrollView>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: colors.primary,
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  statsColumn: {
    gap: 8,
  },
  accordion: {
    backgroundColor: 'transparent',
  },
  taskItem: {
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  taskContent: {
    padding: 16,
    gap: 8,
  },
  taskHeader: {
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionDate: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    maxHeight: '80%',
    flex: 1,
  },
  modalCardContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontWeight: '600',
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: `${colors.primary}10`,
  },
  dateRangeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  breakdownContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  statItemBorder: {
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
    gap: 4,
  },
  statCount: {
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.onSurfaceVariant,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 8,
  },
  priorityCard: {
    flex: 1,
    minWidth: '45%',
  },
  priorityCount: {
    marginVertical: 8,
  },
  weeklyItem: {
    marginBottom: 16,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  tabLabel: {
    textTransform: 'none',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  tabIndicator: {
    backgroundColor: colors.primary,
    height: 3,
    borderRadius: 3,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerStatsLeft: {
    flex: 1,
    gap: 8,
  },
  progressContainer: {
    gap: 12,
  },
  progress: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  sectionSpacer: {
    height: 8,
  },
}); 