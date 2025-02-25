import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { IconName } from '@expo/vector-icons/build/createIconSet';

interface StatCardProps {
  icon: IconName;
  title: string;
  value: number;
  description?: string;
  color?: string;
  percentage?: boolean;
  subtitle?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  color = colors.primary,
  subtitle,
  description 
}: StatCardProps) {
  return (
    <Surface style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons 
          name={icon as any} 
          size={24} 
          color={color}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  description: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    opacity: 0.8,
  },
}); 