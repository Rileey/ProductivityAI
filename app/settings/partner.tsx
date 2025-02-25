import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import { colors } from '../../src/theme/colors';
import PartnerInvite from '../../src/components/PartnerInvite';
import PendingInvitations from '../../src/components/PendingInvitations';
import { useAuth } from '../../src/contexts/AuthContext';
import { Stack } from 'expo-router';

export default function PartnerSettings() {
  const { session } = useAuth();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Partner Settings",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
        }} 
      />
      
      <ScrollView style={styles.container}>
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Accountability Partner
          </Text>
          <Text style={styles.description}>
            An accountability partner can help you stay on track by viewing your tasks and providing reminders.
          </Text>
        </Surface>

        <View style={styles.spacer} />
        
        <PendingInvitations />
        
        <View style={styles.spacer} />
        
        <PartnerInvite />

        <View style={styles.spacer} />

        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Partner Permissions
          </Text>
          <Text style={styles.description}>
            Your partner can:
          </Text>
          <View style={styles.permissionsList}>
            <Text style={styles.permissionItem}>• View your task list and progress</Text>
            <Text style={styles.permissionItem}>• Send reminders for overdue tasks</Text>
            <Text style={styles.permissionItem}>• Add comments to tasks</Text>
            <Text style={styles.permissionItem}>• Approve task completion (optional)</Text>
          </View>
        </Surface>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    marginBottom: 16,
  },
  spacer: {
    height: 16,
  },
  permissionsList: {
    gap: 8,
  },
  permissionItem: {
    fontSize: 14,
    color: colors.onSurface,
  },
}); 