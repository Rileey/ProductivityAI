import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Surface style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons 
          name={icon as any} 
          size={20} 
          color={color}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
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
}); 