import React, { useState, useRef } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { addDays, format, isToday, isSameDay, subDays } from 'date-fns';
import { colors } from '../theme/colors';
import type { Database } from '../types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

interface DateScrollerProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  tasks: Task[];
}

export default function DateScroller({ selectedDate, onDateSelect, tasks }: DateScrollerProps) {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'MMMM yyyy'));
  const scrollViewRef = useRef<ScrollView>(null);

  const generateDates = () => {
    const dates = [];
    const startDate = subDays(new Date(), 1);
    
    for (let i = 0; i < 30; i++) { // Show more days for month transitions
      dates.push(addDays(startDate, i));
    }
    return dates;
  };

  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const dateWidth = 53; // width + margins
    const index = Math.floor(contentOffset.x / dateWidth);
    const currentDate = dates[index];
    if (currentDate) {
      const monthYear = format(currentDate, 'MMMM yyyy');
      if (monthYear !== currentMonth) {
        setCurrentMonth(monthYear);
      }
    }
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return isSameDay(taskDate, date);
    });
  };

  const dates = generateDates();

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.monthYear}>
          {currentMonth}
        </Text>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {dates.map((date) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const today = isToday(date);
          const tasksForDate = getTasksForDate(date);
          const hasOverdueTasks = tasksForDate.some(task => 
            !task.completed && new Date(task.due_date) < new Date()
          );
          
          return (
            <View key={date.toISOString()} style={styles.dateContainer}>
              <TouchableOpacity
                onPress={() => onDateSelect?.(date)}
                style={[
                  styles.dateItem,
                  isSelected && styles.selectedDate,
                  today && styles.today
                ]}
              >
                <Text style={[
                  styles.dayName,
                  isSelected && styles.selectedText,
                  today && styles.todayText
                ]}>
                  {format(date, 'EEE')}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.selectedText,
                  today && styles.todayText
                ]}>
                  {format(date, 'd')}
                </Text>
              </TouchableOpacity>

              {tasksForDate.length > 0 && (
                <View style={styles.taskIndicators}>
                  {Array.from({ length: Math.min(4, tasksForDate.length) }).map((_, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.taskDot,
                        hasOverdueTasks && styles.overdueDot,
                        i === 0 && { backgroundColor: colors.primary }
                      ]} 
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  monthYear: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  dateContainer: {
    alignItems: 'center',
    gap: 8,
  },
  dateItem: {
    padding: 8,
    alignItems: 'center',
    minWidth: 45,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedDate: {
    backgroundColor: colors.primary,
  },
  today: {
    backgroundColor: `${colors.primary}20`,
  },
  dayName: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedText: {
    color: colors.onSurfaceVariant,
  },
  todayText: {
    color: colors.primary,
  },
  taskIndicators: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceVariant,
  },
  overdueDot: {
    backgroundColor: colors.error,
  },
}); 