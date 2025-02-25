import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Surface, Text } from 'react-native-paper';
import { colors } from '../theme/colors';

interface FilterBarProps {
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: { id: string; name: string }[];
}

export default function AnalyticsFilterBar({
  dateRange,
  onDateRangeChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: FilterBarProps) {
  return (
    <Surface style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.label}>Time Range</Text>
          <View style={styles.chips}>
            <Chip
              selected={dateRange === 'week'}
              onPress={() => onDateRangeChange('week')}
              compact
            >
              Week
            </Chip>
            <Chip
              selected={dateRange === 'month'}
              onPress={() => onDateRangeChange('month')}
              compact
            >
              Month
            </Chip>
            <Chip
              selected={dateRange === 'all'}
              onPress={() => onDateRangeChange('all')}
              compact
            >
              All Time
            </Chip>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.label}>Categories</Text>
          <View style={styles.chips}>
            <Chip
              selected={selectedCategory === null}
              onPress={() => onCategoryChange(null)}
              compact
            >
              All
            </Chip>
            {categories.map(category => (
              <Chip
                key={category.id}
                selected={selectedCategory === category.id}
                onPress={() => onCategoryChange(category.id)}
                compact
              >
                {category.name}
              </Chip>
            ))}
          </View>
        </View>
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  label: {
    color: colors.onSurfaceVariant,
    marginLeft: 4,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
}); 